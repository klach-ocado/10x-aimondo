# Plan implementacji widoku Heatmapy

## 1. Przegląd
Celem jest stworzenie nowego widoku w aplikacji, który będzie prezentował zagregowane dane o treningach użytkownika w formie heatmapy. Widok ten pozwoli na wizualną identyfikację najczęściej uczęszczanych tras i obszarów. Użytkownik będzie mógł filtrować dane oraz manualnie odświeżać widok mapy, aby zaktualizować heatmapę dla bieżącego obszaru. Stan mapy (centrum, zoom) będzie zapisywany w `localStorage`.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- **Ścieżka**: `/heatmap`
- **Plik strony**: `src/pages/heatmap.astro`

## 3. Struktura komponentów
Komponenty będą zorganizowane w następującej hierarchii:

```
- Layout.astro
  - Header.astro (istniejący, globalny)
  - heatmap.astro (strona Astro)
    - HeatmapView.tsx (komponent kliencki React)
      - HeatmapFilterPanel.tsx (zwijany panel, reużycie lub adaptacja `FiltersPanel`)
      - Map.tsx (istniejący, rozszerzony o warstwę heatmapy)
      - RefreshButton.tsx (przycisk do odświeżania danych)
      - BackButton.tsx (przycisk powrotu do `/dashboard`)
```

## 4. Szczegóły komponentów

### `HeatmapView.tsx`
- **Opis komponentu**: Główny komponent kontenera dla widoku heatmapy. Zarządza stanem całego widoku, w tym filtrami, danymi do heatmapy, stanami ładowania i błędów oraz interakcjami między komponentami podrzędnymi.
- **Główne elementy**: `div` jako kontener, integrujący `HeatmapFilterPanel`, `Map`, `RefreshButton` i `BackButton`.
- **Obsługiwane interakcje**:
  - Inicjalizacja stanu na podstawie parametrów URL i `localStorage`.
  - Pobieranie danych dla heatmapy.
  - Obsługa zmian w filtrach.
  - Obsługa zdarzeń z mapy (przesunięcie, zoom).
  - Obsługa kliknięcia przycisku odświeżania.
- **Warunki walidacji**: Brak bezpośredniej walidacji; deleguje walidację do `HeatmapFilterPanel` i logiki pobierania danych.
- **Typy**: `HeatmapDataDto`, `HeatmapFiltersViewModel`, `MapViewState`.
- **Propsy**: Brak.

### `HeatmapFilterPanel.tsx`
- **Opis komponentu**: Zwijany panel z polami filtrów (zakres dat, nazwa, typ). Jest to adaptacja istniejącego komponentu `FiltersPanel` z dashboardu.
- **Główne elementy**: Komponenty `shadcn/ui` takie jak `Collapsible`, `Input`, `DatePicker`.
- **Obsługiwane interakcje**:
  - Zmiana wartości w polach filtrów.
  - Rozwijanie i zwijanie panelu.
- **Warunki walidacji**:
  - `name`: Dowolny ciąg znaków.
  - `type`: Dowolny ciąg znaków.
  - `dateFrom`/`dateTo`: Poprawne daty.
- **Typy**: `HeatmapFiltersViewModel`.
- **Propsy**:
  - `filters: HeatmapFiltersViewModel`
  - `onFiltersChange: (newFilters: HeatmapFiltersViewModel) => void`
  - `isDisabled: boolean`

### `Map.tsx`
- **Opis komponentu**: Istniejący komponent mapy oparty na Maplibre GL JS. Wymaga rozszerzenia o możliwość renderowania warstwy typu `heatmap` obok istniejącej warstwy `line`.
- **Dostawca map**: Mapy będą dostarczane przez openfreemap.org ze stylem "bright".
- **Główne elementy**: Kontener `div` dla mapy Maplibre.
- **Obsługiwane interakcje**:
  - Przesuwanie i zoomowanie mapy (`onMoveEnd`).
  - Inicjalizacja z zapisanym stanem widoku.
- **Warunki walidacji**: Wymaga poprawnych danych GeoJSON do wyświetlenia warstwy.
- **Typy**: `MapViewState`, `HeatmapDataDto`.
- **Propsy**:
  - `initialState: MapViewState`
  - `heatmapData: GeoJSON.FeatureCollection<GeoJSON.Point> | null`
  - `onMoveEnd: (newViewState: MapViewState, bounds: LngLatBounds) => void`
  - `isLoading: boolean`

### `RefreshButton.tsx` i `BackButton.tsx`
- **Opis komponentu**: Proste przyciski (`Button` z `shadcn/ui`) do wywoływania akcji.
- **Główne elementy**: `<button>`.
- **Obsługiwane interakcje**: `onClick`.
- **Warunki walidacji**: Przycisk odświeżania powinien być nieaktywny (`disabled`) podczas ładowania danych.
- **Propsy**:
  - `onClick: () => void`
  - `isDisabled?: boolean`

## 5. Typy

- **`HeatmapDataDto`**: Obiekt transferu danych (DTO) zwracany przez API.
  ```typescript
  interface HeatmapDataDto {
    points: [number, number][]; // Tablica punktów [lat, lng]
  }
  ```

- **`HeatmapFiltersViewModel`**: Model widoku reprezentujący stan filtrów w interfejsie użytkownika.
  ```typescript
  interface HeatmapFiltersViewModel {
    name?: string;
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    type?: string;
  }
  ```

- **`MapViewState`**: Reprezentuje stan widoku mapy, który będzie utrwalany w `localStorage`.
  ```typescript
  interface MapViewState {
    center: [number, number]; // [lng, lat]
    zoom: number;
  }
  ```

- **`GetHeatmapDataRequest`**: Typ dla parametrów zapytania do API.
  ```typescript
  interface GetHeatmapDataRequest {
    bbox: string; // "minLng,minLat,maxLng,maxLat"
    name?: string;
    dateFrom?: string; // ISO string
    dateTo?: string; // ISO string
    type?: string;
  }
  ```

## 6. Zarządzanie stanem
Logika i stan widoku zostaną zamknięte w niestandardowym hooku `useHeatmap.ts`.

- **Hook**: `useHeatmap()`
- **Cel**: Enkapsulacja całej logiki związanej z widokiem heatmapy, w tym zarządzanie filtrami, stanem mapy, pobieraniem danych i obsługą błędów.
- **Zarządzany stan**:
  - `filters: HeatmapFiltersViewModel` - aktualny stan filtrów.
  - `mapViewState: MapViewState` - centrum i zoom mapy, synchronizowane z `localStorage`.
  - `mapBounds: LngLatBounds | null` - aktualne granice widoku mapy.
  - `heatmapData: HeatmapDataDto | null` - dane dla warstwy heatmapy.
  - `isLoading: boolean` - flaga informująca o stanie ładowania danych.
  - `error: Error | null` - obiekt błędu w przypadku niepowodzenia.
- **Funkcje udostępniane**:
  - `handleFiltersChange`: Aktualizuje stan filtrów.
  - `handleMapMove`: Aktualizuje `mapBounds` i `mapViewState`.
  - `refreshData`: Ręcznie uruchamia pobieranie danych z API.
  - `clearError`: Czyści stan błędu.

## 7. Integracja API
- **Endpoint**: `GET /api/heatmap`
- **Proces**:
  1. Hook `useHeatmap` przy inicjalizacji lub po kliknięciu "Odśwież" wywołuje funkcję pobierającą dane.
  2. Funkcja ta konstruuje obiekt `GetHeatmapDataRequest` na podstawie stanów `filters` i `mapBounds`.
  3. Wykonywane jest zapytanie `fetch` do `/api/heatmap` z parametrami w query string.
  4. **Typ żądania**: `GetHeatmapDataRequest` (przekształcony na query params).
  5. **Typ odpowiedzi (sukces)**: `HeatmapDataDto`.
  6. **Typ odpowiedzi (błąd)**: `{ message: string, errors?: any }`.
  7. Po otrzymaniu odpowiedzi, hook aktualizuje stany `heatmapData`, `isLoading` i `error`.

## 8. Interakcje użytkownika
- **Wejście na stronę**: Aplikacja odczytuje filtry z parametrów URL (jeśli istnieją) i stan mapy z `localStorage`. Następnie pobiera dane dla heatmapy.
- **Zmiana filtrów**: Użytkownik modyfikuje filtry w panelu. Stan `filters` w `useHeatmap` jest aktualizowany. Dane nie są odświeżane automatycznie.
- **Przesuwanie/zoom mapy**: Po zakończeniu ruchu mapy, `useHeatmap` aktualizuje `mapBounds` i zapisuje nowy `mapViewState` w `localStorage` (z użyciem debounce).
- **Kliknięcie "Odśwież dane"**: Wywołuje funkcję `refreshData` z `useHeatmap`, która pobiera nowe dane z API, używając aktualnych `filters` i `mapBounds`.
- **Kliknięcie "Wróć do listy"**: Użytkownik jest przekierowywany do `/dashboard`.

## 9. Warunki i walidacja
- **Warunek `bbox`**: Interfejs musi zapewnić, że zapytanie do API jest wysyłane tylko wtedy, gdy dostępne są granice mapy (`mapBounds`). W przeciwnym razie przycisk "Odśwież" powinien być nieaktywny lub należy użyć domyślnych granic.
- **Stan ładowania**: Przycisk "Odśwież" oraz pola filtrów w `HeatmapFilterPanel` będą nieaktywne (`disabled`), gdy `isLoading` jest `true`, aby zapobiec wielokrotnym zapytaniom.
- **Format daty**: Hook `useHeatmap` będzie odpowiedzialny za formatowanie dat z `DatePicker` do formatu ISO wymaganego przez API.

## 10. Obsługa błędów
- **Błąd API**: W przypadku błędu sieciowego lub odpowiedzi z kodem 4xx/5xx, hook `useHeatmap` ustawi stan `error`. Komponent `HeatmapView` wyświetli powiadomienie typu "toast" (np. za pomocą `sonner`) z komunikatem błędu.
- **Brak danych**: Jeśli API zwróci pustą tablicę `points`, mapa po prostu nie wyświetli warstwy heatmapy. Nie jest to traktowane jako błąd, lecz jako pusty stan dla danego zapytania.
- **Brak `bbox`**: Logika w `useHeatmap` musi obsłużyć przypadek, gdy granice mapy nie są jeszcze zdefiniowane, uniemożliwiając wysłanie zapytania do API.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro**: Stworzyć plik `src/pages/heatmap.astro`, który zaimportuje i wyrenderuje komponent kliencki `HeatmapView.tsx` wewnątrz `Layout.astro`.
2.  **Stworzenie `HeatmapView.tsx`**: Zaimplementować główny komponent widoku, który będzie renderował szkielet interfejsu i importował komponenty podrzędne.
3.  **Implementacja `useHeatmap`**: Stworzyć hook `useHeatmap.ts` z całą logiką zarządzania stanem, w tym:
    - Inicjalizację stanu (z URL i `localStorage`).
    - Funkcję do pobierania danych z `/api/heatmap`.
    - Handlery do interakcji użytkownika.
    - Logikę zapisu do `localStorage`.
4.  **Adaptacja `FiltersPanel`**: Stworzyć `HeatmapFilterPanel.tsx`, który będzie reużywał lub adaptował istniejący `FiltersPanel`, dodając logikę zwijania.
5.  **Rozszerzenie `Map.tsx`**: Zmodyfikować komponent `Map.tsx`, aby warunkowo renderował warstwę `heatmap` na podstawie otrzymanych `heatmapData`. Należy przekształcić `HeatmapDataDto` na format GeoJSON.
6.  **Stworzenie przycisków**: Zaimplementować proste komponenty `RefreshButton.tsx` i `BackButton.tsx`.
7.  **Integracja komponentów**: Połączyć wszystkie komponenty w `HeatmapView.tsx`, przekazując stany i handlery z hooka `useHeatmap` jako propsy.
8.  **Obsługa ładowania i błędów**: Dodać wskaźniki ładowania (np. spinner na przycisku odświeżania) oraz wyświetlanie powiadomień o błędach.
9.  **Aktualizacja `Header.astro`**: Dodać link nawigacyjny "Heatmapa" do globalnego nagłówka.
10. **Testowanie**: Przetestować wszystkie przepływy użytkownika, w tym przekazywanie filtrów z dashboardu, odświeżanie, obsługę błędów i utrwalanie stanu mapy.
