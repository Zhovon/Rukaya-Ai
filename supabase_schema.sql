-- Run this in the Supabase SQL Editor

CREATE TABLE public.live_locations (
  id UUID PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to upsert their location
-- (This lets the public Next.js site send location data)
CREATE POLICY "Allow anonymous upsert" 
ON public.live_locations 
FOR ALL 
TO anon 
USING (true)
WITH CHECK (true);
