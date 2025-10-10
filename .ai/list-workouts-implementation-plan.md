# API Endpoint Implementation Plan: Get Workouts

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`GET /api/workouts`) jest odpowiedzialny za pobieranie listy treningów dla uwierzytelnionego użytkownika. Zapewnia funkcjonalności paginacji, filtrowania (po nazwie, dacie, typie) oraz sortowania, umożliwiając klientowi elastyczne przeszukiwanie danych.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/workouts`
- **Parametry**:
  - **Opcjonalne**:
    - `page` (integer, domyślnie: 1): Numer strony do paginacji.
    - `limit` (integer, domyślnie: 20): Liczba wyników na stronie.
    - `name` (string): Filtruje treningi, których nazwa zawiera podany ciąg znaków (case-insensitive).
    - `dateFrom` (string, format: YYYY-MM-DD): Dolna granica zakresu daty treningu.
    - `dateTo` (string, format: YYYY-MM-DD): Górna granica zakresu daty treningu.
    - `type` (string): Filtruje treningi po konkretnym typie (np. "run").
    - `sortBy` (string, domyślnie: 'date'): Pole, po którym odbywa się sortowanie.
    - `order` (string, domyślnie: 'desc'): Kierunek sortowania ('asc' lub 'desc').
- **Request Body**: Brak (parametry przekazywane są w URL).

## 3. Wykorzystywane typy
- **DTO (z `src/types.ts`)**:
  - `PaginatedWorkoutsDto`: Główny typ odpowiedzi.
  - `WorkoutListItemDto`: Reprezentacja pojedynczego treningu na liście.
  - `Pagination`: Metadane paginacji.
- **Command Model (nowy)**:
  - `GetWorkoutsCommand`: Obiekt przekazywany do warstwy serwisowej, zawierający zwalidowane i sparsowane parametry zapytania.
    ```typescript
    type GetWorkoutsCommand = {
      userId: string;
      page: number;
      limit: number;
      name?: string;
      dateFrom?: string;
      dateTo?: string;
      type?: string;
      sortBy: string;
      order: 'asc' | 'desc';
    };
    ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 100,
      "totalPages": 5
    },
    "data": [
      {
        "id": "uuid-goes-here",
        "name": "Evening Jog",
        "date": "2025-10-25T18:30:00Z",
        "type": "run",
        "distance": 7500,
        "duration": 2700
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu Astro `src/pages/api/workouts/index.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika i dołącza klienta Supabase oraz dane użytkownika do `context.locals`.
3.  Handler `GET` w pliku endpointu sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
4.  Parametry zapytania z URL są parsowane i walidowane przy użyciu predefiniowanego schematu `zod`. W przypadku błędu walidacji, zwracany jest `400 Bad Request` z opisem błędu.
5.  Tworzony jest obiekt `GetWorkoutsCommand` z `userId` i zwalidowanymi parametrami.
6.  Wywoływana jest funkcja `WorkoutService.getWorkouts(command)` z `src/lib/services/workout.service.ts`.
7.  Serwis dynamicznie buduje zapytanie do Supabase, używając `select()`.
    - Dołącza filtry `.ilike('name', ...)` , `.gte('date', ...)` , `.lte('date', ...)` , `.eq('type', ...)` jeśli są obecne w komendzie.
    - Dodaje sortowanie `.order(sortBy, { ascending: order === 'asc' })`.
    - Aplikuje paginację `.range((page - 1) * limit, page * limit - 1)`.
8.  Wykonywane są dwa zapytania: jedno po dane, drugie po całkowitą liczbę pasujących rekordów (`count`).
9.  Serwis konstruuje i zwraca obiekt `PaginatedWorkoutsDto`.
10. Endpoint zwraca otrzymany DTO do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony do zalogowanych użytkowników. Middleware Astro będzie odpowiedzialne za weryfikację tokenu sesji.
- **Autoryzacja**: Mechanizm Row-Level Security (RLS) w bazie danych PostgreSQL (skonfigurowany w Supabase) zapewni, że zapytanie zwróci wyłącznie treningi należące do uwierzytelnionego użytkownika (`auth.uid() = user_id`).
- **Walidacja wejścia**: Użycie `zod` do walidacji wszystkich parametrów wejściowych chroni przed nieoczekiwanymi danymi i potencjalnymi atakami.

## 7. Obsługa błędów
- **Błędy walidacji (400)**: Zod schema w handlerze API przechwyci wszelkie niezgodności typów, formatów czy wartości i zwróci odpowiedź z czytelnym komunikatem.
- **Brak autoryzacji (401)**: Handler sprawdzi istnienie sesji użytkownika na początku i zwróci błąd, jeśli jej brak.
- **Błędy serwera (500)**: Wszelkie nieoczekiwane wyjątki w warstwie serwisu (np. błąd połączenia z bazą danych) będą przechwytywane w bloku `try...catch` w handlerze API i logowane, a do klienta zostanie zwrócona generyczna odpowiedź o błędzie serwera.

## 8. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych**: Wydajność zapytań będzie zapewniona przez odpowiednie indeksy w tabeli `workouts`, zgodnie z `.ai/db-plan.md`. Kluczowe będą indeksy na `(user_id, date DESC)` oraz na kolumnie `type`.
- **Paginacja**: Obowiązkowa paginacja zapobiega przesyłaniu dużych ilości danych i przeciążaniu zarówno serwera, jak i klienta.
- **Liczba zapytań**: Wykonanie dwóch zapytań (jedno po dane, drugie po `count`) jest optymalnym podejściem przy użyciu Supabase, aby uzyskać zarówno paginowane wyniki, jak i całkowitą liczbę elementów.

## 9. Etapy wdrożenia
1.  **Utworzenie pliku endpointu**: Stwórz plik `src/pages/api/workouts/index.ts`.
2.  **Zdefiniowanie walidacji**: W pliku `index.ts` zdefiniuj schemat `zod` do walidacji parametrów `page`, `limit`, `name`, `dateFrom`, `dateTo`, `type`, `sortBy` i `order`.
3.  **Implementacja handlera `GET`**: W `index.ts` zaimplementuj handler `GET`, który:
    - Ustawia `export const prerender = false;`.
    - Sprawdza uwierzytelnienie użytkownika z `context.locals`.
    - Parsuje i waliduje parametry zapytania przy użyciu schemy `zod`.
    - Obsługuje błędy walidacji i autoryzacji.
4.  **Utworzenie pliku serwisu**: Stwórz plik `src/lib/services/workout.service.ts`.
5.  **Zdefiniowanie `GetWorkoutsCommand`**: W pliku serwisu (lub w `src/types.ts`) zdefiniuj typ `GetWorkoutsCommand`.
6.  **Implementacja logiki serwisu**: W `workout.service.ts` stwórz asynchroniczną funkcję `getWorkouts`, która przyjmuje `GetWorkoutsCommand` i klienta Supabase.
7.  **Budowa zapytania**: Wewnątrz `getWorkouts` zaimplementuj logikę budowania dynamicznego zapytania do Supabase, uwzględniając wszystkie filtry, sortowanie i paginację.
8.  **Wykonanie zapytań**: Wykonaj zapytanie o dane oraz zapytanie o całkowitą liczbę rekordów (`count`).
9.  **Konstrukcja odpowiedzi**: Sformatuj wyniki do postaci `PaginatedWorkoutsDto` i zwróć je.
10. **Integracja**: W handlerze `GET` (`index.ts`) wywołaj nowo utworzoną funkcję serwisową, opakuj wywołanie w `try...catch` i zwróć jej wynik lub odpowiedni błąd do klienta.
