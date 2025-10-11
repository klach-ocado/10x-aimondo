# API Endpoint Implementation Plan: Delete a Workout

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom trwałe usunięcie jednego ze swoich treningów. Usunięcie treningu powoduje również kaskadowe usunięcie wszystkich powiązanych z nim punktów trasy (`track_points`) dzięki relacji z kluczem obcym `ON DELETE CASCADE` zdefiniowanej w schemacie bazy danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/workouts/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (URL parameter, `UUID`): Unikalny identyfikator treningu, który ma zostać usunięty.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

W celu zachowania spójności architektury, zdefiniujemy model polecenia, który będzie przekazywany z warstwy API do warstwy serwisowej.

- **Command Model**:
  ```typescript
  // To be defined within the service method call
  interface DeleteWorkoutCommand {
    id: string; // Workout ID (UUID)
    userId: string; // User ID from session (UUID)
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `204 No Content`
  - **Treść**: Pusta.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli podany `id` nie jest w formacie UUID.
  - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Jeśli trening o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych

1. Żądanie `DELETE` trafia do dynamicznego endpointu Astro: `src/pages/api/workouts/[id].ts`.
2. Middleware Astro (`src/middleware/index.ts`) weryfikuje, czy użytkownik jest zalogowany. Jeśli nie, przerywa przetwarzanie i zwraca `401 Unauthorized`. Jeśli tak, dołącza `locals.supabase` i `locals.user` do kontekstu.
3. Endpoint `[id].ts` odczytuje parametr `id` z `Astro.params`.
4. Za pomocą `zod` przeprowadzana jest walidacja, czy `id` jest poprawnym UUID. Jeśli nie, zwracany jest błąd `400 Bad Request`.
5. Endpoint wywołuje metodę `deleteWorkout` z serwisu `workout.service.ts`, przekazując `id` treningu oraz `id` użytkownika z `Astro.locals.user`.
6. Metoda `deleteWorkout` w serwisie konstruuje i wykonuje zapytanie `DELETE` do tabeli `workouts` w Supabase, używając `supabase.from('workouts').delete().match({ id: command.id })`.
7. Polityka RLS (Row-Level Security) w bazie danych PostgreSQL automatycznie zapewnia, że operacja `DELETE` powiedzie się tylko wtedy, gdy `user_id` w usuwanym wierszu jest zgodne z `auth.uid()` (ID zalogowanego użytkownika).
8. Jeśli zapytanie usunie wiersz (co oznacza, że trening istniał i należał do użytkownika), baza danych automatycznie usunie powiązane `track_points` dzięki `ON DELETE CASCADE`.
9. Serwis sprawdza wynik operacji. Jeśli liczba usuniętych wierszy wynosi 0, oznacza to, że trening nie został znaleziony dla danego użytkownika, więc serwis zwraca rezultat wskazujący na `404 Not Found`.
10. Endpoint na podstawie wyniku z serwisu zwraca odpowiedni kod statusu: `204 No Content` w przypadku sukcesu lub odpowiedni kod błędu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Middleware Astro jest odpowiedzialne za weryfikację tokenu sesji i odrzucenie nieautoryzowanych żądań.
- **Autoryzacja**: Gwarancja, że użytkownik może usunąć tylko własne treningi, jest egzekwowana na poziomie bazy danych przez politykę RLS Supabase. Zapobiega to atakom typu IDOR (Insecure Direct Object Reference).
- **Walidacja danych wejściowych**: Parametr `id` jest walidowany, aby upewnić się, że jest to prawidłowy UUID, co zapobiega błędom zapytań i potencjalnym atakom.

## 7. Obsługa błędów

- **`id` nie jest UUID**: Endpoint zwraca `400 Bad Request` z komunikatem błędu.
- **Użytkownik niezalogowany**: Middleware zwraca `401 Unauthorized`.
- **Trening nie istnieje lub nie należy do użytkownika**: Serwis `delete` z Supabase nie znajdzie pasującego rekordu. Na podstawie wyniku operacji, endpoint zwróci `404 Not Found`.
- **Błąd bazy danych**: Wszelkie błędy zgłoszone przez Supabase podczas operacji `DELETE` (np. problem z połączeniem) będą przechwytywane w bloku `try...catch`, logowane na serwerze, a do klienta zostanie zwrócony ogólny błąd `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Operacja `DELETE` na pojedynczym rekordzie z indeksem na kluczu głównym jest bardzo wydajna.
- Kaskadowe usuwanie w tabeli `track_points` jest również wydajne, ponieważ jest oparte na indeksowanym kluczu obcym `workout_id`.
- Przy dużej liczbie punktów trasy na jeden trening operacja może zająć chwilę, ale jest to operacja jednorazowa i nie powinna wpływać na ogólną wydajność aplikacji.

## 9. Etapy wdrożenia

1. **Aktualizacja serwisu `workout.service.ts`**:
   - Dodaj nową metodę `deleteWorkout(command: { id: string; userId: string; supabase: SupabaseClient }): Promise<{ error: any; notFound: boolean }>`.
   - Wewnątrz metody wykonaj zapytanie `supabase.from('workouts').delete().match({ id: command.id })`.
   - Sprawdź `error` oraz `count` w odpowiedzi od Supabase. Jeśli `count` jest 0 i nie ma błędu, ustaw flagę `notFound` na `true`.
   - Zwróć obiekt z wynikiem operacji.

2. **Aktualizacja endpointu `src/pages/api/workouts/[id].ts`**:
   - Dodaj obsługę metody `DELETE` w `export async function DELETE({ params, locals }: APIContext)`.
   - Pobierz `user` z `locals`. Jeśli nie istnieje, zwróć `401`.
   - Zwaliduj `params.id` przy użyciu `zod.string().uuid()`. W razie błędu zwróć `400`.
   - Wywołaj nową metodę `workoutService.deleteWorkout` z `id` treningu, `id` użytkownika i klientem `supabase` z `locals`.
   - Na podstawie odpowiedzi z serwisu:
     - Jeśli wystąpił błąd, zaloguj go i zwróć `500`.
     - Jeśli `notFound` jest `true`, zwróć `404`.
     - W przeciwnym razie zwróć `204 No Content`.
