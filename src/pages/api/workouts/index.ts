
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const GetWorkoutsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
  name: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.string().optional(),
  sortBy: z.string().optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

import type { GetWorkoutsCommand } from '../../../types';
import { WorkoutService } from '../../../lib/services/workout.service';

export const GET: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const validationResult = GetWorkoutsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: 'Invalid query parameters',
        errors: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const command: GetWorkoutsCommand = {
      ...validationResult.data,
      userId: user.id,
    };

    const workoutService = new WorkoutService(supabase);
    const paginatedWorkouts = await workoutService.getWorkouts(command);

    return new Response(JSON.stringify(paginatedWorkouts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // TODO: Implement better logging
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
