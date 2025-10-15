import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeatmapFilterPanel } from "./HeatmapFilterPanel";
import React from "react";

// Zgodnie z vitest-unit-testing.mdc, używamy `vi.fn()` do mockowania funkcji callback
describe("HeatmapFilterPanel Component", () => {
  // Test 1: Poprawne renderowanie z przekazanymi filtrami
  it("should render with initial filter values", () => {
    // Arrange
    const initialFilters = {
      name: "My Test Run",
      type: "Running",
    };
    const onFiltersChange = vi.fn();

    // Act
    render(<HeatmapFilterPanel filters={initialFilters} onFiltersChange={onFiltersChange} isDisabled={false} />);

    // Assert
    // Używamy `getByDisplayValue` do znalezienia inputów z konkretną wartością
    expect(screen.getByDisplayValue("My Test Run")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Running")).toBeInTheDocument();
  });

  // Test 2: Interakcja z polem tekstowym (name)
  it("should call onFiltersChange when name filter is changed", () => {
    // Arrange
    const onFiltersChange = vi.fn();
    render(<HeatmapFilterPanel filters={{}} onFiltersChange={onFiltersChange} isDisabled={false} />);
    const nameInput = screen.getByPlaceholderText("Filter by name...");

    // Act
    fireEvent.change(nameInput, { target: { value: "New Name" } });

    // Assert
    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange).toHaveBeenCalledWith({ name: "New Name" });
  });

  // Test 3: Kliknięcie przycisku "Clear All"
  it("should call onFiltersChange with empty object on 'Clear All' click", () => {
    // Arrange
    const onFiltersChange = vi.fn();
    render(
      <HeatmapFilterPanel
        filters={{ name: "some filter" }} // Filtr musi być aktywny, żeby przycisk się pojawił
        onFiltersChange={onFiltersChange}
        isDisabled={false}
      />
    );
    const clearButton = screen.getByRole("button", { name: "Clear All" });

    // Act
    fireEvent.click(clearButton);

    // Assert
    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  // Test 4: Stan `isDisabled`
  it("should disable all inputs and buttons when isDisabled is true", () => {
    // Arrange
    render(<HeatmapFilterPanel filters={{ name: "some filter" }} onFiltersChange={vi.fn()} isDisabled={true} />);

    // Assert
    expect(screen.getByPlaceholderText("Filter by name...")).toBeDisabled();
    expect(screen.getByPlaceholderText("Filter by type...")).toBeDisabled();
    expect(screen.getByRole("button", { name: /pick a date range/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear All" })).toBeDisabled();
  });
});
