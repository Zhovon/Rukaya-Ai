"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function LiveLocationTracker() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    // Get or create a unique session ID for this user device
    let sessionId = localStorage.getItem('rukaya_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('rukaya_session_id', sessionId);
    }

    // Function to push location to Supabase
    const updateLocation = async (lat: number, lon: number) => {
      try {
        await supabase
          .from('live_locations')
          .upsert({
            id: sessionId,
            lat,
            lon,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    };

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.log("Could not track location. User may have denied.", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Only push every ~30s if unchanged, though watchPosition handles movement
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return null; // This component doesn't render anything
}
