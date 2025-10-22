import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { authService } from "@/lib/services/auth.service";
import { UpdatePasswordSchema } from "@/lib/auth/schemas";

export function UpdatePasswordForm() {
  const form = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = useCallback(async (values: z.infer<typeof UpdatePasswordSchema>) => {
    const result = await authService.updatePassword(values);

    switch (result.status) {
      case "success":
        toast.success("Password updated successfully!");
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          // eslint-disable-next-line react-compiler/react-compiler
          window.location.href = "/dashboard";
        }, 1000);
        break;
      case "unauthorized":
        toast.error("Invalid or Expired Link", {
          description: "Your password reset link is invalid or has expired. Please request a new one.",
        });
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 3000);
        break;
      case "error":
        toast.error("Failed to update password", {
          description: result.error,
        });
        break;
    }
  }, []);

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Update Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
