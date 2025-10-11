import type { APIContext } from "astro";
import { z } from "zod";
import { WorkoutService } from "../../../lib/services/workout.service";

export const prerender = false;

const workoutIdSchema = z.string().uuid();

export async function GET(context: APIContext): Promise<Response> {
  const { params, locals } = context;

  const validationResult = workoutIdSchema.safeParse(params.id);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: "Invalid workout ID format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const workoutId = validationResult.data;
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const workoutService = new WorkoutService(locals.supabase);
    const workoutDetails = await workoutService.getWorkoutDetails({
      workoutId,
      userId: user.id,
    });

    if (!workoutDetails) {
      return new Response(JSON.stringify({ error: "Workout not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(workoutDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching workout details:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}