import * as React from "react";
import { useWorkoutsDashboard } from "./hooks/useWorkoutsDashboard";

export default function DashboardView() {
  const { workouts, pagination, isLoading, error } = useWorkoutsDashboard();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* Placeholder for Add Workout Button */}
      </div>

      {/* Placeholder for FiltersPanel */}

      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}

      {/* Placeholder for WorkoutsDataTable */}
      {!isLoading && !error && (
        <pre>{JSON.stringify({ workouts, pagination }, null, 2)}</pre>
      )}
    </div>
  );
}
