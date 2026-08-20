'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom Icons ────────────────────────────────────────────────────────────
const pickupIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: #10B981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8); flex-items: center; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">A</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const dropIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: #EF4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); flex-items: center; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">B</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const driverIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: #1E293B; width: 34px; height: 34px; border-radius: 12px; border: 2px solid #3B82F6; box-shadow: 0 0 12px rgba(59, 130, 246, 0.5); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚕</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const activeDriverIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: #0B3D91; width: 40px; height: 40px; border-radius: 14px; border: 3px solid #E85D04; box-shadow: 0 0 20px rgba(232, 93, 4, 0.8); display: flex; align-items: center; justify-content: center; font-size: 22px;">🚕</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const movingCarIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: linear-gradient(135deg, #2563EB, #0891B2); width: 44px; height: 44px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 25px rgba(37, 99, 235, 0.9); display: flex; align-items: center; justify-content: center; font-size: 24px;">🚘</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const createStopIcon = (index: number) =>
  new L.DivIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: #F59E0B; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(245, 158, 11, 0.8); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">S${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// ─── Auto-center Map Helper ──────────────────────────────────────────────────
function ChangeView({ center, bounds }: { center?: [number, number]; bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  return null;
}

// ─── Click Listener Component ────────────────────────────────────────────────
function MapClickListener({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// ─── Component Props ─────────────────────────────────────────────────────────
export interface DriverMarker {
  id: string;
  name: string;
  vehicleModel: string;
  vehicleNo: string;
  rating: number;
  eta: string;
  fare: number;
  lat: number;
  lng: number;
  type?: string;
  category?: string;
}

export interface StopLocation {
  address: string;
  lat: number;
  lng: number;
}

interface CabMapProps {
  center: [number, number];
  pickup?: { lat: number; lng: number; address: string } | null;
  drop?: { lat: number; lng: number; address: string } | null;
  stops?: StopLocation[];
  drivers?: DriverMarker[];
  selectedDriverId?: string | null;
  assignedDriverPos?: [number, number] | null;
  onSelectDriver?: (id: string) => void;
  onPickupDragEnd?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  routePoints?: [number, number][] | null;
  driverToPickupPoints?: [number, number][] | null;
  currentCarPos?: [number, number] | null;
  isLiveTrip?: boolean;
}

export default function CabMap({
  center,
  pickup,
  drop,
  stops = [],
  drivers = [],
  selectedDriverId,
  assignedDriverPos,
  onSelectDriver,
  onPickupDragEnd,
  onMapClick,
  routePoints,
  driverToPickupPoints,
  currentCarPos,
  isLiveTrip = false,
}: CabMapProps) {
  // Calculate bounds for fitting view
  const bounds = React.useMemo(() => {
    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (drop) points.push([drop.lat, drop.lng]);
    stops.forEach((s) => points.push([s.lat, s.lng]));
    if (assignedDriverPos) points.push(assignedDriverPos);

    if (points.length >= 2) {
      return L.latLngBounds(points);
    }
    return undefined;
  }, [pickup, drop, stops, assignedDriverPos]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="w-full h-full z-0"
      style={{ background: '#07090E' }}
    >
      <ChangeView center={center} bounds={bounds} />
      <MapClickListener onMapClick={onMapClick} />

      <TileLayer
        attribution='&copy; <a href="https://www.carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Pickup Marker (Draggable) */}
      {pickup && (
        <Marker
          position={[pickup.lat, pickup.lng]}
          icon={pickupIcon}
          draggable={!isLiveTrip}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onPickupDragEnd?.(position.lat, position.lng);
            },
          }}
        >
          <Popup>
            <div className="text-xs font-bold text-gray-800">
              📍 Pickup: {pickup.address}
              <br />
              <span className="text-[10px] text-gray-500 font-normal">Drag marker to change pickup location</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Multi-stops Markers */}
      {stops.map((stop, idx) => (
        <Marker key={`stop-${idx}`} position={[stop.lat, stop.lng]} icon={createStopIcon(idx)}>
          <Popup>
            <div className="text-xs font-bold text-amber-800">
              🛑 Stop {idx + 1}: {stop.address}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Drop Marker */}
      {drop && (
        <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
          <Popup>
            <div className="text-xs font-bold text-gray-800">
              🏁 Destination: {drop.address}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Nearby Driver Markers (Selection Phase) */}
      {!isLiveTrip &&
        !assignedDriverPos &&
        drivers.map((driver) => {
          const isSelected = selectedDriverId === driver.id;
          return (
            <Marker
              key={driver.id}
              position={[driver.lat, driver.lng]}
              icon={isSelected ? activeDriverIcon : driverIcon}
              eventHandlers={{
                click: () => onSelectDriver?.(driver.id),
              }}
            >
              <Popup>
                <div className="text-xs font-bold text-gray-900 space-y-1">
                  <p className="text-sm font-extrabold text-blue-600">{driver.name}</p>
                  <p className="text-gray-600">
                    {driver.vehicleModel} · {driver.vehicleNo}
                  </p>
                  <p className="text-amber-600">
                    ★ {driver.rating.toFixed(1)} · {driver.eta} away
                  </p>
                  <p className="font-bold text-emerald-600">₹{driver.fare}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Assigned Driver Marker (Moving towards pickup) */}
      {!isLiveTrip && assignedDriverPos && (
        <Marker position={assignedDriverPos} icon={activeDriverIcon}>
          <Popup>
            <div className="text-xs font-extrabold text-blue-600">
              🚕 Driver is Arriving at Pickup Point
            </div>
          </Popup>
        </Marker>
      )}

      {/* Polyline: Driver -> Pickup */}
      {!isLiveTrip && driverToPickupPoints && driverToPickupPoints.length > 1 && (
        <Polyline
          positions={driverToPickupPoints}
          pathOptions={{
            color: '#E85D04',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 8',
          }}
        />
      )}

      {/* Route Polyline: Pickup -> Stops -> Drop */}
      {routePoints && routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{
            color: '#3B82F6',
            weight: 5,
            opacity: 0.85,
            dashArray: isLiveTrip ? undefined : '10, 10',
          }}
        />
      )}

      {/* Moving Car Marker during Live Trip */}
      {isLiveTrip && currentCarPos && (
        <Marker position={currentCarPos} icon={movingCarIcon}>
          <Popup>
            <div className="text-xs font-extrabold text-blue-600">
              🚘 Your Cab is En Route
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

