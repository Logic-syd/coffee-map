'use client';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { venues } from '@/data/sample-venues';

export default function VenuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const feature = venues.find(v => v.id === params.id);
  if (!feature) {
    notFound();
  }

  // 添加默认值
  const v = {
    id: feature.id || '',
    name: feature.name || { zh: '未知店铺', ja: '', ko: '' },
    address: feature.address || '地址未知',
    lat: feature.lat || 0,
    lng: feature.lng || 0,
    categories: feature.categories || [],
    serving: feature.serving || [],
    services: feature.services || [],
    tags: feature.tags || [],
    contacts: {
      site: feature.contacts?.site || '',
      ig: feature.contacts?.ig || '',
      fb: feature.contacts?.fb || '',
      tel: feature.contacts?.tel || '',
    },
    hours: {
      default: feature.hours?.default || [],
      exceptions: feature.hours?.exceptions || [],
    },
    status: feature.status || 'unknown',
    image: feature.image || '/placeholder.jpg',
    distance: feature.distance || 0,
  };

  return (
    <main className="p-6 pb-32 space-y-6">
      {/* 返回按钮 */}
      <button 
        onClick={() => router.back()}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
      </button>

      {/* 头部：店名 & 地址 */}
      <header className="rounded-lg bg-indigo-700 text-white p-6">
        <h1 className="text-2xl font-bold">{v.name.zh}</h1>
        <p className="mt-1 text-sm opacity-80">📍 {v.address}</p>
      </header>

      {/* Opening hours 简单展示 */}
      {v.hours.default.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Opening hours</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {v.hours.default.map(([day, open, close], index) => (
              <li key={index}>
                <span className="inline-block w-16">{day || '未知'}</span>
                {open && close ? `${open} – ${close}` : 'Closed'}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Serving */}
      {v.serving.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Serving</h2>
          <div className="flex flex-wrap gap-2">
            {v.serving.map(tag => (
              <span key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {v.services.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Services</h2>
          <div className="flex flex-wrap gap-2">
            {v.services.map(tag => (
              <span key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
