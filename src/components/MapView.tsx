'use client';
import dynamic from 'next/dynamic';
import 'maplibre-gl/dist/maplibre-gl.css';

// 用到的是 react-map-gl 的 “maplibre 子路径”
const Map = dynamic(() => import('react-map-gl/maplibre').then(m => m.default), {
  ssr: false
});

export default function MapView() {
  return (
    <div className="fixed inset-0 z-10">
      <Map
        mapLib={import('maplibre-gl')}              // ← 告诉它走 MapLibre
        initialViewState={{
          longitude: 121.47,   // 上海经纬度，按需改
          latitude: 31.23,
          zoom: 12
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        // ↑ 这是 Carto 公开免费瓦片，也可以换成
        //    Stadia / MapTiler / 你自己的 mbtiles URL
      />
    </div>
  );
}
