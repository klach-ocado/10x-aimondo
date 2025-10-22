import type {
  CreateWorkoutCommand,
  GetHeatmapDataCommand,
  GetWorkoutDetailsCommand,
  GetWorkoutsCommand,
  HeatmapDto,
  HeatmapPoint,
  LoadEndomondoDataCommand,
  PaginatedWorkoutsDto,
  UpdateWorkoutCommand,
  WorkoutDetailsDto,
  WorkoutDto,
} from "../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import { DOMParser } from "linkedom";
import { calculateStats } from "./workout-stats.service";

export class WorkoutService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getWorkoutDetails(command: GetWorkoutDetailsCommand): Promise<WorkoutDetailsDto | null> {
    const { workoutId, userId } = command;

    const { data, error } = await this.supabase.rpc("get_workout_details", {
      p_workout_id: workoutId,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching workout details via RPC:", error);
      return null;
    }

    return data as WorkoutDetailsDto | null;
  }

  async getHeatmapData(command: GetHeatmapDataCommand): Promise<HeatmapDto> {
    const { data, error } = await this.supabase.rpc("get_heatmap_points", {
      p_user_id: command.userId,
      min_lng: command.minLng,
      min_lat: command.minLat,
      max_lng: command.maxLng,
      max_lat: command.maxLat,
      p_name: command.name,
      p_date_from: command.dateFrom,
      p_date_to: command.dateTo,
      p_type: command.type,
      p_limit: 10000, // Hardcoded limit as requested
    });

    if (error) {
      console.error("Error fetching heatmap data:", error);
      throw new Error("Failed to fetch heatmap data from the database.");
    }

    const points = data ? data.map((p: { lat: number; lng: number }): HeatmapPoint => [p.lat, p.lng]) : [];

    return { points };
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

  async updateWorkout(id: string, userId: string, command: UpdateWorkoutCommand): Promise<WorkoutDto | null> {
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

  async deleteWorkout(id: string, userId: string): Promise<{ error: Error | null; notFound: boolean }> {
    const { error, count } = await this.supabase.from("workouts").delete().match({ id: id, user_id: userId });

    if (error) {
      console.error("Error deleting workout:", error);
      return { error: new Error("Failed to delete workout"), notFound: false };
    }

    if (count === 0) {
      return { error: null, notFound: true };
    }

    return { error: null, notFound: false };
  }

  async createWorkout(command: CreateWorkoutCommand): Promise<WorkoutDto> {
    const customParseMethod = (txt: string): Document | null => {
      // @ts-expect-error we need only subset of XML features
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

    const stats = calculateStats(
      trackPoints.map((p) => ({
        lat: p.latitude,
        lon: p.longitude,
        time: p.time ? new Date(p.time) : undefined,
      }))
    );

    const workoutToInsert = {
      user_id: command.user_id,
      name: command.name,
      date: (trackPoints[0].time ? new Date(trackPoints[0].time) : new Date()).toISOString(),
      type: parsedGpx.tracks[0].type || "other",
      distance: Math.round(stats.distance),
      duration: stats.duration ? Math.round(stats.duration) : null,
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

  async loadEndomondoData(command: LoadEndomondoDataCommand): Promise<WorkoutDto> {
    const endomondoData = JSON.parse(command.jsonContent).reduce((acc: any, item: any) => {
      const key = Object.keys(item)[0];
      acc[key] = item[key];
      return acc;
    }, {});

    const workoutToInsert = {
      user_id: command.user_id,
      name: command.fileName.replace(".json", ""),
      date: new Date(endomondoData.start_time).toISOString(),
      type: endomondoData.sport,
      distance: Math.round(endomondoData.distance_km * 1000),
      duration: endomondoData.duration_s ? Math.round(endomondoData.duration_s) : null,
    };

    const { data: workout, error: workoutError } = await this.supabase
      .from("workouts")
      .insert(workoutToInsert)
      .select()
      .single();

    if (workoutError) {
      throw new Error("Failed to insert workout");
    }

    const trackPointsToInsert = endomondoData.points.map((pointData: any[], index: number) => {
      const pointDetails: any = {};
      pointData.forEach((detail) => {
        const key = Object.keys(detail)[0];
        pointDetails[key] = detail[key];
      });

      const lat = pointDetails.location[0][0].latitude;
      const lon = pointDetails.location[0][1].longitude;

      return {
        workout_id: workout.id,
        location: `POINT(${lon} ${lat})`,
        elevation: pointDetails.altitude || null,
        timestamp: new Date(pointDetails.timestamp).toISOString(),
        sequence_number: index,
      };
    });

    const { error: trackPointsError } = await this.supabase.from("track_points").insert(trackPointsToInsert);

    if (trackPointsError) {
      // We should also delete the workout we just created
      await this.supabase.from("workouts").delete().match({ id: workout.id });
      throw new Error("Failed to insert track points");
    }

    return workout;
  }
}
