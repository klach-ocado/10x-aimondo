import { useState, useCallback } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { HeatmapFiltersViewModel } from "../heatmap/HeatmapFilterPanel";
import type { MapViewState } from "../Map";

export interface HeatmapDataDto {
  points: [number, number][]; // [lat, lng]
}

export const useHeatmap = () => {
  const [filters, setFilters] = useState<HeatmapFiltersViewModel>({});
  const [mapViewState, setMapViewState] = useState<MapViewState | null>(null);
  const [mapBbox, setMapBbox] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<FeatureCollection<Point> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshData = useCallback(async (bbox: string | null, currentFilters: HeatmapFiltersViewModel) => {
    if (!bbox) {
      setError(new Error("Map bounds are not available to fetch data."));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("bbox", bbox);
      if (currentFilters.name) params.append("name", currentFilters.name);
      if (currentFilters.type) params.append("type", currentFilters.type);
      if (currentFilters.dateRange?.from) params.append("dateFrom", currentFilters.dateRange.from.toISOString());
      if (currentFilters.dateRange?.to) params.append("dateTo", currentFilters.dateRange.to.toISOString());

      const response = await fetch(`/api/heatmap?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch heatmap data");
      }

      const data: HeatmapDataDto = await response.json();

      const geojsonData: FeatureCollection<Point> = {
        type: "FeatureCollection",
        features: data.points.map((p) => ({
          type: "Feature",
          properties: { mag: 1 },
          geometry: { type: "Point", coordinates: [p[1], p[0]] }, // lng, lat
        })),
      };

      setHeatmapData(geojsonData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMapLoad = useCallback(
    (boundsArray: [[number, number], [number, number]]) => {
      const bboxString = `${boundsArray[0][0]},${boundsArray[0][1]},${boundsArray[1][0]},${boundsArray[1][1]}`;
      setMapBbox(bboxString);

      // Parse filters from URL and trigger initial fetch
      const params = new URLSearchParams(window.location.search);
      const name = params.get("name") || undefined;
      const type = params.get("type") || undefined;
      const dateFrom = params.get("dateFrom");
      const dateTo = params.get("dateTo");

      const initialFilters: HeatmapFiltersViewModel = {
        name,
        type,
        dateRange: {
          from: dateFrom ? new Date(dateFrom) : undefined,
          to: dateTo ? new Date(dateTo) : undefined,
        },
      };

      // Remove empty properties for a clean state
      Object.keys(initialFilters).forEach((key) => {
        const value = initialFilters[key as keyof HeatmapFiltersViewModel];
        if (value === undefined || value === null) {
          delete initialFilters[key as keyof HeatmapFiltersViewModel];
        } else if (typeof value === 'object' && value.from === undefined && value.to === undefined) {
          delete initialFilters[key as keyof HeatmapFiltersViewModel];
        }
      });

      setFilters(initialFilters);
      refreshData(bboxString, initialFilters);
    },
    [refreshData]
  );

  const handleManualRefresh = useCallback(() => {
    refreshData(mapBbox, filters);
  }, [mapBbox, filters, refreshData]);

  const handleFiltersChange = useCallback((newFilters: HeatmapFiltersViewModel) => {
    setFilters(newFilters);
  }, []);

  const handleMapMove = useCallback((newViewState: MapViewState, boundsArray: [[number, number], [number, number]]) => {
    setMapViewState(newViewState);
    const bboxString = `${boundsArray[0][0]},${boundsArray[0][1]},${boundsArray[1][0]},${boundsArray[1][1]}`;
    setMapBbox(bboxString);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    filters,
    mapViewState,
    heatmapData,
    isLoading,
    error,
    handleFiltersChange,
    handleMapMove,
    handleMapLoad,
    handleManualRefresh,
    clearError,
  };
};
