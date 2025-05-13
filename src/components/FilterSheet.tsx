import React from "react";
import BottomSheet from "@/components/BottomSheet";
import { HeartIcon } from "@heroicons/react/24/outline";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  selected: Record<string, boolean>;
  onChange: (selected: Record<string, boolean>) => void;
}

const filterGroups = [
  {
    title: "",
    options: [
      {
        key: "favourites",
        icon: <HeartIcon className="w-6 h-6" />,
        label: "Favourites",
      },
      { key: "open", label: "Open Cafes" },
    ],
  },
  {
    title: "Filter Coffee",
    options: [
      { key: "batch_brew", label: "Batch Brew" },
      { key: "hand_brew", label: "Hand Brew" },
    ],
  },
  {
    title: "Drinks",
    options: [
      { key: "cold_brew", label: "Cold Brew/Drip" },
      { key: "nitro_coffee", label: "Nitro Coffee" },
      { key: "decaf_coffee", label: "Decaf Coffee" },
      { key: "plant_milk", label: "Plant-Based Milk" },
    ],
  },
  {
    title: "Food",
    options: [
      { key: "breakfast", label: "Breakfast" },
      { key: "lunch", label: "Lunch" },
    ],
  },
  {
    title: "Services",
    options: [
      { key: "free_wifi", label: "Free Wi-Fi" },
      { key: "laptop_friendly", label: "Laptop Friendly" },
      { key: "credit_cards", label: "Credit Cards" },
      { key: "vegan_options", label: "Vegan Options" },
      { key: "kids_friendly", label: "Kids Friendly" },
      { key: "dog_friendly", label: "Dog Friendly" },
      { key: "outdoor_seating", label: "Outdoor Seating" },
      { key: "wheelchair", label: "Wheelchair" },
    ],
  },
];

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
      <div className="flex flex-col items-center px-4 pt-3 pb-8">
        {/* 筛选分组 */}
        {filterGroups.map((group, idx) => (
          <div key={group.title || idx} className="w-full mb-4">
            {group.title && (
              <h2 className="text-lg font-bold text-center mb-3">
                {group.title}
              </h2>
            )}
            <div className="flex flex-wrap gap-3 justify-center">
              {group.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`flex items-center gap-2 border rounded-full px-5 py-2 min-w-[140px] justify-center ${selected[opt.key] ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}
                  onClick={() => toggle(opt.key)}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          className="text-blue-700 font-medium text-center mt-6"
          onClick={reset}
          type="button"
        >
          Reset All Filters
        </button>
      </div>
    </BottomSheet>
  );
}
