import { useState, useEffect } from "react";
import FavoriteButton from "@/components/FavoriteButton";
import { LinkIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import {
  FaCoffee,
  FaWifi,
  FaLaptop,
  FaCreditCard,
  FaLeaf,
  FaDog,
  FaChild,
  FaWheelchair,
  FaMugHot,
  FaIceCream,
  FaUtensils,
  FaGlassWhiskey,
  FaCloud,
} from "react-icons/fa";
import { MdFreeBreakfast, MdOutdoorGrill } from "react-icons/md";
import {
  GiMilkCarton,
  GiBeerStein,
  GiCroissant,
  GiCoffeeCup,
  GiCoffeeBeans,
} from "react-icons/gi";
import { BsCupHot } from "react-icons/bs";
import { ChevronDown } from "lucide-react";

// 定义venue类型
interface Venue {
  id: string;
  name?: { zh?: string; en?: string; ja?: string; ko?: string };
  address: string;
  lat: number;
  lng: number;
  contacts?: {
    site?: string;
    fb?: string;
    ig?: string;
    twitter?: string;
    tel?: string;
  };
  serving?: string[];
  services?: string[];
  hours?: {
    default?: [string, string, string][];
  };
  image_url?: string;
  [key: string]: unknown; // Use unknown instead of any
}

export default function VenueDetail({
  v,
  onClose,
  distanceKm,
}: {
  v: Venue;
  onClose?: () => void;
  distanceKm?: number;
}) {
  const [popup, setPopup] = useState<null | {
    type: "name" | "address";
    value: string;
  }>(null);
  const [copied, setCopied] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [lang, setLang] = useState("zh");
  const showJa = lang.startsWith("ja");
  const showKo = lang.startsWith("ko");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(navigator.language || "zh");
    }
  }, []);

  if (!v) return null;

  // 取多语言名
  const nameZh = v.name?.zh;
  const nameEn = v.name?.en;
  const nameJa = v.name?.ja;
  const nameKo = v.name?.ko;

  // 联系方式图标配置
  const contactIcons = [
    v.contacts?.site && {
      key: "site",
      icon: <LinkIcon className="w-6 h-6" />,
      url: v.contacts.site.startsWith("http")
        ? v.contacts.site
        : `https://${v.contacts.site}`,
    },
    v.contacts?.fb && {
      key: "fb",
      icon: <FaFacebook className="w-6 h-6" />,
      url: v.contacts.fb.startsWith("http")
        ? v.contacts.fb
        : `https://facebook.com/${v.contacts.fb}`,
    },
    v.contacts?.ig && {
      key: "ig",
      icon: <FaInstagram className="w-6 h-6" />,
      url: v.contacts.ig.startsWith("http")
        ? v.contacts.ig
        : `https://instagram.com/${v.contacts.ig}`,
    },
    v.contacts?.twitter && {
      key: "twitter",
      icon: <FaTwitter className="w-6 h-6" />,
      url: v.contacts.twitter.startsWith("http")
        ? v.contacts.twitter
        : `https://twitter.com/${v.contacts.twitter}`,
    },
    v.contacts?.tel && {
      key: "tel",
      icon: <PhoneIcon className="w-6 h-6" />,
      url: `tel:${v.contacts.tel}`,
    },
  ].filter((c): c is { key: string; icon: React.ReactElement; url: string } =>
    Boolean(c),
  );

  // 导航弹窗选项
  const mapOptions: { name: string; url: string }[] = [
    {
      name: "Apple Maps",
      url: `http://maps.apple.com/?daddr=${encodeURIComponent(v.address)}`,
    },
    {
      name: "Google Maps",
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(v.address)}`,
    },
    {
      name: "高德地图",
      url: `https://uri.amap.com/marker?position=${v.lng},${v.lat}&name=${encodeURIComponent(v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "")}`,
    },
    {
      name: "Kakao Map",
      url: `https://map.kakao.com/link/map/${encodeURIComponent(v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "")},${v.lat},${v.lng}`,
    },
    {
      name: "Naver Map",
      url: `https://map.naver.com/v5/search/${encodeURIComponent(v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "")}?c=${v.lng},${v.lat},16,0,0,0,dh`,
    },
  ];

  // 标签到图标的映射
  const servingIcons: Record<string, React.ReactNode> = {
    espresso: <FaCoffee size={28} />,
    "filter coffee": <GiCoffeeCup size={28} />,
    breakfast: <MdFreeBreakfast size={28} />,
    lunch: <FaUtensils size={28} />,
    "cold brew/drip": <FaGlassWhiskey size={28} />,
    "batch brew": <BsCupHot size={28} />,
    "hand brew": <GiCoffeeBeans size={28} />,
    "nitro coffee": <FaCloud size={28} />,
    "decaf coffee": <FaMugHot size={28} />,
    "plant-based milk": <GiMilkCarton size={28} />,
    "vegan options": <FaLeaf size={28} />,
    beer: <GiBeerStein size={28} />,
    croissant: <GiCroissant size={28} />,
    dessert: <FaIceCream size={28} />,
  };
  const serviceIcons: Record<string, React.ReactNode> = {
    "free wifi": <FaWifi size={28} />,
    "laptop friendly": <FaLaptop size={28} />,
    "credit cards": <FaCreditCard size={28} />,
    "kids friendly": <FaChild size={28} />,
    "dog friendly": <FaDog size={28} />,
    "outdoor seating": <MdOutdoorGrill size={28} />,
    wheelchair: <FaWheelchair size={28} />,
  };

  // 分享逻辑
  const handleShare = async () => {
    const displayName =
      v.name?.zh || v.name?.en || v.name?.ja || v.name?.ko || "";
    const shareText = `${displayName}\n${v.address}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: shareText,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <main className="pb-32 space-y-6">
      {/* 顶部图片+下滑按钮+渐变（仅有图片时显示） */}
      {v.image_url && (
        <div className="relative w-full">
          <img
            src={v.image_url}
            alt={nameZh || nameEn || nameJa || nameKo || "No Name"}
            className="w-full h-56 object-cover rounded-b-3xl"
          />
          {/* 左上角下滑按钮（白底黑icon，显眼） */}
          {onClose && (
            <button
              className="absolute top-4 left-4 z-10 bg-white rounded-full p-2 shadow-card border border-black/10"
              onClick={onClose}
              aria-label="Close"
            >
              <ChevronDown className="w-6 h-6 text-black" />
            </button>
          )}
          {/* 图片底部渐变 */}
          <div
            className="absolute left-0 right-0 bottom-0 h-24 rounded-b-3xl pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #ffe4ec 100%)",
            }}
          />
        </div>
      )}
      {/* 店名与多语言名 */}
      <div className={v.image_url ? "-mt-12 px-6" : "px-6 pt-6"}>
        <div className="flex items-center justify-between text-2xl font-bold text-inkblack">
          <span>{nameZh}</span>
          <FavoriteButton
            venueId={v.id}
            size={28}
            className="border-2 border-pinkaccent text-pinkaccent bg-white hover:bg-pinkaccent hover:text-white transition-colors shadow-card rounded-full p-1"
          />
        </div>
        {nameEn && (
          <div className="text-base text-gray-500 mt-1 text-left">{nameEn}</div>
        )}
        {showJa && nameJa && (
          <div className="text-base text-gray-500 mt-1 text-left">{nameJa}</div>
        )}
        {showKo && nameKo && (
          <div className="text-base text-gray-500 mt-1 text-left">{nameKo}</div>
        )}
        {/* 距离与地址 */}
        <div className="flex items-center gap-2 mt-3 text-left">
          {typeof distanceKm === "number" && (
            <span className="text-sm text-inkblack font-medium">
              {distanceKm.toFixed(1)} km
            </span>
          )}
          <span
            className="text-sm text-gray-700 truncate cursor-pointer"
            style={{ maxWidth: "70vw" }}
            title={v.address}
            onClick={() => setPopup({ type: "address", value: v.address })}
          >
            {v.address}
          </span>
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
            <div className="mb-4 break-words text-gray-900 text-base">
              {popup.value}
            </div>
            <button
              className="w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              onClick={async () => {
                await navigator.clipboard.writeText(popup.value);
                setPopup(null);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              复制{popup.type === "name" ? "店名" : "地址"}
            </button>
          </div>
        </div>
      )}
      {/* 复制成功提示 */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow z-50 text-sm">
          已复制
        </div>
      )}

      {/* Opening hours 简单展示 */}
      {Array.isArray(v.hours?.default) && v.hours.default.length > 0 && (
        <section className="px-6 mt-6">
          <h2 className="font-semibold mb-2 text-inkblack text-left">
            Opening hours
          </h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {v.hours.default.map(([day, open, close], index: number) => (
              <li key={index}>
                <span className="inline-block w-16">{day || "未知"}</span>
                {open && close ? `${open} – ${close}` : "Closed"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 联系方式图标区 */}
      {contactIcons.length > 0 && (
        <div className="flex gap-4 my-4 px-6">
          {contactIcons.map((c) => (
            <a
              key={c.key}
              href={c.url}
              target={c.key === "tel" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="rounded-full bg-gray-100 p-3 hover:bg-gray-200 transition"
            >
              {c.icon}
            </a>
          ))}
        </div>
      )}

      {/* Serving */}
      {Array.isArray(v.serving) && v.serving.length > 0 && (
        <section className="mt-6 px-6">
          <h2 className="font-semibold mb-2 text-inkblack text-left">
            Serving
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {v.serving.map((tag: string) => (
              <div
                key={tag}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50"
              >
                <span>
                  {servingIcons[tag.toLowerCase()] || <FaCoffee size={24} />}
                </span>
                <span className="mt-1 text-xs text-center break-words">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {Array.isArray(v.services) && v.services.length > 0 && (
        <section className="mt-6 px-6">
          <h2 className="font-semibold mb-2 text-inkblack text-left">
            Services
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {v.services.map((tag: string) => (
              <div
                key={tag}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50"
              >
                <span>
                  {serviceIcons[tag.toLowerCase()] || <FaCoffee size={24} />}
                </span>
                <span className="mt-1 text-xs text-center break-words">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 底部按钮区：主题色保持一致 */}
      <div className="fixed left-0 right-0 bottom-0 z-30 bg-white p-4 flex flex-col gap-3 border-t">
        <button
          className="w-full py-3 rounded-full bg-pinkaccent text-white font-bold text-lg shadow hover:bg-pink-600 active:bg-pink-700 transition"
          onClick={() => setNavOpen(true)}
        >
          Navigate
        </button>
        <button
          className="w-full py-3 rounded-full border-2 border-pinkaccent text-pinkaccent font-bold text-lg hover:bg-pink-50 transition"
          onClick={handleShare}
        >
          Share
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
            <div className="mb-4 font-semibold text-lg">选择地图应用</div>
            <div className="flex flex-col gap-3">
              {mapOptions.map((opt) => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded bg-pinkaccent text-white text-center font-semibold hover:bg-pink-500 transition"
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
