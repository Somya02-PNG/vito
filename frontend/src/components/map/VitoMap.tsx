'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Navigation,
  Plus,
  Minus,
  Crosshair,
  Car,
  Shield,
  Loader2,
} from 'lucide-react';

export interface MapPoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface MapDriver {
  id: string;
  lat: number;
  lng: number;
  heading?: number;
  vehicleType?: string;
  name?: string;
  eta?: string;
  isSelected?: boolean;
}

export interface VitoMapProps {
  pickup: MapPoint | null;
  drop: MapPoint | null;
  stops?: MapPoint[];
  drivers?: MapDriver[];
  activeDriver?: MapDriver | null;
  routeCoordinates?: [number, number][]; // [lng, lat]
  mode?:
    | 'IDLE'
    | 'PICKUP_SELECT'
    | 'DESTINATION_SEARCH'
    | 'ROUTE_PREVIEW'
    | 'VEHICLE_SELECT'
    | 'MATCHING_RADAR'
    | 'DRIVER_ASSIGNED'
    | 'DRIVER_ARRIVING'
    | 'DRIVER_ARRIVED'
    | 'ACTIVE_TRIP'
    | 'TRIP_COMPLETED';
  onPickupChange?: (point: MapPoint) => void;
  onDropChange?: (point: MapPoint) => void;
  className?: string;
}

export default function VitoMap({
  pickup,
  drop,
  stops = [],
  drivers = [],
  activeDriver = null,
  routeCoordinates = [],
  mode = 'IDLE',
  onPickupChange,
  onDropChange,
  className = 'w-full h-full min-h-[400px]',
}: VitoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Markers
  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);
  const driverMarkersMap = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  const activeDriverMarkerRef = useRef<maplibregl.Marker | null>(null);

  // ─── 1. Initialize MapLibre GL ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // VITO Custom High-Contrast Dark Map Style
    const darkStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };

    const initialCenter: [number, number] = pickup
      ? [pickup.lng, pickup.lat]
      : [77.2167, 28.6315]; // Default: Connaught Place, New Delhi

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: darkStyle,
      center: initialCenter,
      zoom: 13.5,
      pitch: 35,
      bearing: -10,
      attributionControl: false,
    });

    instance.on('load', () => {
      // Add Route Source and Layers
      instance.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      // Route Glow Layer
      instance.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00C2B3',
          'line-width': 10,
          'line-opacity': 0.25,
          'line-blur': 4,
        },
      });

      // Route Main Line Layer
      instance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00E5D4',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });

      mapInstance.current = instance;
      setMapLoaded(true);
    });

    return () => {
      instance.remove();
      mapInstance.current = null;
    };
  }, []);

  // ─── 2. Update Pickup Marker ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    if (pickup && typeof pickup.lng === 'number' && typeof pickup.lat === 'number') {
      if (!pickupMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'vito-pickup-pin';
        el.innerHTML = `
          <div style="
            background: #10B981;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 900;
            font-size: 13px;
            font-family: system-ui, sans-serif;
          ">A</div>
        `;

        const marker = new maplibregl.Marker({ element: el, draggable: !!onPickupChange })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(mapInstance.current);

        if (onPickupChange) {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            onPickupChange({ lat: lngLat.lat, lng: lngLat.lng, address: 'Pinned Location' });
          });
        }
        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLngLat([pickup.lng, pickup.lat]);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
  }, [pickup, mapLoaded, onPickupChange]);

  // ─── 3. Update Drop Marker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    if (drop && typeof drop.lng === 'number' && typeof drop.lat === 'number') {
      if (!dropMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'vito-drop-pin';
        el.innerHTML = `
          <div style="
            background: #EF4444;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 900;
            font-size: 13px;
            font-family: system-ui, sans-serif;
          ">B</div>
        `;

        const marker = new maplibregl.Marker({ element: el, draggable: !!onDropChange })
          .setLngLat([drop.lng, drop.lat])
          .addTo(mapInstance.current);

        if (onDropChange) {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            onDropChange({ lat: lngLat.lat, lng: lngLat.lng, address: 'Pinned Destination' });
          });
        }
        dropMarkerRef.current = marker;
      } else {
        dropMarkerRef.current.setLngLat([drop.lng, drop.lat]);
      }
    } else if (dropMarkerRef.current) {
      dropMarkerRef.current.remove();
      dropMarkerRef.current = null;
    }
  }, [drop, mapLoaded, onDropChange]);

  // ─── 4. Update Route Geometry Layer ────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    const source = mapInstance.current.getSource('route-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates || [],
        },
      });
    }
  }, [routeCoordinates, mapLoaded]);

  // ─── 5. Update Nearby & Active Driver Markers ──────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    // A. Clear old nearby driver markers
    const currentIds = new Set(drivers.map((d) => d.id));
    driverMarkersMap.current.forEach((marker: maplibregl.Marker, id: string) => {
      if (!currentIds.has(id)) {
        marker.remove();
        driverMarkersMap.current.delete(id);
      }
    });

    // B. Draw/update nearby drivers (privacy-safe, non-active)
    if (!activeDriver) {
      drivers.forEach((driver) => {
        let marker = driverMarkersMap.current.get(driver.id);
        const heading = driver.heading || 0;

        if (!marker) {
          const el = document.createElement('div');
          el.className = 'vito-driver-marker';
          el.innerHTML = `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 12px;
              background: #0B1728;
              border: 2px solid #00C2B3;
              box-shadow: 0 4px 14px rgba(0, 194, 179, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              transform: rotate(${heading}deg);
              transition: transform 0.3s ease;
            ">🚗</div>
          `;

          marker = new maplibregl.Marker({ element: el })
            .setLngLat([driver.lng, driver.lat])
            .addTo(mapInstance.current!);

          driverMarkersMap.current.set(driver.id, marker);
        } else {
          marker.setLngLat([driver.lng, driver.lat]);
          const inner = marker.getElement().querySelector('div');
          if (inner) inner.style.transform = `rotate(${heading}deg)`;
        }
      });
    }

    // C. Draw active assigned driver (with live pulse & ETA pill)
    if (activeDriver) {
      // Remove all background drivers when trip is active for visual focus
      driverMarkersMap.current.forEach((m: maplibregl.Marker) => m.remove());
      driverMarkersMap.current.clear();

      const heading = activeDriver.heading || 0;
      if (!activeDriverMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'vito-active-driver-marker';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
            <div style="
              background: #07111F;
              color: #00E5D4;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 9999px;
              border: 1px solid #00C2B3;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              white-space: nowrap;
            ">🚘 ${activeDriver.eta || 'En Route'}</div>
            <div style="
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: #0B1728;
              border: 3.5px solid #00E5D4;
              box-shadow: 0 0 24px rgba(0, 229, 212, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              transform: rotate(${heading}deg);
              transition: transform 0.3s ease;
            ">🚖</div>
          </div>
        `;

        activeDriverMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([activeDriver.lng, activeDriver.lat])
          .addTo(mapInstance.current);
      } else {
        activeDriverMarkerRef.current.setLngLat([activeDriver.lng, activeDriver.lat]);
        const inner = activeDriverMarkerRef.current.getElement().querySelector('div > div:nth-child(2)') as HTMLElement;
        if (inner) inner.style.transform = `rotate(${heading}deg)`;
      }
    } else if (activeDriverMarkerRef.current) {
      activeDriverMarkerRef.current.remove();
      activeDriverMarkerRef.current = null;
    }
  }, [drivers, activeDriver, mapLoaded]);

  // ─── 6. Smart Camera Bounds Controller ─────────────────────────────────────
  const fitRouteBounds = useCallback(() => {
    if (!mapInstance.current || !mapLoaded) return;

    if (pickup && drop) {
      const bounds = new maplibregl.LngLatBounds([pickup.lng, pickup.lat], [drop.lng, drop.lat]);

      if (activeDriver) {
        bounds.extend([activeDriver.lng, activeDriver.lat]);
      }

      routeCoordinates.forEach((coord) => bounds.extend(coord));

      mapInstance.current.fitBounds(bounds, {
        padding: { top: 70, bottom: 90, left: 60, right: 60 },
        maxZoom: 16,
        duration: 1200,
      });
    } else if (pickup) {
      mapInstance.current.flyTo({
        center: [pickup.lng, pickup.lat],
        zoom: 14.5,
        duration: 1000,
      });
    }
  }, [pickup, drop, activeDriver, routeCoordinates, mapLoaded]);

  useEffect(() => {
    fitRouteBounds();
  }, [fitRouteBounds]);

  // Recenter to Current Location
  const handleRecenter = () => {
    if (!mapInstance.current) return;
    if (pickup) {
      mapInstance.current.flyTo({ center: [pickup.lng, pickup.lat], zoom: 15, duration: 800 });
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-[#07090E] ${className}`}>
      {/* MapLibre DOM Node */}
      <div ref={mapContainer} className="w-full h-full min-h-[450px]" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-xl bg-[#0B1728]/90 hover:bg-[#11243A] text-white border border-white/10 shadow-lg backdrop-blur-md transition-all active:scale-95"
          title="Recenter to Pickup Location"
        >
          <Crosshair className="w-4 h-4 text-[#00C2B3]" />
        </button>

        <button
          onClick={() => mapInstance.current?.zoomIn({ duration: 300 })}
          className="p-2.5 rounded-xl bg-[#0B1728]/90 hover:bg-[#11243A] text-white border border-white/10 shadow-lg backdrop-blur-md transition-all active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => mapInstance.current?.zoomOut({ duration: 300 })}
          className="p-2.5 rounded-xl bg-[#0B1728]/90 hover:bg-[#11243A] text-white border border-white/10 shadow-lg backdrop-blur-md transition-all active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Map Mode Status Badge (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07111F]/85 border border-[#00C2B3]/30 backdrop-blur-md text-xs font-bold text-white shadow-xl">
        <span className="w-2 h-2 rounded-full bg-[#00C2B3] animate-pulse" />
        <span className="uppercase tracking-wider text-[11px] text-[#00E5D4]">
          {mode.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}
