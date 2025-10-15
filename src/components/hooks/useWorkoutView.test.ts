import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWorkoutView } from "./useWorkoutView";

// Mock globalnego obiektu fetch zgodnie z wytycznymi
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Przykładowe dane treningu
const mockWorkout = {
  id: "123",
  name: "Morning Run",
  distance: 10.5,
  duration: 3600,
  track_points: [{ lat: 52.2297, lon: 21.0122 }],
};

describe("useWorkoutView", () => {
  beforeEach(() => {
    // Resetowanie mocka przed każdym testem
    vi.clearAllMocks();
  });

  it("should return initial loading state", () => {
    // Arrange & Act
    const { result } = renderHook(() => useWorkoutView("123"));

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.workout).toBeNull();
  });

  it("should fetch workout data and return success state", async () => {
    // Arrange
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockWorkout),
    };
    mockFetch.mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useWorkoutView("123"));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/workouts/123");
    expect(result.current.workout).toEqual(mockWorkout);
    expect(result.current.error).toBeNull();
  });

  it("should return an error state if the fetch fails", async () => {
    // Arrange
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ message: "Failed to fetch workout data" }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useWorkoutView("123"));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch workout data");
    expect(result.current.workout).toBeNull();
  });

  it("should return an error state for network errors", async () => {
    // Arrange
    mockFetch.mockRejectedValue(new Error("Network error"));

    // Act
    const { result } = renderHook(() => useWorkoutView("123"));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.workout).toBeNull();
  });
});
