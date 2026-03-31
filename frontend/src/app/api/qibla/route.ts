import { NextRequest, NextResponse } from 'next/server';
import { calcQibla } from '@/lib/islamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }
  const result = calcQibla(lat, lon);
  return NextResponse.json({ bearing: result.bearing, distance_km: result.distanceKm, makkah: { lat: 21.4225, lon: 39.8262 } });
}
