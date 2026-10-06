"use client";
import { useLocale } from "@/hooks/useLocale";
import BottomSheet from "@/components/BottomSheet";
import { HeartIcon, ClockIcon } from "@heroicons/react/24/outline";
import { t } from "@/lib/i18n";
import { FEATURE_GROUPS, featureLabel } from "@/lib/venue-features";
import type { VenueFeature } from "@/lib/venue-features";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  selected: Record<string, boolean>;
  catalog: VenueFeature[];
  onChange: (selected: Record<string, boolean>) => void;
}

export default function FilterSheet({
  open,
  onClose,
  selected,
  onChange,
  catalog,
}: FilterSheetProps) {
  const locale = useLocale();
  const toggle = (key: string) =>
    onChange({ ...selected, [key]: !selected[key] });
  const buttonClass = (key: string) =>
    `min-h-11 px-5 py-2 rounded-full text-sm whitespace-nowrap flex items-center gap-2 border transition ${selected[key] ? "bg-pinkaccent text-inkblack border-pinkaccent" : "bg-white text-inkblack border-inkblack/10"}`;
  return (
    <BottomSheet
      label={t("action.filters", locale)}
      open={open}
      onClose={onClose}
    >
      <div className="px-6 pt-4 pb-10">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            aria-pressed={Boolean(selected.favourites)}
            className={buttonClass("favourites")}
            onClick={() => toggle("favourites")}
          >
            <HeartIcon className="w-5 h-5" />
            {t("filter.favourites", locale)}
          </button>
          <button
            type="button"
            aria-pressed={Boolean(selected.open)}
            className={buttonClass("open")}
            onClick={() => toggle("open")}
          >
            <ClockIcon className="w-5 h-5" />
            {t("filter.openCafes", locale)}
          </button>
        </div>
        {FEATURE_GROUPS.map((group) => {
          const options = catalog.filter(
            (item) =>
              item.group === group.id &&
              item.inFilters &&
              item.active !== false,
          );
          if (!options.length) return null;
          return (
            <div key={group.id}>
              <h2 className="font-semibold text-base text-inkblack mt-5 mb-3 text-center">
                {group.labels[locale]}
              </h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {options.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={Boolean(selected[item.id])}
                    className={buttonClass(item.id)}
                    onClick={() => toggle(item.id)}
                  >
                    {featureLabel(item, locale)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="min-h-11 text-blue-600 py-2 px-6 rounded-full hover:bg-blue-50"
            onClick={() => onChange({})}
          >
            {t("filter.resetAll", locale)}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
