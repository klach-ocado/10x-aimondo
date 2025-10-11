# API Endpoint Implementation Plan: Create Workout

## 1. Przegląd punktu końcowego

Ten punkt końcowy `POST /api/workouts` umożliwia uwierzytelnionym użytkownikom przesyłanie plików GPX w celu utworzenia nowych treningów. Endpoint przetwarza plik, oblicza kluczowe statystyki, takie jak dystans i czas trwania, a następnie zapisuje dane w bazie danych w ramach jednej transakcji. Po pomyślnym utworzeniu zwraca szczegóły nowego treningu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/workouts`
- **Typ zawartości**: `multipart/form-data`
- **Pola formularza**:
  - **Wymagane**:
    - `name` (string): Nazwa treningu, musi mieć od 3 do 300 znaków.
    - `gpxFile` (file): Plik w formacie `.gpx`, o maksymalnym rozmiarze 5MB.
  - **Opcjonalne**: Brak.

## 3. Wykorzystywane typy

- **`CreateWorkoutCommand`**: (`src/types.ts`) Używany do przekazania danych (nazwa, ID użytkownika, zawartość pliku GPX) z warstwy API do serwisu.
- **`WorkoutDto`**: (`src/types.ts`) Używany jako obiekt transferu danych (DTO) dla odpowiedzi, zawierający dane nowo utworzonego treningu.
- **`TrackPoint`**: (`src/types.ts`) Reprezentuje strukturę punktu trasy zapisywanego w bazie danych.
- **`WorkoutCreateSchema` (nowy)**: Schemat `zod` do walidacji pól `name` i `gpxFile` z żądania `multipart/form-data`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `201 Created`
  - **Struktura Body**: Obiekt JSON typu `WorkoutDto` (bez `track_points`).
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "user_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
      "name": "Morning Run",
      "date": "2025-10-26T08:00:00Z",
      "type": "run",
      "distance": 5230,
      "duration": 1850,
      "created_at": "2025-10-26T10:15:00Z",
      "updated_at": "2025-10-26T10:15:00Z"
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `413 Payload Too Large`: Plik GPX przekracza limit 5MB.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `POST` trafia do endpointu Astro `src/pages/api/workouts.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika i dołącza klienta Supabase oraz dane użytkownika do `context.locals`.
3.  Endpoint sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
4.  Dane `multipart/form-data` są odczytywane z żądania.
5.  Schemat `zod` (`WorkoutCreateSchema`) waliduje pole `name`.
6.  Metadane pliku `gpxFile` są walidowane: istnienie, rozmiar (< 5MB) i rozszerzenie (`.gpx`).
7.  Jeśli walidacja przejdzie pomyślnie, zawartość pliku GPX jest odczytywana jako tekst.
8.  Tworzony jest obiekt `CreateWorkoutCommand` zawierający `name`, `user_id` (z `context.locals.user.id`) i `gpxFileContent`.
9.  Wywoływana jest metoda `createWorkout(command)` z nowo utworzonego serwisu `WorkoutService`.
10. **Wewnątrz `WorkoutService`**:
    a. Biblioteka `gpxparser` parsuje `gpxFileContent`.
    b. Sprawdzane jest, czy istnieją jakiekolwiek punkty trasy. Jeśli nie, zgłaszany jest błąd.
    c. Obliczane są statystyki: całkowity dystans i czas trwania.
    d. Rozpoczynana jest transakcja bazodanowa przy użyciu Supabase (`supabase.rpc('create_workout_with_track_points', ...)` lub wykonując kolejne zapytania w ramach jednej transakcji).
    e. Nowy rekord jest wstawiany do tabeli `workouts`.
    f. Wszystkie punkty trasy są masowo wstawiane do tabeli `track_points` z `workout_id` nowego treningu.
    g. Transakcja jest zatwierdzana.
11. `WorkoutService` zwraca nowo utworzony obiekt `WorkoutDto`.
12. Endpoint zwraca odpowiedź `201 Created` z obiektem `WorkoutDto` w ciele.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony do zalogowanych użytkowników poprzez weryfikację sesji Supabase w middleware Astro.
- **Autoryzacja**: Polityki Row-Level Security (RLS) w bazie danych PostgreSQL zapewniają, że operacje zapisu do tabeli `workouts` mogą być wykonywane tylko w imieniu zalogowanego użytkownika (`WITH CHECK (auth.uid() = user_id)`).
- **Walidacja wejścia**:
  - `name`: Walidacja `zod` zapobiega zbyt krótkim/długim lub nieprawidłowym wartościom.
  - `gpxFile`: Ścisła walidacja rozmiaru pliku, rozszerzenia i typu MIME chroni przed atakami DoS i przesyłaniem złośliwych plików.
- **Bezpieczeństwo parsera XML**: Wybrana biblioteka do parsowania GPX (`gpxparser`) musi być skonfigurowana lub domyślnie odporna na ataki typu XXE (XML External Entity).

## 7. Rozważania dotyczące wydajności

- **Przesyłanie plików**: Limit 5MB na plik GPX jest rozsądnym kompromisem między funkcjonalnością a obciążeniem serwera.
- **Przetwarzanie danych**: Parsowanie GPX i obliczanie statystyk odbywa się na serwerze. Dla plików do 5MB operacje te powinny być wystarczająco szybkie.
- **Operacje bazodanowe**: Użycie transakcji i masowego wstawiania (`bulk insert`) dla punktów trasy jest kluczowe dla zapewnienia integralności danych i minimalizacji liczby zapytań do bazy danych, co znacząco poprawia wydajność.

## 8. Etapy wdrożenia

1.  **Konfiguracja zależności**: Zainstaluj bibliotekę do parsowania GPX, np. `gpxparser-js`.
    ```bash
    npm install gpxparser-js
    ```
2.  **Utworzenie pliku API**: Stwórz plik `src/pages/api/workouts.ts`.
3.  **Implementacja walidacji**: W pliku API dodaj logikę uwierzytelniania oraz walidacji `multipart/form-data` przy użyciu `zod` dla pola `name` i ręcznej walidacji dla `gpxFile`.
4.  **Utworzenie serwisu**: Stwórz plik `src/lib/services/workout.service.ts`.
5.  **Implementacja logiki serwisu**:
    - Zaimplementuj metodę `createWorkout(command: CreateWorkoutCommand)`.
    - Wewnątrz metody dodaj logikę do parsowania GPX, walidacji zawartości (sprawdzenie istnienia punktów trasy) i obliczania statystyk.
6.  **Implementacja transakcji bazodanowej**:
    - W `WorkoutService`, użyj klienta Supabase do wykonania transakcji:
      1. Wstawienie rekordu do `workouts`.
      2. Masowe wstawienie rekordów do `track_points`.
    - Zadbaj o poprawne wycofywanie transakcji w przypadku błędu.
7.  **Integracja API z serwisem**: W pliku API (`workouts.ts`) wywołaj metodę `workoutService.createWorkout()` i obsłuż jej wynik lub błędy.
8.  **Obsługa błędów**: Zaimplementuj kompleksową obsługę błędów, mapując błędy z serwisu i walidacji na odpowiednie kody statusu HTTP (400, 401, 413, 500).
9.  **Testowanie**: Utwórz testy jednostkowe dla `WorkoutService` (mockując bazę danych) oraz testy integracyjne dla endpointu API, aby zweryfikować cały przepływ, włączając w to poprawne i niepoprawne przypadki użycia.
