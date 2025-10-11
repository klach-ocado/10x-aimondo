import React, { useRef, useEffect, useState } from 'react';
import maplibregl, { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LngLatLike } from 'maplibre-gl';
import { cn } from '@/lib/utils';
import type { FeatureCollection, Point } from 'geojson';

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

interface BaseMapProps {
  initialViewState: MapViewState | null;
  className?: string;
  onMoveEnd?: (viewState: MapViewState, bounds: LngLatBounds) => void;
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

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.current.on('load', () => setIsMapLoaded(true));

    const handleMoveEnd = () => {
      if (map.current && onMoveEnd) {
        const viewState = {
          center: map.current.getCenter().toArray() as [number, number],
          zoom: map.current.getZoom(),
        };
        const bounds = map.current.getBounds();
        onMoveEnd(viewState, bounds);
      }
    };

    map.current.on('moveend', handleMoveEnd);
    map.current.on('zoomend', handleMoveEnd);

    return () => {
      map.current?.off('moveend', handleMoveEnd);
      map.current?.off('zoomend', handleMoveEnd);
      map.current?.remove();
      map.current = null;
    };
  }, [initialViewState, onMoveEnd]);

  // Effect for track display
  useEffect(() => {
    if (displayMode !== 'track' || !isMapLoaded || !map.current || !trackPoints || trackPoints.length === 0) return;

    const mapInstance = map.current;
    const routeSourceId = 'route';
    const coordinates = trackPoints.map(p => [p.lng, p.lat]);
    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates },
    };

    if (mapInstance.getSource(routeSourceId)) {
      (mapInstance.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      mapInstance.addSource(routeSourceId, { type: 'geojson', data: geojson });
      mapInstance.addLayer({
        id: 'route-layer',
        type: 'line',
        source: routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 },
      });
    }

    const bounds = coordinates.reduce(
      (b, coord) => b.extend(coord as LngLatLike),
      new maplibregl.LngLatBounds(coordinates[0] as LngLatLike, coordinates[0] as LngLatLike)
    );
    mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 15 });

  }, [isMapLoaded, trackPoints, displayMode]);

  // Effect for heatmap display
  useEffect(() => {
    if (displayMode !== 'heatmap' || !isMapLoaded || !map.current) return;

    const mapInstance = map.current;
    const heatmapSourceId = 'heatmap-points';

    if (mapInstance.getSource(heatmapSourceId)) {
      (mapInstance.getSource(heatmapSourceId) as maplibregl.GeoJSONSource).setData(heatmapData || { type: 'FeatureCollection', features: [] });
    } else {
      mapInstance.addSource(heatmapSourceId, {
        type: 'geojson',
        data: heatmapData || { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer(
        {
          id: 'heatmap-layer',
          type: 'heatmap',
          source: heatmapSourceId,
          maxzoom: 9,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
          },
        },
        'waterway-label'
      );
    }
  }, [isMapLoaded, heatmapData, displayMode]);


  return <div ref={mapContainer} className={cn('h-96 w-full rounded-md', className)} />;
};

export default Map;
