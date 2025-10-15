import type { APIRoute } from "astro";
import { z } from "zod";
import type { GetWorkoutsCommand, CreateWorkoutCommand } from "@/types";
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

export const GET: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;

  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = GetWorkoutsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ message: "Invalid query parameters", errors: validationResult.error.flatten() }),
        { status: 400 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const command: GetWorkoutsCommand = { ...validationResult.data, userId: user!.id };
    const workoutService = new WorkoutService(supabase);
    const paginatedWorkouts = await workoutService.getWorkouts(command);
    return new Response(JSON.stringify(paginatedWorkouts), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;
  try {
    const formData = await request.formData();
    const gpxFile = formData.get("gpxFile") as File;
    const validationResult = WorkoutCreateSchema.safeParse({ name: formData.get("name") });
    if (!validationResult.success || !gpxFile) {
      return new Response(JSON.stringify({ message: "Invalid input" }), { status: 400 });
    }
    const command: CreateWorkoutCommand = {
      name: validationResult.data.name,
      gpxFileContent: await gpxFile.text(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      user_id: user!.id,
    };
    const workoutService = new WorkoutService(supabase);
    const newWorkout = await workoutService.createWorkout(command);
    return new Response(JSON.stringify(newWorkout), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
