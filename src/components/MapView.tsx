"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import BottomSheet from "./BottomSheet";
import VenueDetail from "./VenueDetail";
import { useLocale } from "@/hooks/useLocale";
import { t, venueName } from "@/lib/i18n";
import { SHANGHAI_CENTER } from "@/utils/nearby";
import type { VenueFeature } from "@/lib/venue-features";
import type { Venue } from "@/types/venue";
import type { Coordinates } from "@/utils/location";
export default function MapView({
  venues,
  userCoords,
  nearby,
  catalog,
  onShowList,
}: {
  venues: Venue[];
  userCoords?: Coordinates;
  nearby: boolean;
  catalog?: VenueFeature[];
  onShowList: () => void;
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const camera = useRef<{ center: [number, number]; zoom: number } | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = venues.find((venue) => venue.id === selectedId);
  useEffect(() => {
    if (!container.current) return;
    let live = true;
    setReady(false);
    setFailed(false);
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: camera.current?.center || [
          SHANGHAI_CENTER.lng,
          SHANGHAI_CENTER.lat,
        ],
        zoom: camera.current?.zoom ?? 13,
        locale: {
          "Map.Title": t("action.map", locale),
          "NavigationControl.ZoomIn": t("map.zoomIn", locale),
          "NavigationControl.ZoomOut": t("map.zoomOut", locale),
          "AttributionControl.ToggleAttribution": t("map.attribution", locale),
        },
        renderWorldCopies: false,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    mapRef.current = map;
    map.dragRotate.disable();
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    const timeout = setTimeout(() => {
      if (live) setFailed(true);
    }, 15_000);
    map.on("error", () => {
      if (live) setFailed(true);
    });
    map.once("load", () => {
      clearTimeout(timeout);
      if (live) setReady(true);
    });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => map.resize());
    observer?.observe(container.current);
    return () => {
      live = false;
      clearTimeout(timeout);
      observer?.disconnect();
      const center = map.getCenter();
      camera.current = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
      };
      map.remove();
      mapRef.current = null;
    };
  }, [attempt, locale]);
  const lastFocus = useRef<string | undefined>(undefined);
  const lat = userCoords?.lat;
  const lng = userCoords?.lng;
  // Location can arrive after the style loads, or change after returning to the app.
  useEffect(() => {
    if (!ready) return;
    const focus = `${nearby}:${lat}:${lng}`;
    if (lastFocus.current === focus) return;
    lastFocus.current = focus;
    mapRef.current?.jumpTo({
      center:
        nearby && lat !== undefined && lng !== undefined
          ? [lng, lat]
          : [SHANGHAI_CENTER.lng, SHANGHAI_CENTER.lat],
      zoom: nearby ? 13 : 12,
    });
  }, [ready, nearby, lat, lng]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: Marker[] = [];
    if (lat !== undefined && lng !== undefined) {
      const marker = new Marker({ color: "#2563eb" })
        .setLngLat([lng, lat])
        .addTo(map);
      marker
        .getElement()
        .setAttribute("aria-label", t("map.currentLocation", locale));
      markers.push(marker);
    }
    for (const venue of venues) {
      const marker = new Marker({ color: "#ec4899" })
        .setLngLat([venue.lng, venue.lat])
        .addTo(map);
      const element = marker.getElement();
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", venueName(venue.name, locale));
      element.style.display = "flex";
      element.style.justifyContent = "center";
      element.style.alignItems = "flex-end";
      element.style.minWidth = "44px";
      element.style.minHeight = "44px";
      element.style.cursor = "pointer";
      element.onclick = (event) => {
        event.stopPropagation();
        setSelectedId(venue.id);
      };
      element.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setSelectedId(venue.id);
        }
      };
      markers.push(marker);
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [ready, venues, lat, lng, locale]);
  return (
    <>
      <div
        ref={container}
        className="absolute inset-0"
        aria-label={t("action.map", locale)}
      />
      {!ready && !failed && (
        <div
          className="absolute inset-0 grid place-items-center bg-pinkcream/90"
          role="status"
        >
          {t("map.loading", locale)}
        </div>
      )}
      {failed && (
        <div
          className="absolute inset-x-4 top-4 rounded-xl bg-white p-4 shadow-lg"
          role="alert"
        >
          <p className="text-sm text-gray-700">{t("map.error", locale)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="min-h-11 rounded-full bg-pinkcream px-4"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t("action.retry", locale)}
            </button>
            <button
              className="min-h-11 rounded-full bg-pinkcream px-4"
              onClick={onShowList}
            >
              {t("action.list", locale)}
            </button>
          </div>
        </div>
      )}
      <BottomSheet open={Boolean(selected)} onClose={() => setSelectedId(null)}>
        {selected && (
          <VenueDetail
            v={selected}
            catalog={catalog}
            onClose={() => setSelectedId(null)}
            distanceKm={selected.distanceKm}
          />
        )}
      </BottomSheet>
    </>
  );
}
