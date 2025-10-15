import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Map from "./Map";
import maplibregl from "maplibre-gl";

// --- Pełne mockowanie biblioteki maplibre-gl ---
const mockMapInstance = {
  addControl: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  getSource: vi.fn(() => ({
    setData: vi.fn(),
  })),
  setLayoutProperty: vi.fn(),
  fitBounds: vi.fn(),
  getBounds: vi.fn(() => ({
    toArray: () => [
      [-1, -1],
      [1, 1],
    ],
  })),
  getCenter: vi.fn(() => ({ toArray: () => [0, 0] })),
  getZoom: vi.fn(() => 2),
  remove: vi.fn(),
};

// Mockowanie konstruktora Map
vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn(() => mockMapInstance),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn().mockImplementation(() => ({
      extend: vi.fn(),
    })),
  },
}));

// --- Mockowanie LocalStorage ---
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Map", () => {
  beforeEach(() => {
    // Czyszczenie wszystkich mocków przed każdym testem
    vi.clearAllMocks();
    localStorageMock.clear();

    // Umożliwia ręczne wywoływanie zdarzeń mapy w testach
    mockMapInstance.on.mockImplementation((event, callback) => {
      if (event === "load") {
        // Automatyczne wywołanie 'load' po renderowaniu, aby symulować inicjalizację mapy
        setTimeout(callback, 0);
      }
    });
  });

  it("should initialize the map on mount", async () => {
    // Arrange
    const onLoad = vi.fn();

    // Act
    render(<Map displayMode="track" trackPoints={[]} onLoad={onLoad} />);

    // Assert
    await waitFor(() => {
      expect(maplibregl.Map).toHaveBeenCalledOnce(); // Sprawdzenie, czy mapa została utworzona
      expect(mockMapInstance.addControl).toHaveBeenCalledOnce(); // Sprawdzenie, czy kontrolki zostały dodane
      expect(mockMapInstance.addSource).toHaveBeenCalledWith("route-source", expect.any(Object));
      expect(mockMapInstance.addSource).toHaveBeenCalledWith("heatmap-source", expect.any(Object));
      expect(onLoad).toHaveBeenCalledOnce(); // Sprawdzenie, czy callback onLoad został wywołany
    });
  });

  it('should render in "track" mode and fit bounds to points', async () => {
    // Arrange
    const trackPoints = [
      { lat: 40, lng: -74 },
      { lat: 41, lng: -75 },
    ];

    // Act
    render(<Map displayMode="track" trackPoints={trackPoints} />);

    // Assert
    await waitFor(() => {
      // Sprawdzenie, czy warstwy są poprawnie przełączane
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("route-layer", "visibility", "visible");
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("heatmap-layer", "visibility", "none");

      // Sprawdzenie, czy dane trasy zostały ustawione
      const sourceMock = mockMapInstance.getSource("route-source");
      expect(sourceMock.setData).toHaveBeenCalledWith(
        expect.objectContaining({
          geometry: {
            type: "LineString",
            coordinates: [
              [-74, 40],
              [-75, 41],
            ],
          },
        })
      );
      // Sprawdzenie, czy mapa dopasowuje widok do trasy
      expect(mockMapInstance.fitBounds).toHaveBeenCalledOnce();
    });
  });

  it('should render in "heatmap" mode with provided data', async () => {
    // Arrange
    const heatmapData = { type: "FeatureCollection", features: [] } as any;

    // Act
    render(<Map displayMode="heatmap" heatmapData={heatmapData} initialViewState={{ center: [0, 0], zoom: 1 }} />);

    // Assert
    await waitFor(() => {
      // Sprawdzenie, czy warstwy są poprawnie przełączane
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("heatmap-layer", "visibility", "visible");
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("route-layer", "visibility", "none");

      // Sprawdzenie, czy dane heatmapy zostały ustawione
      const sourceMock = mockMapInstance.getSource("heatmap-source");
      expect(sourceMock.setData).toHaveBeenCalledWith(heatmapData);
    });
  });

  it("should save view state to localStorage on move", async () => {
    // Arrange
    const onMoveEnd = vi.fn();
    const setItemSpy = vi.spyOn(localStorageMock, "setItem");

    // Ręczna obsługa zdarzeń dla tego testu
    let moveEndCallback: () => void = () => {};
    mockMapInstance.on.mockImplementation((event, callback) => {
      if (event === "load") setTimeout(callback, 0);
      if (event === "moveend") moveEndCallback = callback; // Przechwycenie callbacku
    });

    render(
      <Map
        displayMode="heatmap"
        heatmapData={null}
        initialViewState={{ center: [0, 0], zoom: 1 }}
        onMoveEnd={onMoveEnd}
      />
    );

    // Act
    await waitFor(() => expect(mockMapInstance.addControl).toHaveBeenCalled()); // Czekanie na załadowanie
    moveEndCallback(); // Ręczne wywołanie zdarzenia 'moveend'

    // Assert
    await waitFor(() => {
      expect(onMoveEnd).toHaveBeenCalledOnce();
      expect(setItemSpy).toHaveBeenCalledWith("mapViewState", JSON.stringify({ center: [0, 0], zoom: 2 }));
    });
  });
});
