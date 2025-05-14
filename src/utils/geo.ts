import { getDistance } from "geolib";

export function calcDistanceKm(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
): number {
  return getDistance(p1, p2) / 1000;
}
