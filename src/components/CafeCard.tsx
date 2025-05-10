import { Venue } from '@/data/sample-venues';

export default function CafeCard({ v }: { v: Venue }) {
  const badgeColor =
    v.status === 'open'
      ? 'bg-green-500'
      : v.status === 'closing'
      ? 'bg-yellow-400'
      : 'bg-red-500';

  return (
    <div className="rounded-xl overflow-hidden shadow-sm bg-white">
      {/* 封面图 */}
      <div className="relative h-44">
        <img
          src={v.image}
          alt={v.name.zh}
          className="object-cover w-full h-full"
        />
        <span
          className={`absolute top-2 right-2 text-xs text-white px-2 py-0.5 rounded-full ${badgeColor}`}
        >
          {v.status === 'closing' ? 'closing soon' : v.status}
        </span>
      </div>

      {/* 文本区域 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{v.name.zh}</h3>
        <p className="text-sm text-gray-500">
          <span className="mr-1">📍</span>
          {v.distance} m · {v.address}
        </p>
      </div>
    </div>
  );
}
