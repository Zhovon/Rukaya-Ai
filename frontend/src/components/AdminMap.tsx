"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

// Fix for leaflet default icons in next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface LocationData {
  id: string;
  lat: number;
  lon: number;
  updated_at: string;
}

export default function AdminMap() {
  const [locations, setLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchLocations = async () => {
      // Only get locations updated in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data, error } = await supabase
        .from('live_locations')
        .select('*')
        .gte('updated_at', yesterday.toISOString())
        .order('updated_at', { ascending: false });
        
      if (data) setLocations(data);
    };

    fetchLocations();

    // Subscribe to realtime changes on the table
    const subscription = supabase
      .channel('public:live_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_locations' }, () => {
        fetchLocations(); // Refresh when any location changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={[21.4225, 39.8262]} // Start map centered loosely on Makkah
        zoom={3} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => {
          // Calculate minutes ago
          const diffMs = new Date().getTime() - new Date(loc.updated_at).getTime();
          const minsAgo = Math.round(diffMs / 60000);
          
          return (
            <Marker key={loc.id} position={[loc.lat, loc.lon]} icon={customIcon}>
              <Popup>
                <div className="text-center">
                  <strong>User Device</strong><br />
                  <span className="text-sm text-slate-500">
                    {minsAgo === 0 ? "Just now" : `${minsAgo} min ago`}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
