import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WorkoutListItemDto } from "@/types";

interface DeleteConfirmationDialogProps {
  workout: WorkoutListItemDto | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteConfirmationDialog({ workout, isOpen, onOpenChange, onConfirm }: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!workout) return;

    setIsDeleting(true);
    const result = await onConfirm(workout.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Workout deleted successfully!");
      onOpenChange(false);
    } else {
      toast.error("Failed to delete workout", { description: result.error });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the workout
            <span className="font-medium"> {workout?.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
