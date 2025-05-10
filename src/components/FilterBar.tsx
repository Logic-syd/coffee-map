'use client';
const filters = ['Open Cafes', 'Breakfast', 'Vegan', 'Late Night'];

export default function FilterBar() {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-white sticky top-[3.25rem] z-10">
      {filters.map(f => (
        <button
          key={f}
          className="flex-shrink-0 rounded-full bg-gray-100 text-sm px-4 py-1 whitespace-nowrap"
        >
          {f}
        </button>
      ))}
    </div>
  );
}
