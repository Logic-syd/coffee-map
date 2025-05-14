import { useEffect, useState, useCallback } from "react";

type Status = "idle" | "loading" | "granted" | "denied";

export function useUserLocation(): {
  status: Status;
  coords?: { lat: number; lng: number };
  request: () => void;
} {
  const [status, setStatus] = useState<Status>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>();

  useEffect(() => {
    const cached = sessionStorage.getItem("userCoords");
    if (cached) {
      try {
        const { lat, lng } = JSON.parse(cached);
        setCoords({ lat, lng });
        setStatus("granted");
      } catch {}
    }
  }, []);

  const request = useCallback(() => {
    if (status === "granted" || status === "loading") return;
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setStatus("granted");
        sessionStorage.setItem("userCoords", JSON.stringify({ lat, lng }));
      },
      () => {
        setStatus("denied");
      },
    );
  }, [status]);

  return { status, coords, request };
}
