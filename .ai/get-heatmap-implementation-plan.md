# API Endpoint Implementation Plan: Get Heatmap Data

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest dostarczenie danych do generowania mapy cieplnej (heatmap) na podstawie aktywności użytkownika. Endpoint `GET /api/heatmap` pobiera losową próbkę do 10 000 punktów geograficznych (`track_points`) z obszaru widocznego na mapie, uwzględniając aktywne filtry. Zapewnia to wysoką wydajność przy jednoczesnym zachowaniu reprezentatywności wizualizacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/heatmap`
- **Parametry Zapytania (Query Parameters)**:
  - **Wymagane**:
    - `bbox` (string): Obszar geograficzny w formacie `minLng,minLat,maxLng,maxLat`.
  - **Opcjonalne**:
    - `name` (string): Filtr po fragmencie nazwy treningu.
    - `dateFrom` (string): Początek zakresu dat (format: `YYYY-MM-DD`).
    - `dateTo` (string): Koniec zakresu dat (format: `YYYY-MM-DD`).
    - `type` (string): Filtr po typie treningu (np. "run", "bike").
- **Request Body**: Brak (dane przekazywane w parametrach zapytania).

## 3. Wykorzystywane typy

- **Command Model**: `GetHeatmapDataCommand`
  ```typescript
  export interface GetHeatmapDataCommand {
    userId: string;
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
  }
  ```
- **DTO (Data Transfer Object)**: `HeatmapDto`
  ```typescript
  export interface HeatmapDto {
    points: [number, number][]; // [latitude, longitude]
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "points": [
      [49.2827, -123.1207],
      [49.2828, -123.1209]
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe lub brakujące parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera (np. błąd bazy danych).

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu `/api/heatmap`.
2.  Middleware Astro weryfikuje sesję użytkownika. Jeśli użytkownik nie jest zalogowany, zwraca `401 Unauthorized`.
3.  Handler endpointu w `src/pages/api/heatmap.ts` używa schemy `zod` do walidacji i parsowania parametrów zapytania.
4.  W przypadku błędu walidacji, zwracany jest błąd `400 Bad Request` z odpowiednim komunikatem.
5.  Po pomyślnej walidacji, tworzony jest obiekt `GetHeatmapDataCommand`.
6.  Wywoływana jest metoda `workoutService.getHeatmapData(command)`.
7.  Serwis `workout.service.ts` komunikuje się z Supabase, wywołując funkcję PostgreSQL (`rpc()`) dedykowaną do pobierania danych heatmapy.
8.  Funkcja w bazie danych:
    a. Łączy (`JOIN`) tabele `track_points` i `workouts`.
    b. Filtruje wyniki na podstawie `user_id` (RLS jest automatycznie stosowane).
    c. Używa `ST_MakeEnvelope` i operatora `&&` do filtrowania punktów wewnątrz `bbox`.
    d. Aplikuje opcjonalne filtry (`name`, `date`, `type`).
    e. Używa `TABLESAMPLE SYSTEM (n)` do pobrania losowej próbki maksymalnie 10 000 wierszy.
    f. Zwraca tablicę współrzędnych `[latitude, longitude]`.
9.  Serwis otrzymuje dane i przekazuje je do handlera endpointu.
10. Handler zwraca odpowiedź `200 OK` z danymi w formacie `HeatmapDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware Astro, który sprawdza, czy użytkownik jest zalogowany.
- **Autoryzacja**: Polityki Row-Level Security (RLS) w Supabase na tabeli `workouts` zapewniają, że zapytanie zwróci tylko punkty należące do treningów aktualnie zalogowanego użytkownika. Jest to kluczowe dla izolacji danych.
- **Walidacja danych**: Użycie `zod` do walidacji wszystkich danych wejściowych z zapytania chroni przed nieoczekiwanymi formatami danych.
- **SQL Injection**: Zastosowanie `rpc()` z Supabase SDK z parametryzacją zapytania zapobiega atakom typu SQL Injection.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, gdy walidacja `zod` nie powiedzie się (np. brak `bbox`, nieprawidłowy format `bbox` lub dat). Odpowiedź będzie zawierać szczegóły błędu walidacji.
- **401 Unauthorized**: Zwracany przez middleware, jeśli brak aktywnej sesji użytkownika.
- **500 Internal Server Error**: Zwracany w bloku `try...catch`, gdy wystąpi błąd podczas komunikacji z bazą danych lub inny nieprzewidziany błąd serwera. Błąd zostanie zalogowany po stronie serwera.

## 8. Rozważania dotyczące wydajności

- **Próbkowanie danych**: Ograniczenie liczby punktów do 10 000 za pomocą `TABLESAMPLE SYSTEM` jest kluczowe dla utrzymania niskiego czasu odpowiedzi i zmniejszenia obciążenia klienta.
- **Indeksy bazy danych**: Wydajność zapytania zależy od istnienia przestrzennego indeksu GiST na kolumnie `track_points.location`.
- **Przeniesienie logiki do bazy danych**: Zaimplementowanie logiki w funkcji PostgreSQL i wywołanie jej przez `rpc()` minimalizuje liczbę zapytań i transfer danych między aplikacją a bazą danych.

## 9. Etapy wdrożenia

1.  **Baza danych**:
    - Stworzyć nową funkcję w PostgreSQL o nazwie `get_heatmap_points`.
    - Funkcja ta będzie przyjmować parametry: `user_id`, `min_lng`, `min_lat`, `max_lng`, `max_lat` oraz opcjonalne filtry.
    - Zaimplementować w niej logikę opisaną w sekcji "Przepływ danych".
2.  **Typy**:
    - Dodać definicję typu `GetHeatmapDataCommand` w pliku `src/types.ts`.
3.  **Serwis**:
    - W pliku `src/lib/services/workout.service.ts` dodać nową metodę asynchroniczną `getHeatmapData(command: GetHeatmapDataCommand): Promise<HeatmapDto>`.
    - Wewnątrz metody wywołać funkcję `get_heatmap_points` z bazy danych za pomocą `supabase.rpc()`.
    - Przetworzyć wynik i zwrócić go jako `HeatmapDto`.
4.  **Endpoint API**:
    - Utworzyć nowy plik `src/pages/api/heatmap.ts`.
    - Zdefiniować `export const prerender = false;`.
    - Stworzyć schemę walidacji `zod` dla parametrów zapytania, w tym transformację `bbox` na osobne wartości liczbowe.
    - Zaimplementować handler `GET`, który:
      a. Pobiera `supabase` i `session` z `context.locals`.
      b. Sprawdza, czy sesja istnieje.
      c. Waliduje parametry zapytania.
      d. Tworzy `GetHeatmapDataCommand`.
      e. Wywołuje `workoutService.getHeatmapData()`.
      f. Obsługuje błędy i zwraca odpowiednie kody statusu.
      g. Zwraca dane w przypadku sukcesu.
5.  **Testowanie**:
    - Dodać testy jednostkowe dla serwisu (jeśli dotyczy).
    - Przeprowadzić testy manualne lub automatyczne (end-to-end) w celu weryfikacji poprawności działania endpointu, obsługi błędów i wydajności.
