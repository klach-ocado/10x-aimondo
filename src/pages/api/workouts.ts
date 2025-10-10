
import type { APIContext } from 'astro';
import { type CreateWorkoutCommand, WorkoutCreateSchema } from '../../types';
import { WorkoutService } from '../../lib/services/workout.service';

export const prerender = false;

const MAX_GPX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(context: APIContext): Promise<Response> {
  if (!context.locals.user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const formData = await context.request.formData();
  const name = formData.get('name');
  const gpxFile = formData.get('gpxFile');

  const validationResult = WorkoutCreateSchema.safeParse({ name });

  if (!validationResult.success) {
    return new Response(JSON.stringify({ message: 'Invalid input', errors: validationResult.error.flatten() }), {
      status: 400,
    });
  }

  if (!gpxFile || !(gpxFile instanceof File)) {
    return new Response(JSON.stringify({ message: 'GPX file is required' }), { status: 400 });
  }

  if (gpxFile.size > MAX_GPX_FILE_SIZE) {
    return new Response(JSON.stringify({ message: 'GPX file is too large' }), { status: 413 });
  }

  if (!gpxFile.name.endsWith('.gpx')) {
    return new Response(JSON.stringify({ message: 'Invalid file type. Only .gpx files are accepted' }), {
      status: 400,
    });
  }

  try {
    const gpxFileContent = await gpxFile.text();

    const command: CreateWorkoutCommand = {
      name: validationResult.data.name,
      user_id: context.locals.user.id,
      gpxFileContent,
    };

    const workoutService = new WorkoutService(context.locals.supabase);
    const workout = await workoutService.createWorkout(command);

    return new Response(JSON.stringify(workout), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
