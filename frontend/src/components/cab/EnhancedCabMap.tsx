'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom DivIcons with Sleek Dark Theme Styling ───────────────────────────
const createBadgeIcon = (text: string, bgColor: string, borderColor: string = '#ffffff') => {
  return new L.DivIcon({
    className: 'custom-map-badge',
    html: `<div style="
      background: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 0 20px ${bgColor}90, 0 4px 12px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 13px;
      font-family: sans-serif;
    ">${text}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const pickupIcon = createBadgeIcon('A', '#10B981');
const dropIcon = createBadgeIcon('B', '#EF4444');
const stop1Icon = createBadgeIcon('1', '#F59E0B');
const stop2Icon = createBadgeIcon('2', '#F59E0B');

const driverIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `<div style="
    background: #0F172A;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: 2px solid #3B82F6;
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.4), 0 4px 10px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
  ">🚕</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const selectedDriverIcon = new L.DivIcon({
  className: 'custom-selected-driver-marker',
  html: `<div style="
    background: #1E3A8A;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 3px solid #38BDF8;
    box-shadow: 0 0 24px rgba(56, 189, 248, 0.8), 0 4px 14px rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    animation: pulse 1.5s infinite;
  ">🚕</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const movingVehicleIcon = new L.DivIcon({
  className: 'custom-moving-car-marker',
  html: `<div style="
    background: linear-gradient(135deg, #2563EB, #06B6D4);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3.5px solid #FFFFFF;
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.9), 0 8px 24px rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  ">🚘</div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// ─── Auto-fit Map View Controller ───────────────────────────────────────────
function MapViewManager({
  center,
  bounds,
  zoom,
}: {
  center?: [number, number];
  bounds?: L.LatLngBoundsExpression;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    } else if (center) {
      map.setView(center, zoom || 14, { animate: true });
    }
  }, [center, bounds, zoom, map]);

  return null;
}

// ─── Component Props ────────────────────────────────────────────────────────
export interface LocationMarker {
  address: string;
  lat: number;
  lng: number;
}

export interface DriverMarkerItem {
  id: string;
  name: string;
  vehicleModel: string;
  vehicleNo: string;
  rating: number;
  eta: string;
  lat: number;
  lng: number;
  category?: string;
  phone?: string;
}

interface EnhancedCabMapProps {
  center: [number, number];
  pickup?: LocationMarker | null;
  drop?: LocationMarker | null;
  stops?: LocationMarker[];
  drivers?: DriverMarkerItem[];
  selectedDriverId?: string | null;
  onSelectDriver?: (id: string) => void;
  routePoints?: [number, number][] | null;
  currentCarPos?: [number, number] | null;
  isMoving?: boolean;
  statusLabel?: string;
}

export default function EnhancedCabMap({
  center,
  pickup,
  drop,
  stops = [],
  drivers = [],
  selectedDriverId,
  onSelectDriver,
  routePoints,
  currentCarPos,
  isMoving = false,
  statusLabel,
}: EnhancedCabMapProps) {
  // Compute bounds when coordinates exist
  const bounds = useMemo(() => {
    const latLngs: [number, number][] = [];

    if (currentCarPos) {
      latLngs.push(currentCarPos);
    }
    if (pickup?.lat && pickup?.lng) {
      latLngs.push([pickup.lat, pickup.lng]);
    }
    if (stops && stops.length > 0) {
      stops.forEach((s) => {
        if (s.lat && s.lng) latLngs.push([s.lat, s.lng]);
      });
    }
    if (drop?.lat && drop?.lng) {
      latLngs.push([drop.lat, drop.lng]);
    }

    if (latLngs.length >= 2) {
      return L.latLngBounds(latLngs);
    }
    return undefined;
  }, [pickup, drop, stops, currentCarPos]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-[#07090E]">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#06090E' }}
      >
        <MapViewManager center={center} bounds={bounds} />

        {/* CartoDB High-Contrast Dark Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Pickup Marker (A) */}
        {pickup?.lat && pickup?.lng && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup className="vito-map-popup">
              <div className="p-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                  Pickup Location (A)
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{pickup.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Additional Stops (1, 2) */}
        {stops.map((stop, idx) => {
          if (!stop.lat || !stop.lng) return null;
          const stopIcon = idx === 0 ? stop1Icon : stop2Icon;
          return (
            <Marker key={idx} position={[stop.lat, stop.lng]} icon={stopIcon}>
              <Popup className="vito-map-popup">
                <div className="p-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block">
                    Stop {idx + 1}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{stop.address}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Drop Marker (B) */}
        {drop?.lat && drop?.lng && (
          <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
            <Popup className="vito-map-popup">
              <div className="p-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
                  Destination (B)
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{drop.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Drivers */}
        {!isMoving &&
          drivers.map((driver) => {
            const isSelected = selectedDriverId === driver.id;
            return (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                icon={isSelected ? selectedDriverIcon : driverIcon}
                eventHandlers={{
                  click: () => onSelectDriver?.(driver.id),
                }}
              >
                <Popup className="vito-map-popup">
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-blue-600">{driver.name}</span>
                      <span className="text-[10px] font-bold text-amber-600">★ {driver.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold">{driver.vehicleModel} · {driver.vehicleNo}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{driver.eta} away</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Route Line */}
        {routePoints && routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#3B82F6',
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Moving Active Car */}
        {isMoving && currentCarPos && (
          <Marker position={currentCarPos} icon={movingVehicleIcon}>
            <Popup className="vito-map-popup">
              <div className="p-1 text-center">
                <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider block">
                  {statusLabel || 'Vehicle in Motion'}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Status Pill */}
      {statusLabel && (
        <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{statusLabel}</span>
        </div>
      )}
    </div>
  );
}
