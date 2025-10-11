import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(0)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(2)} km`;
}

export function formatDuration(durationInSeconds: number | null): string {
  if (durationInSeconds === null || isNaN(durationInSeconds) || durationInSeconds < 0) {
    return "00:00:00";
  }
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
