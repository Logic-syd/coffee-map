export type Coordinates = { lat: number; lng: number };
export type LocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "timeout"
  | "unavailable";
export const LOCATION_MAX_AGE = 5 * 60_000;
export const LOCATION_TIMEOUT = 10_000;
export function isCoordinates(value: unknown): value is Coordinates {
  if (
    !value ||
    typeof value !== "object" ||
    !("lat" in value) ||
    !("lng" in value)
  )
    return false;
  return (
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lng) <= 180
  );
}
export function readCachedCoordinates(
  raw: string | null,
  now = Date.now(),
): Coordinates | undefined {
  try {
    const value = JSON.parse(raw || "null");
    if (
      !isCoordinates(value) ||
      !("timestamp" in value) ||
      typeof value.timestamp !== "number"
    )
      return;
    const age = now - value.timestamp;
    if (age < 0 || age > LOCATION_MAX_AGE) return;
    return { lat: value.lat, lng: value.lng };
  } catch {
    return;
  }
}
export class LocationFailure extends Error {
  status: "denied" | "timeout" | "unavailable";
  constructor(status: LocationFailure["status"]) {
    super(status);
    this.status = status;
  }
}
// The extra timer also bounds platforms that never invoke either callback.
export function getCurrentCoordinates(
  geolocation: Pick<Geolocation, "getCurrentPosition"> | undefined,
  signal?: AbortSignal,
): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!geolocation || signal?.aborted) {
      reject(new LocationFailure("unavailable"));
      return;
    }
    let settled = false;
    const finish = (value: Coordinates | LocationFailure) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      if (value instanceof LocationFailure) reject(value);
      else resolve(value);
    };
    const abort = () => finish(new LocationFailure("unavailable"));
    const timer = setTimeout(
      () => finish(new LocationFailure("timeout")),
      LOCATION_TIMEOUT,
    );
    signal?.addEventListener("abort", abort, { once: true });
    try {
      geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          finish(
            isCoordinates(coords) ? coords : new LocationFailure("unavailable"),
          );
        },
        (error) =>
          finish(
            new LocationFailure(
              error.code === 1
                ? "denied"
                : error.code === 3
                  ? "timeout"
                  : "unavailable",
            ),
          ),
        {
          timeout: LOCATION_TIMEOUT,
          maximumAge: 60_000,
          enableHighAccuracy: false,
        },
      );
    } catch {
      finish(new LocationFailure("unavailable"));
    }
  });
}
