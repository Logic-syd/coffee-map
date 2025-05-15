import { useState } from "react";
import FavoriteButton from "@/components/FavoriteButton";

export default function VenueDetail({ v }: { v: any }) {
  const [popup, setPopup] = useState<null | {
    type: "name" | "address";
    value: string;
  }>(null);
  const [copied, setCopied] = useState(false);

  if (!v) return null;
  return (
    <main className="p-6 pb-32 space-y-6">
      {/* 头部：店名 & 地址 */}
      <header className="rounded-lg bg-indigo-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-2xl font-bold truncate cursor-pointer max-w-xs"
              title={v.name_zh || v.name?.zh}
              onClick={() =>
                setPopup({ type: "name", value: v.name_zh || v.name?.zh })
              }
            >
              {v.name_zh || v.name?.zh}
            </div>
            <div
              className="mt-1 text-sm opacity-80 truncate cursor-pointer max-w-xs"
              title={v.address}
              onClick={() => setPopup({ type: "address", value: v.address })}
            >
              📍 {v.address}
            </div>
          </div>
          <FavoriteButton venueId={v.id} />
        </div>
      </header>

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
          {popup?.type === "name" ? "店名已复制" : "地址已复制"}
        </div>
      )}

      {/* Opening hours 简单展示 */}
      {v.hours?.default?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Opening hours</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {v.hours.default.map(([day, open, close]: any[], index: number) => (
              <li key={index}>
                <span className="inline-block w-16">{day || "未知"}</span>
                {open && close ? `${open} – ${close}` : "Closed"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Serving */}
      {v.serving?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Serving</h2>
          <div className="flex flex-wrap gap-2">
            {v.serving.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {v.services?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Services</h2>
          <div className="flex flex-wrap gap-2">
            {v.services.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
