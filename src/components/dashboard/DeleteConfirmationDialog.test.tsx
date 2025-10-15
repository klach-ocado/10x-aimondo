import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import type { WorkoutListItemDto } from "@/types";
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
  name: "Test Workout",
  type: "Running",
  date: "2023-10-27T10:00:00.000Z",
  distance: 5000,
  duration: 1800,
};

describe("DeleteConfirmationDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (isOpen = true, workout: WorkoutListItemDto | null = mockWorkout) => {
    render(
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        workout={workout}
      />
    );
  };

  it("should render title and description with workout name when open", () => {
    // Arrange
    renderComponent();

    // Assert
    expect(screen.getByText("Are you absolutely sure?")).toBeInTheDocument();
    expect(screen.getByText(/This will permanently delete the workout/)).toBeInTheDocument();
    expect(screen.getByText(mockWorkout.name)).toBeInTheDocument();
  });

  it("should call onConfirm and close on successful confirmation", async () => {
    // Arrange
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue({ success: true });
    renderComponent();

    // Act
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Assert
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockWorkout.id);
    });
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
    expect(vi.mocked(toast).success).toHaveBeenCalledWith("Workout deleted successfully!");
  });

  it("should show error toast and not close on failed confirmation", async () => {
    // Arrange
    const user = userEvent.setup();
    const errorMessage = "Deletion failed";
    mockOnConfirm.mockResolvedValue({ success: false, error: errorMessage });
    renderComponent();

    // Act
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Assert
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockWorkout.id);
    });
    expect(mockOnOpenChange).not.toHaveBeenCalled();
    expect(vi.mocked(toast).error).toHaveBeenCalledWith("Failed to delete workout", { description: errorMessage });
  });

  it("should disable buttons during deletion", async () => {
    // Arrange
    const user = userEvent.setup();
    // Make the promise hang so we can check the intermediate state
    mockOnConfirm.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    const continueButton = screen.getByRole("button", { name: /continue/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    // Act
    await user.click(continueButton);

    // Assert
    await waitFor(() => {
      expect(continueButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  it("should call onOpenChange when cancel is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderComponent();

    // Act
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Assert
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
