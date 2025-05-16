"use client";
import { useState } from "react";
import DrawerMenu from "./DrawerMenu";
import { Menu, MapPin, X } from "lucide-react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { tapSpring } from "@/lib/motion";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TopBar({
  search,
  setSearch,
  onMapClick,
  isMapMode,
  showBack = false,
  onBack,
  title,
}: {
  search?: string;
  setSearch?: (v: string) => void;
  onMapClick?: () => void;
  isMapMode?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-pinkcream rounded-b-3xl shadow-card flex items-center px-4 gap-2">
        {showBack ? (
          <motion.button
            onClick={handleBack}
            className="p-2 hover:bg-pinkaccent/30 rounded-full transition"
            aria-label="Back"
            whileTap={tapSpring}
          >
            <ArrowLeftIcon className="w-5 h-5 text-inkblack" />
          </motion.button>
        ) : (
          <motion.button
            onClick={() => setDrawerOpen(true)}
            className="p-2 hover:bg-pinkaccent/30 rounded-full transition"
            aria-label="Open menu"
            whileTap={tapSpring}
          >
            <Menu size={24} className="text-inkblack" />
          </motion.button>
        )}
        {title ? (
          <span className="text-xl font-semibold text-inkblack flex-1">
            {title}
          </span>
        ) : (
          <div className="flex-1 flex items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch?.(e.target.value)}
              placeholder="Search cafes, tags..."
              className="w-full rounded-full bg-white shadow-input px-4 py-2 text-sm placeholder-graytext text-inkblack focus:outline-none"
            />
          </div>
        )}
        {setSearch && (
          <motion.button
            className={`ml-2 p-2 rounded-full ${isMapMode ? "bg-white hover:bg-white/80" : "hover:bg-yolkyellow/60"} transition`}
            aria-label={isMapMode ? "Back to list" : "View map"}
            onClick={onMapClick}
            whileTap={tapSpring}
          >
            {isMapMode ? (
              <X size={20} className="text-gray-700" />
            ) : (
              <MapPin size={22} className="text-mintice" />
            )}
          </motion.button>
        )}
      </header>
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
