"use client";
import dynamic from "next/dynamic";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMemo } from "react";
import { Marker, Source, Layer } from "react-map-gl/maplibre";
import { calcDistanceKm } from "@/utils/geo";

// 用到的是 react-map-gl 的 "maplibre 子路径"
const Map = dynamic(
  () => import("react-map-gl/maplibre").then((m) => m.default),
  {
    ssr: false,
  },
);

function getCircleGeoJSON(
  center: { lng: number; lat: number },
  radiusKm: number,
  points = 64,
) {
  const coords = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    // 地球半径约6371km
    const dx = (radiusKm * Math.cos(angle)) / 111.32;
    const dy = (radiusKm * Math.sin(angle)) / 110.57;
    coords.push([center.lng + dx, center.lat + dy]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

export default function MapView({
  venues,
  userCoords,
}: {
  venues: { id: string; lat: number; lng: number; name_zh?: string }[];
  userCoords?: { lat: number; lng: number };
}) {
  const hasUser = !!userCoords;
  const filteredVenues = useMemo(() => {
    if (!userCoords) return venues;
    return venues.filter(
      (v) => calcDistanceKm(userCoords, { lat: v.lat, lng: v.lng }) <= 10,
    );
  }, [venues, userCoords]);

  const circleGeo = useMemo(
    () =>
      userCoords
        ? getCircleGeoJSON({ lng: userCoords.lng, lat: userCoords.lat }, 10)
        : null,
    [userCoords],
  );

  return (
    <div className="fixed inset-0 z-10">
      <Map
        mapLib={import("maplibre-gl")} // ← 告诉它走 MapLibre
        initialViewState={{
          longitude: userCoords?.lng ?? 121.47,
          latitude: userCoords?.lat ?? 31.23,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        // ↑ 这是 Carto 公开免费瓦片，也可以换成
        //    Stadia / MapTiler / 你自己的 mbtiles URL
      >
        {/* 用户marker和10km圆 */}
        {userCoords && (
          <>
            <Marker
              longitude={userCoords.lng}
              latitude={userCoords.lat}
              color="#2563eb"
            />
            {circleGeo && (
              <Source id="user-radius" type="geojson" data={circleGeo}>
                <Layer
                  id="radius-fill"
                  type="fill"
                  paint={{ "fill-color": "#2563eb", "fill-opacity": 0.1 }}
                />
                <Layer
                  id="radius-outline"
                  type="line"
                  paint={{
                    "line-color": "#2563eb",
                    "line-width": 2,
                    "line-opacity": 0.5,
                  }}
                />
              </Source>
            )}
          </>
        )}
        {/* 店铺marker */}
        {filteredVenues.map((v) => (
          <Marker key={v.id} longitude={v.lng} latitude={v.lat} color="#111" />
        ))}
      </Map>
    </div>
  );
}
