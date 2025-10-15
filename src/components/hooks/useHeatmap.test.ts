import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHeatmap } from "./useHeatmap";
import type { HeatmapDataDto } from "./useHeatmap";
import type { FeatureCollection, Point } from "geojson";

// Zgodnie z vitest-unit-testing.mdc, mockujemy globalne zależności jak fetch
const mockSuccessResponse: HeatmapDataDto = {
  points: [
    [50.0, 19.0],
    [50.1, 19.1],
  ],
};

const mockGeoJsonResponse: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { mag: 1 },
      geometry: { type: "Point", coordinates: [19.0, 50.0] },
    },
    {
      type: "Feature",
      properties: { mag: 1 },
      geometry: { type: "Point", coordinates: [19.1, 50.1] },
    },
  ],
};

const fetchSpy = vi.spyOn(global, "fetch");

describe("useHeatmap Hook", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Domyślna implementacja mocka dla "happy path"
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSuccessResponse),
    } as Response);
  });

  // Test 1: Stan początkowy
  it("should initialize with correct default state", () => {
    // Arrange & Act
    const { result } = renderHook(() => useHeatmap());

    // Assert
    expect(result.current.filters).toEqual({});
    expect(result.current.mapViewState).toBeNull();
    expect(result.current.heatmapData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // Test 2: Pobieranie danych po załadowaniu mapy (Happy Path)
  it("should fetch data and update state on handleMapLoad", async () => {
    // Arrange
    const { result } = renderHook(() => useHeatmap());
    const initialBounds: [[number, number], [number, number]] = [
      [18.0, 49.0],
      [20.0, 51.0],
    ];

    // Act
    await act(async () => {
      result.current.handleMapLoad(initialBounds);
    });

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(`/api/heatmap?bbox=18%2C49%2C20%2C51`);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.heatmapData).toEqual(mockGeoJsonResponse);
    expect(result.current.error).toBeNull();
  });

  // Test 3: Obsługa błędów API
  it("should set error state when fetch fails", async () => {
    // Arrange
    const errorMessage = "Failed to fetch";
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    } as Response);
    const { result } = renderHook(() => useHeatmap());
    const initialBounds: [[number, number], [number, number]] = [
      [18.0, 49.0],
      [20.0, 51.0],
    ];

    // Act
    await act(async () => {
      result.current.handleMapLoad(initialBounds);
    });

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(result.current.heatmapData).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  // Test 4: Ręczne odświeżanie z filtrami
  it("should build correct URL with filters on manual refresh", async () => {
    // Arrange
    const { result } = renderHook(() => useHeatmap());
    const bounds: [[number, number], [number, number]] = [
      [18.0, 49.0],
      [20.0, 51.0],
    ];
    const filters = {
      name: "My Workout",
      type: "Running",
      dateRange: { from: new Date("2023-01-01"), to: new Date("2023-01-31") },
    };

    // Act
    await act(async () => {
      result.current.handleMapLoad(bounds); // To set bbox
      result.current.handleFiltersChange(filters);
    });
    await act(async () => {
      result.current.handleManualRefresh();
    });

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(2); // 1 for load, 1 for refresh
    const expectedParams = new URLSearchParams({
      bbox: "18,49,20,51",
      name: "My Workout",
      type: "Running",
      dateFrom: new Date("2023-01-01").toISOString(),
      dateTo: new Date("2023-01-31").toISOString(),
    }).toString();
    expect(fetchSpy).toHaveBeenCalledWith(`/api/heatmap?${expectedParams}`);
  });

  // Test 5: Czyszczenie błędu
  it("should clear the error state", async () => {
    // Arrange
    fetchSpy.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useHeatmap());
    const initialBounds: [[number, number], [number, number]] = [
      [18.0, 49.0],
      [20.0, 51.0],
    ];
    await act(async () => {
      result.current.handleMapLoad(initialBounds);
    });

    // Assert initial error state
    expect(result.current.error).not.toBeNull();

    // Act
    act(() => {
      result.current.clearError();
    });

    // Assert final state
    expect(result.current.error).toBeNull();
  });
});
