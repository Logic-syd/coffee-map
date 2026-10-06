import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import type { TranslationKey } from "@/lib/i18n";
import { t, venueName, formatDistance, formatHours } from "@/lib/i18n";
import { getOpeningIntervals, WEEKDAYS } from "@/utils/opening-hours";
import VenueImage from "./VenueImage";
import OpeningStatus from "./OpeningStatus";
import type { Venue } from "@/types/venue";
import FavoriteButton from "@/components/FavoriteButton";
import { LinkIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import { ChevronDown } from "lucide-react";
import VenueFeatures from "@/components/VenueFeatures";
import type { VenueFeature } from "@/lib/venue-features";

export default function VenueDetail({
  v,
  onClose,
  distanceKm,
  catalog,
}: {
  v: Venue;
  onClose?: () => void;
  distanceKm?: number;
  catalog?: VenueFeature[];
}) {
  const [popup, setPopup] = useState<null | {
    type: "name" | "address";
    value: string;
  }>(null);
  const [copied, setCopied] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const lang = useLocale();
  const now = useMinuteClock();
  const displayName = venueName(v.name, lang);
  const intervals = getOpeningIntervals(v.hours);
  const [actionError, setActionError] = useState<TranslationKey>();

  // 联系方式图标配置
  const contactIcons = [
    v.contacts?.site && {
      key: "site" as const,
      icon: <LinkIcon className="w-6 h-6" />,
      url: v.contacts.site.startsWith("http")
        ? v.contacts.site
        : `https://${v.contacts.site}`,
    },
    v.contacts?.fb && {
      key: "fb" as const,
      icon: <FaFacebook className="w-6 h-6" />,
      url: v.contacts.fb.startsWith("http")
        ? v.contacts.fb
        : `https://facebook.com/${v.contacts.fb}`,
    },
    v.contacts?.ig && {
      key: "ig" as const,
      icon: <FaInstagram className="w-6 h-6" />,
      url: v.contacts.ig.startsWith("http")
        ? v.contacts.ig
        : `https://instagram.com/${v.contacts.ig}`,
    },
    v.contacts?.twitter && {
      key: "twitter" as const,
      icon: <FaTwitter className="w-6 h-6" />,
      url: v.contacts.twitter.startsWith("http")
        ? v.contacts.twitter
        : `https://twitter.com/${v.contacts.twitter}`,
    },
    v.contacts?.tel && {
      key: "tel" as const,
      icon: <PhoneIcon className="w-6 h-6" />,
      url: `tel:${v.contacts.tel}`,
    },
  ].filter(
    (
      c,
    ): c is {
      key: "site" | "fb" | "ig" | "twitter" | "tel";
      icon: React.ReactElement;
      url: string;
    } => Boolean(c),
  );

  // 导航弹窗选项
  const mapOptions: { name: string; url: string }[] = [
    {
      name: t("map.apple", lang),
      url: `https://maps.apple.com/?daddr=${encodeURIComponent(v.address)}`,
    },
    {
      name: t("map.google", lang),
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(v.address)}`,
    },
    {
      name: t("map.amap", lang),
      url: `https://uri.amap.com/marker?position=${v.lng},${v.lat}&name=${encodeURIComponent(v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "")}`,
    },
    {
      name: t("map.kakao", lang),
      url: `https://map.kakao.com/link/map/${encodeURIComponent(v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "")},${v.lat},${v.lng}`,
    },
    {
      name: t("map.naver", lang),
      url: `https://map.naver.com/v5/search/${encodeURIComponent(v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "")}?c=${v.lng},${v.lat},16,0,0,0,dh`,
    },
  ];

  // 分享逻辑
  const handleShare = async () => {
    setActionError(undefined);
    const shareText = [
      displayName,
      v.name.zh !== displayName ? v.name.zh : undefined,
      v.address,
    ]
      .filter(Boolean)
      .join("\n");
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: shareText,
        });
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError"))
          setActionError("action.shareError");
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setActionError("action.shareError");
      }
    }
  };

  return (
    <main className="space-y-6">
      <div className="relative w-full">
        <VenueImage
          src={v.image_url}
          alt={displayName}
          locale={lang}
          className="h-56 rounded-b-3xl"
        />
        {onClose && (
          <button
            className="absolute left-4 top-4 grid min-h-11 min-w-11 place-items-center rounded-full bg-white shadow-card"
            onClick={onClose}
            aria-label={t("action.close", lang)}
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        )}
      </div>
      <div className="px-6">
        <div className="flex items-start justify-between gap-3 text-2xl font-bold text-inkblack">
          <h1>{displayName}</h1>
          <FavoriteButton
            venueId={v.id}
            size={28}
            className="border-2 border-pinkaccent bg-white"
          />
        </div>
        {v.name.zh && v.name.zh !== displayName && (
          <button
            type="button"
            lang="zh-CN"
            className="mt-1 min-h-11 text-left text-base text-gray-500"
            aria-label={`${t("action.copyOriginalName", lang)}: ${v.name.zh}`}
            onClick={() => {
              setActionError(undefined);
              setPopup({ type: "name", value: v.name.zh! });
            }}
          >
            {v.name.zh}
          </button>
        )}
        <p className="mt-2 text-sm">
          <OpeningStatus hours={v.hours} now={now} locale={lang} />
        </p>
        {/* 距离与地址 */}
        <div className="flex items-center gap-2 mt-3 text-left">
          {typeof distanceKm === "number" && (
            <span className="text-sm text-inkblack font-medium">
              {formatDistance(distanceKm, lang)}
            </span>
          )}
          <button
            type="button"
            className="min-h-11 text-left text-sm text-gray-700 break-words"
            title={v.address}
            lang={v.address ? "zh-CN" : lang}
            disabled={!v.address}
            onClick={() => {
              setActionError(undefined);
              setPopup({ type: "address", value: v.address });
            }}
          >
            {v.address || t("venue.addressMissing", lang)}
          </button>
        </div>
      </div>

      {/* 弹窗显示完整内容和复制按钮 */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setPopup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 min-w-[260px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mb-4 break-words text-gray-900 text-base"
              lang="zh-CN"
            >
              {popup.value}
            </div>
            <button
              className="min-h-11 w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(popup.value);
                  setPopup(null);
                  setCopied(true);
                  setActionError(undefined);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setActionError("action.copyError");
                }
              }}
            >
              {t(
                popup.type === "name"
                  ? "action.copyOriginalName"
                  : "action.copy",
                lang,
              )}
            </button>
          </div>
        </div>
      )}
      {/* 复制成功提示 */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow z-50 text-sm">
          {t("action.copied", lang)}
        </div>
      )}

      <section className="px-6 mt-6">
        <h2 className="mb-2 text-left font-semibold text-inkblack">
          {t("hours.title", lang)}
        </h2>
        {intervals ? (
          <ul className="space-y-2 text-sm text-gray-700">
            {WEEKDAYS.map((day, index) => (
              <li key={day} className="flex gap-3">
                <span className="w-16 shrink-0">
                  {new Intl.DateTimeFormat(lang, {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(new Date(Date.UTC(2026, 9, 5 + index)))}
                </span>
                <span>
                  {intervals
                    .filter((interval) => interval[0] === day)
                    .map(([, start, end]) => formatHours(start, end, lang))
                    .join(" / ") || t("hours.dayOff", lang)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">{t("hours.unknown", lang)}</p>
        )}
      </section>
      {actionError && (
        <div
          className="fixed bottom-6 left-4 right-4 z-[60] flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 shadow-lg"
          role="alert"
        >
          <span>{t(actionError, lang)}</span>
          <button
            className="min-h-11 shrink-0 px-2 font-semibold"
            onClick={() => setActionError(undefined)}
          >
            {t("action.close", lang)}
          </button>
        </div>
      )}

      {/* 联系方式图标区 */}
      {contactIcons.length > 0 && (
        <div className="flex gap-4 my-4 px-6">
          {contactIcons.map((c) => (
            <a
              key={c.key}
              href={c.url}
              aria-label={t(`contact.${c.key}`, lang)}
              target={c.key === "tel" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="rounded-full bg-gray-100 p-3 hover:bg-gray-200 transition"
            >
              {c.icon}
            </a>
          ))}
        </div>
      )}

      <div className="px-6">
        <VenueFeatures venue={v} locale={lang} catalog={catalog} />
      </div>

      {/* 底部按钮区：主题色保持一致 */}
      <div
        className="sticky bottom-0 z-30 bg-white p-4 flex flex-col gap-3 border-t"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          className="w-full py-3 rounded-full bg-pinkaccent text-white font-bold text-lg shadow hover:bg-pink-600 active:bg-pink-700 transition"
          onClick={() => setNavOpen(true)}
        >
          {t("action.navigate", lang)}
        </button>
        <button
          className="w-full py-3 rounded-full border-2 border-pinkaccent text-pinkaccent font-bold text-lg hover:bg-pink-50 transition"
          onClick={handleShare}
        >
          {t("action.share", lang)}
        </button>
      </div>

      {/* 导航弹窗 */}
      {navOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setNavOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 min-w-[260px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 font-semibold text-lg">
              {t("action.chooseMap", lang)}
            </div>
            <div className="flex flex-col gap-3">
              {mapOptions.map((opt) => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 w-full py-2 rounded bg-pinkaccent text-white text-center font-semibold hover:bg-pink-500 transition"
                  onClick={() => setNavOpen(false)}
                >
                  {opt.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
