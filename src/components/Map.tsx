import React, { useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import type { FeatureCollection, Point } from "geojson";
import { useMap } from "./hooks/useMap";

// --- TYPE DEFINITIONS ---

export interface MapViewState {
  center: [number, number]; // [lng, lat]
  zoom: number;
}

interface BaseMapProps {
  className?: string;
  onMoveEnd?: (viewState: MapViewState, bounds: [[number, number], [number, number]]) => void;
  onLoad?: (bounds: [[number, number], [number, number]]) => void;
}

interface TrackMapProps extends BaseMapProps {
  displayMode: "track";
  trackPoints: { lat: number; lng: number }[];
  heatmapData?: never;
  initialViewState?: null;
}

interface HeatmapMapProps extends BaseMapProps {
  displayMode: "heatmap";
  heatmapData: FeatureCollection<Point> | null;
  trackPoints?: never;
  initialViewState: MapViewState | null;
}

type MapProps = TrackMapProps | HeatmapMapProps;

// --- COMPONENT ---

const Map: React.FC<MapProps> = (props) => {
  const { className } = props;
  const mapContainer = useRef<HTMLDivElement>(null);

  useMap({
    mapContainer,
    ...props,
  });

  return <div ref={mapContainer} className={cn("h-96 w-full rounded-md", className)} data-testid="main-map" />;
};

export default Map;
