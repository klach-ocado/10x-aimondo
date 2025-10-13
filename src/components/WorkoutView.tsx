import React from 'react';
import { useWorkoutView } from './hooks/useWorkoutView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import StatsOverlay from './StatsOverlay';
import Map from './Map';
import BackButton from './common/BackButton';

interface WorkoutViewProps {
  workoutId: string;
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ workoutId }) => {
  const { workout, isLoading, error } = useWorkoutView(workoutId);

  const handleBack = () => {
    window.location.href = '/dashboard';
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
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
      <div className="p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!workout) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center space-x-4 p-4 border-b">
        <BackButton onClick={handleBack} />
        <h1 className="text-xl font-semibold">Workout Details</h1>
      </header>

      <main className="p-4 space-y-4 flex flex-col flex-grow">
        <h2 className="text-3xl font-bold tracking-tight">{workout.name}</h2>
        <StatsOverlay distance={workout.distance} duration={workout.duration} />
        <div className="flex-grow">
            {workout.track_points && workout.track_points.length > 0 ? (
              <Map
                displayMode="track"
                trackPoints={workout.track_points}
                className="h-full w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-96 w-full rounded-md border border-dashed">
                  <p className="text-muted-foreground">No track data available for this workout.</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default WorkoutView;
