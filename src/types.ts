import type { Tables } from './db/database.types';

/**
 * Represents the core Workout entity from the database, aliased as WorkoutDto.
 * This is the main data transfer object for a single workout.
 */
export type WorkoutDto = Tables<'workouts'>;

/**
 * Represents the core TrackPoint entity from the database.
 * The 'location' property is of type 'unknown' and needs to be handled separately
 * when mapping to a DTO.
 */
export type TrackPoint = Tables<'track_points'>;

/**
 * DTO for a single track point as returned by the API.
 * 'ele' is an alias for elevation, and 'time' for timestamp.
 * 'lat' and 'lng' are extracted from the PostGIS 'location' column in the backend.
 */
export type TrackPointDto = {
  lat: number;
  lng: number;
  ele: number | null;
  time: string | null;
};

/**
 * DTO for a workout item in a paginated list.
 * It's a subset of the full WorkoutDto, containing only the fields
 * necessary for list display.
 */
export type WorkoutListItemDto = Pick<
  WorkoutDto,
  'id' | 'name' | 'date' | 'type' | 'distance' | 'duration'
>;

/**
 * DTO for the full details of a single workout, including its track points.
 * It combines the list item DTO with an array of track point DTOs.
 */
export type WorkoutDetailsDto = WorkoutListItemDto & {
  track_points: TrackPointDto[];
};

/**
 * Represents the pagination metadata included in paginated API responses.
 */
export type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

/**
 * DTO for a paginated response of workouts.
 */
export type PaginatedWorkoutsDto = {
  pagination: Pagination;
  data: WorkoutListItemDto[];
};

/**
 * Command model for creating a new workout.
 * This represents the data passed to the service layer after initial parsing
 * and validation of the incoming request. The 'gpxFileContent' is the raw
 * string content of the uploaded GPX file.
 */
export type CreateWorkoutCommand = Pick<WorkoutDto, 'name' | 'user_id'> & {
  gpxFileContent: string;
};

/**
 * Command model for updating an existing workout.
 * All fields are optional, allowing for partial updates.
 */
export type UpdateWorkoutCommand = Partial<Pick<WorkoutDto, 'name' | 'date' | 'type'>>;

/**
 * Represents a single point for the heatmap visualization.
 * The format is a tuple of [latitude, longitude].
 */
export type HeatmapPoint = [number, number];

/**
 * DTO for the heatmap data response.
 */
export type HeatmapDto = {
  points: HeatmapPoint[];
};
