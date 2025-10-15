import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWorkoutsDashboard } from "./useWorkoutsDashboard";
import type { PaginatedWorkoutsDto, WorkoutListItemDto } from "@/types";

// Mocking global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mocking localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

const mockWorkouts: WorkoutListItemDto[] = [
  { id: "1", name: "Morning Run", date: "2023-10-26T09:00:00.000Z", distance: 5000, duration: 1800, type: "Running" },
  { id: "2", name: "Evening Bike", date: "2023-10-25T18:00:00.000Z", distance: 15000, duration: 3600, type: "Biking" },
];

const mockPaginatedResponse: PaginatedWorkoutsDto = {
  data: mockWorkouts,
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalItems: 20,
    limit: 10,
  },
};

describe("useWorkoutsDashboard", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockClear();
    localStorageMock.clear();
    // Default successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPaginatedResponse),
    });
  });

  it("should fetch workouts on initial render and update state on success", async () => {
    // Arrange & Act
    const { result } = renderHook(() => useWorkoutsDashboard());

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.workouts).toEqual(mockWorkouts);
      expect(result.current.pagination).toEqual(mockPaginatedResponse.pagination);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("/api/workouts?page=1&limit=10&sortBy=date&order=desc");
    });
  });

  it("should handle fetch errors gracefully", async () => {
    // Arrange
    const error = new Error("Failed to fetch");
    mockFetch.mockRejectedValue(error);

    // Act
    const { result } = renderHook(() => useWorkoutsDashboard());

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(error);
      expect(result.current.workouts).toEqual([]);
    });
  });

  it("should load initial filters from localStorage", async () => {
    // Arrange
    const savedFilters = { name: "Run", type: "Running" };
    localStorageMock.setItem("dashboardFilters", JSON.stringify(savedFilters));

    // Act
    const { result } = renderHook(() => useWorkoutsDashboard());

    // Assert
    await waitFor(() => {
      expect(result.current.filters).toEqual(savedFilters);
    });
  });

  it("should save filters to localStorage when they change", async () => {
    // Arrange
    const { result } = renderHook(() => useWorkoutsDashboard());
    const setItemSpy = vi.spyOn(localStorageMock, "setItem");
    const newFilters = { name: "Bike" };

    // Act
    act(() => {
      result.current.setFilters(newFilters);
    });

    // Assert
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith("dashboardFilters", JSON.stringify(newFilters));
    });
  });

  it("should refetch when page is changed", async () => {
    // Arrange
    const { result } = renderHook(() => useWorkoutsDashboard());
    await waitFor(() => expect(result.current.isLoading).toBe(false)); // Wait for initial fetch

    // Act
    act(() => {
      result.current.setPage(2);
    });

    // Assert
    await waitFor(() => {
      expect(result.current.page).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith("/api/workouts?page=2&limit=10&sortBy=date&order=desc");
    });
  });

  it("should refetch when sort is changed", async () => {
    // Arrange
    const { result } = renderHook(() => useWorkoutsDashboard());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Act
    act(() => {
      result.current.setSort({ sortBy: "name", order: "asc" });
    });

    // Assert
    await waitFor(() => {
      expect(result.current.sort).toEqual({ sortBy: "name", order: "asc" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith("/api/workouts?page=1&limit=10&sortBy=name&order=asc");
    });
  });

  describe("with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce filter changes before refetching", async () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutsDashboard());
      // Don't wait for initial fetch, just clear the mock to isolate the debounce call
      await act(async () => {
        await Promise.resolve(); // allow initial fetch promise to resolve
      });
      mockFetch.mockClear();

      // Act
      act(() => {
        result.current.setFilters({ name: "a" });
        result.current.setFilters({ name: "ab" });
        result.current.setFilters({ name: "abc" });
      });

      // Assert
      // Fetch should not be called immediately
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timers past the debounce delay
      await act(async () => {
        vi.runAllTimers();
        await Promise.resolve(); // allow debounced fetch promise to resolve
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenLastCalledWith("/api/workouts?page=1&limit=10&sortBy=date&order=desc&name=abc");
    });
  });

  it("clearAllFilters should reset filters, page, and sort state", async () => {
    // Arrange
    const { result } = renderHook(() => useWorkoutsDashboard());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.setPage(3);
      result.current.setSort({ sortBy: "name", order: "asc" });
      result.current.setFilters({ name: "test" });
    });
    await waitFor(() => expect(result.current.filters).toEqual({ name: "test" }));

    // Act
    act(() => {
      result.current.clearAllFilters();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.filters).toEqual({});
      expect(result.current.page).toBe(1);
      expect(result.current.sort).toEqual({ sortBy: "date", order: "desc" });
      // 1 initial, 1 for setPage, 1 for setSort, 1 for clearAllFilters (which cancels the debounced setFilters)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe("Data Modification", () => {
    it("addWorkout should send a POST request and refetch on success", async () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutsDashboard());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const formData = new FormData();
      formData.append("name", "new workout");

      mockFetch
        .mockResolvedValueOnce({ status: 201, ok: true, json: () => Promise.resolve({}) }) // For the POST
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPaginatedResponse) }); // For the refetch

      // Act
      let response;
      await act(async () => {
        response = await result.current.addWorkout(formData);
      });

      // Assert
      expect(response).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial, 1 POST, 1 refetch
      expect(mockFetch.mock.calls[1][0]).toBe("/api/workouts");
      expect(mockFetch.mock.calls[1][1]?.method).toBe("POST");
      expect(mockFetch.mock.calls[1][1]?.body).toBe(formData);
    });

    it("updateWorkout should send a PUT request and refetch on success", async () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutsDashboard());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const updateData = { name: "Updated Name" };

      mockFetch
        .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve({}) }) // For the PUT
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPaginatedResponse) }); // For the refetch

      // Act
      let response;
      await act(async () => {
        response = await result.current.updateWorkout("1", updateData);
      });

      // Assert
      expect(response).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch.mock.calls[1][0]).toBe("/api/workouts/1");
      expect(mockFetch.mock.calls[1][1]?.method).toBe("PUT");
      expect(mockFetch.mock.calls[1][1]?.body).toBe(JSON.stringify(updateData));
    });

    it("deleteWorkout should send a DELETE request and refetch on success", async () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutsDashboard());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      mockFetch
        .mockResolvedValueOnce({ status: 204, ok: true }) // For the DELETE
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPaginatedResponse) }); // For the refetch

      // Act
      let response;
      await act(async () => {
        response = await result.current.deleteWorkout("1");
      });

      // Assert
      expect(response).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch.mock.calls[1][0]).toBe("/api/workouts/1");
      expect(mockFetch.mock.calls[1][1]?.method).toBe("DELETE");
    });

    it("should return an error object if a modification fails", async () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutsDashboard());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const errorResponse = { message: "Failed to delete." };
      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      // Act
      let response;
      await act(async () => {
        response = await result.current.deleteWorkout("1");
      });

      // Assert
      expect(response).toEqual({ success: false, error: "Failed to delete." });
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 initial, 1 failed DELETE
    });
  });
});
