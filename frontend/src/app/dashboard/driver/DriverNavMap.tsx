'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom Navigation Icons ────────────────────────────────────────────────
const driverPosIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: linear-gradient(135deg, #10B981, #059669); width: 40px; height: 40px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 22px rgba(16, 185, 129, 0.9); flex-items: center; display: flex; justify-content: center; font-size: 22px;">🚘</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const pickupIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: #3B82F6; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(59, 130, 246, 0.7); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">A</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: #EF4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(239, 68, 68, 0.7); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">B</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapViewRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface DriverNavMapProps {
  center: [number, number];
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  pickupAddress?: string;
  dropAddress?: string;
}

export default function DriverNavMap({
  center,
  pickupLat = 28.6315,
  pickupLng = 77.2167,
  dropLat = 28.5562,
  dropLng = 77.1000,
  pickupAddress = 'Pickup Point',
  dropAddress = 'Drop Destination',
}: DriverNavMapProps) {
  const routePoints: [number, number][] = [
    [pickupLat, pickupLng],
    [(pickupLat + dropLat) / 2 + 0.005, (pickupLng + dropLng) / 2 - 0.003],
    [dropLat, dropLng],
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="w-full h-full z-0"
      style={{ background: '#07090E' }}
    >
      <MapViewRecenter center={center} />

      <TileLayer
        attribution='&copy; <a href="https://www.carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Route Path */}
      <Polyline
        positions={routePoints}
        pathOptions={{ color: '#10B981', weight: 6, opacity: 0.8 }}
      />

      {/* Pickup */}
      <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
        <Popup>
          <div className="text-xs font-bold text-gray-900">📍 Pickup: {pickupAddress}</div>
        </Popup>
      </Marker>

      {/* Drop */}
      <Marker position={[dropLat, dropLng]} icon={dropIcon}>
        <Popup>
          <div className="text-xs font-bold text-gray-900">🏁 Drop: {dropAddress}</div>
        </Popup>
      </Marker>

      {/* Driver Position Marker */}
      <Marker position={center} icon={driverPosIcon}>
        <Popup>
          <div className="text-xs font-bold text-emerald-600">🚘 Navigation Active</div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
