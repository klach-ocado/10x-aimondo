import type { APIRoute } from "astro";
import type { UpdateWorkoutCommand } from "@/types";
import { WorkoutService } from "@/lib/services/workout.service";

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals, params }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const workoutId = params.id;
  if (!workoutId) {
    return new Response(JSON.stringify({ message: "Workout ID is required" }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: "Not implemented yet" }), { status: 500 });
  // try {
  //   const workoutService = new WorkoutService(supabase);
  //   const data: UpdateWorkoutCommand = await request.json();
  //   const updatedWorkout = await workoutService.updateWorkout(workoutId, data);
  //   return new Response(JSON.stringify(updatedWorkout), { status: 200 });
  // } catch (error) {
  //   console.error(error);
  //   return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  // }
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
  const { user, supabase } = locals;
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const workoutId = params.id;
  if (!workoutId) {
    return new Response(JSON.stringify({ message: "Workout ID is required" }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: "Not implemented yet" }), { status: 500 });
  // try {
  //   const workoutService = new WorkoutService(supabase);
  //   await workoutService.deleteWorkout(workoutId);
  //   return new Response(null, { status: 204 });
  // } catch (error) {
  //   console.error(error);
  //   return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  // }
};
