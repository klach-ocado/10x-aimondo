import type { Coordinate, TrackPoint, WorkoutStats } from 'src/types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the Haversine distance between two geographic coordinates.
 * @param point1 - The first coordinate.
 * @param point2 - The second coordinate.
 * @returns The distance in meters.
 */
function calculateHaversineDistance(point1: Coordinate, point2: Coordinate): number {
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLon = (point2.lon - point1.lon) * (Math.PI / 180);
  const lat1Rad = point1.lat * (Math.PI / 180);
  const lat2Rad = point2.lat * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the total distance and duration for a given array of track points.
 * @param points - An array of TrackPoint objects.
 * @returns An object containing the total distance (in meters) and duration (in seconds or null).
 */
export function calculateStats(points: TrackPoint[]): WorkoutStats {
  // Handle edge cases: no points or a single point
  if (!points || points.length < 2) {
    return { distance: 0, duration: null };
  }

  const validPoints = points.filter(p => 
    p.lat != null && p.lon != null
  );

  if (validPoints.length < 2) {
    return { distance: 0, duration: null };
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < validPoints.length; i++) {
    totalDistance += calculateHaversineDistance(validPoints[i - 1], validPoints[i]);
  }

  // Calculate total duration
  const pointsWithTime = validPoints.filter(p => p.time instanceof Date);
  let totalDuration: number | null = null;
  if (pointsWithTime.length > 1) {
    // Ensure points are sorted by time just in case
    pointsWithTime.sort((a, b) => a.time!.getTime() - b.time!.getTime());
    const startTime = pointsWithTime[0].time!.getTime();
    const endTime = pointsWithTime[pointsWithTime.length - 1].time!.getTime();
    totalDuration = (endTime - startTime) / 1000; // in seconds
  }

  return {
    distance: totalDistance,
    duration: totalDuration,
  };
}
