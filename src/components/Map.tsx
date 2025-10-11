import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LngLatLike } from 'maplibre-gl';

interface MapProps {
  trackPoints: { lat: number; lng: number }[];
  initialViewState: { center: [number, number]; zoom: number } | null;
}

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
const LOCAL_STORAGE_KEY = 'mapViewState';

const Map: React.FC<MapProps> = ({ trackPoints, initialViewState }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once

    const savedState = initialViewState ?? JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || 'null');

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: savedState?.center || [0, 0],
      zoom: savedState?.zoom || 2,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    const saveState = () => {
        if (map.current) {
            const currentState = {
              center: map.current.getCenter().toArray(),
              zoom: map.current.getZoom(),
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState));
        }
    }

    map.current.on('moveend', saveState);
    map.current.on('zoomend', saveState);

    return () => {
      map.current?.off('moveend', saveState);
      map.current?.off('zoomend', saveState);
      map.current?.remove();
      map.current = null;
    };
  }, [initialViewState]);

  useEffect(() => {
    if (!isMapLoaded || !map.current || !trackPoints || trackPoints.length === 0) return;

    const mapInstance = map.current;
    const routeSourceId = 'route';

    const coordinates = trackPoints.map(p => [p.lng, p.lat]);

    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: coordinates,
      },
    };

    if (mapInstance.getSource(routeSourceId)) {
        (mapInstance.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
        mapInstance.addSource(routeSourceId, {
            type: 'geojson',
            data: geojson,
        });

        mapInstance.addLayer({
            id: 'route-layer',
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
            paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 0.75,
            },
        });
    }

    const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as LngLatLike);
    }, new maplibregl.LngLatBounds(coordinates[0] as LngLatLike, coordinates[0] as LngLatLike));

    mapInstance.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
    });

  }, [isMapLoaded, trackPoints]);

  return <div ref={mapContainer} className="h-96 w-full rounded-md" />;
};

export default Map;
