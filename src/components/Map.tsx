import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LngLatLike } from 'maplibre-gl';
import { cn } from '@/lib/utils';
import type { Feature, FeatureCollection, Point, LineString } from 'geojson';

// --- TYPE DEFINITIONS ---

export interface MapViewState {
  center: [number, number]; // [lng, lat]
  zoom: number;
}

interface BaseMapProps {
  className?: string;
  // Callback for when the map view changes by user interaction
  onMoveEnd?: (viewState: MapViewState, bounds: [[number, number], [number, number]]) => void;
  // Callback for when the map has finished its initial load
  onLoad?: (bounds: [[number, number], [number, number]]) => void;
}

interface TrackMapProps extends BaseMapProps {
  displayMode: 'track';
  trackPoints: { lat: number; lng: number }[];
  heatmapData?: never;
  initialViewState?: null; // In track mode, view is determined by trackPoints
}

interface HeatmapMapProps extends BaseMapProps {
  displayMode: 'heatmap';
  heatmapData: FeatureCollection<Point> | null;
  trackPoints?: never;
  initialViewState: MapViewState | null;
}

type MapProps = TrackMapProps | HeatmapMapProps;

// --- CONSTANTS ---

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
const LOCAL_STORAGE_KEY = 'mapViewState';

const ROUTE_SOURCE_ID = 'route-source';
const ROUTE_LAYER_ID = 'route-layer';
const HEATMAP_SOURCE_ID = 'heatmap-source';
const HEATMAP_LAYER_ID = 'heatmap-layer';

// --- COMPONENT ---

const Map: React.FC<MapProps> = (props) => {
  const { displayMode, className, onMoveEnd, onLoad } = props;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- MAP INITIALIZATION EFFECT ---
  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize only once

    let currentViewState: MapViewState;
    if (props.displayMode === 'heatmap' && props.initialViewState) {
        currentViewState = props.initialViewState;
    } else {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        currentViewState = savedState ? JSON.parse(savedState) : { center: [0, 0], zoom: 2 };
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: currentViewState.center,
      zoom: currentViewState.zoom,
    });

    const mapInstance = map.current;
    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // --- LOAD EVENT HANDLER ---
    mapInstance.on('load', () => {
      // Add all sources and layers required for all display modes.
      // They are initialized with empty data and hidden, to be updated later.

      // 1. Track Mode Source and Layer
      mapInstance.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      mapInstance.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'none' },
        paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 },
      });

      // 2. Heatmap Mode Source and Layer
      mapInstance.addSource(HEATMAP_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      mapInstance.addLayer({
        id: HEATMAP_LAYER_ID,
        type: 'heatmap',
        source: HEATMAP_SOURCE_ID,
        maxzoom: 16, // Increased maxzoom
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['coalesce', ['get', 'mag'], 1], // Robust fix for the null error
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 9, 1, 16, 0], // Adjusted opacity range
        },
      });

      setIsLoaded(true); // Signal that the map is ready for data updates

      // Trigger the onLoad callback with initial bounds
      if (onLoad) {
        const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]];
        onLoad(bounds);
      }
    });

    // --- MOVE/SAVE STATE HANDLER ---
    const handleMove = () => {
      if (!mapInstance) return;
      const newViewState: MapViewState = {
        center: mapInstance.getCenter().toArray() as [number, number],
        zoom: mapInstance.getZoom(),
      };
      // Save state to localStorage as per ui-plan.md
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newViewState));
      // Notify parent if callback is provided
      if (onMoveEnd) {
        const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]];
        onMoveEnd(newViewState, bounds);
      }
    };

    mapInstance.on('moveend', handleMove);
    mapInstance.on('zoomend', handleMove);

    // --- CLEANUP ---
    return () => {
      mapInstance.off('moveend', handleMove);
      mapInstance.off('zoomend', handleMove);
      mapInstance.remove();
      map.current = null;
    };
  }, []); // This effect runs only once on mount


  // --- DATA AND VISIBILITY UPDATE EFFECT ---
  useEffect(() => {
    if (!isLoaded || !map.current) return; // Wait for map to be fully loaded

    const mapInstance = map.current;

    // Logic to switch between display modes
    if (displayMode === 'track' && props.trackPoints) {
      // 1. Set layer visibility
      mapInstance.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'none');
      mapInstance.setLayoutProperty(ROUTE_LAYER_ID, 'visibility', 'visible');

      // 2. Update data and fit bounds
      if (props.trackPoints.length > 0) {
        const coordinates = props.trackPoints.map(p => [p.lng, p.lat]);
        const feature: Feature<LineString> = {
          type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates },
        };
        (mapInstance.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(feature);

        const bounds = coordinates.reduce(
          (b, coord) => b.extend(coord as LngLatLike),
          new maplibregl.LngLatBounds(coordinates[0] as LngLatLike, coordinates[0] as LngLatLike)
        );
        mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    } else if (displayMode === 'heatmap') {
      // 1. Set layer visibility
      mapInstance.setLayoutProperty(ROUTE_LAYER_ID, 'visibility', 'none');
      mapInstance.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'visible');

      // 2. Update data
      const source = mapInstance.getSource(HEATMAP_SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(props.heatmapData || { type: 'FeatureCollection', features: [] });
      }
    }
  }, [isLoaded, displayMode, props.trackPoints, props.heatmapData]);

  return <div ref={mapContainer} className={cn('h-96 w-full rounded-md', className)} />;
};

export default Map;