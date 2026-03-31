import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  try {
    const res = await fetch(`${BACKEND_URL}/api/qibla?lat=${lat}&lon=${lon}`);
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
