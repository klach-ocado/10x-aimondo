import React from 'react';
import { useWorkoutView } from './hooks/useWorkoutView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface WorkoutViewProps {
  workoutId: string;
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ workoutId }) => {
  const { workout, isLoading, error } = useWorkoutView(workoutId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
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
    <div>
      <h1 className="text-2xl font-bold mb-4">{workout.name}</h1>
      <pre className="bg-gray-100 p-4 rounded-md">{JSON.stringify(workout, null, 2)}</pre>
    </div>
  );
};

export default WorkoutView;
