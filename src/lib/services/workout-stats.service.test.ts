import { describe, it, expect } from "vitest";
import { calculateStats } from "./workout-stats.service";
import type { TrackPoint } from "src/types";

describe("calculateStats", () => {
  it("should return 0 distance and null duration for no points", () => {
    expect(calculateStats([])).toEqual({ distance: 0, duration: null });
  });

  it("should return 0 distance and null duration for a single point", () => {
    const points: TrackPoint[] = [{ lat: 50, lon: 10, time: new Date() }];
    expect(calculateStats(points)).toEqual({ distance: 0, duration: null });
  });

  it("should return 0 distance and null duration for points with missing lat/lon", () => {
    const points: TrackPoint[] = [
      { lat: 50, lon: 10, time: new Date() },
      // @ts-expect-error testing invalid data
      { lat: null, lon: null, time: new Date() },
    ];
    expect(calculateStats(points)).toEqual({ distance: 0, duration: null });
  });

  it("should calculate distance correctly for two points", () => {
    const points: TrackPoint[] = [
      { lat: 52.52, lon: 13.405, time: new Date("2025-10-15T10:00:00Z") }, // Berlin
      { lat: 48.8566, lon: 2.3522, time: new Date("2025-10-15T11:00:00Z") }, // Paris
    ];
    const stats = calculateStats(points);
    // Distance between Berlin and Paris is approx 878km
    expect(stats.distance).toBeGreaterThan(870000);
    expect(stats.distance).toBeLessThan(890000);
  });

  it("should calculate duration correctly", () => {
    const points: TrackPoint[] = [
      { lat: 52.52, lon: 13.405, time: new Date("2025-10-15T10:00:00Z") },
      { lat: 48.8566, lon: 2.3522, time: new Date("2025-10-15T11:00:00Z") },
    ];
    const stats = calculateStats(points);
    expect(stats.duration).toBe(3600); // 1 hour in seconds
  });

  it("should return null duration if time is missing", () => {
    const points: TrackPoint[] = [
      { lat: 52.52, lon: 13.405 },
      { lat: 48.8566, lon: 2.3522 },
    ];
    const stats = calculateStats(points);
    expect(stats.duration).toBeNull();
  });

  it("should handle a mix of points with and without time", () => {
    const points: TrackPoint[] = [
      { lat: 52.52, lon: 13.405, time: new Date("2025-10-15T10:00:00Z") },
      { lat: 52.2297, lon: 21.0122 }, // Warsaw, no time
      { lat: 48.8566, lon: 2.3522, time: new Date("2025-10-15T12:00:00Z") },
    ];
    const stats = calculateStats(points);
    // Distance should be calculated for all valid points
    expect(stats.distance).toBeGreaterThan(1300000); // Berlin -> Warsaw -> Paris
    // Duration should be calculated based on points with time
    expect(stats.duration).toBe(7200); // 2 hours
  });

  it("should handle unsorted points by time", () => {
    const points: TrackPoint[] = [
      { lat: 48.8566, lon: 2.3522, time: new Date("2025-10-15T12:00:00Z") }, // Paris
      { lat: 52.52, lon: 13.405, time: new Date("2025-10-15T10:00:00Z") }, // Berlin
    ];
    const stats = calculateStats(points);
    expect(stats.duration).toBe(7200);
  });
});
