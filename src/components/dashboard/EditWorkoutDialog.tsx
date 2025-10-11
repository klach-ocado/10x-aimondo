import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { WorkoutListItemDto, UpdateWorkoutCommand } from "@/types";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(300, "Name must be at most 300 characters."),
  type: z.string().min(3, "Type must be at least 3 characters.").max(50, "Type must be at most 50 characters."),
  date: z.date({ required_error: "A date is required." }),
});

interface EditWorkoutDialogProps {
  workout: WorkoutListItemDto | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (id: string, data: UpdateWorkoutCommand) => Promise<{ success: boolean; error?: string }>;
}

export function EditWorkoutDialog({ workout, isOpen, onOpenChange, onSuccess }: EditWorkoutDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
    },
  });

  React.useEffect(() => {
    if (workout) {
      form.reset({
        name: workout.name,
        type: workout.type || "",
        date: new Date(workout.date),
      });
    }
  }, [workout, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!workout) return;

    const result = await onSuccess(workout.id, {
      ...values,
      date: format(values.date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    });

    if (result.success) {
      toast.success("Workout updated successfully!");
      onOpenChange(false);
    } else {
      toast.error("Failed to update workout", { description: result.error });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Workout</DialogTitle>
          <DialogDescription>Make changes to your workout here. Click save when you're done.</DialogDescription>
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
                    <Input placeholder="Morning Run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Running" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
