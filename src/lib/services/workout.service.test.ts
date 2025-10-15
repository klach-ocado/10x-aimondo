
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutService } from "./workout.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateWorkoutCommand, UpdateWorkoutCommand } from "../../types";

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  ilike: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  single: vi.fn(),
  match: vi.fn(),
} as unknown as SupabaseClient;

// Mock external dependencies
vi.mock("@we-gold/gpxjs", () => ({
  parseGPXWithCustomParser: vi.fn(),
}));

vi.mock("xmldom-qsa", () => ({
  DOMParser: vi.fn().mockImplementation(() => ({
    parseFromString: vi.fn().mockReturnValue(null), // Default mock
  })),
}));

describe("WorkoutService", () => {
  let workoutService: WorkoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    workoutService = new WorkoutService(mockSupabase);
  });

  describe("getWorkoutDetails", () => {
    it("should return workout details on success", async () => {
      const mockDetails = { id: "1", name: "Morning Run" };
      vi.spyOn(mockSupabase, "rpc").mockResolvedValueOnce({ data: mockDetails, error: null });

      const result = await workoutService.getWorkoutDetails({ workoutId: "1", userId: "user-1" });

      expect(result).toEqual(mockDetails);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_workout_details", {
        p_workout_id: "1",
        p_user_id: "user-1",
      });
    });

    it("should return null on error", async () => {
      vi.spyOn(mockSupabase, "rpc").mockResolvedValueOnce({ data: null, error: new Error("DB error") });

      const result = await workoutService.getWorkoutDetails({ workoutId: "1", userId: "user-1" });

      expect(result).toBeNull();
    });
  });

  describe("getWorkouts", () => {
    it("should return paginated workouts", async () => {
      const mockWorkouts = [{ id: "1", name: "Test" }];
      const mockResponse = { data: mockWorkouts, error: null, count: 1 };
      (mockSupabase.from("workouts").select as vi.Mock).mockReturnValue(mockResponse);

      const result = await workoutService.getWorkouts({ userId: "user-1", page: 1, limit: 10, sortBy: "date", order: "desc" });

      expect(result.data).toEqual(mockWorkouts);
      expect(result.pagination.totalItems).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith("workouts");
    });

    it("should throw an error if fetching fails", async () => {
        const mockResponse = { data: null, error: new Error("DB Error"), count: 0 };
        (mockSupabase.from("workouts").select as vi.Mock).mockReturnValue(mockResponse);

        await expect(workoutService.getWorkouts({ userId: "user-1", page: 1, limit: 10, sortBy: "date", order: "desc" })).rejects.toThrow("Failed to fetch workouts");
      });
  });

  describe("updateWorkout", () => {
    it("should update and return the workout", async () => {
      const command: UpdateWorkoutCommand = { name: "Updated Name" };
      const updatedWorkout = { id: "1", name: "Updated Name" };
      vi.spyOn(mockSupabase, "single").mockResolvedValueOnce({ data: updatedWorkout, error: null });

      const result = await workoutService.updateWorkout("1", "user-1", command);

      expect(result).toEqual(updatedWorkout);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining(command));
    });

    it("should return null on update error", async () => {
        vi.spyOn(mockSupabase, "single").mockResolvedValueOnce({ data: null, error: new Error("DB error") });

        const result = await workoutService.updateWorkout("1", "user-1", { name: "new name" });
  
        expect(result).toBeNull();
      });
  });

  describe("deleteWorkout", () => {
    it("should return no error on successful deletion", async () => {
        vi.spyOn(mockSupabase, "match").mockResolvedValueOnce({ error: null, count: 1 });

      const result = await workoutService.deleteWorkout("1", "user-1");

      expect(result.error).toBeNull();
      expect(result.notFound).toBe(false);
    });

    it("should return notFound if workout does not exist", async () => {
        vi.spyOn(mockSupabase, "match").mockResolvedValueOnce({ error: null, count: 0 });

      const result = await workoutService.deleteWorkout("1", "user-1");

      expect(result.error).toBeNull();
      expect(result.notFound).toBe(true);
    });

    it("should return an error on failure", async () => {
        vi.spyOn(mockSupabase, "match").mockResolvedValueOnce({ error: new Error("DB error"), count: 0 });

        const result = await workoutService.deleteWorkout("1", "user-1");
  
        expect(result.error).toBeInstanceOf(Error);
        expect(result.notFound).toBe(false);
      });
  });

  describe("createWorkout", () => {
    it("should throw error for invalid GPX file", async () => {
      const { parseGPXWithCustomParser } = await import("@we-gold/gpxjs");
      (parseGPXWithCustomParser as vi.Mock).mockReturnValue([null, { message: "Invalid GPX" }]);

      const command: CreateWorkoutCommand = { gpxFileContent: "<xml>invalid</xml>", name: "test", user_id: "user-1" };

      await expect(workoutService.createWorkout(command)).rejects.toThrow("Failed to parse GPX file");
    });

    it("should throw error if GPX has no tracks", async () => {
        const { parseGPXWithCustomParser } = await import("@we-gold/gpxjs");
        (parseGPXWithCustomParser as vi.Mock).mockReturnValue([ { tracks: [] }, null ]);
  
        const command: CreateWorkoutCommand = { gpxFileContent: "<xml></xml>", name: "test", user_id: "user-1" };
  
        await expect(workoutService.createWorkout(command)).rejects.toThrow("GPX file does not contain any tracks");
      });

      it("should throw error if track points fail to insert", async () => {
        const { parseGPXWithCustomParser } = await import("@we-gold/gpxjs");
        (parseGPXWithCustomParser as vi.Mock).mockReturnValue([
          { tracks: [{ points: [{ latitude: 1, longitude: 1, time: new Date() }] }] },
          null,
        ]);
        vi.spyOn(mockSupabase, "single").mockResolvedValueOnce({ data: { id: 'new-workout' }, error: null });
        vi.spyOn(mockSupabase, "insert").mockResolvedValueOnce({ error: new Error("Insert failed") }); // track_points insert fails
      
        const command: CreateWorkoutCommand = { gpxFileContent: "<xml>valid</xml>", name: "test", user_id: "user-1" };
      
        await expect(workoutService.createWorkout(command)).rejects.toThrow("Failed to insert track points");
      });
  });
});
