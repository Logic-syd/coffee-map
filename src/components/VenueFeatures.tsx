import { t } from "@/lib/i18n";
import { Coffee, CupSoda, Utensils, Sparkles } from "lucide-react";
import {
  FEATURE_GROUPS,
  VENUE_FEATURES,
  getVenueFeatures,
  featureLocale,
  featureLabel,
} from "@/lib/venue-features";
import type { VenueFeature, VenueFeatureData } from "@/lib/venue-features";

const icons = {
  coffee: Coffee,
  drinks: CupSoda,
  food: Utensils,
  amenities: Sparkles,
};

export default function VenueFeatures({
  venue,
  locale = "zh-CN",
  catalog = VENUE_FEATURES,
}: {
  venue: VenueFeatureData;
  locale?: string;
  catalog?: VenueFeature[];
}) {
  const lang = featureLocale(locale);
  const features = getVenueFeatures(venue, catalog).filter(
    (item) => item.inDetails,
  );
  if (!features.length) return null;
  return (
    <section className="space-y-4" aria-label={t("venue.features", lang)}>
      <h2 className="font-semibold text-inkblack">
        {t("venue.features", lang)}
      </h2>
      {FEATURE_GROUPS.map((group) => {
        const items = features.filter((item) => item.group === group.id);
        if (!items.length) return null;
        const Icon = icons[group.id];
        return (
          <div key={group.id}>
            <h3 className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Icon size={15} aria-hidden="true" />
              {group.labels[lang]}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-700"
                >
                  {featureLabel(item, lang)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
