import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LngLatLike } from 'maplibre-gl';
import { cn } from '@/lib/utils';
import type { FeatureCollection, Point, LineString } from 'geojson';

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

interface BaseMapProps {
  initialViewState: MapViewState | null;
  className?: string;
  onMoveEnd?: (viewState: MapViewState, bounds: [[number, number], [number, number]]) => void;
  isLoading?: boolean;
}

interface TrackMapProps extends BaseMapProps {
  displayMode: 'track';
  trackPoints: { lat: number; lng: number }[];
  heatmapData?: never;
}

interface HeatmapMapProps extends BaseMapProps {
  displayMode: 'heatmap';
  heatmapData: FeatureCollection<Point> | null;
  trackPoints?: never;
}

type MapProps = TrackMapProps | HeatmapMapProps;

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-layer';
const HEATMAP_SOURCE_ID = 'heatmap-points';
const HEATMAP_LAYER_ID = 'heatmap-layer';

const Map: React.FC<MapProps> = ({
  displayMode,
  trackPoints,
  heatmapData,
  initialViewState,
  className,
  onMoveEnd,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialViewState?.center || [0, 0],
      zoom: initialViewState?.zoom || 2,
    });

    const mapInstance = map.current;

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapInstance.on('load', () => {
      // Add sources and layers for both modes, but keep them empty initially.
      // Visibility will be controlled by layout properties.

      // Track source and layer
      mapInstance.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      mapInstance.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: 'none', // Initially hidden
        },
        paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 },
      });

      // Heatmap source and layer
      mapInstance.addSource(HEATMAP_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      mapInstance.addLayer({
        id: HEATMAP_LAYER_ID,
        type: 'heatmap',
        source: HEATMAP_SOURCE_ID,
        maxzoom: 9,
        layout: {
          visibility: 'none', // Initially hidden
        },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
        },
      });

      setIsMapLoaded(true);
    });

    const handleMoveEnd = () => {
      if (map.current && onMoveEnd) {
        const viewState = {
          center: map.current.getCenter().toArray() as [number, number],
          zoom: map.current.getZoom(),
        };
        const rawBounds = map.current.getBounds();
        onMoveEnd(viewState, rawBounds.toArray() as [[number, number], [number, number]]);
      }
    };

    mapInstance.on('moveend', handleMoveEnd);
    mapInstance.on('zoomend', handleMoveEnd);

    return () => {
      mapInstance.off('moveend', handleMoveEnd);
      mapInstance.off('zoomend', handleMoveEnd);
      mapInstance.remove();
      map.current = null;
    };
  }, [initialViewState, onMoveEnd]);

  // Effect to update data and visibility
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;
    const mapInstance = map.current;

    if (displayMode === 'track') {
      mapInstance.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'none');
      mapInstance.setLayoutProperty(ROUTE_LAYER_ID, 'visibility', 'visible');

      if (trackPoints && trackPoints.length > 0) {
        const coordinates = trackPoints.map(p => [p.lng, p.lat]);
        const geojson: FeatureCollection<LineString> = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates },
          }]
        };
        (mapInstance.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson.features[0]);

        const bounds = coordinates.reduce(
          (b, coord) => b.extend(coord as LngLatLike),
          new maplibregl.LngLatBounds(coordinates[0] as LngLatLike, coordinates[0] as LngLatLike)
        );
        mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    } else if (displayMode === 'heatmap') {
      mapInstance.setLayoutProperty(ROUTE_LAYER_ID, 'visibility', 'none');
      mapInstance.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'visible');

      const source = mapInstance.getSource(HEATMAP_SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(heatmapData || { type: 'FeatureCollection', features: [] });
      }
    }
  }, [isMapLoaded, displayMode, trackPoints, heatmapData]);

  return <div ref={mapContainer} className={cn('h-96 w-full rounded-md', className)} />;
};

export default Map;
