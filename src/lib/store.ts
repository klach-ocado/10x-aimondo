import type { WorkoutFilters } from "@/components/hooks/useWorkoutsDashboard";

type Listener = () => void;

let state: WorkoutFilters = {};
const listeners: Set<Listener> = new Set();

export const dashboardFiltersStore = {
  get(): WorkoutFilters {
    return state;
  },

  set(newState: Partial<WorkoutFilters>) {
    state = { ...state, ...newState };
    listeners.forEach((listener) => listener());
  },

  clear() {
    state = {};
    listeners.forEach((listener) => listener());
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
