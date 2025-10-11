import React from "react";
import { useWorkoutView } from "./hooks/useWorkoutView";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import StatsOverlay from "./StatsOverlay";
import Map from "./Map";

interface WorkoutViewProps {
  workoutId: string;
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ workoutId }) => {
  const { workout, isLoading, error } = useWorkoutView(workoutId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!workout) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{workout.name}</h1>
      <StatsOverlay distance={workout.distance} duration={workout.duration} />
      {workout.track_points && workout.track_points.length > 0 ? (
        <Map
          displayMode="track"
          trackPoints={workout.track_points}
          initialViewState={null}
          className="h-[calc(100vh-22rem)]"
        />
      ) : (
        <div className="flex items-center justify-center h-96 w-full rounded-md border border-dashed">
          <p className="text-muted-foreground">No track data available for this workout.</p>
        </div>
      )}
    </div>
  );
};

export default WorkoutView;
