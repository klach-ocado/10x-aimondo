# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard jest głównym interfejsem aplikacji, dostępnym po zalogowaniu. Jego celem jest umożliwienie użytkownikowi przeglądania, filtrowania, sortowania i zarządzania wszystkimi swoimi treningami. Widok składa się z panelu filtrów, interaktywnej tabeli z listą treningów oraz okien modalnych do dodawania, edycji i usuwania aktywności.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji po zalogowaniu:

- **Ścieżka**: `/dashboard`

## 3. Struktura komponentów

Hierarchia komponentów zostanie zorganizowana w celu oddzielenia odpowiedzialności i zapewnienia reużywalności. Główny komponent React (`DashboardView`) będzie zarządzał stanem i logiką, koordynując pracę komponentów podrzędnych.

```
/src/pages/dashboard.astro
└── Layout.astro
    └── main
        └── DashboardView.tsx (React Island)
            ├── FiltersPanel.tsx
            ├── WorkoutsDataTable.tsx
            │   └── DataTableSkeleton.tsx (w stanie ładowania)
            ├── Welcome.tsx (w stanie pustym)
            ├── AddWorkoutDialog.tsx
            ├── EditWorkoutDialog.tsx
            └── DeleteConfirmationDialog.tsx
```

## 4. Szczegóły komponentów

### `DashboardView` (React)

- **Opis**: Główny komponent-kontener, który zarządza całym stanem widoku dashboardu za pomocą hooka `useWorkoutsDashboard`. Odpowiada za renderowanie komponentów podrzędnych oraz kontrolowanie widoczności okien modalnych.
- **Główne elementy**: `FiltersPanel`, `WorkoutsDataTable`, `Welcome` (warunkowo), `AddWorkoutDialog`, `EditWorkoutDialog`, `DeleteConfirmationDialog`.
- **Obsługiwane interakcje**: Zarządza stanem otwarcia okien modalnych (np. które okno jest otwarte i z jakimi danymi).
- **Typy**: `WorkoutListItemDto`, `Pagination`.
- **Propsy**: Brak.

### `FiltersPanel` (React)

- **Opis**: Panel zawierający kontrolki do filtrowania listy treningów. Zmiany w polach są zbierane i emitowane (z debouncingiem) do komponentu nadrzędnego.
- **Główne elementy**: `Input` (shadcn/ui) dla nazwy i typu, `DatePicker` (shadcn/ui) z opcją wyboru zakresu dat, `Button` (shadcn/ui) do nawigacji do widoku heatmapy.
- **Obsługiwane interakcje**: Wprowadzanie tekstu w polach, wybór dat.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `WorkoutFilters`.
- **Propsy**:
  - `filters: WorkoutFilters`
  - `onFiltersChange: (filters: WorkoutFilters) => void`
  - `disabled: boolean`

### `WorkoutsDataTable` (React)

- **Opis**: Interaktywna tabela danych (oparta na `DataTable` z shadcn/ui) wyświetlająca listę treningów. Obsługuje sortowanie, paginację oraz akcje na wierszach (edycja, usunięcie).
- **Główne elementy**: `Table`, `TableHeader`, `TableRow`, `TableCell`, `DropdownMenu` (dla akcji), `DataTablePagination`. W stanie ładowania wyświetla komponent `DataTableSkeleton`.
- **Obsługiwane interakcje**: Kliknięcie nagłówka kolumny (sortowanie), zmiana strony (paginacja), wybór "Edytuj" lub "Usuń" z menu kontekstowego wiersza, kliknięcie wiersza (nawigacja).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `WorkoutListItemDto`, `Pagination`.
- **Propsy**:
  - `data: WorkoutListItemDto[]`
  - `pagination: Pagination`
  - `isLoading: boolean`
  - `onSortChange: (columnId: string, direction: 'asc' | 'desc') => void`
  - `onPageChange: (page: number) => void`
  - `onEdit: (workout: WorkoutListItemDto) => void`
  - `onDelete: (workout: WorkoutListItemDto) => void`

### `AddWorkoutDialog` (React)

- **Opis**: Okno modalne z formularzem do dodawania nowego treningu poprzez wgranie pliku GPX.
- **Główne elementy**: `Dialog`, `DialogContent`, `form`, `Input` (dla nazwy), `Input type="file"` (dla pliku GPX), `Button type="submit"`.
- **Obsługiwane interakcje**: Wypełnianie formularza, wybór pliku, zatwierdzenie.
- **Obsługiwana walidacja**:
  - `name`: wymagane, 3-300 znaków.
  - `gpxFile`: wymagany, typ `.gpx`, rozmiar < 5MB (walidacja po stronie klienta).
  - Wyświetlanie błędów walidacji zwróconych przez API.
- **Typy**: `AddWorkoutForm`.
- **Propsy**:
  - `isOpen: boolean`
  - `onOpenChange: (isOpen: boolean) => void`
  - `onSuccess: () => void`

### `EditWorkoutDialog` (React)

- **Opis**: Okno modalne z formularzem do edycji metadanych istniejącego treningu.
- **Główne elementy**: `Dialog`, `DialogContent`, `form`, `Input` (dla nazwy i typu), `DatePicker` (dla daty), `Button type="submit"`.
- **Obsługiwane interakcje**: Modyfikacja danych w formularzu, zatwierdzenie.
- **Obsługiwana walidacja**:
  - `name`: wymagane, 3-300 znaków.
  - `type`: wymagane, 3-50 znaków.
  - `date`: wymagana.
  - Wyświetlanie błędów walidacji zwróconych przez API.
- **Typy**: `EditWorkoutForm`, `WorkoutListItemDto`.
- **Propsy**:
  - `workout: WorkoutListItemDto | null`
  - `isOpen: boolean`
  - `onOpenChange: (isOpen: boolean) => void`
  - `onSuccess: () => void`

### `DeleteConfirmationDialog` (React)

- **Opis**: Okno dialogowe typu `AlertDialog` z prośbą o potwierdzenie usunięcia treningu.
- **Główne elementy**: `AlertDialog`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction` (Potwierdź), `AlertDialogCancel`.
- **Obsługiwane interakcje**: Potwierdzenie lub anulowanie operacji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `WorkoutListItemDto`.
- **Propsy**:
  - `workout: WorkoutListItemDto | null`
  - `isOpen: boolean`
  - `onOpenChange: (isOpen: boolean) => void`
  - `onConfirm: () => void`

## 5. Typy

Oprócz typów DTO z `src/types.ts`, widok będzie korzystał z następujących typów ViewModel do zarządzania stanem formularzy i filtrów.

```typescript
// Typ dla stanu formularza filtrów
interface WorkoutFilters {
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

// Typ dla stanu sortowania tabeli
interface WorkoutSort {
  sortBy: string;
  order: "asc" | "desc";
}

// Typ dla stanu formularza dodawania treningu
interface AddWorkoutForm {
  name: string;
  gpxFile: File | null;
}

// Typ dla stanu formularza edycji treningu
interface EditWorkoutForm {
  name: string;
  date: Date;
  type: string;
}
```

## 6. Zarządzanie stanem

Logika biznesowa i stan widoku zostaną scentralizowane w niestandardowym hooku `useWorkoutsDashboard`. Takie podejście upraszcza komponent `DashboardView` i hermetyzuje logikę pobierania danych, filtrowania, paginacji oraz operacji CRUD.

**`useWorkoutsDashboard.ts`**:

- **Stan**: Zarządza stanami `workouts`, `pagination`, `filters`, `sort`, `page`, `isLoading`, `error`.
- **Funkcje**: Udostępnia metody do modyfikacji stanu i interakcji z API:
  - `setFilters`: Aktualizuje filtry i (z debouncingiem) odświeża dane.
  - `setSort`: Aktualizuje sortowanie i odświeża dane.
  - `setPage`: Zmienia stronę i odświeża dane.
  - `addWorkout(data: FormData)`: Wywołuje `POST /api/workouts`.
  - `updateWorkout(id: string, data: UpdateWorkoutCommand)`: Wywołuje `PUT /api/workouts/{id}`.
  - `deleteWorkout(id: string)`: Wywołuje `DELETE /api/workouts/{id}`.
  - `refresh`: Ręcznie odświeża dane.
- **Logika**: Używa `useEffect` do automatycznego pobierania danych, gdy zależności (`filters`, `sort`, `page`) się zmieniają.

## 7. Integracja API

Integracja z backendem będzie realizowana poprzez wywołania `fetch` do endpointów API zdefiniowanych w `api-plan.md`.

- **`GET /api/workouts`**:
  - **Żądanie**: Wywoływane z parametrami query string budowanymi na podstawie stanów `filters`, `sort` i `page`.
  - **Odpowiedź**: `PaginatedWorkoutsDto`. Odpowiedź aktualizuje stany `workouts` i `pagination` w hooku.
- **`POST /api/workouts`**:
  - **Żądanie**: `multipart/form-data` zawierające `name` i `gpxFile`.
  - **Odpowiedź**: `201 Created` z nowym obiektem `WorkoutDto`. Po sukcesie lista jest odświeżana.
- **`PUT /api/workouts/{id}`**:
  - **Żądanie**: `application/json` z ciałem typu `UpdateWorkoutCommand`.
  - **Odpowiedź**: `200 OK` z zaktualizowanym obiektem `WorkoutDto`. Po sukcesie lista jest odświeżana.
- **`DELETE /api/workouts/{id}`**:
  - **Żądanie**: Brak ciała.
  - **Odpowiedź**: `204 No Content`. Po sukcesie lista jest odświeżana.

## 8. Interakcje użytkownika

- **Filtrowanie**: Użytkownik wpisuje tekst lub wybiera daty w `FiltersPanel`. Po 500ms bezczynności, wywoływane jest zapytanie do API z nowymi filtrami.
- **Sortowanie**: Użytkownik klika na nagłówek kolumny w `WorkoutsDataTable`, co zmienia kierunek sortowania i odświeża dane.
- **Paginacja**: Użytkownik klika przyciski paginacji, co zmienia numer strony i odświeża dane.
- **Dodawanie treningu**: Użytkownik klika globalny przycisk "Dodaj trening", co otwiera `AddWorkoutDialog`. Po wypełnieniu i zatwierdzeniu formularza, dane są wysyłane, a lista się odświeża.
- **Edycja treningu**: Użytkownik wybiera "Edytuj" z menu wiersza, co otwiera `EditWorkoutDialog` z wypełnionymi danymi. Po zapisaniu zmian, lista się odświeża.
- **Usuwanie treningu**: Użytkownik wybiera "Usuń" z menu wiersza, co otwiera `DeleteConfirmationDialog`. Po potwierdzeniu, trening jest usuwany, a lista się odświeża.
- **Nawigacja do szczegółów**: Kliknięcie dowolnego miejsca w wierszu tabeli (poza menu akcji) przenosi użytkownika na stronę `/workouts/[id]`.

## 9. Warunki i walidacja

- **Formularz dodawania**:
  - `name`: Sprawdzanie długości (3-300) po stronie klienta (np. z użyciem `zod` i `react-hook-form`).
  - `gpxFile`: Sprawdzanie obecności pliku, rozszerzenia `.gpx` i rozmiaru (< 5MB) po stronie klienta.
- **Formularz edycji**:
  - `name`: Długość 3-300.
  - `type`: Długość 3-50.
  - `date`: Musi być poprawną datą.
- **Interfejs**: Przyciski "Zapisz" w formularzach są nieaktywne (`disabled`), dopóki formularz nie jest poprawny. Podczas wysyłania danych przyciski również są nieaktywne, a obok nich wyświetlany jest wskaźnik ładowania.

## 10. Obsługa błędów

- **Błędy sieciowe/API**: W przypadku nieudanego pobrania listy treningów, w miejscu tabeli wyświetlany jest komunikat o błędzie.
- **Błędy walidacji (400)**: Błędy zwrócone przez API podczas dodawania/edycji są przechwytywane i wyświetlane pod odpowiednimi polami w formularzu.
- **Błędy serwera (500) / inne**: W oknach modalnych oraz przy operacji usuwania, w przypadku błędu wyświetlany jest ogólny komunikat o niepowodzeniu operacji (np. w formie komponentu `Toast`).
- **Błędy autoryzacji (401)**: Globalny mechanizm obsługi `fetch` powinien przechwytywać błędy 401 i przekierowywać użytkownika do strony logowania.

## 11. Kroki implementacji

1.  Utworzenie pliku strony `/src/pages/dashboard.astro` i osadzenie w nim pustego komponentu React `DashboardView.tsx` z `client:load`.
2.  Implementacja szkieletu komponentu `DashboardView`, w tym podstawowej struktury z nagłówkiem i miejscem na przyszłe komponenty.
3.  Stworzenie hooka `useWorkoutsDashboard` z logiką pobierania danych (`GET /api/workouts`), zarządzaniem stanem `isLoading` i `error`.
4.  Implementacja komponentu `WorkoutsDataTable` wraz z `DataTableSkeleton`, który będzie wyświetlał dane z hooka lub stan ładowania.
5.  Implementacja komponentu `FiltersPanel` i integracja jego stanu z hookiem `useWorkoutsDashboard` w celu filtrowania danych.
6.  Dodanie obsługi sortowania i paginacji w `WorkoutsDataTable` i połączenie jej z hookiem.
7.  Implementacja `AddWorkoutDialog` wraz z formularzem, walidacją po stronie klienta i logiką wywołania `addWorkout` z hooka.
8.  Implementacja `EditWorkoutDialog`, w tym przekazywanie danych edytowanego treningu i wywołanie `updateWorkout`.
9.  Implementacja `DeleteConfirmationDialog` i integracja z `deleteWorkout`.
10. Dodanie komponentu `Welcome` dla pustego stanu.
11. Finalne dopracowanie UX, obsługi błędów (np. toasty) i ostylowanie.
