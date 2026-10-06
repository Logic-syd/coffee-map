"use client";
import { featureLabel } from "@/lib/venue-features";
import { useLocale } from "@/hooks/useLocale";
import type { VenueFeature } from "@/lib/venue-features";
import { motion } from "framer-motion";
import { Heart, Filter } from "lucide-react";
import { tapSpring } from "@/lib/motion";
import { t } from "@/lib/i18n";

// Define filter labels as proper type for t function
type FilterLabel = "filter.openCafes" | "tag.dessert";

const filters = [
  { key: "open", label: "filter.openCafes" as FilterLabel },
  { key: "dessert", label: "tag.dessert" as FilterLabel },
];

export default function FilterBar({
  selected,
  setSelected,
  onHeartClick,
  isFavoriteActive,
  onFilterClick,
  catalog,
}: {
  selected: string[];
  catalog: VenueFeature[];
  setSelected: (v: string[]) => void;
  onHeartClick: () => void;
  isFavoriteActive: boolean;
  onFilterClick?: () => void;
}) {
  const locale = useLocale();
  // 计算选中的筛选条件数量（不包括"open"和收藏状态）
  const filterCount = selected.filter(
    (item) => item !== "open" && item !== "favourites",
  ).length;

  const handleClick = (val: string) => {
    setSelected(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val],
    );
  };
  return (
    <div
      className="flex shrink-0 gap-2 px-4 py-2 bg-pinkcream sticky top-14 z-10 items-center overflow-x-auto scrollbar-hide"
      style={{
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <motion.button
        className={`min-h-11 min-w-11 flex-shrink-0 p-2 rounded-full transition shadow-card ${isFavoriteActive ? "bg-pinkaccent" : "bg-white"}`}
        aria-label={t("filter.favourites", locale)}
        aria-pressed={isFavoriteActive}
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
          className="min-h-11 min-w-11 p-2 rounded-full hover:bg-mintice/60 transition"
          aria-label={t("action.filters", locale)}
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
      {filters
        .filter(
          (f) =>
            f.key === "open" ||
            catalog.some(
              (item) =>
                item.id === f.key && item.inFilters && item.active !== false,
            ),
        )
        .map((f) => {
          const isActive = selected.includes(f.key);
          return (
            <motion.button
              key={f.key}
              onClick={() => handleClick(f.key)}
              aria-pressed={isActive}
              className={`min-h-11 min-w-11 flex-shrink-0 px-4 py-1 rounded-full text-sm whitespace-nowrap transition-colors duration-150 font-medium ${isActive ? "bg-pinkaccent text-white" : "bg-yolkyellow text-inkblack"}`}
              whileTap={tapSpring}
            >
              {f.key === "dessert" &&
              catalog.find((item) => item.id === "dessert")
                ? featureLabel(
                    catalog.find((item) => item.id === "dessert")!,
                    locale,
                  )
                : t(f.label, locale)}
            </motion.button>
          );
        })}
    </div>
  );
}
