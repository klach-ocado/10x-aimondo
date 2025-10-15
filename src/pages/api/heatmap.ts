import type { APIContext } from "astro";
import { z } from "zod";
import type { GetHeatmapDataCommand } from "../../types";
import { WorkoutService } from "../../lib/services/workout.service";

export const prerender = false;

const GetHeatmapDataQuerySchema = z.object({
  bbox: z.string().refine(
    (val) => {
      const parts = val.split(",");
      return parts.length === 4 && parts.every((part) => !isNaN(parseFloat(part)));
    },
    { message: "Invalid bbox format. Expected minLng,minLat,maxLng,maxLat" }
  ),
  name: z.string().optional(),
  dateFrom: z.string().datetime({ message: "Invalid date format for dateFrom" }).optional(),
  dateTo: z.string().datetime({ message: "Invalid date format for dateTo" }).optional(),
  type: z.string().optional(),
});

export async function GET(context: APIContext): Promise<Response> {
  const { locals, url } = context;
  const { user, supabase } = locals;

  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validation = GetHeatmapDataQuerySchema.safeParse(queryParams);

  if (!validation.success) {
    return new Response(JSON.stringify({ message: "Invalid query parameters", errors: validation.error.flatten() }), {
      status: 400,
    });
  }

  const { bbox, ...filters } = validation.data;
  const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(parseFloat);

  const command: GetHeatmapDataCommand = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    userId: user!.id,
    minLng,
    minLat,
    maxLng,
    maxLat,
    ...filters,
  };

  try {
    const workoutService = new WorkoutService(supabase);
    const heatmapDto = await workoutService.getHeatmapData(command);
    return new Response(JSON.stringify(heatmapDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/heatmap:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
