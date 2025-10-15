import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutService } from "./workout.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateWorkoutCommand, UpdateWorkoutCommand } from "../../types";
import { parseGPXWithCustomParser } from "@we-gold/gpxjs";

vi.mock("@we-gold/gpxjs");
vi.mock("xmldom-qsa", () => ({
  DOMParser: vi.fn().mockImplementation(() => ({
    parseFromString: vi.fn().mockReturnValue(null),
  })),
}));

describe("WorkoutService", () => {
  let workoutService: WorkoutService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      rpc: vi.fn(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn(),
      single: vi.fn(),
      match: vi.fn(),
    };
    workoutService = new WorkoutService(mockSupabase as unknown as SupabaseClient);
    vi.clearAllMocks();
  });

  describe("getWorkouts", () => {
    it("should return paginated workouts", async () => {
      const mockWorkouts = [{ id: "1", name: "Test" }];
      mockSupabase.range.mockResolvedValueOnce({ data: mockWorkouts, error: null, count: 1 });

      const result = await workoutService.getWorkouts({
        userId: "user-1",
        page: 1,
        limit: 10,
        sortBy: "date",
        order: "desc",
      });

      expect(result.data).toEqual(mockWorkouts);
      expect(result.pagination.totalItems).toBe(1);
    });

    it("should throw an error if fetching fails", async () => {
      mockSupabase.range.mockResolvedValueOnce({ data: null, error: new Error("DB Error"), count: 0 });

      await expect(
        workoutService.getWorkouts({ userId: "user-1", page: 1, limit: 10, sortBy: "date", order: "desc" })
      ).rejects.toThrow("Failed to fetch workouts");
    });
  });

  describe("createWorkout", () => {
    it("should create a workout successfully", async () => {
      vi.mocked(parseGPXWithCustomParser).mockReturnValue([
        { tracks: [{ points: [{ latitude: 1, longitude: 1, time: new Date() }], type: "run" }] },
        null,
      ]);
      const newWorkout = { id: "new-id", name: "test" };
      mockSupabase.single.mockResolvedValueOnce({ data: newWorkout, error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const command: CreateWorkoutCommand = { gpxFileContent: "<xml>valid</xml>", name: "test", user_id: "user-1" };
      const result = await workoutService.createWorkout(command);

      expect(result).toEqual(newWorkout);
    });

    it("should throw error if track points fail to insert", async () => {
      vi.mocked(parseGPXWithCustomParser).mockReturnValue([
        { tracks: [{ points: [{ latitude: 1, longitude: 1, time: new Date() }] }] },
        null,
      ]);
      mockSupabase.single.mockResolvedValueOnce({ data: { id: "new-workout" }, error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: new Error("Insert failed") });

      const command: CreateWorkoutCommand = { gpxFileContent: "<xml>valid</xml>", name: "test", user_id: "user-1" };

      await expect(workoutService.createWorkout(command)).rejects.toThrow("Failed to insert track points");
    });
  });
});
