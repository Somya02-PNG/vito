'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom DivIcons with Locked VITO Styling ───────────────────────────────
const createBadgeIcon = (text: string, bgColor: string, borderColor: string = '#ffffff') => {
  return new L.DivIcon({
    className: 'custom-map-badge',
    html: `<div style="
      background: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 4px 14px rgba(7, 17, 31, 0.25);
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

const pickupIcon = createBadgeIcon('A', '#16A67A'); // --vito-success
const dropIcon = createBadgeIcon('B', '#E5484D');   // --vito-danger
const stop1Icon = createBadgeIcon('1', '#F4A340');  // --vito-warning
const stop2Icon = createBadgeIcon('2', '#F4A340');  // --vito-warning

const driverIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `<div style="
    background: #07111F;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 2px solid #00C2B3;
    box-shadow: 0 4px 14px rgba(0, 194, 179, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
  ">🚗</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const selectedDriverIcon = (etaText: string = '2 min') =>
  new L.DivIcon({
    className: 'custom-selected-driver-marker',
    html: `<div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    ">
      <div style="
        background: #07111F;
        color: #00C2B3;
        font-weight: 800;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 9999px;
        border: 1px solid #00C2B3;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">🚗 ${etaText}</div>
      <div style="
        background: #07111F;
        width: 40px;
        height: 40px;
        border-radius: 14px;
        border: 3px solid #00C2B3;
        box-shadow: 0 0 20px rgba(0, 194, 179, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      ">🚘</div>
    </div>`,
    iconSize: [60, 64],
    iconAnchor: [30, 48],
  });

const movingVehicleIcon = (etaText: string = 'Live') =>
  new L.DivIcon({
    className: 'custom-moving-car-marker',
    html: `<div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    ">
      <div style="
        background: #07111F;
        color: #FFFFFF;
        font-weight: 800;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 9999px;
        border: 1px solid #00C2B3;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">🚗 ${etaText}</div>
      <div style="
        background: #07111F;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3.5px solid #00C2B3;
        box-shadow: 0 0 24px rgba(0, 194, 179, 0.8), 0 8px 20px rgba(7, 17, 31, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
      ">🚘</div>
    </div>`,
    iconSize: [60, 68],
    iconAnchor: [30, 52],
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
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch {}
    } else if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [map, bounds, center, zoom]);

  return null;
}

// ─── EnhancedCabMap Component Props ─────────────────────────────────────────
interface LocationCoord {
  lat: number;
  lng: number;
  address?: string;
}

interface NearbyDriverCoord {
  id: string;
  lat: number;
  lng: number;
  name: string;
  vehicleModel?: string;
  rating?: number;
  eta?: string;
}

interface EnhancedCabMapProps {
  center?: [number, number];
  pickup?: LocationCoord | null;
  drop?: LocationCoord | null;
  stops?: LocationCoord[];
  nearbyDrivers?: NearbyDriverCoord[];
  drivers?: any[];
  selectedDriver?: NearbyDriverCoord | null;
  selectedDriverId?: string | null;
  movingVehiclePos?: [number, number] | null;
  currentCarPos?: [number, number] | null;
  routePolyline?: [number, number][];
  routePoints?: [number, number][] | null;
  isMoving?: boolean;
  statusLabel?: string;
  activeStep?: string;
  liveEtaText?: string;
  speedKmh?: number;
  distanceRemainingKm?: number;
  timeRemainingMin?: number;
  className?: string;
}

export default function EnhancedCabMap({
  center,
  pickup,
  drop,
  stops = [],
  nearbyDrivers = [],
  drivers = [],
  selectedDriver,
  selectedDriverId,
  movingVehiclePos,
  currentCarPos,
  routePolyline = [],
  routePoints,
  isMoving,
  statusLabel,
  activeStep = 'RIDE_ENTRY',
  liveEtaText = '2 min',
  speedKmh = 38,
  distanceRemainingKm,
  timeRemainingMin,
  className = '',
}: EnhancedCabMapProps) {
  // Default Center (New Delhi City Center)
  const defaultCenter: [number, number] = [28.6315, 77.2167];

  const resolvedNearby = nearbyDrivers.length > 0 ? nearbyDrivers : (drivers as any[]) || [];
  const resolvedMovingPos = movingVehiclePos || currentCarPos;
  const resolvedPolyline = routePolyline.length > 0 ? routePolyline : routePoints || [];

  const mapCenter: [number, number] = useMemo(() => {
    if (resolvedMovingPos) return resolvedMovingPos;
    if (selectedDriver) return [selectedDriver.lat, selectedDriver.lng];
    if (pickup) return [pickup.lat, pickup.lng];
    if (center) return center;
    return defaultCenter;
  }, [resolvedMovingPos, selectedDriver, pickup, center]);

  const mapBounds = useMemo(() => {
    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (drop) points.push([drop.lat, drop.lng]);
    stops.forEach((s) => points.push([s.lat, s.lng]));
    if (resolvedMovingPos) points.push(resolvedMovingPos);
    if (selectedDriver) points.push([selectedDriver.lat, selectedDriver.lng]);

    if (points.length >= 2) {
      return L.latLngBounds(points);
    }
    return undefined;
  }, [pickup, drop, stops, resolvedMovingPos, selectedDriver]);

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_8px_30px_rgba(7,17,31,0.06)] bg-[#F7F9FC] ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '480px', zIndex: 1 }}
      >
        {/* Soft-Light / Carto Voyager Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapViewManager center={mapCenter} bounds={mapBounds} zoom={14} />

        {/* Pickup Marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup className="custom-vito-popup">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#16A67A] uppercase tracking-wider block">
                  Pickup Location
                </span>
                <p className="text-xs font-bold text-[#0B1728] mt-0.5">
                  {pickup.address || 'Current Location'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Multi-Stop Markers */}
        {stops.map((stop, i) => (
          <Marker
            key={i}
            position={[stop.lat, stop.lng]}
            icon={i === 0 ? stop1Icon : stop2Icon}
          >
            <Popup className="custom-vito-popup">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#F4A340] uppercase tracking-wider block">
                  Stop {i + 1}
                </span>
                <p className="text-xs font-bold text-[#0B1728] mt-0.5">
                  {stop.address}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Drop Marker */}
        {drop && (
          <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
            <Popup className="custom-vito-popup">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#E5484D] uppercase tracking-wider block">
                  Destination
                </span>
                <p className="text-xs font-bold text-[#0B1728] mt-0.5">
                  {drop.address}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Drivers */}
        {!selectedDriver &&
          !movingVehiclePos &&
          nearbyDrivers.map((driver) => (
            <Marker
              key={driver.id}
              position={[driver.lat, driver.lng]}
              icon={driverIcon}
            >
              <Popup className="custom-vito-popup">
                <div className="p-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0B1728]">{driver.name}</span>
                    <span className="text-[10px] text-[#C9A45C] font-bold">⭐ {driver.rating || 4.9}</span>
                  </div>
                  <p className="text-[11px] text-[#526174]">
                    {driver.vehicleModel || 'Sedan'} · {driver.eta || '3 min away'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Selected Driver En Route Marker */}
        {selectedDriver && !movingVehiclePos && (
          <Marker
            position={[selectedDriver.lat, selectedDriver.lng]}
            icon={selectedDriverIcon(liveEtaText)}
          >
            <Popup className="custom-vito-popup">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#00A99D] uppercase tracking-wider block">
                  Assigned Driver
                </span>
                <p className="text-xs font-bold text-[#0B1728] mt-0.5">{selectedDriver.name}</p>
                <p className="text-[11px] text-[#526174]">{selectedDriver.vehicleModel}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Moving Active Trip Vehicle */}
        {movingVehiclePos && (
          <Marker position={movingVehiclePos} icon={movingVehicleIcon(liveEtaText)}>
            <Popup className="custom-vito-popup">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#00A99D] uppercase tracking-wider block">
                  Active Ride
                </span>
                <p className="text-xs font-bold text-[#0B1728] mt-0.5">Speed: {speedKmh} km/h</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline (Teal VITO Route Line) */}
        {routePolyline.length > 0 && (
          <>
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#00C2B3',
                weight: 5,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#07111F',
                weight: 8,
                opacity: 0.15,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating Minimal Glass Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="px-3 py-1.5 rounded-full vito-glass text-xs font-bold text-[#0B1728] dark:text-white shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16A67A] animate-pulse" />
          <span>GPS Active</span>
        </div>
      </div>

      {/* Active Trip Telemetry Pill Overlay */}
      {activeStep === 'ACTIVE_TRIP' && (
        <div className="absolute bottom-4 left-4 right-4 z-10 p-3.5 rounded-2xl vito-glass text-[#0B1728] dark:text-white shadow-lg flex items-center justify-around gap-2 text-center border border-[#00C2B3]/30">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#8995A5] block">Speed</span>
            <span className="text-sm font-black text-[#0B1728] dark:text-white">{speedKmh} km/h</span>
          </div>
          <div className="h-6 w-px bg-[#E5EAF0] dark:bg-[#17334F]" />
          <div>
            <span className="text-[10px] font-bold uppercase text-[#8995A5] block">Distance Left</span>
            <span className="text-sm font-black text-[#00A99D]">{distanceRemainingKm ?? 8.4} km</span>
          </div>
          <div className="h-6 w-px bg-[#E5EAF0] dark:bg-[#17334F]" />
          <div>
            <span className="text-[10px] font-bold uppercase text-[#8995A5] block">ETA</span>
            <span className="text-sm font-black text-[#16A67A]">{timeRemainingMin ?? 18} mins</span>
          </div>
        </div>
      )}
    </div>
  );
}
