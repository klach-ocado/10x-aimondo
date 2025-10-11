# Plan implementacji widoku: Widok pojedynczego treningu

## 1. Przegląd
Widok pojedynczego treningu ma na celu szczegółową prezentację jednej aktywności użytkownika. Centralnym elementem jest interaktywna mapa, na której wizualizowana jest trasa treningu. Uzupełnieniem są kluczowe statystyki, takie jak dystans i czas trwania. Widok ten stanowi końcowy element w ścieżce użytkownika, który po przejrzeniu listy swoich treningów, chce zagłębić się w szczegóły jednego z nich.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką, która zawiera identyfikator konkretnego treningu.

- **Ścieżka**: `/workouts/[id]`
- **Plik implementujący**: `src/pages/workouts/[id].astro`

## 3. Struktura komponentów
Hierarchia komponentów zapewni separację odpowiedzialności, gdzie strona Astro odpowiada za routing i układ, a komponenty React za interaktywność i renderowanie danych.

```
- src/layouts/Layout.astro
  - Header (komponent globalny)
  - src/pages/workouts/[id].astro
    - BackButton (przycisk powrotu do /dashboard)
    - WorkoutView.tsx (client:visible)
      - (Warunkowo) LoadingSpinner
      - (Warunkowo) ErrorMessage
      - Map.tsx
      - StatsOverlay.tsx
```

## 4. Szczegóły komponentów

### `src/pages/workouts/[id].astro`
- **Opis komponentu**: Strona Astro, która obsługuje dynamiczny routing. Jej zadaniem jest pobranie `id` treningu z adresu URL i przekazanie go jako prop do głównego komponentu React.
- **Główne elementy**:
  - Komponent `<Layout>` jako główna struktura strony.
  - Komponent `<BackButton>` lub prosty link `<a>` do nawigacji powrotnej.
  - Komponent React `<WorkoutView client:visible />`, który jest "nawadniany" po stronie klienta.
- **Propsy przekazywane do `WorkoutView`**:
  - `workoutId: string` - ID treningu pobrane z `Astro.params.id`.

### `WorkoutView.tsx`
- **Opis komponentu**: Główny komponent React, który orkiestruje pobieranie danych, zarządzanie stanem (ładowanie, błąd, dane) i renderowanie komponentów podrzędnych (`Map`, `StatsOverlay`).
- **Główne elementy**:
  - Logika do wyświetlania stanu ładowania (np. komponent `Skeleton` lub `Spinner`).
  - Logika do wyświetlania komunikatu o błędzie.
  - Renderowanie komponentu `<Map>` i `<StatsOverlay>` po pomyślnym załadowaniu danych.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Komponent reaguje na zmiany stanu pochodzące z hooka `useWorkoutView`.
- **Typy**: `WorkoutWithTrackDTO`
- **Propsy**:
  - `workoutId: string`

### `Map.tsx`
- **Opis komponentu**: Reużywalny komponent do wyświetlania mapy za pomocą Maplibre GL JS. W tym widoku jego zadaniem jest narysowanie trasy treningu jako linii.
- **Dostawca map**: Mapy będą dostarczane przez openfreemap.org ze stylem "bright".
- **Główne elementy**:
  - Kontener `div` dla mapy.
  - Logika inicjalizująca mapę.
  - Logika dodająca źródło danych GeoJSON typu `LineString` oraz warstwę `line` do narysowania trasy.
  - Logika do automatycznego dopasowania widoku mapy (`fitBounds`) do granic trasy.
  - Logika zapisująca stan mapy (centrum, zoom) do `localStorage` przy zdarzeniach `moveend` i `zoomend`.
- **Obsługiwane interakcje**: Interakcje z mapą (przesuwanie, zoom) obsługiwane przez Maplibre.
- **Typy**: Wymaga tablicy współrzędnych `[lng, lat][]` do stworzenia GeoJSON.
- **Propsy**:
  - `trackPoints: { lat: number; lng: number }[]`
  - `initialViewState: { center: [number, number]; zoom: number } | null`

### `StatsOverlay.tsx`
- **Opis komponentu**: Prosty komponent do wyświetlania sformatowanych statystyk treningu.
- **Główne elementy**:
  - Elementy `div` lub `p` do wyświetlania etykiet i wartości.
  - Logika formatująca dystans (np. z metrów na kilometry) i czas trwania (np. z sekund na format `hh:mm:ss`).
- **Obsługiwane interakcje**: Brak.
- **Typy**: `WorkoutWithTrackDTO` (lub wybrane pola).
- **Propsy**:
  - `distance: number`
  - `duration: number`

### `BackButton.astro`
- **Opis komponentu**: Prosty przycisk lub link, który nawiguje użytkownika z powrotem do strony głównej.
- **Główne elementy**:
  - Link `<a>` z atrybutem `href="/dashboard"`.
  - Może być ostylowany za pomocą komponentu `<Button>` z `shadcn/ui`.
- **Obsługiwane interakcje**: Kliknięcie.

## 5. Typy

### `TrackPointDTO`
Reprezentuje pojedynczy punkt na trasie treningu.
```typescript
interface TrackPointDTO {
  lat: number;
  lng: number;
  ele: number | null;
  time: string | null;
}
```

### `WorkoutWithTrackDTO`
Główny obiekt transferu danych (DTO) dla widoku pojedynczego treningu, zawierający wszystkie niezbędne informacje.
```typescript
interface WorkoutWithTrackDTO {
  id: string;
  name: string;
  date: string;
  type: string;
  distance: number;
  duration: number;
  track_points: TrackPointDTO[];
}
```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie wyizolowane w dedykowanym customowym hooku, aby utrzymać komponent `WorkoutView` w czystości.

### `useWorkoutView(workoutId: string)`
- **Cel**: Enkapsulacja logiki pobierania danych, obsługi stanu ładowania i błędów dla widoku pojedynczego treningu.
- **Zwracane wartości**:
  ```typescript
  {
    workout: WorkoutWithTrackDTO | null;
    isLoading: boolean;
    error: string | null;
  }
  ```
- **Logika wewnętrzna**:
  - Używa `useState` do przechowywania `workout`, `isLoading` i `error`.
  - Używa `useEffect` do uruchomienia asynchronicznej funkcji pobierającej dane z API po zamontowaniu komponentu.
  - Wewnątrz `useEffect`:
    - Ustawia `isLoading` na `true`.
    - Wywołuje `fetch(`/api/workouts/${workoutId}`).
    - Po otrzymaniu odpowiedzi:
      - Jeśli sukces (200 OK): parsuje JSON, aktualizuje stan `workout` i ustawia `isLoading` na `false`.
      - Jeśli błąd (404, 500): odczytuje komunikat błędu, aktualizuje stan `error` i ustawia `isLoading` na `false`.
    - W bloku `catch` obsługuje błędy sieciowe, aktualizując stan `error`.

## 7. Integracja API
Integracja opiera się na wywołaniu jednego punktu końcowego API.

- **Endpoint**: `GET /api/workouts/[id]`
- **Opis**: Pobiera pełne dane pojedynczego treningu, włącznie z tablicą punktów trasy.
- **Typ żądania**: Brak (dane przekazywane w URL).
- **Typ odpowiedzi (sukces)**: `WorkoutWithTrackDTO`
- **Typ odpowiedzi (błąd)**:
  ```json
  {
    "message": "Komunikat błędu"
  }
  ```

## 8. Interakcje użytkownika
- **Wejście na stronę**:
  - Użytkownik wchodzi na `/workouts/[id]`.
  - Komponent `WorkoutView` jest renderowany, `useWorkoutView` jest inicjalizowany.
  - Wyświetlany jest wskaźnik ładowania.
  - Po załadowaniu danych, wskaźnik znika, a na ekranie pojawia się mapa z trasą i nakładka ze statystykami.
- **Nawigacja powrotna**:
  - Użytkownik klika przycisk "Wróć do listy".
  - Aplikacja przenosi użytkownika na stronę `/dashboard`.
- **Interakcja z mapą**:
  - Użytkownik może przesuwać i przybliżać/oddalać mapę.
  - Po zakończeniu ruchu (`moveend`/`zoomend`), nowa pozycja i zoom są zapisywane w `localStorage`.

## 9. Warunki i walidacja
- **Warunek**: Poprawny identyfikator UUID treningu musi być obecny w ścieżce URL.
- **Walidacja**: Walidacja po stronie klienta nie jest konieczna. Interfejs musi być przygotowany na obsługę odpowiedzi błędu `404 Not Found` z API, co oznacza, że podany `id` nie istnieje lub użytkownik nie ma do niego dostępu. W takim przypadku komponent `WorkoutView` powinien wyświetlić odpowiedni komunikat o błędzie.

## 10. Obsługa błędów
- **Trening nie znaleziony (404)**: Hook `useWorkoutView` ustawi stan `error`. Komponent `WorkoutView` wyświetli komunikat, np. "Nie znaleziono treningu o podanym identyfikatorze." oraz przycisk powrotu.
- **Błąd serwera (500)**: Hook `useWorkoutView` ustawi stan `error`. Komponent `WorkoutView` wyświetli ogólny komunikat, np. "Wystąpił błąd serwera. Spróbuj ponownie później."
- **Błąd sieci**: Blok `catch` w logice `fetch` ustawi stan `error`. Komponent `WorkoutView` wyświetli komunikat o problemie z połączeniem.
- **Brak punktów trasy**: Jeśli API zwróci trening z pustą tablicą `track_points`, mapa powinna wyświetlić komunikat "Brak danych o trasie", a statystyki mogą być normalnie wyświetlone.

## 11. Kroki implementacji
1.  **Stworzenie strony Astro**: Utworzyć plik `src/pages/workouts/[id].astro`. Wewnątrz pobrać `id` z `Astro.params` i przekazać go do komponentu React.
2.  **Stworzenie komponentu `WorkoutView.tsx`**: Utworzyć plik `src/components/WorkoutView.tsx`. Dodać podstawową strukturę i przyjąć `workoutId` jako prop.
3.  **Implementacja hooka `useWorkoutView`**: W osobnym pliku (np. `src/components/hooks/useWorkoutView.ts`) zaimplementować logikę pobierania danych, zarządzania stanem ładowania i błędów.
4.  **Integracja hooka z komponentem**: Użyć `useWorkoutView` wewnątrz `WorkoutView.tsx` do pobrania danych i warunkowego renderowania UI (ładowanie/błąd/sukces).
5.  **Stworzenie komponentu `StatsOverlay.tsx`**: Utworzyć prosty komponent do wyświetlania sformatowanych danych `distance` i `duration`.
6.  **Integracja komponentu `Map.tsx`**:
    - Upewnić się, że komponent `Map.tsx` potrafi przyjąć tablicę punktów trasy.
    - Zaimplementować logikę tworzenia źródła GeoJSON (`type: 'LineString'`) i warstwy `line`.
    - Dodać funkcjonalność `fitBounds`, aby automatycznie kadrować mapę na trasę.
    - Dodać logikę zapisu stanu mapy do `localStorage`.
7.  **Dodanie nawigacji powrotnej**: W pliku `.astro` dodać przycisk/link powrotny do `/dashboard`.
8.  **Stylowanie i finalizacja**: Dodać style dla nakładki statystyk i upewnić się, że wszystkie elementy są poprawnie wyświetlane i responsywne.
9.  **Testowanie**: Przetestować wszystkie scenariusze: pomyślne ładowanie, błąd 404, błąd 500 oraz przypadek, gdy trening nie ma punktów trasy.
