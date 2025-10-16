# Specyfikacja Techniczna: Moduł Uwierzytelniania Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i plan wdrożenia funkcjonalności uwierzytelniania użytkowników (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) w aplikacji AImondo. Rozwiązanie bazuje na usłudze Supabase Auth i jest zintegrowane z frameworkiem Astro w trybie renderowania po stronie serwera (SSR).

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Podział Odpowiedzialności (Astro vs. React)

- **Strony Astro (`.astro`)**: Będą pełnić rolę "szkieletów" (hostów) dla komponentów interaktywnych oraz renderować statyczne elementy. Będą również odpowiedzialne za logikę po stronie serwera, taką jak ochrona tras i przekierowania w oparciu o status zalogowania użytkownika.
- **Komponenty React (`.tsx`)**: Zostaną użyte do budowy interaktywnych formularzy (logowanie, rejestracja, etc.). Będą zarządzać własnym stanem (wprowadzane dane, błędy walidacji) i komunikować się z dedykowanymi endpointami API w celu wykonania operacji autentykacyjnych.

### 2.2. Nowe Strony i Komponenty

#### Strony (w `src/pages/`)

- **`login.astro`**: Strona publiczna, dostępna dla niezalogowanych użytkowników. Będzie renderować komponent `LoginForm`. W przypadku, gdy zalogowany użytkownik spróbuje na nią wejść, zostanie przekierowany do `/dashboard`. Na stronie powinien znaleźć się również link do strony resetowania hasła (`/password-reset`).
- **`register.astro`**: Strona publiczna do zakładania nowego konta. Będzie renderować komponent `RegisterForm`. Podobnie jak `/login`, będzie przekierowywać zalogowanych użytkowników.
- **`password-reset.astro`**: Strona publiczna z formularzem do zainicjowania procesu resetowania hasła. Będzie renderować komponent `PasswordResetForm`.
- **`update-password.astro`**: Strona publiczna, na którą użytkownik trafia po kliknięciu linku z e-maila resetującego hasło. Będzie renderować komponent `UpdatePasswordForm`.

#### Komponenty (w `src/components/auth/`)

- **`LoginForm.tsx`**: Formularz z polami na e-mail i hasło. Będzie wykorzystywał hooki Reacta do zarządzania stanem, walidacji po stronie klienta (np. sprawdzanie, czy pola nie są puste) oraz obsługi wysyłki danych do `api/auth/login`.
- **`RegisterForm.tsx`**: Formularz z polami na e-mail, hasło i powtórzenie hasła. Zaimplementuje walidację klienta (np. zgodność haseł) i będzie komunikował się z `api/auth/register`.
- **`PasswordResetForm.tsx`**: Prosty formularz z polem na e-mail, wysyłający dane do `api/auth/password-reset`.
- **`UpdatePasswordForm.tsx`**: Formularz z polem na nowe hasło, komunikujący się z `api/auth/update-password`.

### 2.3. Modyfikacje Istniejących Elementów

- **`src/layouts/Layout.astro`**:
  - W sekcji `<head>` lub na końcu `<body>` należy dodać warunkowo renderowany element nawigacji.
  - Korzystając z `Astro.locals.user`, layout zdecyduje, które linki wyświetlić:
    - **Tryb `auth`**: Linki do "Dashboard", "Heatmap" oraz przycisk/link "Wyloguj", który będzie formularzem POST wysyłanym do `api/auth/logout`.
    - **Tryb `non-auth`**: Linki "Zaloguj się" i "Zarejestruj się".
- **`src/pages/index.astro`**:
  - Ta strona stanie się głównym punktem wejścia. Jej jedynym zadaniem będzie sprawdzenie statusu zalogowania usera (`Astro.locals.user`) i wykonanie przekierowania:
    - Jeśli sesja istnieje: `return Astro.redirect('/dashboard');`
    - Jeśli sesja nie istnieje: `return Astro.redirect('/login');`
- **`src/pages/dashboard.astro`, `heatmap.astro`, `workouts/[id].astro`**:
  - Te strony stają się chronione. Logika ochrony zostanie zaimplementowana centralnie w middleware.

### 2.4. Walidacja i Obsługa Błędów

- **Walidacja po stronie klienta**: Podstawowa walidacja w komponentach React (np. wymagane pola, format e-mail) dla natychmiastowego feedbacku.
- **Walidacja po stronie serwera**: Każdy endpoint API będzie używał biblioteki `zod` do pełnej walidacji przychodzących danych.
- **Komunikaty dla użytkownika**: Błędy zwrócone z API (np. "Nieprawidłowe hasło", "Użytkownik już istnieje") będą przechwytywane w komponentach React i wyświetlane pod odpowiednimi polami formularza lub jako globalne powiadomienie (toast) przy użyciu istniejącego komponentu `sonner`.

## 3. Logika Backendowa

### 3.1. Middleware (`src/middleware/index.ts`)

Middleware jest kluczowym elementem integracji z Supabase w trybie SSR.

- **Inicjalizacja klienta Supabase**: Na każde żądanie, middleware utworzy serwerowego klienta Supabase, przekazując mu ciasteczka z żądania. Pozwoli to Supabase na odczytanie i zweryfikowanie tokenu JWT.
- **Zarządzanie stanem zalogowania użytkownika**: Pobierze aktualnego użytkownika (`supabase.auth.getUser()`) i umieści go wraz z klientem Supabase w `context.locals`. Dzięki temu każda strona i endpoint API w projekcie będzie miał dostęp do `Astro.locals.supabase` i `Astro.locals.user`.
- **Ochrona tras**: Zaimplementuje logikę przekierowań:
  - Jeśli `Astro.locals.user` nie istnieje, a żądanie dotyczy chronionej ścieżki (np. `/dashboard`, `/api/workouts`), użytkownik zostanie przekierowany na `/login`.
  - Jeśli `Astro.locals.user` istnieje, a żądanie dotyczy stron `/login` lub `/register`, użytkownik zostanie przekierowany na `/dashboard`.
- **Obsługa `Set-Cookie`**: Middleware będzie odpowiedzialny za przechwycenie nagłówków `Set-Cookie` (zawierających odświeżone tokeny) z odpowiedzi Supabase i dołączenie ich do finalnej odpowiedzi serwera.

### 3.2. Endpointy API (w `src/pages/api/auth/`)

Wszystkie endpointy będą asynchroniczne i będą korzystać z klienta Supabase udostępnionego przez middleware (`Astro.locals.supabase`).

- **`login.ts` (`POST`)**:
  1. Walidacja (zod): `email`, `password`.
  2. Wywołanie `supabase.auth.signInWithPassword()`.
  3. W przypadku błędu, zwrot statusu 401 i komunikatu.
  4. W przypadku sukcesu, zwrot statusu 200. Ciasteczka sesyjne zostaną automatycznie obsłużone przez middleware.
- **`register.ts` (`POST`)**:
  1. Walidacja (zod): `email`, `password`.
  2. Wywołanie `supabase.auth.signUp()`. Przy wyłączonej weryfikacji e-mail, metoda ta zwróci dane użytkownika i sesję.
  3. Endpoint musi ręcznie ustawić ciasteczko sesji za pomocą `Astro.cookies.set()`, aby zalogować użytkownika.
  4. Zwrot statusu 200 w przypadku sukcesu lub 400/409 w przypadku błędu (np. słabe hasło, użytkownik istnieje).
- **`logout.ts` (`POST`)**:
  1. Wywołanie `supabase.auth.signOut()`.
  2. Zwrot statusu 200 i przekierowanie na stronę logowania.
- **`password-reset.ts` (`POST`)**:
  1. Walidacja (zod): `email`.
  2. Wywołanie `supabase.auth.resetPasswordForEmail()` z adresem URL do strony `update-password`.
  3. Zawsze zwraca status 200, aby nie ujawniać, czy dany e-mail istnieje w bazie.
- **`update-password.ts` (`POST`)**:
  1. Walidacja (zod): `password`.
  2. Wywołanie `supabase.auth.updateUser()` z nowym hasłem. Sesja użytkownika jest pobierana z tokenu odzyskiwania.
  3. W przypadku sukcesu, zwrot statusu 200. Klient po otrzymaniu odpowiedzi powinien przekierować użytkownika na stronę `/login` z komunikatem o pomyślnej zmianie hasła.
- **`callback.ts` (`GET`)** (być może w przyszłości):
  1. Endpoint obsługujący callbacki od Supabase (np. w przyszłości dla logowania OAuth).
  2. Odczytuje `code` z parametrów URL.
  3. Wywołuje `supabase.auth.exchangeCodeForSession(code)`.
  4. Przekierowuje użytkownika do `/dashboard`.

### 3.3. Modele Danych i Walidacja

- Schematy `zod` zostaną zdefiniowane w osobnym pliku (np. `src/lib/auth.schemas.ts`) i reużywane w endpointach API.
- Przykładowy schemat logowania:
  ```typescript
  export const LoginSchema = z.object({
    email: z.string().email({ message: "Nieprawidłowy format adresu e-mail." }),
    password: z.string().min(1, { message: "Hasło jest wymagane." }),
  });
  ```

## 4. System Autentykacji (Supabase)

### 4.1. Konfiguracja Supabase Auth

- **Wyłączenie weryfikacji e-mail**: Aby zapewnić automatyczne logowanie po rejestracji (zgodnie z US-001), w panelu Supabase (`Authentication -> Providers -> Email`) należy wyłączyć opcję "Confirm email".
- **Szablony e-mail**: W panelu Supabase należy dostosować szablon "Reset password", aby link w nim zawarty kierował do odpowiedniej strony w aplikacji AImondo:
  - Link resetujący hasło: `https://<twoja-domena>/update-password` (Supabase automatycznie dołączy tokeny).
- **Dostawcy OAuth**: Konfiguracja jest opcjonalna, ale w przyszłości można łatwo dodać logowanie przez Google, GitHub itp.

### 4.2. Bezpieczeństwo Danych (Row Level Security)

- **Włączenie RLS**: Należy aktywować RLS na tabeli `workouts` oraz wszystkich przyszłych tabelach przechowujących dane użytkownika.
- **Polityki dostępu**: Należy utworzyć polityki SQL, które powiążą dostęp do danych z ID zalogowanego użytkownika.
  - Przykład polityki `SELECT` dla tabeli `workouts`:
    ```sql
    CREATE POLICY "Użytkownicy mogą odczytywać tylko własne treningi."
    ON public.workouts FOR SELECT
    USING ( auth.uid() = user_id );
    ```
  - Podobne polityki należy stworzyć dla operacji `INSERT`, `UPDATE` i `DELETE`.
- **Kolumna `user_id`**: Tabela `workouts` musi posiadać kolumnę `user_id` typu `uuid`, która będzie przechowywać identyfikator użytkownika z `auth.users`. Należy ustawić jej wartość domyślną na `auth.uid()`.
