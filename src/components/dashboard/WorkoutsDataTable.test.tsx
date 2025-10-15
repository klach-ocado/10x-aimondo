import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutsDataTable } from "./WorkoutsDataTable";
import type { Pagination, WorkoutListItemDto, WorkoutSort } from "@/types";

// Mock window.location.href
const originalLocation = window.location;

const mockData: WorkoutListItemDto[] = [
  {
    id: "1",
    name: "Morning Run",
    date: "2023-10-26T09:00:00.000Z",
    distance: 5000,
    duration: 1800,
    type: "Running",
  },
  {
    id: "2",
    name: "Evening Bike",
    date: "2023-10-25T18:00:00.000Z",
    distance: 15000,
    duration: 3600,
    type: "Biking",
  },
];

const mockPagination: Pagination = {
  currentPage: 1,
  totalPages: 5,
  totalItems: 50,
  limit: 10,
};

const mockSort: WorkoutSort = {
  sortBy: "date",
  order: "desc",
};

describe("WorkoutsDataTable", () => {
  const mockOnSortChange = vi.fn();
  const mockOnPageChange = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });
  });

  const renderComponent = (data = mockData) => {
    render(
      <WorkoutsDataTable
        data={data}
        pagination={mockPagination}
        sort={mockSort}
        onSortChange={mockOnSortChange}
        onPageChange={mockOnPageChange}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
  };

  it("should render rows for each workout", () => {
    // Arrange
    renderComponent();

    // Assert
    expect(screen.getByText("Morning Run")).toBeInTheDocument();
    expect(screen.getByText("Evening Bike")).toBeInTheDocument();
    // Check for formatted distance
    expect(screen.getByText("5.00 km")).toBeInTheDocument();
    // Check for formatted duration (1800s = 30m)
    expect(screen.getByText("00:30:00")).toBeInTheDocument();
  });

  it('should render "No results." when data is empty', () => {
    // Arrange
    renderComponent([]);

    // Assert
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("should call onSortChange when a sortable header is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    await user.click(screen.getByRole("button", { name: /name/i }));

    // Assert
    expect(mockOnSortChange).toHaveBeenCalledWith({ sortBy: "name", order: "asc" });
  });

  it("should navigate to workout details page on row click", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    await user.click(screen.getByText("Morning Run"));

    // Assert
    expect(window.location.href).toBe(`/workouts/1`);
  });

  it("should call onEdit when edit is clicked from the dropdown menu", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    // Open the dropdown for the first row
    await user.click(screen.getAllByRole("button", { name: /open menu/i })[0]);
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    // Assert
    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it("should call onDelete when delete is clicked from the dropdown menu", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    await user.click(screen.getAllByRole("button", { name: /open menu/i })[0]);
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    // Assert
    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it("should not navigate on row click if action menu is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    await user.click(screen.getAllByRole("button", { name: /open menu/i })[0]);
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    // Assert
    expect(window.location.href).toBe("");
    expect(mockOnEdit).toHaveBeenCalled(); // Ensure the action was still called
  });
});
