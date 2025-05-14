import { Venue } from "@/data/sample-venues";

type CafeCardProps = {
  v: {
    id: string;
    name_zh?: string;
    address?: string;
    displayName?: string;
    image_url?: string;
    distance?: number;
    // 其它你需要的字段
    [key: string]: any;
  };
  distanceKm?: number;
};

export default function CafeCard({ v, distanceKm }: CafeCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
        {v.image_url ? (
          <img
            src={v.image_url}
            alt={v.displayName || v.name_zh || ""}
            className="object-cover w-full h-full"
            style={{ aspectRatio: "4/3" }}
          />
        ) : (
          <div
            className="w-full h-full bg-gray-200 flex items-center justify-center"
            style={{ aspectRatio: "4/3" }}
          >
            {/* 可选：放个默认icon或文字 */}
          </div>
        )}
        <div className="absolute left-0 bottom-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent">
          <h3 className="font-semibold text-lg text-white">
            {v.displayName || v.name_zh}
          </h3>
          <p className="text-sm text-gray-500">
            <span className="mr-1">📍</span>
            {v.address}
            {typeof distanceKm === "number" && (
              <> • {distanceKm.toFixed(1)} km</>
            )}
          </p>
        </div>
      </div>
      {/* 你可以在这里加其它内容，比如服务标签等 */}
    </div>
  );
}
