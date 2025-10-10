
import type { APIContext } from 'astro';
import { WorkoutCreateSchema } from '../../types';

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

  // TODO: Create CreateWorkoutCommand and call WorkoutService

  return new Response(JSON.stringify({ message: 'Validation successful' }), { status: 200 });
}
