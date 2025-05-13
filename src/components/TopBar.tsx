"use client";
import { useState } from "react";
import DrawerMenu from "./DrawerMenu";
import { MapIcon } from "@heroicons/react/24/outline";
import { useSearch } from "@/lib/useSearch";

export default function TopBar({
  search,
  setSearch,
  onMapClick,
}: {
  search: string;
  setSearch: (v: string) => void;
  onMapClick: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b">
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-base focus:outline-none mx-2"
          />
          <button
            className="p-2 rounded-full bg-white shadow"
            onClick={onMapClick}
            aria-label="Map"
          >
            <MapIcon className="w-7 h-7 text-indigo-700" />
          </button>
        </div>
      </header>
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
