import * as React from "react";
import { useWorkoutsDashboard } from "./hooks/useWorkoutsDashboard";
import { WorkoutsDataTable } from "./dashboard/WorkoutsDataTable";
import { DataTableSkeleton } from "./dashboard/DataTableSkeleton";
import { FiltersPanel } from "./dashboard/FiltersPanel";

import { FiltersPanel } from "./dashboard/FiltersPanel";

export default function DashboardView() {
  const { 
    workouts, 
    pagination, 
    isLoading, 
    error, 
    filters, 
    setFilters, 
    sort, 
    setSort, 
    setPage 
  } = useWorkoutsDashboard();

  const handleEdit = (workout: any) => console.log("Edit:", workout);
  const handleDelete = (workout: any) => console.log("Delete:", workout);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* Placeholder for Add Workout Button */}
      </div>

      <FiltersPanel filters={filters} onFiltersChange={setFilters} disabled={isLoading} />

      {error && <p className="text-red-500">Error: {error.message}</p>}

      {isLoading && !workouts.length ? (
        <DataTableSkeleton />
      ) : pagination && (
        <WorkoutsDataTable 
          data={workouts} 
          pagination={pagination} 
          sort={sort}
          onSortChange={setSort}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
