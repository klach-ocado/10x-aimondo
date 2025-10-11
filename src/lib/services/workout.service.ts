import type {
  CreateWorkoutCommand,
  GetWorkoutDetailsCommand,
  GetWorkoutsCommand,
  PaginatedWorkoutsDto,
  UpdateWorkoutCommand,
  WorkoutDetailsDto,
  WorkoutDto,
} from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import { DOMParser } from "xmldom-qsa";

export class WorkoutService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getWorkoutDetails(command: GetWorkoutDetailsCommand): Promise<WorkoutDetailsDto | null> {
    const { workoutId, userId } = command;

    const { data, error } = await this.supabase
      .from("workouts")
      .select(
        `
        id,
        name,
        date,
        type,
        distance,
        duration,
        track_points (
          lat:location.ST_Y(),
          lng:location.ST_X(),
          ele:elevation,
          time:timestamp
        )
      `,
      )
      .eq("id", workoutId)
      .eq("user_id", userId)
      .single();

    if (error) {
      // TODO: Improve error handling, check for specific errors like P2025 (not found)
      console.error("Error fetching workout details:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mappedTrackPoints = data.track_points.map((point) => ({
      ...point,
      // ST_Y and ST_X are aliased to lat and lng in the query
    }));

    return {
      id: data.id,
      name: data.name,
      date: data.date,
      type: data.type,
      distance: data.distance,
      duration: data.duration,
      track_points: mappedTrackPoints,
    };
  }

  async getWorkouts(command: GetWorkoutsCommand): Promise<PaginatedWorkoutsDto> {
    const { userId, page, limit, name, dateFrom, dateTo, type, sortBy, order } = command;

    const query = this.supabase.from("workouts").select("*", { count: "exact" }).eq("user_id", userId);

    if (name) {
      query.ilike("name", `%${name}%`);
    }
    if (dateFrom) {
      query.gte("date", dateFrom);
    }
    if (dateTo) {
      query.lte("date", dateTo);
    }
    if (type) {
      query.eq("type", type);
    }

    query.order(sortBy, { ascending: order === "asc" });
    query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      // TODO: Create a custom error for this
      throw new Error("Failed to fetch workouts");
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
      data: data || [],
    };
  }

  async updateWorkout(
    id: string,
    userId: string,
    command: UpdateWorkoutCommand,
  ): Promise<WorkoutDto | null> {
    const { data, error } = await this.supabase
      .from("workouts")
      .update({ ...command, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating workout:", error);
      return null;
    }

    return data;
  }

  async createWorkout(command: CreateWorkoutCommand): Promise<WorkoutDto> {
    const customParseMethod = (txt: string): Document | null => {
      return new DOMParser().parseFromString(txt, "text/xml");
    };
    const [parsedGpx, error] = parseGPXWithCustomParser(command.gpxFileContent, customParseMethod);

    if (error) {
      // TODO: Create a custom error for this
      throw new Error("Failed to parse GPX file");
    }

    if (!parsedGpx || !parsedGpx.tracks || parsedGpx.tracks.length === 0) {
      // TODO: Create a custom error for this
      throw new Error("GPX file does not contain any tracks");
    }

    const trackPoints = parsedGpx.tracks.flatMap((track) => track.points);

    if (trackPoints.length === 0) {
      // TODO: Create a custom error for this
      throw new Error("GPX file does not contain any track points");
    }

    const workoutToInsert = {
      user_id: command.user_id,
      name: command.name,
      date: (trackPoints[0].time ? new Date(trackPoints[0].time) : new Date()).toISOString(),
      type: "run", // Mock data
      distance: 10000, // Mock data
      duration: 3600, // Mock data
    };

    const { data: workout, error: workoutError } = await this.supabase
      .from("workouts")
      .insert(workoutToInsert)
      .select()
      .single();

    if (workoutError) {
      // TODO: Create a custom error for this
      throw new Error("Failed to insert workout");
    }

    const trackPointsToInsert = trackPoints.map((point, index) => ({
      workout_id: workout.id,
      location: `POINT(${point.longitude} ${point.latitude})`,
      elevation: point.elevation,
      timestamp: point.time ? new Date(point.time).toISOString() : null,
      sequence_number: index,
    }));

    const { error: trackPointsError } = await this.supabase.from("track_points").insert(trackPointsToInsert);

    if (trackPointsError) {
      // TODO: Create a custom error for this
      // We should also delete the workout we just created
      throw new Error("Failed to insert track points");
    }

    return workout;
  }
}
