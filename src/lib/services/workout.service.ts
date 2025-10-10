import type { CreateWorkoutCommand, WorkoutDto } from '../../types';
import type { SupabaseClient } from '../../db/supabase.client';
import { parseGPXWithCustomParser } from '@we-gold/gpxjs';
import { DOMParser } from 'xmldom-qsa';

export class WorkoutService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async createWorkout(command: CreateWorkoutCommand): Promise<WorkoutDto> {
    const customParseMethod = (txt: string): Document | null => {
      return new DOMParser().parseFromString(txt, "text/xml");
    };
    const [parsedGpx, error] = parseGPXWithCustomParser(command.gpxFileContent, customParseMethod);

    if (error) {
      // TODO: Create a custom error for this
      throw new Error('Failed to parse GPX file');
    }

    if (!parsedGpx || !parsedGpx.tracks || parsedGpx.tracks.length === 0) {
      // TODO: Create a custom error for this
      throw new Error('GPX file does not contain any tracks');
    }

    const trackPoints = parsedGpx.tracks.flatMap((track) => track.points);

    if (trackPoints.length === 0) {
      // TODO: Create a custom error for this
      throw new Error('GPX file does not contain any track points');
    }

    const workoutToInsert = {
      user_id: command.user_id,
      name: command.name,
      date: (trackPoints[0].time ? new Date(trackPoints[0].time) : new Date()).toISOString(),
      type: 'run', // Mock data
      distance: 10000, // Mock data
      duration: 3600, // Mock data
    };

    const { data: workout, error: workoutError } = await this.supabase
      .from('workouts')
      .insert(workoutToInsert)
      .select()
      .single();

    if (workoutError) {
      // TODO: Create a custom error for this
      throw new Error('Failed to insert workout');
    }

    const trackPointsToInsert = trackPoints.map((point, index) => ({
      workout_id: workout.id,
      location: `POINT(${point.longitude} ${point.latitude})`,
      elevation: point.elevation,
      timestamp: point.time ? new Date(point.time).toISOString() : null,
      sequence_number: index,
    }));

    const { error: trackPointsError } = await this.supabase.from('track_points').insert(trackPointsToInsert);

    if (trackPointsError) {
      // TODO: Create a custom error for this
      // We should also delete the workout we just created
      throw new Error('Failed to insert track points');
    }

    return workout;
  }
}
