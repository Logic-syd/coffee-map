"use client";
import { useEffect, useState, useMemo } from "react";
import CafeCard from "@/components/CafeCard";
import BottomSheet from "@/components/BottomSheet";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import FilterSheet from "@/components/FilterSheet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { calcDistanceKm } from "@/utils/geo";
import MapView from "@/components/MapView";
import { useFavoritesStore } from "@/store/favorites";
import VenueDetail from "@/components/VenueDetail";
import FilterBar from "@/components/FilterBar";
import Loading from "./loading";

// Define venue type
export interface Venue {
  id: string;
  name: { zh?: string; en?: string; ja?: string; ko?: string };
  address: string;
  lat: number;
  lng: number;
  image_url?: string;
  hours?: {
    default?: [string, string, string][];
  };
  serving?: string[];
  services?: string[];
  tags?: string[];
  distanceKm?: number;
  isOpenNow?: boolean;
  created_at?: string;
  [key: string]: any;
}

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [search, setSearch] = useState("");
  const [mapMode, setMapMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, boolean>
  >({});
  const {
    status: locStatus,
    coords: userCoords,
    request: requestLocation,
  } = useUserLocation();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const favorites = useFavoritesStore((s) => s.favorites);
  const [loading, setLoading] = useState(true);

  // 用useMemo计算venuesWithDistance，避免死循环
  const venuesWithDistance = useMemo(() => {
    if (locStatus === "granted" && userCoords) {
      return [...venues]
        .map((v) => ({
          ...v,
          distanceKm: calcDistanceKm(userCoords, { lat: v.lat, lng: v.lng }),
        }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }
    return venues;
  }, [venues, locStatus, userCoords]);

  // 客户端筛选结果
  const [clientFilteredVenues, setClientFilteredVenues] = useState(venues);

  useEffect(() => {
    setClientFilteredVenues(
      venuesWithDistance.filter((v) => {
        // 搜索支持多语言
        const searchMatched =
          !search ||
          Object.values(v.name || {}).some((n) =>
            n?.toLowerCase().includes(search.toLowerCase()),
          );
        if (!searchMatched) return false;
        if (showFavoritesOnly && !favorites.includes(v.id)) return false;
        for (const key in selectedFilters) {
          if (!selectedFilters[key]) continue;
          if (key === "open") {
            if (!isOpenNow(v.hours, getBeijingNow())) return false;
          } else {
            // 标签类：serving/services/tags 任一字段包含即匹配
            const labelMap: Record<string, string> = {
              breakfast: "breakfast",
              vegan_options: "vegan options",
              free_wifi: "free wifi",
              laptop_friendly: "laptop friendly",
              credit_cards: "credit cards",
              kids_friendly: "kids friendly",
              dog_friendly: "dog friendly",
              outdoor_seating: "outdoor seating",
              wheelchair: "wheelchair",
              batch_brew: "batch brew",
              hand_brew: "hand brew",
              cold_brew: "cold brew/drip",
              nitro_coffee: "nitro coffee",
              decaf_coffee: "decaf coffee",
              plant_milk: "plant-based milk",
              lunch: "lunch",
            };
            const label = labelMap[key];
            if (
              !(
                v.serving?.includes(label) ||
                v.services?.includes(label) ||
                v.tags?.includes(label)
              )
            ) {
              return false;
            }
          }
        }
        return true;
      }),
    );
  }, [
    venuesWithDistance,
    search,
    selectedFilters,
    userCoords,
    locStatus,
    showFavoritesOnly,
    favorites,
  ]);

  function isOpenNow(hours: Venue["hours"], now: Date) {
    if (!hours?.default) return false;
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = dayMap[now.getDay()];
    const today = hours.default.find(([d]) => d === day);
    if (!today) return false;
    // Destructure array and ignore first element
    const [, open, close] = today;
    if (!open || !close) return false;
    const [oh, om] = open.split(":").map(Number);
    const [ch, cm] = close.split(":").map(Number);
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= openMins && nowMins <= closeMins;
  }

  // 获取东八区当前时间
  function getBeijingNow() {
    const now = new Date();
    // 东八区与UTC的时差为+8小时
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 8 * 3600000);
  }

  // 地图按钮点击逻辑，集成定位和降级体验
  function handleMapClick() {
    // 每次点击都同步请求定位，兼容 iOS WebView/Hybrid
    requestLocation();
    setMapMode(true);
  }

  // 判断用户是否在中国大陆
  function isInChina({ lat, lng }: { lat: number; lng: number }) {
    return lng >= 73.5 && lng <= 135.1 && lat >= 18 && lat <= 53.6;
  }

  // Handle favorite toggle
  const handleFavoriteToggle = (id: string) => {
    const store = useFavoritesStore.getState();
    if (store.isFavorite(id)) {
      store.removeFavorite(id);
    } else {
      store.addFavorite(id);
    }
  };

  useEffect(() => {
    supabase
      .from("venues")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else
          setVenues(
            (data || []).map((v: any) => ({
              ...v,
              name: {
                zh: v.name_zh,
                en: v.name_eng,
                ja: v.name_ja,
                ko: v.name_ko,
              },
            })),
          );
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      {mapMode ? (
        <div className="flex flex-col h-screen">
          <TopBar
            search={search}
            setSearch={setSearch}
            onMapClick={() => setMapMode(false)}
            isMapMode={true}
          />
          <div className="sticky top-14 z-10">
            <FilterBar
              selected={Object.keys(selectedFilters).filter(
                (k) => selectedFilters[k],
              )}
              setSelected={(arr) => {
                // 只保留原有 selectedFilters 结构
                const next: Record<string, boolean> = {};
                arr.forEach((k) => (next[k] = true));
                setSelectedFilters(next);
              }}
              onHeartClick={() => setShowFavoritesOnly((v) => !v)}
              isFavoriteActive={showFavoritesOnly}
              onFilterClick={() => setFilterOpen(true)}
            />
          </div>
          <div className="flex-1 relative">
            <MapView
              venues={venues}
              userCoords={
                locStatus === "granted" && userCoords && isInChina(userCoords)
                  ? userCoords
                  : undefined
              }
              className="absolute inset-0 z-0"
            />
          </div>
        </div>
      ) : (
        <>
          <TopBar
            search={search}
            setSearch={setSearch}
            onMapClick={handleMapClick}
            isMapMode={false}
          />
          <FilterBar
            selected={Object.keys(selectedFilters).filter(
              (k) => selectedFilters[k],
            )}
            setSelected={(arr) => {
              // 只保留原有 selectedFilters 结构
              const next: Record<string, boolean> = {};
              arr.forEach((k) => (next[k] = true));
              setSelectedFilters(next);
            }}
            onHeartClick={() => setShowFavoritesOnly((v) => !v)}
            isFavoriteActive={showFavoritesOnly}
            onFilterClick={() => setFilterOpen(true)}
          />
          <main className="p-4 space-y-4 pb-24 pt-[20px]">
            {clientFilteredVenues.map((v) => (
              <div key={v.id} onClick={() => setSelectedVenue(v)}>
                <CafeCard
                  v={{
                    id: v.id,
                    name: v.name,
                    address: v.address,
                    image_url: v.image_url,
                    isOpenNow: isOpenNow(v.hours, getBeijingNow()),
                  }}
                  distanceKm={v.distanceKm}
                  isFav={favorites.includes(v.id)}
                  onToggleFav={handleFavoriteToggle}
                />
              </div>
            ))}
          </main>
          <BottomSheet
            open={!!selectedVenue}
            onClose={() => setSelectedVenue(null)}
          >
            {selectedVenue && (
              <VenueDetail
                v={selectedVenue}
                onClose={() => setSelectedVenue(null)}
                distanceKm={selectedVenue.distanceKm}
              />
            )}
          </BottomSheet>
          <FilterSheet
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            selected={selectedFilters}
            onChange={setSelectedFilters}
          />
        </>
      )}
    </>
  );
}
