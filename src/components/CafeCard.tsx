import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { t, venueName, formatDistance } from "@/lib/i18n";
import VenueImage from "./VenueImage";
import OpeningStatus from "./OpeningStatus";
import type { Venue } from "@/types/venue";
export default function CafeCard({
  v,
  now,
  isFav = false,
  onToggleFav,
}: {
  v: Venue;
  now: Date;
  isFav?: boolean;
  onToggleFav: (id: string) => void;
}) {
  const locale = useLocale();
  const name = venueName(v.name, locale);
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer"
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <VenueImage src={v.image_url} alt={name} locale={locale} />
        <button
          type="button"
          className="absolute top-2 right-2 min-h-11 min-w-11 grid place-items-center bg-white/90 rounded-full shadow-card"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFav(v.id);
          }}
          aria-pressed={isFav}
          aria-label={t(
            isFav ? "action.removeFavorite" : "action.addFavorite",
            locale,
          )}
        >
          <Heart
            size={22}
            className={
              isFav ? "text-pinkaccent fill-pinkaccent" : "text-graytext"
            }
          />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-inkblack line-clamp-2">
          {name}
        </h3>
        {name !== v.name.zh && v.name.zh && (
          <p className="text-sm text-gray-500" lang="zh-CN">
            {v.name.zh}
          </p>
        )}
        <p className="text-sm text-graytext flex items-start gap-2 mt-1">
          {typeof v.distanceKm === "number" && (
            <span className="shrink-0 text-inkblack">
              {formatDistance(v.distanceKm, locale)}
            </span>
          )}
          <span className="line-clamp-2" lang={v.address ? "zh-CN" : locale}>
            {v.address || t("venue.addressMissing", locale)}
          </span>
        </p>
        <p className="text-sm mt-2">
          <OpeningStatus hours={v.hours} now={now} locale={locale} />
        </p>
      </div>
    </motion.div>
  );
}
