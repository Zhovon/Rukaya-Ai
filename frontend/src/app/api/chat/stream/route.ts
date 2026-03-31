import { NextRequest } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!backendRes.ok || !backendRes.body) {
      return new Response(JSON.stringify({ error: 'Backend unavailable' }), { status: 502 });
    }
    return new Response(backendRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Backend unavailable' }), { status: 502 });
  }
}
