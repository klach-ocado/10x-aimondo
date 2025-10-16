import React, { useEffect } from "react";
import { useHeatmap } from "./hooks/useHeatmap";
import { HeatmapFilterPanel } from "./heatmap/HeatmapFilterPanel";
import Map from "./Map";
import RefreshButton from "./heatmap/RefreshButton";
import BackButton from "./common/BackButton";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const HeatmapView = () => {
  const {
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
  } = useHeatmap();

  useEffect(() => {
    if (error) {
      toast.error(error.message, {
        onDismiss: clearError,
      });
    }
  }, [error, clearError]);

  const handleBack = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <BackButton onClick={handleBack} />
          <h1 className="text-xl font-semibold">Heatmap</h1>
        </div>
        <RefreshButton onClick={handleManualRefresh} isDisabled={isLoading} />
      </header>

      <div className="p-4">
        <HeatmapFilterPanel filters={filters} onFiltersChange={handleFiltersChange} isDisabled={isLoading} />
      </div>

      {error && !heatmapData && (
        <div className="p-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-grow p-4">
        <Map
          displayMode="heatmap"
          initialViewState={mapViewState}
          heatmapData={heatmapData}
          onMoveEnd={handleMapMove}
          onLoad={handleMapLoad}
          className="h-full w-full"
        />
      </div>
    </div>
  );
};

export default HeatmapView;
