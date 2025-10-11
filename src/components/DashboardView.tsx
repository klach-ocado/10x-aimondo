import * as React from "react";
import { useState } from "react";
import { useWorkoutsDashboard } from "./hooks/useWorkoutsDashboard";
import { WorkoutsDataTable } from "./dashboard/WorkoutsDataTable";
import { DataTableSkeleton } from "./dashboard/DataTableSkeleton";
import { FiltersPanel } from "./dashboard/FiltersPanel";
import type { WorkoutListItemDto } from "@/types";
import { EditWorkoutDialog } from "./dashboard/EditWorkoutDialog";
import { DeleteConfirmationDialog } from "./dashboard/DeleteConfirmationDialog";
import { AddWorkoutDialog } from "./dashboard/AddWorkoutDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

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
    setPage,
    updateWorkout,
    deleteWorkout,
    addWorkout,
    clearAllFilters,
  } = useWorkoutsDashboard();
  const [editingWorkout, setEditingWorkout] = useState<WorkoutListItemDto | null>(null);
  const [deletingWorkout, setDeletingWorkout] = useState<WorkoutListItemDto | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleEdit = (workout: WorkoutListItemDto) => setEditingWorkout(workout);
  const handleDelete = (workout: WorkoutListItemDto) => setDeletingWorkout(workout);

  return (
    <div className="space-y-8">
      <Toaster richColors />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Workout</Button>
      </div>

      <FiltersPanel filters={filters} onFiltersChange={setFilters} disabled={isLoading} onClearAll={clearAllFilters} />

      {error && <p className="text-red-500">Error: {error.message}</p>}

      {isLoading && !workouts.length ? (
        <DataTableSkeleton />
      ) : (
        pagination && (
          <WorkoutsDataTable
            data={workouts}
            pagination={pagination}
            sort={sort}
            onSortChange={setSort}
            onPageChange={setPage}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )
      )}

      <EditWorkoutDialog
        isOpen={!!editingWorkout}
        onOpenChange={(isOpen) => !isOpen && setEditingWorkout(null)}
        workout={editingWorkout}
        onSuccess={updateWorkout}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingWorkout}
        onOpenChange={(isOpen) => !isOpen && setDeletingWorkout(null)}
        workout={deletingWorkout}
        onConfirm={deleteWorkout}
      />

      <AddWorkoutDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={addWorkout} />
    </div>
  );
}
