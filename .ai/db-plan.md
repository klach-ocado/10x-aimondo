# Plan schematu bazy danych dla AImondo

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Tabela: `public.workouts`

Przechowuje metadane dotyczące treningów wgranych przez użytkowników.

| Nazwa kolumny | Typ danych     | Ograniczenia                               | Opis                                             |
| :------------ | :------------- | :----------------------------------------- | :----------------------------------------------- |
| `id`          | `UUID`         | `PRIMARY KEY`, `default gen_random_uuid()` | Unikalny identyfikator treningu.                 |
| `user_id`     | `UUID`         | `NOT NULL`, `FOREIGN KEY (auth.users.id)`  | Identyfikator użytkownika z tabeli `auth.users`. |
| `name`        | `VARCHAR(300)` | `NOT NULL`                                 | Nazwa treningu nadana przez użytkownika.         |
| `date`        | `TIMESTAMPTZ`  | `NOT NULL`                                 | Data i czas treningu.                            |
| `type`        | `VARCHAR(50)`  | `NOT NULL`                                 | Typ aktywności (np. "run", "bike").              |
| `distance`    | `INTEGER`      | `NOT NULL`                                 | Całkowity dystans treningu w metrach.            |
| `duration`    | `INTEGER`      |                                            | Całkowity czas trwania treningu w sekundach.     |
| `created_at`  | `TIMESTAMPTZ`  | `NOT NULL`, `default now()`                | Znacznik czasu utworzenia rekordu.               |
| `updated_at`  | `TIMESTAMPTZ`  | `NOT NULL`, `default now()`                | Znacznik czasu ostatniej aktualizacji rekordu.   |

### Tabela: `public.track_points`

Przechowuje punkty geograficzne (współrzędne) dla każdego treningu.

| Nazwa kolumny     | Typ danych              | Ograniczenia                                                     | Opis                                                  |
| :---------------- | :---------------------- | :--------------------------------------------------------------- | :---------------------------------------------------- |
| `id`              | `BIGSERIAL`             | `PRIMARY KEY`                                                    | Unikalny identyfikator punktu na trasie.              |
| `workout_id`      | `UUID`                  | `NOT NULL`, `FOREIGN KEY (public.workouts.id) ON DELETE CASCADE` | Identyfikator treningu, do którego należy punkt.      |
| `location`        | `GEOMETRY(Point, 4326)` | `NOT NULL`                                                       | Współrzędne geograficzne punktu (długość, szerokość). |
| `elevation`       | `REAL`                  |                                                                  | Wysokość n.p.m. w metrach.                            |
| `timestamp`       | `TIMESTAMPTZ`           |                                                                  | Znacznik czasu zarejestrowania punktu.                |
| `sequence_number` | `INTEGER`               | `NOT NULL`                                                       | Numer sekwencyjny punktu w ramach danego treningu.    |

---

## 2. Relacje między tabelami

- **`public.workouts` -> `auth.users` (wiele-do-jednego)**
  - Każdy trening w `workouts` jest powiązany z jednym użytkownikiem w `auth.users` poprzez klucz obcy `user_id`.
  - Jeden użytkownik może mieć wiele treningów.

- **`public.track_points` -> `public.workouts` (wiele-do-jednego)**
  - Każdy punkt w `track_points` należy do jednego treningu w `workouts` poprzez klucz obcy `workout_id`.
  - Jeden trening składa się z wielu punktów.
  - Zastosowano `ON DELETE CASCADE`, co oznacza, że usunięcie rekordu z `workouts` automatycznie usunie wszystkie powiązane z nim rekordy w `track_points`, zapewniając integralność danych.

---

## 3. Indeksy

### Indeksy w tabeli `public.workouts`

- **Indeks złożony na `(user_id, date DESC)`:**
  - Cel: Optymalizacja zapytań o listę treningów dla konkretnego użytkownika, sortowaną od najnowszych. Jest to kluczowe dla głównego widoku aplikacji.
- **Indeks na `user_id`:**
  - Cel: Przyspieszenie operacji filtrowania i łączenia danych po identyfikatorze użytkownika.
- **Indeks na `type`:**
  - Cel: Przyspieszenie filtrowania treningów po typie aktywności.

### Indeksy w tabeli `public.track_points`

- **Indeks przestrzenny GiST na `location`:**
  - Cel: Drastyczne przyspieszenie zapytań geograficznych, takich jak wyszukiwanie punktów w danym obszarze mapy, co jest niezbędne do wydajnego generowania heatmapy.

---

## 4. Zasady PostgreSQL (Row-Level Security)

### Tabela `public.workouts`

Zasady bezpieczeństwa na poziomie wiersza (RLS) zostaną włączone, aby zapewnić, że użytkownicy mogą zarządzać (tworzyć, odczytywać, aktualizować, usuwać) wyłącznie własnymi treningami.

- **Włączenie RLS:**

  ```sql
  ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
  ```

- **Polityka `SELECT`:** Użytkownicy mogą odczytywać tylko swoje treningi.

  ```sql
  CREATE POLICY "Allow users to read their own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);
  ```

- **Polityka `INSERT`:** Użytkownicy mogą dodawać treningi tylko we własnym imieniu.

  ```sql
  CREATE POLICY "Allow users to insert their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  ```

- **Polityka `UPDATE`:** Użytkownicy mogą aktualizować tylko swoje treningi.

  ```sql
  CREATE POLICY "Allow users to update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  ```

- **Polityka `DELETE`:** Użytkownicy mogą usuwać tylko swoje treningi.
  ```sql
  CREATE POLICY "Allow users to delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);
  ```

### Tabela `public.track_points`

Dla tej tabeli nie definiuje się bezpośrednich polityk RLS. Dostęp do punktów jest zabezpieczony pośrednio przez relację z tabelą `workouts`. Każde zapytanie o punkty musi być połączone z `workouts`, co sprawia, że polityki RLS z tabeli `workouts` zostaną automatycznie zastosowane, ograniczając dostęp tylko do punktów należących do treningów danego użytkownika.

---

## 5. Dodatkowe uwagi i decyzje projektowe

- **Rozszerzenie PostGIS:** Schemat wymaga włączenia rozszerzenia `postgis` w bazie danych w celu obsługi typów danych `GEOMETRY`.
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```
- **Brak partycjonowania (MVP):** Na etapie MVP zrezygnowano z partycjonowania tabeli `track_points`. Dla przewidywanej skali danych w początkowej fazie projektu, odpowiednie indeksowanie (zwłaszcza indeks GiST) jest wystarczające do zapewnienia wydajności.
- **Typy danych dla statystyk:** Kolumny `duration` i `distance` używają typu `INTEGER` do przechowywania wartości w sekundach i metrach. Jest to wydajne i wystarczająco precyzyjne dla wymagań MVP.
- **Automatyczne `updated_at`:** W celu automatycznego aktualizowania kolumny `updated_at` przy każdej modyfikacji rekordu, można stworzyć dedykowaną funkcję i trigger.
