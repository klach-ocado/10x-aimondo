import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(300, "Name must be at most 300 characters."),
  gpxFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "GPX file is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((files) => files?.[0]?.name.toLowerCase().endsWith(".gpx"), ".gpx file format is required."),
});

interface AddWorkoutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (data: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function AddWorkoutDialog({ isOpen, onOpenChange, onSuccess }: AddWorkoutDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("gpxFile", values.gpxFile[0]);

    const result = await onSuccess(formData);

    if (result.success) {
      toast.success("Workout added successfully!");
      onOpenChange(false);
      form.reset();
    } else {
      toast.error("Failed to add workout", { description: result.error });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="add-workout-dialog">
        <DialogHeader>
          <DialogTitle>Add New Workout</DialogTitle>
          <DialogDescription>Upload a GPX file to add a new workout to your list.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Evening Bike Ride" {...field} data-testid="workout-name-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gpxFile"
              render={() => (
                <FormItem>
                  <FormLabel>GPX File</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".gpx" {...form.register("gpxFile")} data-testid="gpx-file-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} data-testid="add-workout-button">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Workout
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
