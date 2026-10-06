import { calcDistanceKm } from "./geo.ts";
import type { Coordinates } from "./location";
export const SHANGHAI_CENTER = { lat: 31.2241, lng: 121.4466 };
export const NEARBY_RADIUS_KM = 5;
export function isWithinShanghaiCoverage(coords: Coordinates): boolean {
  return calcDistanceKm(coords, SHANGHAI_CENTER) <= 50;
}
export function withDistances<T extends Coordinates>(
  venues: T[],
  coords?: Coordinates,
): (T & { distanceKm?: number })[] {
  if (!coords) return venues;
  return venues
    .map((venue) => ({ ...venue, distanceKm: calcDistanceKm(coords, venue) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
