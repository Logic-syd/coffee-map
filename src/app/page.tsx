"use client";
import { useEffect, useState } from "react";
import { venues } from "@/data/sample-venues";
import TopBar from "@/components/TopBar";
import FilterBar from "@/components/FilterBar";
import CafeCard from "@/components/CafeCard";
import DrawerMenu from "@/components/DrawerMenu";
import MapView from "@/components/MapView";
import BottomSheet from "@/components/BottomSheet";

//import type { Venue } from "@/data/sample-venues";
type Feature = {
  properties: {
    id: string;
    name: { zh: string; ja?: string; ko?: string };
    address: string;
    city?: string;
    tel?: string;
    lat: number | string;
    lng: number | string;
    hours?: {
      default: [string, string, string][];
      exceptions?: [string, string | null, string | null][];
    };
    categories?: string[];
    serving?: string[];
    services?: string[];
    tags?: string[];
    contacts?: {
      tel?: string | null;
      site?: string | null;
      ig?: string | null;
      fb?: string | null;
    };
    // …其它你关心的字段
  };
};

export default function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapMode, setMapMode, loading, setLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Feature[]>([]);
  useEffect(() => {
    // ① 拉取 JSON
    fetch("/data/venues.min.json")
      .then((res) => res.json())
      .then((json) => {
        setVenues(json.features); // ② 写入 state
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading…</p>;
  return (
    <main className="p-4 space-y-4 pb-24">
      {venues.map((f) => (
        <CafeCard key={f.properties.id} v={f.properties} />
      ))}
    </main>
  );
}

// 详情内容组件，直接用你原来 VenuePage 的内容
function VenueDetail({ v }: { v: Venue }) {
  return (
    <main className="p-6 pb-32 space-y-6">
      {/* 头部：店名 & 地址 */}
      <header className="rounded-lg bg-indigo-700 text-white p-6">
        <h1 className="text-2xl font-bold">{v.name.zh}</h1>
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
