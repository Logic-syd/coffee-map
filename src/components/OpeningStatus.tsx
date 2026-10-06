import { getOpeningState } from "@/utils/opening-hours";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
export default function OpeningStatus({
  hours,
  now,
  locale,
}: {
  hours: unknown;
  now: Date;
  locale: Language;
}) {
  const state = getOpeningState(hours, now);
  return (
    <span className={state === "open" ? "text-green-700" : "text-gray-600"}>
      {t(`hours.${state}`, locale)}
    </span>
  );
}
