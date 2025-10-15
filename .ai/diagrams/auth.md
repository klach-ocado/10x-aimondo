<authentication_analysis>
Na podstawie dostarczonych dokumentów, oto analiza przepływów autentykacji:

### 1. Zidentyfikowane przepływy autentykacji:

- **Rejestracja Użytkownika (Sign Up)**: Nowy użytkownik tworzy konto.
- **Logowanie Użytkownika (Sign In)**: Istniejący użytkownik uzyskuje dostęp do aplikacji.
- **Wylogowanie Użytkownika (Sign Out)**: Zalogowany użytkownik kończy sesję.
- **Resetowanie Hasła (Password Reset)**: Użytkownik inicjuje proces odzyskiwania hasła.
- **Aktualizacja Hasła (Update Password)**: Użytkownik ustawia nowe hasło po resecie.
- **Ochrona Tras (Route Protection)**: System uniemożliwia dostęp do chronionych stron niezalogowanym użytkownikom.
- **Odświeżanie Sesji (Token Refresh)**: Automatyczne odświeżanie wygasających tokenów JWT w tle.

### 2. Główni aktorzy i ich interakcje:

- **Przeglądarka (Browser)**: Interfejs użytkownika, z którego użytkownik inicjuje akcje (np. wypełnia formularz logowania). Renderuje komponenty React i strony Astro.
- **Middleware (Astro)**: Centralny punkt kontroli dla każdego żądania. Odpowiada za weryfikację sesji, ochronę tras i zarządzanie ciasteczkami sesji.
- **Astro API**: Dedykowane endpointy (np. `/api/auth/login`) obsługujące logikę biznesową autentykacji, komunikujące się z Supabase.
- **Supabase Auth**: Zewnętrzna usługa odpowiedzialna za zarządzanie tożsamością, wystawianie i weryfikację tokenów JWT.

### 3. Procesy weryfikacji i odświeżania tokenów:

- **Weryfikacja**: Przy każdym żądaniu do chronionej trasy, Middleware używa tokenu z ciasteczek, aby zweryfikować sesję w Supabase.
- **Odświeżanie**: Biblioteka kliencka Supabase automatycznie próbuje odświeżyć token dostępowy (access token) przy użyciu tokenu odświeżającego (refresh token), gdy ten pierwszy wygaśnie. Middleware przechwytuje nowe tokeny (zwracane w odpowiedzi z Supabase) i aktualizuje ciasteczka w przeglądarce użytkownika, zapewniając ciągłość sesji.

### 4. Opis kroków autentykacji (Przepływ logowania):

1.  Użytkownik wypełnia formularz logowania w komponencie React (`LoginForm.tsx`) i go wysyła.
2.  Komponent wysyła żądanie `POST` do endpointu `/api/auth/login` z e-mailem i hasłem.
3.  Żądanie jest przechwytywane przez Middleware, które inicjalizuje klienta Supabase z ciasteczkami z żądania.
4.  Endpoint `/api/auth/login` wywołuje `supabase.auth.signInWithPassword()`.
5.  Supabase Auth weryfikuje dane. W przypadku sukcesu generuje tokeny (access i refresh) i zwraca je do Astro API.
6.  Astro API zwraca odpowiedź 200 OK.
7.  Middleware przechwytuje odpowiedź, zauważa nagłówki `Set-Cookie` od Supabase, dołącza je do finalnej odpowiedzi i wysyła do przeglądarki.
8.  Przeglądarka zapisuje ciasteczka sesyjne.
9.  Komponent React, po otrzymaniu odpowiedzi 200 OK, przekierowuje użytkownika na stronę `/dashboard`.
10. Przy kolejnym żądaniu (np. do `/dashboard`), Middleware odczyta nowe ciasteczka, pomyślnie zweryfikuje sesję i zezwoli na dostęp.

</authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber

    participant Browser
    participant Middleware
    participant Astro API
    participant Supabase Auth

    %% --- User Login Flow ---
    Note over Browser, Supabase Auth: Przepływ logowania użytkownika

    Browser->>Middleware: POST /api/auth/login
    activate Middleware
    Middleware->>Astro API: Przekazanie żądania
    activate Astro API
    Astro API->>Supabase Auth: signInWithPassword()
    activate Supabase Auth

    alt Dane poprawne
        Supabase Auth-->>Astro API: Sesja (access & refresh token)
        Astro API-->>Middleware: Odpowiedź 200 OK
        Note over Middleware: Dołączenie Set-Cookie do odpowiedzi
        Middleware-->>Browser: Odpowiedź 200 OK + Set-Cookie
        Browser->>Browser: Przekierowanie do /dashboard
    else Dane niepoprawne
        Supabase Auth-->>Astro API: Błąd autentykacji
        Astro API-->>Middleware: Odpowiedź 401 Unauthorized
        Middleware-->>Browser: Odpowiedź 401 Unauthorized
    end

    deactivate Supabase Auth
    deactivate Astro API
    deactivate Middleware

    %% --- Accessing Protected Route ---
    Note over Browser, Supabase Auth: Dostęp do chronionej trasy

    Browser->>Middleware: GET /dashboard
    activate Middleware
    Middleware->>Supabase Auth: Weryfikacja sesji
    activate Supabase Auth

    alt Sesja ważna
        Supabase Auth-->>Middleware: Sesja jest prawidłowa
        Note over Middleware: Renderowanie strony /dashboard
        Middleware-->>Browser: Odpowiedź 200 OK (HTML)
    else Sesja nieważna lub brak
        Supabase Auth-->>Middleware: Brak aktywnej sesji
        Middleware-->>Browser: Odpowiedź 302 Redirect na /login
    end

    deactivate Supabase Auth
    deactivate Middleware

    %% --- Token Refresh Flow ---
    Note over Browser, Supabase Auth: Automatyczne odświeżanie tokenu

    Browser->>Middleware: GET /api/workouts
    activate Middleware
    Middleware->>Supabase Auth: Weryfikacja sesji (token odświeżony w tle)
    activate Supabase Auth
    Supabase Auth-->>Middleware: Zwraca nową, ważną sesję
    deactivate Supabase Auth

    Middleware->>Astro API: Kontynuacja żądania z nową sesją
    activate Astro API
    Astro API-->>Middleware: Zwraca dane (np. lista treningów)
    deactivate Astro API

    Note over Middleware: Dołączenie nowej sesji (Set-Cookie) do odpowiedzi
    Middleware-->>Browser: Odpowiedź 200 OK + Set-Cookie
    deactivate Middleware

```

</mermaid_diagram>
