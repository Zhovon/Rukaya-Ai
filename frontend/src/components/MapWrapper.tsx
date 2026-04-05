"use client";

import dynamic from 'next/dynamic';

const MapNoSSR = dynamic(() => import('./AdminMap'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-emerald-500 font-medium">Loading Map Coordinates...</div>
});

export default function MapWrapper() {
  return <MapNoSSR />;
}
