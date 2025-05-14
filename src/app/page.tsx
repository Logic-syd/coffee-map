"use client";
import { useEffect, useState, useMemo } from "react";
import CafeCard from "@/components/CafeCard";
import BottomSheet from "@/components/BottomSheet";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import { FunnelIcon, HeartIcon } from "@heroicons/react/24/outline";
import FilterSheet from "@/components/FilterSheet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { calcDistanceKm } from "@/utils/geo";
import MapView from "@/components/MapView";

export default function HomePage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [mapMode, setMapMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, boolean>
  >({});
  const lang = "zh"; // 可根据用户设置动态切换
  const {
    status: locStatus,
    coords: userCoords,
    request: requestLocation,
  } = useUserLocation();

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
          (v.name_zh &&
            v.name_zh.toLowerCase().includes(search.toLowerCase())) ||
          (v.name_ja &&
            v.name_ja.toLowerCase().includes(search.toLowerCase())) ||
          (v["name_ko"] &&
            v["name_ko"].toLowerCase().includes(search.toLowerCase())) ||
          (v["name_eng"] &&
            v["name_eng"].toLowerCase().includes(search.toLowerCase()));
        if (!searchMatched) return false;

        // 遍历所有选中的筛选项，全部满足才展示
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
  }, [venuesWithDistance, search, selectedFilters, userCoords, locStatus]);

  function isOpenNow(hours: any, now: Date) {
    if (!hours?.default) return false;
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = dayMap[now.getDay()];
    const today = hours.default.find(([d]: any[]) => d === day);
    if (!today) return false;
    const [_, open, close] = today;
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

  // 地图按钮点击逻辑，集成定位
  function handleMapClick() {
    if (locStatus === "idle") {
      requestLocation();
      setMapMode(true);
    } else if (locStatus === "denied") {
      alert("Location disabled");
    } else {
      setMapMode(true);
    }
  }

  useEffect(() => {
    supabase
      .from("venues")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setVenues(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">Loading…</p>;

  return (
    <>
      {mapMode ? (
        <>
          <MapView venues={venues} userCoords={userCoords} />
          <button
            onClick={() => setMapMode(false)}
            className="fixed top-4 right-4 z-20 bg-white rounded-full shadow px-4 py-2 text-gray-700"
          >
            关闭
          </button>
        </>
      ) : (
        <>
          <TopBar
            search={search}
            setSearch={setSearch}
            onMapClick={handleMapClick}
          />
          <div
            className="sticky top-14 z-20 bg-yellow-100 flex flex-nowrap overflow-x-auto whitespace-nowrap px-4 py-1 scrollbar-hide"
            style={{
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <button
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium mr-2"
              onClick={() => setFilterOpen(true)}
            >
              <FunnelIcon className="w-5 h-5" /> Filters
            </button>
            <button className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium mr-2">
              <HeartIcon className="w-5 h-5" />
            </button>
            <button
              className={`inline-flex px-3 py-1 rounded-full font-medium mr-2 ${selectedFilters.open ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
              onClick={() =>
                setSelectedFilters((f) => ({ ...f, open: !f.open }))
              }
            >
              Open Cafes
            </button>
            <button
              className={`inline-flex px-3 py-1 rounded-full font-medium mr-2 ${selectedFilters.breakfast ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
              onClick={() =>
                setSelectedFilters((f) => ({ ...f, breakfast: !f.breakfast }))
              }
            >
              Breakfast
            </button>
            <button
              className={`inline-flex px-3 py-1 rounded-full font-medium ${selectedFilters.vegan_options ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
              onClick={() =>
                setSelectedFilters((f) => ({
                  ...f,
                  vegan_options: !f.vegan_options,
                }))
              }
            >
              Vegan Options
            </button>
          </div>
          <main className="p-4 space-y-4 pb-24 pt-[20px]">
            {clientFilteredVenues.map((v) => (
              <div key={v.id} onClick={() => setSelectedVenue(v)}>
                <CafeCard v={v} distanceKm={v.distanceKm} />
              </div>
            ))}
          </main>
          <BottomSheet
            open={!!selectedVenue}
            onClose={() => setSelectedVenue(null)}
          >
            {selectedVenue && <VenueDetail v={selectedVenue} />}
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

// 详情内容组件，直接用你原来 VenuePage 的内容
function VenueDetail({ v }: { v: any }) {
  if (!v) return null;
  return (
    <main className="p-6 pb-32 space-y-6">
      {v.image_url && (
        <img
          src={v.image_url}
          alt={v.displayName || v.name_zh || ""}
          className="object-cover w-full rounded-xl mb-4"
          style={{ aspectRatio: "4/3" }}
        />
      )}
      <header className="rounded-lg bg-indigo-700 text-white p-6">
        <h1 className="text-2xl font-bold">{v.name_zh}</h1>
        <p className="mt-1 text-sm opacity-80">📍 {v.address}</p>
      </header>

      {/* Opening hours 简单展示 */}
      {v.hours?.default?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Opening hours</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {v.hours.default.map(([day, open, close], index) => (
              <li key={index}>
                <span className="inline-block w-16">{day || "未知"}</span>
                {open && close ? `${open} – ${close}` : "Closed"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Serving */}
      {v.serving?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Serving</h2>
          <div className="flex flex-wrap gap-2">
            {v.serving.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {v.services?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Services</h2>
          <div className="flex flex-wrap gap-2">
            {v.services.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
