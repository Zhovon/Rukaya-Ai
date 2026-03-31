// Central backend URL — set BACKEND_URL in Vercel env vars to your Render/Railway URL
// Fallback to localhost for local development
export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';
