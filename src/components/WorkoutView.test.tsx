import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import WorkoutView from "./WorkoutView";
import { useWorkoutView } from "./hooks/useWorkoutView";

// Mockowanie zależności (hook i komponenty podrzędne)
vi.mock("./hooks/useWorkoutView");
vi.mock("./StatsOverlay", () => ({
  // @ts-expect-error any for mock
  default: ({ distance, duration }) => (
    <div data-testid="stats-overlay">
      {distance} km, {duration} s
    </div>
  ),
}));
vi.mock("./Map", () => ({
  default: () => <div data-testid="map-component"></div>,
}));
vi.mock("./common/BackButton", () => ({
  // @ts-expect-error any for mock
  default: ({ onClick }) => <button data-testid="back-button" onClick={onClick}></button>,
}));

const mockUseWorkoutView = useWorkoutView as Mock;

describe("WorkoutView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render skeleton while loading", () => {
    // Arrange
    mockUseWorkoutView.mockReturnValue({
      isLoading: true,
      error: null,
      workout: null,
    });

    // Act
    render(<WorkoutView workoutId="1" />);

    // Assert
    expect(screen.getAllByRole("generic").some((el) => el.classList.contains("animate-pulse"))).toBe(true);
    expect(screen.queryByText(/Workout Details/i)).not.toBeInTheDocument();
  });

  it("should render an error message on failure", () => {
    // Arrange
    mockUseWorkoutView.mockReturnValue({
      isLoading: false,
      error: "Something went wrong",
      workout: null,
    });

    // Act
    render(<WorkoutView workoutId="1" />);

    // Assert
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render workout details on success", () => {
    // Arrange
    const workoutData = { name: "Evening Walk", distance: 5, duration: 1800, track_points: [{ lat: 1, lon: 1 }] };
    mockUseWorkoutView.mockReturnValue({
      isLoading: false,
      error: null,
      workout: workoutData,
    });

    // Act
    render(<WorkoutView workoutId="1" />);

    // Assert
    expect(screen.getByText("Workout Details")).toBeInTheDocument();
    expect(screen.getByText("Evening Walk")).toBeInTheDocument();
    expect(screen.getByTestId("stats-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("map-component")).toBeInTheDocument();
  });

  it("should render a message when no track data is available (edge case)", () => {
    // Arrange
    const workoutData = { name: "Treadmill Run", distance: 3, duration: 1200, track_points: [] };
    mockUseWorkoutView.mockReturnValue({
      isLoading: false,
      error: null,
      workout: workoutData,
    });

    // Act
    render(<WorkoutView workoutId="1" />);

    // Assert
    expect(screen.getByText("No track data available for this workout.")).toBeInTheDocument();
    expect(screen.queryByTestId("map-component")).not.toBeInTheDocument();
  });

  it("should handle back button click", () => {
    // Arrange
    // Mockowanie `window.location`
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
    const workoutData = { name: "Test", distance: 1, duration: 1, track_points: [] };
    mockUseWorkoutView.mockReturnValue({
      isLoading: false,
      error: null,
      workout: workoutData,
    });
    render(<WorkoutView workoutId="1" />);

    // Act
    fireEvent.click(screen.getByTestId("back-button"));

    // Assert
    expect(window.location.href).toBe("/dashboard");
  });
});
