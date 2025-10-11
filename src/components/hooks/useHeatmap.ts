import { useState, useCallback } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { HeatmapFiltersViewModel } from '../heatmap/HeatmapFilterPanel';
import type { MapViewState } from '../Map';

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

  const refreshData = useCallback(async (bbox: string | null) => {
    if (!bbox) {
      setError(new Error("Map bounds are not available to fetch data."));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('bbox', bbox);
      if (filters.name) params.append('name', filters.name);
      if (filters.type) params.append('type', filters.type);
      if (filters.dateRange?.from) params.append('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange?.to) params.append('dateTo', filters.dateRange.to.toISOString());

      const response = await fetch(`/api/heatmap?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch heatmap data');
      }

      const data: HeatmapDataDto = await response.json();

      const geojsonData: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: data.points.map(p => ({
          type: 'Feature',
          properties: { mag: 1 },
          geometry: { type: 'Point', coordinates: [p[1], p[0]] }, // lng, lat
        })),
      };

      setHeatmapData(geojsonData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const handleMapLoad = useCallback((boundsArray: [[number, number], [number, number]]) => {
    const bboxString = `${boundsArray[0][0]},${boundsArray[0][1]},${boundsArray[1][0]},${boundsArray[1][1]}`;
    setMapBbox(bboxString);
    refreshData(bboxString);
  }, [refreshData]);

  const handleManualRefresh = useCallback(() => {
    refreshData(mapBbox);
  }, [mapBbox, refreshData]);

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