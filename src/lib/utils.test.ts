import { describe, it, expect } from "vitest";
import { cn, formatDistance, formatDuration } from "./utils";

describe("cn", () => {
  it("should merge tailwind classes correctly", () => {
    expect(cn("p-4", "font-bold", "p-2")).toBe("font-bold p-2");
  });

  it("should handle conditional classes", () => {
    expect(cn("p-4", { "font-bold": true, "text-red-500": false })).toBe("p-4 font-bold");
  });
});

describe("formatDistance", () => {
  it("should format distance in meters", () => {
    expect(formatDistance(500)).toBe("500 m");
  });

  it("should format distance in kilometers with two decimal places", () => {
    expect(formatDistance(1555)).toBe("1.55 km");
  });

  it("should handle zero distance", () => {
    expect(formatDistance(0)).toBe("0 m");
  });
});

describe("formatDuration", () => {
  it("should format duration into HH:MM:SS", () => {
    expect(formatDuration(3661)).toBe("01:01:01");
  });

  it("should return 00:00:00 for null or invalid input", () => {
    expect(formatDuration(null)).toBe("00:00:00");
    expect(formatDuration(NaN)).toBe("00:00:00");
    expect(formatDuration(-100)).toBe("00:00:00");
  });

  it("should pad numbers correctly", () => {
    expect(formatDuration(1)).toBe("00:00:01");
    expect(formatDuration(60)).toBe("00:01:00");
    expect(formatDuration(3600)).toBe("01:00:00");
  });
});
