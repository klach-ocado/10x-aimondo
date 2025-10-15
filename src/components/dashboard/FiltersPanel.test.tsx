import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FiltersPanel } from "./FiltersPanel";
import type { WorkoutFilters } from "../hooks/useWorkoutsDashboard";

// Mock window.location.href
const originalLocation = window.location;

describe("FiltersPanel", () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnClearAll = vi.fn();

  const initialFilters: WorkoutFilters = {
    name: "Initial Name",
    type: "Initial Type",
    dateFrom: undefined,
    dateTo: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore window.location mock
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });
  });

  const renderComponent = (filters: WorkoutFilters = initialFilters, disabled = false) => {
    render(
      <FiltersPanel
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
        onClearAll={mockOnClearAll}
        disabled={disabled}
      />
    );
  };

  it("should render with initial filter values", () => {
    // Arrange
    renderComponent();

    // Assert
    expect(screen.getByPlaceholderText(/filter by name/i)).toHaveValue(initialFilters.name);
    expect(screen.getByPlaceholderText(/filter by type/i)).toHaveValue(initialFilters.type);
  });

  it("should call onFiltersChange when name filter is changed", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();
    const nameInput = screen.getByPlaceholderText(/filter by name/i);

    // Act
    await user.type(nameInput, "a");

    // Assert
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ ...initialFilters, name: "Initial Namea" });
  });

  it("should call onClearAll when Clear All button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent({ ...initialFilters, name: "test" }); // Make clear button visible

    // Act
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    // Assert
    expect(mockOnClearAll).toHaveBeenCalledTimes(1);
  });

  it("should navigate to heatmap with correct query params", async () => {
    // Arrange
    const user = userEvent.setup();
    const filtersWithDate = { ...initialFilters, dateFrom: "2023-01-01", dateTo: "2023-01-31" };
    renderComponent(filtersWithDate);

    // Act
    await user.click(screen.getByRole("button", { name: /show on heatmap/i }));

    // Assert
    const expectedParams = new URLSearchParams({
      name: filtersWithDate.name!,
      type: filtersWithDate.type!,
      dateFrom: filtersWithDate.dateFrom,
      dateTo: filtersWithDate.dateTo,
    }).toString();
    expect(window.location.href).toBe(`/heatmap?${expectedParams}`);
  });

  it("should have all inputs and buttons disabled when disabled prop is true", () => {
    // Arrange
    renderComponent(initialFilters, true);

    // Assert
    expect(screen.getByPlaceholderText(/filter by name/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/filter by type/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /pick a date range/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /show on heatmap/i })).toBeDisabled();
  });
});
