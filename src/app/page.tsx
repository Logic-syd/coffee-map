'use client';
import { useState } from 'react';
import Link from 'next/link';
import { venues } from '@/data/sample-venues';
import TopBar from '@/components/TopBar';
import FilterBar from '@/components/FilterBar';
import CafeCard from '@/components/CafeCard';
import DrawerMenu from '@/components/DrawerMenu';
import MapView from '@/components/MapView';

export default function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapMode, setMapMode] = useState(false);

  return (
    <>
      <TopBar
        onToggleDrawer={() => setDrawerOpen(true)}
        onToggleView={() => setMapMode(!mapMode)}
        isMap={mapMode}
      />
      <FilterBar />

      <main className="p-4 space-y-4 pb-24">
        {venues.map(v => (
        // ① 把每个卡片包在 Link 里
        <Link href={`/venue/${v.id}`} key={v.id} className="block">
          <CafeCard v={v} />
        </Link>
      ))}
      </main>

      {/* 抽屉 & 地图覆盖层 */}
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {mapMode && <MapView />}
    </>
  );
}
