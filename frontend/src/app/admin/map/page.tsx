import dynamic from 'next/dynamic';

export const metadata = {
  title: "Live Locations | Rukaya AI",
};

// Next.js dynamic import ensures Leaflet doesn't try to access `window` on the server build
const MapNoSSR = dynamic(() => import('@/components/AdminMap'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-emerald-500 font-medium">Loading Map Coordinates...</div>
});

export default async function AdminMapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sParams = await searchParams;
  
  // Basic security: require ?pwd=YOUR_PASSWORD in the URL
  const adminPassword = process.env.ADMIN_PASSWORD_MAP;
  
  if (adminPassword && sParams.pwd !== adminPassword) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl shadow-lg">
          <h2 className="font-bold text-lg mb-1">Unauthorized Access</h2>
          <p className="text-sm opacity-90">You must provide the correct password to view the live tracking map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-900 overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 shadow-sm">
        <h1 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          Live User Locations
        </h1>
        <div className="text-xs font-medium text-slate-400">
          Last 24 Hours
        </div>
      </header>
      
      <main className="flex-1 w-full bg-slate-800 relative z-0">
        <MapNoSSR />
      </main>
    </div>
  );
}
