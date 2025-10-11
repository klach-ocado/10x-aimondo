# API Endpoint Implementation Plan: Update a Workout

## 1. Przegląd punktu końcowego
Ten dokument opisuje plan wdrożenia punktu końcowego `PUT /api/workouts/{id}`. Jego celem jest umożliwienie uwierzytelnionym użytkownikom aktualizacji szczegółów istniejącego treningu, takiego jak nazwa, data i typ. Punkt końcowy zapewni walidację danych wejściowych i będzie chroniony, aby użytkownicy mogli modyfikować tylko własne zasoby.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PUT`
- **Struktura URL**: `/api/workouts/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (URL, UUID): Unikalny identyfikator treningu do aktualizacji.
- **Request Body**:
  - **Struktura**: `application/json`
  - **Zawartość**:
    ```json
    {
      "name": "Wieczorny jogging po lesie",
      "date": "2025-10-26T18:30:00Z",
      "type": "jogging"
    }
    ```

## 3. Wykorzystywane typy
- **`WorkoutUpdateSchema` (do zdefiniowania w `src/types.ts`)**: Schemat `zod` do walidacji ciała żądania.
  ```typescript
  export const WorkoutUpdateSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long.").max(300, "Name must be no more than 300 characters long."),
    date: z.string().datetime("Invalid ISO 8601 date format."),
    type: z.string().min(3, "Type must be at least 3 characters long.").max(50, "Type must be no more than 50 characters long."),
  });
  ```
- **`UpdateWorkoutCommand` (istniejący w `src/types.ts`)**: Model polecenia używany do przekazywania danych do warstwy serwisowej.
- **`WorkoutDto` (istniejący w `src/types.ts`)**: Obiekt transferu danych zwracany w przypadku pomyślnej aktualizacji.

## 4. Przepływ danych
1.  Żądanie `PUT` trafia do pliku `src/pages/api/workouts/[id].ts`.
2.  Astro middleware (`src/middleware/index.ts`) jest wykonywane jako pierwsze. Weryfikuje ono sesję użytkownika za pomocą `context.locals.supabase`. Jeśli użytkownik nie jest uwierzytelniony, middleware zwraca odpowiedź `401 Unauthorized`.
3.  Handler `PUT` w pliku endpointu jest wywoływany.
4.  Parametr `id` jest pobierany z `context.params`. Jego format (UUID) jest walidowany.
5.  Ciało żądania jest odczytywane za pomocą `await context.request.json()`.
6.  Pobrane dane są walidowane przy użyciu `WorkoutUpdateSchema.safeParse()`. W przypadku niepowodzenia walidacji, zwracana jest odpowiedź `400 Bad Request` ze szczegółami błędów.
7.  Identyfikator użytkownika jest pobierany z sesji: `context.locals.user.id`.
8.  Wywoływana jest metoda `updateWorkout` z serwisu `workout.service.ts`, przekazując `id`, `userId` oraz zwalidowane dane jako `UpdateWorkoutCommand`.
9.  Serwis wykonuje operację `UPDATE` w bazie danych Supabase. Polityka RLS (Row-Level Security) na tabeli `workouts` zapewnia, że operacja powiedzie się tylko wtedy, gdy `user_id` w bazie danych pasuje do `userId` z sesji.
10. Jeśli operacja w bazie danych nie zaktualizuje żadnego wiersza (ponieważ `id` nie istnieje lub nie należy do użytkownika), serwis zwraca `null`.
11. Handler API sprawdza wynik z serwisu:
    - Jeśli `null`, zwraca `404 Not Found`.
    - Jeśli zwrócony zostanie obiekt `WorkoutDto`, zwraca `200 OK` z tym obiektem w ciele odpowiedzi.
12. W przypadku nieoczekiwanych błędów (np. problem z połączeniem z bazą), zwracana jest odpowiedź `500 Internal Server Error`.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Middleware weryfikuje sesję Supabase i blokuje dostęp nieautoryzowanym użytkownikom.
- **Autoryzacja**: Dostęp do modyfikacji zasobu jest ograniczony do jego właściciela. Jest to egzekwowane na poziomie bazy danych przez politykę RLS, która jest kluczowym elementem zabezpieczeń.
- **Walidacja danych wejściowych**: Wszystkie dane pochodzące od klienta (`id` z URL, ciało żądania) są rygorystycznie walidowane za pomocą `zod`, co zapobiega atakom typu NoSQL/SQL Injection oraz przyjmowaniu niepoprawnych danych.

## 6. Obsługa błędów
- **`400 Bad Request`**: Zwracany, gdy dane wejściowe nie przejdą walidacji `zod` lub `id` nie jest poprawnym UUID. Odpowiedź będzie zawierać szczegółowe informacje o błędach walidacji.
- **`401 Unauthorized`**: Zwracany przez middleware, gdy użytkownik nie jest zalogowany.
- **`404 Not Found`**: Zwracany, gdy trening o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów po stronie serwera, np. problemów z bazą danych. Błąd zostanie zarejestrowany w logach serwera.

## 7. Rozważania dotyczące wydajności
- Operacja `UPDATE` na pojedynczym rekordzie przy użyciu klucza głównego (`id`) i indeksowanego klucza obcego (`user_id`) jest wysoce wydajna.
- Nie przewiduje się znaczących wąskich gardeł wydajnościowych dla tego punktu końcowego przy normalnym obciążeniu.

## 8. Etapy wdrożenia
1.  **Aktualizacja typów**: W pliku `src/types.ts` dodaj `WorkoutUpdateSchema` zgodnie z definicją w sekcji 3.
2.  **Implementacja logiki serwisowej**:
    - W pliku `src/lib/services/workout.service.ts` utwórz nową, asynchroniczną metodę `updateWorkout`.
    - Metoda powinna przyjmować `id: string`, `userId: string` i `data: UpdateWorkoutCommand`.
    - Wewnątrz metody, użyj `supabase.from('workouts').update({...data, updated_at: new Date().toISOString()}).eq('id', id).eq('user_id', userId).select().single()`.
    - Metoda powinna obsłużyć błąd, gdy `single()` nie znajdzie rekordu (co Supabase sygnalizuje jako błąd) i zwrócić `null` w takim przypadku. W przeciwnym razie powinna zwrócić zaktualizowany obiekt.
3.  **Utworzenie pliku endpointu**: Utwórz plik `src/pages/api/workouts/[id].ts`.
4.  **Implementacja handlera `PUT`**:
    - W pliku `[id].ts` dodaj `export const prerender = false;`.
    - Zaimplementuj asynchroniczną funkcję `export async function PUT({ context, params, request }: APIContext)`.
    - Pobierz użytkownika z `context.locals.user`. Jeśli nie istnieje, zwróć `401`.
    - Zwaliduj `params.id` jako UUID.
    - Odczytaj i zwaliduj ciało żądania za pomocą `WorkoutUpdateSchema`.
    - Wywołaj `workoutService.updateWorkout` z odpowiednimi parametrami.
    - Na podstawie wyniku z serwisu, zwróć odpowiednią odpowiedź `Response` z kodem `200`, `404` lub `400`.
    - Dodaj blok `try...catch` do obsługi nieoczekiwanych błędów i zwracania `500`.
