import type { APIRoute } from "astro";
import { z } from "zod";
import type { GetWorkoutsCommand, CreateWorkoutCommand, UpdateWorkoutCommand } from "@/types";
import { WorkoutService } from "@/lib/services/workout.service";

export const prerender = false;

const GetWorkoutsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
  name: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.string().optional(),
  sortBy: z.string().optional().default("date"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

const WorkoutCreateSchema = z.object({
  name: z.string().min(3).max(300),
});

export const ALL: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const workoutService = new WorkoutService(supabase);
  const { method } = request;
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(p => p);
  const workoutId = pathParts[2]; // Assumes /api/workouts/{id}

  try {
    if (method === "GET" && !workoutId) {
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validationResult = GetWorkoutsQuerySchema.safeParse(queryParams);
      if (!validationResult.success) {
        return new Response(JSON.stringify({ message: "Invalid query parameters", errors: validationResult.error.flatten() }), { status: 400 });
      }
      const command: GetWorkoutsCommand = { ...validationResult.data, userId: user.id };
      const paginatedWorkouts = await workoutService.getWorkouts(command);
      return new Response(JSON.stringify(paginatedWorkouts), { status: 200 });
    }

    if (method === "POST" && !workoutId) {
      const formData = await request.formData();
      const gpxFile = formData.get("gpxFile") as File;
      const validationResult = WorkoutCreateSchema.safeParse({ name: formData.get("name") });
      if (!validationResult.success || !gpxFile) {
        return new Response(JSON.stringify({ message: "Invalid input" }), { status: 400 });
      }
      const command: CreateWorkoutCommand = { name: validationResult.data.name, gpxFileContent: await gpxFile.text(), user_id: user.id };
      const newWorkout = await workoutService.createWorkout(command);
      return new Response(JSON.stringify(newWorkout), { status: 201 });
    }

    // if (method === "PUT" && workoutId) {
    //   const data: UpdateWorkoutCommand = await request.json();
    //   const updatedWorkout = await workoutService.updateWorkout(workoutId, data);
    //   return new Response(JSON.stringify(updatedWorkout), { status: 200 });
    // }
    //
    // if (method === "DELETE" && workoutId) {
    //   await workoutService.deleteWorkout(workoutId);
    //   return new Response(null, { status: 204 });
    // }

    return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
