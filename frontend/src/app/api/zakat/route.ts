import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_URL}/api/zakat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
