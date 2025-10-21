import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import type { LngLatLike } from "maplibre-gl";
import type { Feature, FeatureCollection, Point, LineString } from "geojson";
import type { MapViewState } from "../Map";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
const LOCAL_STORAGE_KEY = "mapViewState";

const ROUTE_SOURCE_ID = "route-source";
const ROUTE_LAYER_ID = "route-layer";
const HEATMAP_SOURCE_ID = "heatmap-source";
const HEATMAP_LAYER_ID = "heatmap-layer";

interface UseMapProps {
  mapContainer: React.RefObject<HTMLDivElement>;
  displayMode: "track" | "heatmap";
  onMoveEnd?: (viewState: MapViewState, bounds: [[number, number], [number, number]]) => void;
  onLoad?: (bounds: [[number, number], [number, number]]) => void;
  trackPoints?: { lat: number; lng: number }[];
  heatmapData?: FeatureCollection<Point> | null;
  initialViewState?: MapViewState | null;
}

export function useMap({
  mapContainer,
  displayMode,
  onMoveEnd,
  onLoad,
  trackPoints,
  heatmapData,
  initialViewState,
}: UseMapProps) {
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize only once

    let currentViewState: MapViewState;
    if (displayMode === "heatmap" && initialViewState) {
      currentViewState = initialViewState;
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
    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapInstance.on("load", () => {
      mapInstance.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      mapInstance.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round", visibility: "none" },
        paint: { "line-color": "#3887be", "line-width": 5, "line-opacity": 0.75 },
      });

      mapInstance.addSource(HEATMAP_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      mapInstance.addLayer({
        id: HEATMAP_LAYER_ID,
        type: "heatmap",
        source: HEATMAP_SOURCE_ID,
        maxzoom: 20,
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight": ["coalesce", ["get", "mag"], 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33,102,172,0)",
            0.2,
            "rgb(103,169,207)",
            0.4,
            "rgb(209,229,240)",
            0.6,
            "rgb(253,219,199)",
            0.8,
            "rgb(239,138,98)",
            1,
            "rgb(178,24,43)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 20, 0],
        },
      });

      setIsLoaded(true);

      if (onLoad) {
        const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]];
        onLoad(bounds);
      }
    });

    const handleMove = () => {
      if (!mapInstance) return;
      const newViewState: MapViewState = {
        center: mapInstance.getCenter().toArray() as [number, number],
        zoom: mapInstance.getZoom(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newViewState));
      if (onMoveEnd) {
        const bounds = mapInstance.getBounds().toArray() as [[number, number], [number, number]];
        onMoveEnd(newViewState, bounds);
      }
    };

    mapInstance.on("moveend", handleMove);
    mapInstance.on("zoomend", handleMove);

    return () => {
      mapInstance.off("moveend", handleMove);
      mapInstance.off("zoomend", handleMove);
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !map.current) return;

    const mapInstance = map.current;

    if (displayMode === "track" && trackPoints) {
      mapInstance.setLayoutProperty(HEATMAP_LAYER_ID, "visibility", "none");
      mapInstance.setLayoutProperty(ROUTE_LAYER_ID, "visibility", "visible");

      if (trackPoints.length > 0) {
        const coordinates = trackPoints.map((p) => [p.lng, p.lat]);
        const feature: Feature<LineString> = {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        };
        (mapInstance.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(feature);

        const bounds = coordinates.reduce(
          (b, coord) => b.extend(coord as LngLatLike),
          new maplibregl.LngLatBounds(coordinates[0] as LngLatLike, coordinates[0] as LngLatLike)
        );
        mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    } else if (displayMode === "heatmap") {
      mapInstance.setLayoutProperty(ROUTE_LAYER_ID, "visibility", "none");
      mapInstance.setLayoutProperty(HEATMAP_LAYER_ID, "visibility", "visible");

      const source = mapInstance.getSource(HEATMAP_SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(heatmapData || { type: "FeatureCollection", features: [] });
      }
    }
  }, [isLoaded, displayMode, trackPoints, heatmapData]);
}
