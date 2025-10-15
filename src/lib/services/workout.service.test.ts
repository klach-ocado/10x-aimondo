import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutService } from "./workout.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateWorkoutCommand } from "../../types";
import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import * as workoutStatsService from "./workout-stats.service";

vi.mock("@we-gold/gpxjs");
vi.mock("xmldom-qsa", () => ({
  DOMParser: vi.fn().mockImplementation(() => ({
    parseFromString: vi.fn().mockReturnValue(null),
  })),
}));

describe("WorkoutService", () => {
  let workoutService: WorkoutService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    // We still need a mock Supabase client, but we won't use it.
    mockSupabase = {
      from: () => mockSupabase,
      select: () => mockSupabase,
      insert: () => mockSupabase,
      single: vi.fn().mockResolvedValue({ error: { message: "DB not mocked" } }),
    };
    workoutService = new WorkoutService(mockSupabase as unknown as SupabaseClient);
    vi.clearAllMocks();
  });

  describe("createWorkout logic (pre-database)", () => {
    it("should throw an error if GPX parsing fails", async () => {
      vi.mocked(parseGPXWithCustomParser).mockReturnValue([null, { message: "Invalid GPX" }]);
      const command: CreateWorkoutCommand = { gpxFileContent: "invalid-gpx", name: "test", user_id: "user-1" };

      await expect(workoutService.createWorkout(command)).rejects.toThrow("Failed to parse GPX file");
    });

    it("should throw an error if the GPX file has no tracks", async () => {
      vi.mocked(parseGPXWithCustomParser).mockReturnValue([{ tracks: [] }, null]);
      const command: CreateWorkoutCommand = { gpxFileContent: "<gpx></gpx>", name: "test", user_id: "user-1" };

      await expect(workoutService.createWorkout(command)).rejects.toThrow("GPX file does not contain any tracks");
    });

    it("should throw an error if the tracks contain no points", async () => {
      vi.mocked(parseGPXWithCustomParser).mockReturnValue([{ tracks: [{ points: [] }] }, null]);
      const command: CreateWorkoutCommand = { gpxFileContent: "<gpx></gpx>", name: "test", user_id: "user-1" };

      await expect(workoutService.createWorkout(command)).rejects.toThrow("GPX file does not contain any track points");
    });

    it("should call calculateStats with the correct track points", async () => {
      const trackPoints = [
        { latitude: 1, longitude: 1, time: new Date("2025-01-01T12:00:00Z") },
        { latitude: 2, longitude: 2, time: new Date("2025-01-01T12:01:00Z") },
      ];
      vi.mocked(parseGPXWithCustomParser).mockReturnValue([{ tracks: [{ points: trackPoints }] }, null]);
      const calculateStatsSpy = vi
        .spyOn(workoutStatsService, "calculateStats")
        .mockReturnValue({ distance: 100, duration: 60 });

      const command: CreateWorkoutCommand = { gpxFileContent: "valid-gpx", name: "test", user_id: "user-1" };

      // We expect this to fail at the database step, which is fine.
      await expect(workoutService.createWorkout(command)).rejects.toThrow();

      // The important part is to verify the call before the DB interaction.
      expect(calculateStatsSpy).toHaveBeenCalledWith([
        { lat: 1, lon: 1, time: new Date("2025-01-01T12:00:00Z") },
        { lat: 2, lon: 2, time: new Date("2025-01-01T12:01:00Z") },
      ]);
    });
  });
});
