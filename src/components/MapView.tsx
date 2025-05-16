"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Venue {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

interface MapViewProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: { lng: number; lat: number; color?: string }[];
  venues?: Venue[];
  userCoords?: { lat: number; lng: number };
  className?: string;
}

// 静安寺坐标常量 - 上海静安寺精确坐标
const JING_AN_TEMPLE: [number, number] = [121.4466, 31.2241];

// 避免多次调用RTL插件
let rtlPluginLoaded = false;

export default function MapView({
  center,
  zoom = 14,
  markers = [],
  venues = [],
  userCoords,
  className = "",
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);

  // 确定最终使用的中心点 - 避免在 useEffect 中重新计算
  const effectiveCenter =
    center ||
    (userCoords
      ? [userCoords.lng, userCoords.lat]
      : venues.length > 0
        ? [venues[0].lng, venues[0].lat]
        : JING_AN_TEMPLE);

  // 初始化地图 - 确保只执行一次
  useEffect(() => {
    // 如果地图已存在或容器不存在，跳过
    if (mapRef.current || !mapContainer.current) return;

    console.log("Initializing map with fixed center:", effectiveCenter);

    // 避免多次调用RTL插件
    if (!rtlPluginLoaded) {
      try {
        maplibregl.setRTLTextPlugin("", true);
        rtlPluginLoaded = true;
      } catch {
        console.warn("RTL plugin already loaded or failed to load");
      }
    }

    // 创建地图实例 - 直接使用固定中心点，禁用过渡动画
    let map: maplibregl.Map;

    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: effectiveCenter as [number, number],
        zoom,
        attributionControl: false,
        renderWorldCopies: false, // 减少不必要的渲染
        interactive: true,
        fadeDuration: 0, // 禁用淡入淡出效果
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
      return;
    }

    // 禁用任何过渡动画
    map.dragRotate.disable(); // 禁用旋转以简化体验

    // 直接强制设置中心，不使用动画
    map.once("style.load", () => {
      try {
        map.setCenter(effectiveCenter as [number, number], { animate: false });
        // 保存地图引用并标记为已初始化
        mapRef.current = map;
        setMapInitialized(true);
      } catch (e) {
        console.error("Error during map initialization:", e);
      }
    });

    // 添加最基本的导航控件
    try {
      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,
        }),
        "bottom-right",
      );
    } catch (e) {
      console.warn("Could not add navigation control:", e);
    }

    // 清理函数
    return () => {
      try {
        // 清除所有标记
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        map.remove();
      } catch (e) {
        console.warn("Error during map cleanup:", e);
      }
      mapRef.current = null;
      setMapInitialized(false);
    };
  }, []); // 空依赖数组，确保只初始化一次

  // 单独的效果处理标记更新，使用防抖处理标记更新
  useEffect(() => {
    const map = mapRef.current;
    if (!mapInitialized || !map) return;

    // 使用延迟执行来避免频繁更新
    const updateMarkersTimeout = setTimeout(() => {
      try {
        // 清除所有现有标记
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // 添加用户位置标记
        if (userCoords) {
          const marker = new Marker({
            color: "#2563eb",
            scale: 0.8,
          })
            .setLngLat([userCoords.lng, userCoords.lat])
            .addTo(map);
          markersRef.current.push(marker);
        }

        // 添加场馆标记
        venues.forEach((v) => {
          const marker = new Marker({
            color: "#FFD1DC",
            scale: 0.8,
          })
            .setLngLat([v.lng, v.lat])
            .addTo(map);
          markersRef.current.push(marker);
        });

        // 添加自定义标记
        markers.forEach((m) => {
          const marker = new Marker({
            color: m.color || "#FFD1DC",
            scale: 0.8,
          })
            .setLngLat([m.lng, m.lat])
            .addTo(map);
          markersRef.current.push(marker);
        });

        // 如果有标记且没有指定中心点，适应视图包含所有标记
        if (
          (venues.length > 0 || markers.length > 0 || userCoords) &&
          !center
        ) {
          const bounds = new maplibregl.LngLatBounds();

          // 添加所有点到边界
          venues.forEach((v) => bounds.extend([v.lng, v.lat]));
          markers.forEach((m) => bounds.extend([m.lng, m.lat]));
          if (userCoords) bounds.extend([userCoords.lng, userCoords.lat]);

          // 如果有多个点，适应视图包含所有点，但不使用动画
          if (!bounds.isEmpty() && bounds.getNorth() !== bounds.getSouth()) {
            map.fitBounds(bounds, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 14,
              animate: false,
            });
          }
        } else if (center) {
          // 如果指定了中心点，则使用它
          map.setCenter(center);
        }
      } catch (e) {
        console.error("Error updating markers:", e);
      }
    }, 200); // 200ms延迟，避免频繁更新

    return () => {
      clearTimeout(updateMarkersTimeout);
    };
  }, [mapInitialized, center, markers, userCoords, venues, zoom]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full ${className}`}
      style={{ minHeight: 320 }}
    />
  );
}
