import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMap } from "./useMap";
import maplibregl from "maplibre-gl";
import React from "react";

// --- Pełne mockowanie biblioteki maplibre-gl ---
const routeSourceMock = { setData: vi.fn() };
const heatmapSourceMock = { setData: vi.fn() };

const mockMapInstance = {
  addControl: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  getSource: vi.fn((sourceId) => {
    if (sourceId === "route-source") return routeSourceMock;
    if (sourceId === "heatmap-source") return heatmapSourceMock;
    return undefined;
  }),
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

const mockBoundsInstance = {
  extend: vi.fn(function () {
    return this;
  }), // Return `this` for chaining
};

vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn(() => mockMapInstance),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn().mockImplementation(() => mockBoundsInstance),
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

describe("useMap", () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let loadCallback: () => void = () => {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    mockMapInstance.on.mockImplementation((event, callback) => {
      if (event === "load") {
        loadCallback = callback;
      }
    });
  });

  it("should initialize the map on mount", async () => {
    const mapContainer = React.createRef<HTMLDivElement>();
    mapContainer.current = document.createElement("div");
    const onLoad = vi.fn();

    renderHook(() =>
      useMap({
        mapContainer,
        displayMode: "track",
        trackPoints: [],
        onLoad,
      })
    );

    act(() => {
      loadCallback();
    });

    await waitFor(() => {
      expect(maplibregl.Map).toHaveBeenCalledOnce();
      expect(mockMapInstance.addControl).toHaveBeenCalledOnce();
      expect(mockMapInstance.addSource).toHaveBeenCalledWith("route-source", expect.any(Object));
      expect(mockMapInstance.addSource).toHaveBeenCalledWith("heatmap-source", expect.any(Object));
      expect(onLoad).toHaveBeenCalledOnce();
    });
  });

  it('should update data for "track" mode', async () => {
    const mapContainer = React.createRef<HTMLDivElement>();
    mapContainer.current = document.createElement("div");
    const trackPoints = [
      { lat: 40, lng: -74 },
      { lat: 41, lng: -75 },
    ];

    const { rerender } = renderHook(
      ({ displayMode, points }) =>
        useMap({
          mapContainer,
          displayMode,
          trackPoints: points,
        }),
      {
        initialProps: { displayMode: "track" as const, points: [] },
      }
    );

    act(() => {
      loadCallback();
    });

    rerender({ displayMode: "track", points: trackPoints });

    await waitFor(() => {
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("route-layer", "visibility", "visible");
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("heatmap-layer", "visibility", "none");
      expect(routeSourceMock.setData).toHaveBeenCalledWith(
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
      expect(mockMapInstance.fitBounds).toHaveBeenCalledOnce();
    });
  });

  it('should update data for "heatmap" mode', async () => {
    const mapContainer = React.createRef<HTMLDivElement>();
    mapContainer.current = document.createElement("div");
    const heatmapData = { type: "FeatureCollection", features: [] };

    const { rerender } = renderHook(
      ({ displayMode, data }) =>
        useMap({
          mapContainer,
          displayMode,
          heatmapData: data,
          initialViewState: { center: [0, 0], zoom: 1 },
        }),
      {
        initialProps: { displayMode: "heatmap" as const, data: null },
      }
    );

    act(() => {
      loadCallback();
    });

    rerender({ displayMode: "heatmap", data: heatmapData });

    await waitFor(() => {
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("heatmap-layer", "visibility", "visible");
      expect(mockMapInstance.setLayoutProperty).toHaveBeenCalledWith("route-layer", "visibility", "none");
      expect(heatmapSourceMock.setData).toHaveBeenCalledWith(heatmapData);
    });
  });

  it("should save view state to localStorage on move", async () => {
    const mapContainer = React.createRef<HTMLDivElement>();
    mapContainer.current = document.createElement("div");
    const onMoveEnd = vi.fn();
    const setItemSpy = vi.spyOn(localStorageMock, "setItem");
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let moveEndCallback: () => void = () => {};

    mockMapInstance.on.mockImplementation((event, callback) => {
      if (event === "load") loadCallback = callback;
      if (event === "moveend") moveEndCallback = callback;
    });

    renderHook(() =>
      useMap({
        mapContainer,
        displayMode: "heatmap",
        heatmapData: null,
        initialViewState: { center: [0, 0], zoom: 1 },
        onMoveEnd,
      })
    );

    act(() => {
      loadCallback();
      moveEndCallback();
    });

    await waitFor(() => {
      expect(onMoveEnd).toHaveBeenCalledOnce();
      expect(setItemSpy).toHaveBeenCalledWith("mapViewState", JSON.stringify({ center: [0, 0], zoom: 2 }));
    });
  });
});
