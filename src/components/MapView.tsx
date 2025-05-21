"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import BottomSheet from "./BottomSheet";
import BottomDrawer from "./BottomDrawer";
import VenueDetail from "./VenueDetail";
import { motion } from "framer-motion";

interface Venue {
  id: string;
  lat: number;
  lng: number;
  name: { zh?: string; en?: string; ja?: string; ko?: string };
  address: string;
  image_url?: string;
  [key: string]: unknown;
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

// 判断是否在中国大陆的简易边界框
function isInMainlandChina(lat: number, lng: number) {
  return lng >= 73.5 && lng <= 135.1 && lat >= 18 && lat <= 53.6;
}

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
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVenueDetail, setShowVenueDetail] = useState<
    "false" | "pending" | "true"
  >("false");
  const [showDrawer, setShowDrawer] = useState(false);
  const [hasAutoFitted, setHasAutoFitted] = useState(false);
  // 获取系统语言（与VenueDetail一致）
  const [lang, setLang] = useState("zh");
  const showJa = lang.startsWith("ja");
  const showKo = lang.startsWith("ko");
  const [navOpen, setNavOpen] = useState(false);

  // 确定最终使用的中心点和缩放级别
  const userInChina =
    userCoords && isInMainlandChina(userCoords.lat, userCoords.lng);
  const effectiveCenter =
    center ||
    (userInChina ? [userCoords!.lng, userCoords!.lat] : JING_AN_TEMPLE);
  const defaultZoom = userInChina ? zoom : 15;

  // 初始化地图 - 确保只执行一次
  useEffect(() => {
    // 如果地图已存在或容器不存在，跳过
    if (mapRef.current || !mapContainer.current) return;

    console.log("Initializing map with fixed center:", effectiveCenter);

    // 避免多次调用RTL插件
    if (!rtlPluginLoaded && maplibregl.setRTLTextPlugin) {
      try {
        maplibregl.setRTLTextPlugin("", true);
      } catch {
        // 防止多次调用报错
      }
      rtlPluginLoaded = true;
    }

    // 创建地图实例 - 直接使用固定中心点，禁用过渡动画
    let map: maplibregl.Map;

    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: effectiveCenter as [number, number],
        zoom: defaultZoom,
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
        if (!userInChina) {
          // 创建静安寺周围2公里范围的边界
          const bounds = new maplibregl.LngLatBounds();
          const radius = 0.018; // 约2公里的经纬度变化量
          bounds.extend([
            JING_AN_TEMPLE[0] - radius,
            JING_AN_TEMPLE[1] - radius,
          ]);
          bounds.extend([
            JING_AN_TEMPLE[0] + radius,
            JING_AN_TEMPLE[1] + radius,
          ]);

          map.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            animate: false,
          });
        } else {
          // 有中国大陆定位时，直接设置中心点
          map.setCenter(effectiveCenter as [number, number], {
            animate: false,
          });
        }

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

  // 只在标记点击时手动控制小抽屉的显示，不使用自动effect

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

        // 添加场馆标记（创建时直接绑定点击事件）
        venues.forEach((v) => {
          const marker = new Marker({
            color: "#FFD1DC",
            scale: 0.8,
          })
            .setLngLat([v.lng, v.lat])
            .addTo(map);
          marker.getElement().onclick = (e: MouseEvent) => {
            e.stopPropagation();
            setSelectedVenue(v);
            setShowVenueDetail("false");
            setShowDrawer(true);
          };
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

        // 只在首次加载时自动 fitBounds/setCenter，后续不再自动调整
        if (!hasAutoFitted) {
          if (
            userInChina &&
            (venues.length > 0 || markers.length > 0) &&
            !center
          ) {
            // 只有在中国大陆定位时才 fitBounds
            const bounds = new maplibregl.LngLatBounds();
            venues.forEach((v) => bounds.extend([v.lng, v.lat]));
            markers.forEach((m) => bounds.extend([m.lng, m.lat]));
            bounds.extend([userCoords!.lng, userCoords!.lat]);
            if (!bounds.isEmpty() && bounds.getNorth() !== bounds.getSouth()) {
              map.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                maxZoom: 14,
                animate: false,
              });
              setHasAutoFitted(true);
            }
          } else if (center) {
            map.setCenter(center);
            setHasAutoFitted(true);
          }
        }
      } catch (e) {
        console.error("Error updating markers:", e);
      }
    }, 200); // 200ms延迟，避免频繁更新

    return () => {
      clearTimeout(updateMarkersTimeout);
    };
  }, [
    mapInitialized,
    center,
    markers,
    userCoords,
    venues,
    zoom,
    hasAutoFitted,
  ]);

  // 计算距离
  function calcDistanceKm(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const aVal =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(navigator.language || "zh");
    }
  }, []);

  return (
    <>
      <div
        ref={mapContainer}
        className={`w-full h-full ${className}`}
        style={{ minHeight: 320 }}
      />
      {/* 底部卡片：简要信息+按钮 */}
      <BottomDrawer open={showDrawer} onClose={() => setShowDrawer(false)}>
        {selectedVenue && (
          <div
            className="flex flex-col justify-end min-h-0"
            style={{ height: "33vh" }}
          >
            <div className="px-6 pt-4 pb-6 overflow-y-auto">
              <div className="text-xl font-bold text-inkblack truncate mb-1">
                {selectedVenue.name.zh}
                {selectedVenue.name.en && (
                  <span className="ml-2 text-base font-normal text-gray-500">
                    {selectedVenue.name.en}
                  </span>
                )}
                {showJa && selectedVenue.name.ja && (
                  <span className="ml-2 text-base font-normal text-gray-500">
                    {selectedVenue.name.ja}
                  </span>
                )}
                {showKo && selectedVenue.name.ko && (
                  <span className="ml-2 text-base font-normal text-gray-500">
                    {selectedVenue.name.ko}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm mb-4">
                {userCoords && (
                  <span className="text-inkblack">
                    {calcDistanceKm(userCoords, {
                      lat: selectedVenue.lat,
                      lng: selectedVenue.lng,
                    }).toFixed(1)}{" "}
                    km
                  </span>
                )}
                <span className="text-graytext truncate">
                  {selectedVenue.address}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  className="w-full py-3 rounded-full bg-pinkaccent text-white font-bold text-lg shadow hover:bg-pink-500 transition"
                  onClick={() => setNavOpen(true)}
                >
                  Navigate
                </button>
                <motion.button
                  className="w-full py-3 rounded-full border-2 border-pinkaccent text-pinkaccent font-bold text-lg hover:bg-pink-50 transition"
                  onClick={() => {
                    // 先关闭小抽屉
                    setShowDrawer(false);

                    // 等小抽屉关闭动画完成后再显示详情页
                    setTimeout(() => {
                      setShowVenueDetail("true");
                    }, 500);
                  }}
                  whileTap={{ scale: 0.96 }}
                >
                  View profile
                </motion.button>
              </div>
              {selectedVenue.image_url && (
                <img
                  src={selectedVenue.image_url}
                  alt={
                    selectedVenue.name.zh ||
                    selectedVenue.name.en ||
                    "venue photo"
                  }
                  className="w-full mt-4 rounded-2xl object-cover max-h-40"
                  style={{ maxWidth: "100%" }}
                />
              )}
            </div>
          </div>
        )}
      </BottomDrawer>
      {/* Detail page popup */}
      <BottomSheet
        open={showVenueDetail === "true"}
        onClose={() => {
          // 关闭详情页，立即设置为不显示小抽屉
          setShowVenueDetail("false");
          setShowDrawer(false);
          // 重置选中场馆
          setTimeout(() => {
            setSelectedVenue(null);
          }, 500);
        }}
      >
        {selectedVenue && (
          <VenueDetail
            v={selectedVenue}
            onClose={() => {
              // 关闭详情页，立即设置为不显示小抽屉
              setShowVenueDetail("false");
              setShowDrawer(false);
              // 重置选中场馆
              setTimeout(() => {
                setSelectedVenue(null);
              }, 500);
            }}
            distanceKm={
              userCoords
                ? calcDistanceKm(userCoords, {
                    lat: selectedVenue.lat,
                    lng: selectedVenue.lng,
                  })
                : undefined
            }
          />
        )}
      </BottomSheet>
      {/* 多地图选择弹窗 */}
      {selectedVenue && navOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setNavOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 min-w-[260px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 font-semibold text-lg">选择地图应用</div>
            <div className="flex flex-col gap-3">
              {[
                {
                  name: "Apple Maps",
                  url: `http://maps.apple.com/?daddr=${encodeURIComponent(selectedVenue.address)}`,
                },
                {
                  name: "Google Maps",
                  url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedVenue.address)}`,
                },
                {
                  name: "高德地图",
                  url: `https://uri.amap.com/marker?position=${selectedVenue.lng},${selectedVenue.lat}&name=${encodeURIComponent(selectedVenue.name.zh || selectedVenue.name.en || selectedVenue.name.ja || selectedVenue.name.ko || "")}`,
                },
                {
                  name: "Kakao Map",
                  url: `https://map.kakao.com/link/map/${encodeURIComponent(selectedVenue.name.zh || selectedVenue.name.en || selectedVenue.name.ja || selectedVenue.name.ko || "")},${selectedVenue.lat},${selectedVenue.lng}`,
                },
                {
                  name: "Naver Map",
                  url: `https://map.naver.com/v5/search/${encodeURIComponent(selectedVenue.name.zh || selectedVenue.name.en || selectedVenue.name.ja || selectedVenue.name.ko || "")}?c=${selectedVenue.lng},${selectedVenue.lat},16,0,0,0,dh`,
                },
              ].map((opt) => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded bg-pinkaccent text-white text-center font-semibold hover:bg-pink-500 transition"
                  onClick={() => setNavOpen(false)}
                >
                  {opt.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
