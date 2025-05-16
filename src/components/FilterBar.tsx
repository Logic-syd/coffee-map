"use client";
// import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Filter } from "lucide-react";
import { tapSpring } from "@/lib/motion";

const filters = [
  { label: "Open Cafes", value: "open" },
  { label: "Breakfast", value: "breakfast" },
  { label: "Vegan Options", value: "vegan" },
];

export default function FilterBar({
  selected,
  setSelected,
  onHeartClick,
  isFavoriteActive,
  onFilterClick,
}: {
  selected: string[];
  setSelected: (v: string[]) => void;
  onHeartClick: () => void;
  isFavoriteActive: boolean;
  onFilterClick?: () => void;
}) {
  // 计算选中的筛选条件数量（不包括"open"和收藏状态）
  const filterCount = selected.filter((item) => item !== "open").length;

  const handleClick = (val: string) => {
    setSelected(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val],
    );
  };
  return (
    <div
      className="flex gap-2 px-4 py-2 bg-pinkcream sticky top-14 z-10 items-center overflow-x-auto scrollbar-hide"
      style={{
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <motion.button
        className={`flex-shrink-0 p-2 rounded-full transition shadow-card ${isFavoriteActive ? "bg-pinkaccent" : "bg-white"}`}
        aria-label="Favorites"
        onClick={onHeartClick}
        whileTap={tapSpring}
      >
        <Heart
          size={22}
          className={
            isFavoriteActive ? "text-white fill-white" : "text-pinkaccent"
          }
        />
      </motion.button>
      <div className="relative flex-shrink-0">
        <motion.button
          className="p-2 rounded-full hover:bg-mintice/60 transition"
          aria-label="Filters"
          onClick={onFilterClick}
          whileTap={tapSpring}
        >
          <Filter size={22} className="text-inkblack" />
        </motion.button>
        {filterCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pinkaccent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </div>
      {filters.map((f) => {
        const isActive = selected.includes(f.value);
        return (
          <motion.button
            key={f.value}
            onClick={() => handleClick(f.value)}
            className={`flex-shrink-0 px-4 py-1 rounded-full text-sm whitespace-nowrap transition-colors duration-150 font-medium ${isActive ? "bg-pinkaccent text-white" : "bg-yolkyellow text-inkblack"}`}
            whileTap={tapSpring}
          >
            {f.label}
          </motion.button>
        );
      })}
    </div>
  );
}
