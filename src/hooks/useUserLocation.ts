import { useEffect, useState, useCallback, useRef } from "react";
import {
  getCurrentCoordinates,
  readCachedCoordinates,
  LocationFailure,
  LOCATION_MAX_AGE,
} from "@/utils/location";
import type { Coordinates, LocationStatus } from "@/utils/location";
export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<Coordinates>();
  const pending = useRef<AbortController | null>(null);
  const hasLocation = useRef(false);
  const request = useCallback(() => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setStatus("loading");
    void getCurrentCoordinates(navigator.geolocation, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        hasLocation.current = true;
        setCoords(next);
        setStatus("granted");
        try {
          sessionStorage.setItem(
            "userCoords",
            JSON.stringify({ ...next, timestamp: Date.now() }),
          );
        } catch {
          /* Storage may be disabled. Location still works. */
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        hasLocation.current = false;
        setCoords(undefined);
        setStatus(
          error instanceof LocationFailure ? error.status : "unavailable",
        );
        try {
          sessionStorage.removeItem("userCoords");
        } catch {
          /* Optional cache. */
        }
      })
      .finally(() => {
        if (pending.current === controller) pending.current = null;
      });
  }, []);
  useEffect(() => {
    try {
      const cached = readCachedCoordinates(
        sessionStorage.getItem("userCoords"),
      );
      if (cached) {
        setCoords(cached);
        hasLocation.current = true;
      }
    } catch {
      /* Optional cache. */
    }
    request();
    const refresh = () => {
      if (!document.hidden && hasLocation.current) request();
    };
    const timer = setInterval(refresh, LOCATION_MAX_AGE);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      pending.current?.abort();
      pending.current = null;
    };
  }, [request]);
  return { status, coords, request };
}
