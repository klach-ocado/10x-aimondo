# Plan Implementacji Obliczania Statystyk Treningu

## 1. Opis usługi

Serwis `WorkoutStatsService` będzie odpowiedzialny za hermetyzację logiki obliczania kluczowych statystyk treningu na podstawie surowych danych punktów trasy (trackpoints) uzyskanych z pliku GPX. Głównym zadaniem serwisu jest obliczenie całkowitego dystansu oraz, jeśli to możliwe, czasu trwania aktywności. Serwis będzie działał jako moduł z czystymi funkcjami, bezstanowy i bez zależności od zewnętrznych serwisów czy stanu aplikacji.

## 2. Opis konstruktora

Serwis zostanie zaimplementowany jako zbiór eksportowanych funkcji w module TypeScript. Nie będzie posiadał konstruktora `class`, ponieważ nie ma potrzeby zarządzania jego stanem wewnętrznym.

## 3. Publiczne metody i pola

### `calculateStats(points: TrackPoint[]): WorkoutStats`

Główna metoda publiczna serwisu.

- **Parametry:**
  - `points: TrackPoint[]`: Tablica obiektów reprezentujących punkty trasy. Każdy obiekt powinien być zgodny z typem `TrackPoint` i zawierać co najmniej współrzędne (`lat`, `lon`) oraz opcjonalnie znacznik czasu (`time`).
- **Zwraca:**
  - `WorkoutStats`: Obiekt zawierający obliczone statystyki:
    - `distance: number`: Całkowity dystans treningu w metrach.
    - `duration: number | null`: Całkowity czas trwania treningu w sekundach lub `null`, jeśli nie można go obliczyć.

**Przykład użycia:**

```typescript
import { calculateStats } from "src/lib/services/workout-stats.service";
import type { TrackPoint } from "src/types";

const trackPointsWithTime: TrackPoint[] = [
  { lat: 52.2297, lon: 21.0122, time: new Date("2025-10-14T10:00:00Z") },
  { lat: 52.2298, lon: 21.0123, time: new Date("2025-10-14T10:00:10Z") },
  // ...więcej punktów
  { lat: 52.23, lon: 21.0125, time: new Date("2025-10-14T11:00:00Z") },
];

const stats1 = calculateStats(trackPointsWithTime);
// stats1.distance ≈ 1500 (w metrach)
// stats1.duration = 3600 (w sekundach)

const trackPointsWithoutTime: TrackPoint[] = [
  { lat: 52.2297, lon: 21.0122 },
  { lat: 52.2298, lon: 21.0123 },
];

const stats2 = calculateStats(trackPointsWithoutTime);
// stats2.distance > 0
// stats2.duration = null
```

## 4. Prywatne metody i pola

### `calculateHaversineDistance(point1: Coordinate, point2: Coordinate): number`

Prywatna funkcja pomocnicza do obliczania odległości między dwoma punktami geograficznymi.

- **Parametry:**
  - `point1: Coordinate`: Obiekt z polami `lat` i `lon` dla pierwszego punktu.
  - `point2: Coordinate`: Obiekt z polami `lat` i `lon` dla drugiego punktu.
- **Zwraca:**
  - `number`: Odległość między punktami w metrach.

**Logika:** Implementacja wykorzystuje formułę Haversine, która jest standardem w obliczaniu odległości na sferze i zapewnia wystarczającą dokładność dla potrzeb aplikacji.

## 5. Obsługa błędów i edge case'ów

Serwis musi być odporny na niekompletne lub nieprawidłowe dane wejściowe.

1.  **Pusta tablica punktów:** Jeśli na wejściu zostanie podana pusta tablica `points`, metoda `calculateStats` zwróci `{ distance: 0, duration: null }`.
2.  **Tablica z jednym punktem:** Jeśli tablica `points` zawiera tylko jeden punkt, niemożliwe jest obliczenie dystansu ani czasu trwania. Serwis zwróci `{ distance: 0, duration: null }`.
3.  **Brakujące znaczniki czasu:** Jeśli punkty w tablicy nie zawierają pola `time` lub wszystkie wartości są jednakowe, czas trwania (`duration`) zostanie zwrócony jako `null`. Obliczanie dystansu będzie nadal możliwe.
4.  **Nieprawidłowe lub brakujące współrzędne:** Punkty z nieprawidłowymi lub brakującymi wartościami `lat` lub `lon` zostaną odfiltrowane i pominięte w obliczeniach.
5.  **Niesortowane punkty:** Metoda zakłada, że punkty są dostarczane w porządku chronologicznym. Przed wywołaniem `calculateStats`, należy upewnić się, że dane z parsera GPX są posortowane według czasu.

## 6. Kwestie bezpieczeństwa

Ponieważ serwis operuje na danych już obecnych na serwerze (po parsowaniu pliku GPX) i nie wykonuje żadnych operacji I/O ani zapytań do bazy danych, ryzyka bezpieczeństwa są minimalne. Kluczowe jest zapewnienie, że dane wejściowe są poprawnie walidowane (np. filtrowanie punktów bez współrzędnych), aby uniknąć błędów wykonania, takich jak `NaN` w wynikach, które mogłyby prowadzić do nieprawidłowych zapisów w bazie danych.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Aktualizacja typów

W pliku `src/types.ts` upewnij się, że istnieją lub dodaj następujące typy:

```typescript
// src/types.ts

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface TrackPoint extends Coordinate {
  time?: Date; // Znacznik czasu jest opcjonalny
}

export interface WorkoutStats {
  distance: number; // w metrach
  duration: number | null; // w sekundach lub null
}
```

### Krok 2: Utworzenie pliku serwisu

Utwórz nowy plik `src/lib/services/workout-stats.service.ts`.

### Krok 3: Implementacja logiki serwisu

W pliku `workout-stats.service.ts` zaimplementuj logikę obliczeniową.

```typescript
// src/lib/services/workout-stats.service.ts

import type { Coordinate, TrackPoint, WorkoutStats } from "src/types";

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the Haversine distance between two geographic coordinates.
 * @param point1 - The first coordinate.
 * @param point2 - The second coordinate.
 * @returns The distance in meters.
 */
function calculateHaversineDistance(point1: Coordinate, point2: Coordinate): number {
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLon = (point2.lon - point1.lon) * (Math.PI / 180);
  const lat1Rad = point1.lat * (Math.PI / 180);
  const lat2Rad = point2.lat * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the total distance and duration for a given array of track points.
 * @param points - An array of TrackPoint objects.
 * @returns An object containing the total distance (in meters) and duration (in seconds or null).
 */
export function calculateStats(points: TrackPoint[]): WorkoutStats {
  // Handle edge cases: no points or a single point
  if (!points || points.length < 2) {
    return { distance: 0, duration: null };
  }

  const validPoints = points.filter((p) => p.lat != null && p.lon != null);

  if (validPoints.length < 2) {
    return { distance: 0, duration: null };
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < validPoints.length; i++) {
    totalDistance += calculateHaversineDistance(validPoints[i - 1], validPoints[i]);
  }

  // Calculate total duration
  const pointsWithTime = validPoints.filter((p) => p.time instanceof Date);
  let totalDuration: number | null = null;
  if (pointsWithTime.length > 1) {
    // Ensure points are sorted by time just in case
    pointsWithTime.sort((a, b) => a.time!.getTime() - b.time!.getTime());
    const startTime = pointsWithTime[0].time!.getTime();
    const endTime = pointsWithTime[pointsWithTime.length - 1].time!.getTime();
    totalDuration = (endTime - startTime) / 1000; // in seconds
  }

  return {
    distance: totalDistance,
    duration: totalDuration,
  };
}
```

### Krok 4: Integracja z `workout.service.ts`

Zmodyfikuj istniejący `workout.service.ts` (lub inny serwis odpowiedzialny za import GPX), aby wykorzystać nowo utworzoną funkcję.

```typescript
// src/lib/services/workout.service.ts (przykład modyfikacji)

import { calculateStats } from "./workout-stats.service";
import type { TrackPoint, Workout } from "src/types";
// ... inne importy

// Wewnątrz funkcji, która przetwarza sparsowane dane GPX
// np. createWorkoutFromGpx(gpxData: GpxData, userId: string, name: string)

// Załóżmy, że `parsedPoints: TrackPoint[]` to wynik parsowania pliku GPX
const parsedPoints: TrackPoint[] = parseGpx(gpxData); // funkcja parseGpx jest tu przykładem

// Oblicz statystyki
const stats = calculateStats(parsedPoints);

// Użyj statystyk podczas tworzenia obiektu do zapisu w bazie danych
const newWorkoutData: Omit<Workout, "id" | "createdAt" | "updatedAt"> = {
  userId,
  name,
  // ... inne pola
  distance: stats.distance, // zapisz dystans w metrach
  duration: stats.duration, // zapisz czas trwania w sekundach lub null
  // ...
};

// Kontynuuj logikę zapisu do bazy danych Supabase
// await supabase.from('workouts').insert(newWorkoutData);
```

### Krok 5: Weryfikacja

Po zaimplementowaniu powyższych kroków, przetestuj proces importu pliku GPX. Sprawdź, czy w bazie danych dla nowego treningu poprawnie zapisywane są wartości `distance` i `duration`. Przetestuj również przypadki brzegowe, takie jak plik GPX z jednym punktem lub bez informacji o czasie, aby upewnić się, że serwis zwraca `null` dla `duration`, gdy jest to wymagane.
