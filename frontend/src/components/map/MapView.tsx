'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';

interface MapViewProps {
  center?: { lat: number; lng: number };
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number } | null;
  driverHeading?: number;
  routeCoords?: { lat: number; lng: number }[] | null;
  nearbyDrivers?: { driverId: string; location: { lat: number; lng: number }; heading?: number }[];
  hotspots?: { lat: number; lng: number; radius: number; label: string }[];
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

declare global {
  interface Window { L: any; }
}

export function MapView({
  center = { lat: 12.9756, lng: 77.6068 },
  pickup,
  dropoff,
  driverLocation,
  driverHeading = 0,
  routeCoords = null,
  nearbyDrivers = [],
  hotspots = [],
  className = '',
  onMapClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lastFittedKeyRef = useRef<string>('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Load Leaflet from CDN (no API key needed)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inject Custom Map Animations CSS
    const id = 'custom-map-styles';
    if (!document.getElementById(id)) {
      const customStyle = document.createElement('style');
      customStyle.id = id;
      customStyle.innerHTML = `
        @keyframes map-pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -20; }
        }
        .map-pulse-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          position: relative;
        }
        .map-pulse-ring {
          width: 24px;
          height: 24px;
          background: rgba(16, 185, 129, 0.45);
          border-radius: 50%;
          position: absolute;
          animation: map-pulse 1.8s ease-out infinite;
        }
        .map-pulse-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
          z-index: 2;
        }
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .rotated-car {
          font-size: 26px;
          line-height: 1;
          transition: transform 0.28s linear;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .animated-route-line {
          stroke-dasharray: 8, 12;
          animation: dash-flow 1.2s linear infinite;
        }
        .dark-leaflet-map {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .smooth-marker {
          transition: transform 0.5s linear !important;
        }
      `;
      document.head.appendChild(customStyle);
    }

    if (window.L) { initMap(); return; }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    script.onerror = () => setError(true);
    document.head.appendChild(script);

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up map instance on unmount to prevent memory leaks and container errors
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (err) {
          console.warn('Failed to remove Leaflet map:', err);
        }
        mapRef.current = null;
      }
    };
  }, []);

  function initMap() {
    if (!containerRef.current || mapRef.current) return;
    try {
      const L = window.L;
      const parsedCenter = parseCoords(center) || { lat: 12.9756, lng: 77.6068 };
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(
        [parsedCenter.lat, parsedCenter.lng], 13
      );
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map);

      // Register map click listener
      map.on('click', (e: any) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapRef.current = map;
      setLoaded(true);
    } catch {
      setError(true);
    }
  }

function parseCoords(coordObj: any): { lat: number; lng: number } | null {
  if (!coordObj) return null;
  const lat = typeof coordObj.lat === 'number' ? coordObj.lat : (typeof coordObj.latitude === 'number' ? coordObj.latitude : undefined);
  const lng = typeof coordObj.lng === 'number' ? coordObj.lng : (typeof coordObj.longitude === 'number' ? coordObj.longitude : undefined);
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  if (coordObj.type === 'Point' && Array.isArray(coordObj.coordinates) && coordObj.coordinates.length >= 2) {
    const lats = coordObj.coordinates[1];
    const lngs = coordObj.coordinates[0];
    if (typeof lats === 'number' && typeof lngs === 'number' && !isNaN(lats) && !isNaN(lngs)) {
      return { lat: lats, lng: lngs };
    }
  }
  if (Array.isArray(coordObj) && coordObj.length >= 2) {
    const val1 = coordObj[0];
    const val2 = coordObj[1];
    if (typeof val1 === 'number' && typeof val2 === 'number' && !isNaN(val1) && !isNaN(val2)) {
      if (Math.abs(val1) < Math.abs(val2)) {
        return { lat: val1, lng: val2 };
      } else {
        return { lat: val2, lng: val1 };
      }
    }
  }
  return null;
}

  // Update markers whenever locations change
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    try {
      const L = window.L;
      const map = mapRef.current;

      // Clear old markers safely
      markersRef.current.forEach(m => {
        try { m.remove(); } catch {}
      });
      markersRef.current = [];

      const bounds: [number, number][] = [];

      const parsedPickup = parseCoords(pickup);
      const parsedDropoff = parseCoords(dropoff);
      const parsedDriver = parseCoords(driverLocation);

      if (parsedPickup) {
        const pulsingIcon = L.divIcon({
          html: `
            <div class="map-pulse-container">
              <div class="map-pulse-ring"></div>
              <div class="map-pulse-dot"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: ''
        });
        const m = L.marker([parsedPickup.lat, parsedPickup.lng], { icon: pulsingIcon })
          .addTo(map).bindPopup('Pickup Location');
        markersRef.current.push(m);
        bounds.push([parsedPickup.lat, parsedPickup.lng]);
      }

      if (parsedDropoff) {
        const m = L.marker([parsedDropoff.lat, parsedDropoff.lng], { icon: makeIcon('📍') })
          .addTo(map).bindPopup('Destination');
        markersRef.current.push(m);
        bounds.push([parsedDropoff.lat, parsedDropoff.lng]);
      }

      // Draw route: OSRM routeCoords (preferred) or direct straight polyline fallback
      if (routeCoords && routeCoords.length > 0) {
        try {
          const pathPoints = routeCoords.map(c => [c.lat, c.lng] as [number, number]);
          const bgRouteLine = L.polyline(pathPoints, {
            color: '#1e3a8a',
            weight: 7,
            opacity: 0.4,
            lineJoin: 'round'
          }).addTo(map);
          markersRef.current.push(bgRouteLine);

          const routeLine = L.polyline(pathPoints, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
            className: 'animated-route-line'
          }).addTo(map);
          markersRef.current.push(routeLine);
          
          routeCoords.forEach(c => bounds.push([c.lat, c.lng]));
        } catch (err) {
          console.error('Error drawing road-based route polyline:', err);
        }
      } else if (parsedPickup && parsedDropoff) {
        try {
          const routeLine = L.polyline(
            [[parsedPickup.lat, parsedPickup.lng], [parsedDropoff.lat, parsedDropoff.lng]],
            { color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '5, 10' }
          ).addTo(map);
          markersRef.current.push(routeLine);
        } catch (err) {
          console.error('Error drawing fallback route line polyline:', err);
        }
      }

      if (parsedDriver) {
        const driverIcon = L.divIcon({
          html: `
            <div class="rotated-car" style="transform: rotate(${driverHeading}deg)">
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(76,99,246,0.5))">
                <circle cx="16" cy="16" r="14" fill="#4c63f6" fill-opacity="0.2" stroke="#4c63f6" stroke-width="2"/>
                <path d="M22 17.5V14.5C22 13.67 21.33 13 20.5 13H11.5C10.67 13 10 13.67 10 14.5V17.5C8.9 17.5 8 18.4 8 19.5V22.5C8 23.05 8.45 23.5 9 23.5H10C10.55 23.5 11 23.05 11 22.5V21.5H21V22.5C21 23.05 21.45 23.5 22 23.5H23C23.55 23.5 24 23.05 24 22.5V19.5C24 18.4 23.1 17.5 22 17.5ZM12 14.5H20V17.5H12V14.5ZM11.5 20.5C10.67 20.5 10 19.83 10 19C10 18.17 10.67 17.5 11.5 17.5C12.33 17.5 13 18.17 13 19C13 19.83 12.33 20.5 11.5 20.5ZM20.5 20.5C19.67 20.5 19 19.83 19 19C19 18.17 19.67 17.5 20.5 17.5C21.33 17.5 22 18.17 22 19C22 19.83 21.33 20.5 20.5 20.5Z" fill="#ffffff"/>
              </svg>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          className: 'smooth-marker'
        });
        const m = L.marker([parsedDriver.lat, parsedDriver.lng], { icon: driverIcon })
          .addTo(map).bindPopup('Driver Location');
        markersRef.current.push(m);
        bounds.push([parsedDriver.lat, parsedDriver.lng]);
      }

      nearbyDrivers.slice(0, 10).forEach(d => {
        const parsedDLoc = parseCoords(d.location);
        if (parsedDLoc) {
          const heading = d.heading || 0;
          const taxiIcon = L.divIcon({
            html: `
              <div class="rotated-car" style="transform: rotate(${heading}deg)">
                <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(245,158,11,0.4))">
                  <circle cx="16" cy="16" r="14" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
                  <path d="M22 17.5V14.5C22 13.67 21.33 13 20.5 13H11.5C10.67 13 10 13.67 10 14.5V17.5C8.9 17.5 8 18.4 8 19.5V22.5C8 23.05 8.45 23.5 9 23.5H10C10.55 23.5 11 23.05 11 22.5V21.5H21V22.5C21 23.05 21.45 23.5 22 23.5H23C23.55 23.5 24 23.05 24 22.5V19.5C24 18.4 23.1 17.5 22 17.5ZM12 14.5H20V17.5H12V14.5ZM11.5 20.5C10.67 20.5 10 19.83 10 19C10 18.17 10.67 17.5 11.5 17.5C12.33 17.5 13 18.17 13 19C13 19.83 12.33 20.5 11.5 20.5ZM20.5 20.5C19.67 20.5 19 19.83 19 19C19 18.17 19.67 17.5 20.5 17.5C21.33 17.5 22 18.17 22 19C22 19.83 21.33 20.5 20.5 20.5Z" fill="#f59e0b"/>
                </svg>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            className: 'smooth-marker'
          });
          const m = L.marker([parsedDLoc.lat, parsedDLoc.lng], { icon: taxiIcon }).addTo(map);
          markersRef.current.push(m);
        }
      });

      if (hotspots && hotspots.length > 0) {
        hotspots.forEach(h => {
          try {
            const circle = L.circle([h.lat, h.lng], {
              color: '#ef4444',
              fillColor: '#f87171',
              fillOpacity: 0.2,
              weight: 2,
              radius: h.radius
            }).addTo(map).bindPopup(`🔥 High Demand: ${h.label}`);
            markersRef.current.push(circle);
          } catch {}
        });
      }

      // Decouple bounds-fitting from driver location updates to prevent map jitter/jumping
      const fitKey = `${parsedPickup?.lat}-${parsedPickup?.lng}-${parsedDropoff?.lat}-${parsedDropoff?.lng}-${routeCoords?.length}`;
      if (fitKey !== lastFittedKeyRef.current) {
        lastFittedKeyRef.current = fitKey;
        if (bounds.length > 1) {
          const zoomOptions = parsedDriver 
            ? { padding: [60, 60], maxZoom: 16 } 
            : { padding: [50, 50], maxZoom: 14 };
          map.fitBounds(bounds, zoomOptions);
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        }
      } else if (parsedDriver) {
        // Smoothly center the map on the moving driver (without resetting zoom/bounds)
        map.panTo([parsedDriver.lat, parsedDriver.lng], { animate: true, duration: 0.5 });
      }
    } catch (err) {
      console.warn('Map rendering failed:', err);
    }
  }, [loaded, pickup, dropoff, driverLocation, driverHeading, routeCoords, nearbyDrivers, hotspots]);

  // Center map when center prop changes
  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const parsedCenter = parseCoords(center);
    if (parsedCenter) {
      try {
        mapRef.current.setView([parsedCenter.lat, parsedCenter.lng], mapRef.current.getZoom() || 13);
      } catch (err) {
        console.warn('Failed to center map view:', err);
      }
    }
  }, [center, loaded]);

  if (error) {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-surface-50 border border-white/10 flex flex-col items-center justify-center gap-3 ${className}`}>
        <MapPin className="w-10 h-10 text-slate-600" />
        <p className="text-slate-500 text-sm">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-50">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full dark-leaflet-map" style={{ minHeight: '400px' }} />
    </div>
  );
}

function makeIcon(emoji: string) {
  if (typeof window === 'undefined' || !window.L) return undefined;
  return window.L.divIcon({
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    className: '',
  });
}
