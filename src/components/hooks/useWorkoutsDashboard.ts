import { useState, useEffect, useCallback } from "react";
import type { PaginatedWorkoutsDto, WorkoutListItemDto, Pagination, UpdateWorkoutCommand } from "@/types";

export interface WorkoutFilters {
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

export interface WorkoutSort {
  sortBy: string;
  order: "asc" | "desc";
}

const DEBOUNCE_DELAY = 500;

export function useWorkoutsDashboard() {
  const [workouts, setWorkouts] = useState<WorkoutListItemDto[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<WorkoutFilters>({});
  const [sort, setSort] = useState<WorkoutSort>({ sortBy: "date", order: "desc" });
  
  const [debouncedFilters, setDebouncedFilters] = useState<WorkoutFilters>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, DEBOUNCE_DELAY);
    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  const fetchWorkouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "10");
      params.append("sortBy", sort.sortBy);
      params.append("order", sort.order);

      if (debouncedFilters.name) params.append("name", debouncedFilters.name);
      if (debouncedFilters.type) params.append("type", debouncedFilters.type);
      if (debouncedFilters.dateFrom) params.append("dateFrom", debouncedFilters.dateFrom);
      if (debouncedFilters.dateTo) params.append("dateTo", debouncedFilters.dateTo);

      const response = await fetch(`/api/workouts?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch workouts" }));
        throw new Error(errorData.message || "Failed to fetch workouts");
      }

      const result: PaginatedWorkoutsDto = await response.json();
      setWorkouts(result.data);
      setPagination(result.pagination);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("An unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [page, sort, debouncedFilters]);

  const updateWorkout = async (id: string, data: UpdateWorkoutCommand) => {
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update workout.' }));
        return { success: false, error: errorData.message || 'An unknown error occurred.' };
      }

      await fetchWorkouts();
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'An unknown error occurred.' };
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      });

      if (response.status !== 204) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete workout.' }));
        return { success: false, error: errorData.message || 'An unknown error occurred.' };
      }

      await fetchWorkouts();
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'An unknown error occurred.' };
    }
  };

  const addWorkout = async (data: FormData) => {
    try {
      const response = await fetch(`/api/workouts`, {
        method: 'POST',
        body: data,
      });

      if (response.status !== 201) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add workout.' }));
        return { success: false, error: errorData.message || 'An unknown error occurred.' };
      }

      await fetchWorkouts();
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'An unknown error occurred.' };
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return {
    workouts,
    pagination,
    isLoading,
    error,
    filters,
    sort,
    page,
    setFilters,
    setSort,
    setPage,
    refresh: fetchWorkouts,
    updateWorkout,
    deleteWorkout,
    addWorkout,
  };
}
