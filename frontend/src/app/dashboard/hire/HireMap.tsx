'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom Icons ────────────────────────────────────────────────────────────
const pickupIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: #E85D04; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 18px rgba(232, 93, 4, 0.7); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const driverIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: linear-gradient(135deg, #0B3D91, #3B82F6); width: 40px; height: 40px; border-radius: 14px; border: 3px solid #10B981; box-shadow: 0 0 20px rgba(16, 185, 129, 0.8); display: flex; align-items: center; justify-content: center; font-size: 20px;">👨‍✈️</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Auto-recenter map view
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface HireMapProps {
  center: [number, number];
  pickupAddress?: string;
  driverName?: string;
  driverPos?: [number, number];
  isTracking?: boolean;
}

export default function HireMap({
  center,
  pickupAddress = 'Pickup Location',
  driverName = 'Verified Driver',
  driverPos,
  isTracking = false,
}: HireMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={false}
      className="w-full h-full z-0"
      style={{ background: '#07090E' }}
    >
      <MapRecenter center={center} />

      <TileLayer
        attribution='&copy; <a href="https://www.carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Pickup Pin */}
      <Marker position={center} icon={pickupIcon}>
        <Popup>
          <div className="text-xs font-bold text-gray-900">
            📍 Pickup: {pickupAddress}
          </div>
        </Popup>
      </Marker>

      {/* Driver Location Marker & Pulse */}
      {driverPos && (
        <>
          <Circle
            center={driverPos}
            radius={300}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.15,
              weight: 1.5,
            }}
          />
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>
              <div className="text-xs font-bold text-gray-900">
                👨‍✈️ {driverName} (On Duty)
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
