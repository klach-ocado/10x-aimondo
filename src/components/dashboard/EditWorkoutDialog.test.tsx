import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditWorkoutDialog } from "./EditWorkoutDialog";
import type { WorkoutListItemDto } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockWorkout: WorkoutListItemDto = {
  id: "workout1",
  name: "Morning Run",
  type: "Running",
  date: "2023-10-27T10:00:00.000Z",
  distance: 5000,
  duration: 1800,
};

describe("EditWorkoutDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (isOpen = true, workout: WorkoutListItemDto | null = mockWorkout) => {
    render(
      <EditWorkoutDialog isOpen={isOpen} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} workout={workout} />
    );
  };

  it("should render with initial values from the workout prop", () => {
    // Arrange
    renderComponent();

    // Assert
    expect(screen.getByLabelText(/name/i)).toHaveValue(mockWorkout.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(screen.getByLabelText(/type/i)).toHaveValue(mockWorkout.type!);
    // The date is formatted, so we check for the formatted value
    expect(screen.getByText(format(new Date(mockWorkout.date), "PPP"))).toBeInTheDocument();
  });

  it("should render with empty fields if workout is null", () => {
    // Arrange
    renderComponent(true, null);

    // Assert
    // The dialog title should still be visible
    expect(screen.getByText("Edit Workout")).toBeInTheDocument();
    // The form fields should be empty as there is no workout data to populate them
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
    expect(screen.getByLabelText(/type/i)).toHaveValue("");
  });

  it("should display validation error when name is cleared", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    await user.clear(screen.getByLabelText(/name/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // Assert
    expect(await screen.findByText("Name must be at least 3 characters.")).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("should call onSuccess and close on successful submission", async () => {
    // Arrange
    const user = userEvent.setup();
    mockOnSuccess.mockResolvedValue({ success: true });
    renderComponent();
    const newName = "Evening Stroll";

    // Act
    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), newName);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // Assert
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledWith(mockWorkout.id, {
        name: newName,
        type: mockWorkout.type,
        date: expect.any(String), // date is formatted, so we just check for string type
      });
    });

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should show an error toast and not close on failed submission", async () => {
    // Arrange
    const user = userEvent.setup();
    const errorMessage = "Update failed";
    mockOnSuccess.mockResolvedValue({ success: false, error: errorMessage });
    renderComponent();

    // Act
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // Assert
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mockOnOpenChange).not.toHaveBeenCalled();
    expect(vi.mocked(toast).error).toHaveBeenCalledWith("Failed to update workout", { description: errorMessage });
  });
});
