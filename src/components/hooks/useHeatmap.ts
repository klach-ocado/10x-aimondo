import { useState, useEffect, useCallback } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import type { HeatmapFiltersViewModel } from '../heatmap/HeatmapFilterPanel';
import type { MapViewState } from '../Map';
import { format } from 'date-fns';

const LOCAL_STORAGE_KEY = 'heatmapViewState';

export interface HeatmapDataDto {
    points: [number, number][]; // [lat, lng]
}

export const useHeatmap = () => {
  const [filters, setFilters] = useState<HeatmapFiltersViewModel>({});
  const [mapViewState, setMapViewState] = useState<MapViewState | null>(null);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [heatmapData, setHeatmapData] = useState<FeatureCollection<Point> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      setMapViewState(JSON.parse(savedState));
    }
    setIsLoading(false);
  }, []);

  const handleFiltersChange = useCallback((newFilters: HeatmapFiltersViewModel) => {
    setFilters(newFilters);
  }, []);

  const handleMapMove = useCallback((newViewState: MapViewState, bounds: LngLatBounds) => {
    setMapViewState(newViewState);
    setMapBounds(bounds);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newViewState));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(async () => {
    if (!mapBounds) {
      // This can happen on the very first load before the map has initialized
      // We will wait for the map to move and set the bounds
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('bbox', mapBounds.toBBoxString());
      if (filters.name) params.append('name', filters.name);
      if (filters.type) params.append('type', filters.type);
      if (filters.dateRange?.from) params.append('dateFrom', format(filters.dateRange.from, 'yyyy-MM-dd'));
      if (filters.dateRange?.to) params.append('dateTo', format(filters.dateRange.to, 'yyyy-MM-dd'));

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
          properties: {},
          geometry: { type: 'Point', coordinates: [p[1], p[0]] }, // lng, lat
        })),
      };

      setHeatmapData(geojsonData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, mapBounds]);

  useEffect(() => {
    // Fetch data on initial load once map bounds are available
    if (mapBounds && isInitialLoad) {
      refreshData();
      setIsInitialLoad(false);
    }
  }, [mapBounds, isInitialLoad, refreshData]);


  return {
    filters,
    mapViewState,
    heatmapData,
    isLoading,
    error,
    handleFiltersChange,
    handleMapMove,
    refreshData,
    clearError,
  };
};