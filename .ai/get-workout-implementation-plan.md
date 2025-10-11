# API Endpoint Implementation Plan: Get a single workout with its track

## 1. Przegląd punktu końcowego

Ten punkt końcowy API umożliwia pobranie szczegółowych informacji o pojedynczym treningu na podstawie jego unikalnego identyfikatora (ID). Odpowiedź zawiera kluczowe metadane treningu, takie jak nazwa, data i dystans, a także pełną listę punktów geograficznych (trasę), które składają się na ten trening. Dostęp do danych jest ograniczony tylko do właściciela treningu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/workouts/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator (UUID) treningu, który ma zostać pobrany.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `WorkoutDetailsDto`: Główny obiekt danych zwracany przez API, zawierający szczegóły treningu i tablicę punktów trasy.
  - `TrackPointDto`: Obiekt reprezentujący pojedynczy punkt na trasie.
- **Command Model**:
  - `GetWorkoutDetailsCommand`: Obiekt przekazywany do warstwy serwisowej, zawierający `workoutId` i `userId` w celu separacji logiki biznesowej od warstwy transportowej.
    ```typescript
    // To be added in src/types.ts
    export interface GetWorkoutDetailsCommand {
      workoutId: string;
      userId: string;
    }
    ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `200 OK`
  - **Body**: Obiekt `WorkoutDetailsDto`.
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Morning Run",
      "date": "2025-10-26T08:00:00Z",
      "type": "run",
      "distance": 5230,
      "duration": 1850,
      "track_points": [
        { "lat": 49.2827, "lng": -123.1207, "ele": 10.5, "time": "2025-10-26T08:00:05Z" },
        { "lat": 49.2828, "lng": -123.1209, "ele": 10.8, "time": "2025-10-26T08:00:10Z" }
      ]
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy `id` w URL nie jest prawidłowym UUID.
  - `401 Unauthorized`: Gdy użytkownik nie jest zalogowany.
  - `404 Not Found`: Gdy trening o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointa Astro `src/pages/api/workouts/[id].ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`.
3.  Handler endpointa pobiera `id` z parametrów ścieżki (`Astro.params`).
4.  Parametr `id` jest walidowany przy użyciu `zod` w celu sprawdzenia, czy jest to prawidłowy UUID. W przypadku błędu walidacji zwracany jest status `400 Bad Request`.
5.  Handler wywołuje funkcję `getWorkoutDetails` z serwisu `workout.service.ts`, przekazując obiekt `GetWorkoutDetailsCommand` zawierający `workoutId` i `userId` (pobrany z `context.locals.user`).
6.  Serwis wykonuje zapytanie do bazy danych Supabase, pobierając dane z tabeli `workouts` i zagnieżdżone dane z `track_points` dla podanego ID. Zapytanie jest automatycznie filtrowane przez RLS, aby zapewnić dostęp tylko do danych właściciela.
7.  W zapytaniu do `track_points`, współrzędne `location` (typu `GEOMETRY`) są transformowane na `lat` i `lng` przy użyciu funkcji PostGIS `ST_Y()` i `ST_X()`.
8.  Jeśli zapytanie nie zwróci żadnych wyników, serwis zwraca `null`.
9.  Handler endpointa sprawdza wynik z serwisu. Jeśli jest `null`, zwraca `404 Not Found`.
10. Jeśli dane zostały pomyślnie pobrane, serwis mapuje je na obiekt `WorkoutDetailsDto`.
11. Handler zwraca odpowiedź JSON z kodem `200 OK` i obiektem `WorkoutDetailsDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Middleware Astro będzie odpowiedzialne za weryfikację tokenu sesji Supabase i odrzucenie nieautoryzowanych żądań.
- **Autoryzacja**: Dostęp do zasobu jest chroniony przez polityki Row-Level Security (RLS) w bazie danych PostgreSQL, które zapewniają, że użytkownicy mogą odpytywać tylko własne treningi. Jest to podstawowy i najważniejszy mechanizm autoryzacji.
- **Walidacja danych wejściowych**: Parametr `id` jest rygorystycznie walidowany jako UUID, aby zapobiec błędom zapytań i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK w dużym stopniu przed tym chroni).

## 7. Rozważania dotyczące wydajności

- **Zapytanie do bazy danych**: Aby zapewnić wysoką wydajność, zapytanie powinno pobierać zarówno dane treningu, jak i wszystkie jego punkty trasy w jednym zapytaniu do bazy danych, wykorzystując możliwości zagnieżdżania zapytań w Supabase. Pozwoli to uniknąć problemu N+1 zapytań.
- **Indeksowanie**: Klucz obcy `workout_id` w tabeli `track_points` musi być zaindeksowany, aby zapewnić szybkie łączenie danych. Zgodnie z `db-plan.md`, jest to już zapewnione.

## 8. Etapy wdrożenia

1.  **Aktualizacja typów**: W pliku `src/types.ts` dodaj definicję interfejsu `GetWorkoutDetailsCommand`.
2.  **Utworzenie pliku endpointa**: Stwórz nowy plik `src/pages/api/workouts/[id].ts`.
3.  **Implementacja serwisu**: W pliku `src/lib/services/workout.service.ts` dodaj nową funkcję asynchroniczną `getWorkoutDetails(command: GetWorkoutDetailsCommand): Promise<WorkoutDetailsDto | null>`.
    - Wewnątrz funkcji zaimplementuj zapytanie Supabase, które pobiera trening (`workouts`) i zagnieżdżone punkty trasy (`track_points`).
    - Użyj `.select('*, track_points(*)')`.
    - W zapytaniu o `track_points` użyj transformacji `location` na `lat` i `lng`.
    - Zmapuj wynik na `WorkoutDetailsDto` lub zwróć `null`, jeśli trening nie zostanie znaleziony.
4.  **Implementacja handlera API**: W pliku `src/pages/api/workouts/[id].ts` zaimplementuj handler `GET`.
    - Ustaw `export const prerender = false;`.
    - Pobierz `id` z `Astro.params` i `user` z `context.locals`.
    - Zwaliduj `id` za pomocą `zod.string().uuid()`.
    - Wywołaj serwis `getWorkoutDetails` z odpowiednimi parametrami.
    - Zwróć odpowiedź `200 OK` z danymi, `404 Not Found`, jeśli serwis zwróci `null`, lub `400 Bad Request` w przypadku błędu walidacji.
    - Dodaj obsługę błędów `500 Internal Server Error` za pomocą bloku `try...catch`.
5.  **Testowanie**: Po implementacji, przetestuj endpoint przy użyciu narzędzia do testowania API (np. Postman, cURL) dla wszystkich scenariuszy: sukcesu, braku autoryzacji, nieznalezionego zasobu i nieprawidłowego ID.
