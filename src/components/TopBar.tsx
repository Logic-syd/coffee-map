'use client';
import { Bars3Icon, MapIcon } from '@heroicons/react/24/solid';

type Props = {
  onToggleDrawer: () => void;
  onToggleView: () => void;
  isMap: boolean;
};

export default function TopBar({ onToggleDrawer, onToggleView, isMap }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-20 bg-white">
      <button onClick={onToggleDrawer}>
        <Bars3Icon className="w-7 h-7 text-indigo-700" />
      </button>

      <input
        type="text"
        placeholder="Search"
        className="flex-1 rounded-full bg-gray-100 px-4 py-1 text-sm focus:outline-none"
      />

      <button onClick={onToggleView}>
        <MapIcon
          className={`w-7 h-7 ${isMap ? 'text-indigo-700' : 'text-gray-500'}`}
        />
      </button>
    </div>
  );
}
