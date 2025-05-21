import React from "react";
import BottomSheet from "@/components/BottomSheet";
import { HeartIcon, ClockIcon } from "@heroicons/react/24/outline";
import { t } from "@/lib/i18n";
import clsx from "clsx";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  selected: Record<string, boolean>;
  onChange: (selected: Record<string, boolean>) => void;
}

interface FilterOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterGroup {
  title: string;
  options: FilterOption[];
}

// 新的过滤分组，按照年轻亚洲游客偏好整理
const filterGroups: FilterGroup[] = [
  {
    title: "",
    options: [
      {
        key: "favourites",
        icon: <HeartIcon className="w-5 h-5" />,
        label: "filter.favourites",
      },
      {
        key: "open",
        icon: <ClockIcon className="w-5 h-5" />,
        label: "filter.openCafes",
      },
    ],
  },
  {
    title: "filter.filterCoffee",
    options: [
      { key: "signature_coffee", label: "tag.signature" },
      { key: "espresso", label: "tag.espresso" },
      { key: "hand_drip", label: "tag.drip" },
      { key: "cold_brew", label: "tag.coldbrew" },
    ],
  },
  {
    title: "filter.drinks",
    options: [
      { key: "non_coffee", label: "tag.noncoffee" },
      { key: "alcoholic_drinks", label: "tag.alcohol" },
      { key: "plant_milk", label: "tag.plantmilk" },
    ],
  },
  {
    title: "filter.food",
    options: [
      { key: "brunch", label: "tag.brunch" },
      { key: "dessert", label: "tag.dessert" },
    ],
  },
  {
    title: "filter.amenities",
    options: [
      { key: "free_wifi", label: "tag.wifi" },
      { key: "english_menu", label: "tag.engmenu" },
      { key: "credit_cards", label: "tag.card" },
      { key: "restroom", label: "tag.restroom" },
      { key: "instagram_worthy", label: "tag.photogenic" },
      { key: "pet_friendly", label: "tag.pet" },
      { key: "outdoor_seating", label: "tag.outdoor" },
      { key: "non_smoking", label: "tag.nosmoke" },
    ],
  },
];

// Helper function to safely use t() without TypeScript errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeT = (key: string): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(key as any);
  } catch {
    return key;
  }
};

export default function FilterSheet({
  open,
  onClose,
  selected,
  onChange,
}: FilterSheetProps) {
  function toggle(key: string) {
    onChange({ ...selected, [key]: !selected[key] });
  }

  function reset() {
    onChange({});
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-6 pt-4 pb-10">
        {/* 筛选分组 */}
        {filterGroups.map((group, idx) => (
          <div key={group.title || idx} className="w-full">
            {group.title && (
              <h2 className="text-inkblack font-semibold text-base mt-5 mb-3 text-center">
                {safeT(group.title)}
              </h2>
            )}
            <div className="flex flex-wrap gap-3 justify-center">
              {group.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={clsx(
                    "px-5 py-2 rounded-full text-sm whitespace-nowrap select-none transition flex items-center gap-2",
                    selected[opt.key]
                      ? "bg-pinkaccent text-white scale-95 transition-all duration-150 ease-in-out"
                      : "bg-white/90 text-inkblack border border-inkblack/10 active:scale-95",
                  )}
                  onClick={() => toggle(opt.key)}
                >
                  {opt.icon}
                  {safeT(opt.label)}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Reset 按钮 */}
        <div className="mt-8 mb-2 flex justify-center">
          <button
            className="text-blue-600 font-medium py-2 px-6 rounded-full hover:bg-blue-50 transition"
            onClick={reset}
            type="button"
          >
            {safeT("filter.resetAll")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
