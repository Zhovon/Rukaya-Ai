import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
