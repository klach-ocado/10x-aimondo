import { useState, useEffect } from 'react';
import type { WorkoutDetailsDto } from '@/types';

export const useWorkoutView = (workoutId: string) => {
  const [workout, setWorkout] = useState<WorkoutDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/workouts/${workoutId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        const data: WorkoutDetailsDto = await response.json();
        setWorkout(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId]);

  return { workout, isLoading, error };
};
