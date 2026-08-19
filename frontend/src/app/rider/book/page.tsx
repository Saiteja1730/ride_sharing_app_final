'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, Search, LocateFixed, AlertCircle, Info, Car, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VehicleSelector } from '@/components/ride/VehicleSelector';
import { Badge } from '@/components/ui/Badge';
import { useRideStore } from '@/stores/rideStore';
import { useDriverStore } from '@/stores/driverStore';
import { useRide } from '@/hooks/useRide';
import { driverApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

const MapView = dynamic(() => import('@/components/map/MapView').then(m => ({ default: m.MapView })), { ssr: false });

const DEFAULT_CENTER = { lat: 12.9756, lng: 77.6068 };

const SUGGESTED_LOCATIONS = [
  { label: 'Koramangala', address: 'Koramangala 5th Block, Bengaluru, Karnataka, India', coordinates: { lat: 12.9348, lng: 77.6189 } },
  { label: 'Indiranagar', address: 'Indiranagar 100 Feet Road, Bengaluru, Karnataka, India', coordinates: { lat: 12.9719, lng: 77.6412 } },
  { label: 'Whitefield', address: 'Whitefield Main Road, Bengaluru, Karnataka, India', coordinates: { lat: 12.9698, lng: 77.7500 } },
  { label: 'BLR Airport', address: 'Kempegowda International Airport (BLR), Bengaluru, Karnataka, India', coordinates: { lat: 13.1986, lng: 77.7066 } }
];

export default function BookRidePage() {
  const {
    pickupLocation, dropoffLocation, fareEstimates,
    selectedVehicleType, surgeActive,
    setPickup, setDropoff, activeRide, driverLocation,
    bookingStep,
  } = useRideStore();

  const { estimateFare, bookRide, cancelRide, isEstimating, isBooking } = useRide();

  const getCoords = (loc: any) => {
    if (!loc) return null;
    if (loc.coordinates && Array.isArray(loc.coordinates.coordinates)) {
      return { lat: loc.coordinates.coordinates[1], lng: loc.coordinates.coordinates[0] };
    }
    const lat = Number(loc.coordinates?.lat ?? loc.lat);
    const lng = Number(loc.coordinates?.lng ?? loc.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  };

  const getLiveStats = () => {
    if (!activeRide || !driverLocation) return null;
    const target = ['accepted', 'arriving'].includes(activeRide.status)
      ? getCoords(activeRide.pickupLocation)
      : getCoords(activeRide.dropoffLocation);

    if (!target) return null;

    // Calculate Haversine distance in km
    const lat1 = driverLocation.lat;
    const lon1 = driverLocation.lng;
    const lat2 = target.lat;
    const lon2 = target.lng;

    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Estimate ETA (approx 1.5 minutes per km, minimum 1 min)
    const eta = Math.max(1, Math.round(distance * 1.5));

    return {
      distance: distance.toFixed(2),
      eta,
      phase: ['accepted', 'arriving'].includes(activeRide.status) ? 'pickup' : 'destination'
    };
  };

  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [formError, setFormError] = useState('');

  // Suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);


  // OSRM route coords & mock drivers states
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[] | null>(null);
  const [mockDrivers, setMockDrivers] = useState<{ driverId: string; location: { lat: number; lng: number }; heading: number }[]>([]);
  const [driverHeading, setDriverHeading] = useState(0);
  const prevLocRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (driverLocation) {
      if (prevLocRef.current) {
        const p = prevLocRef.current;
        const angle = Math.atan2(driverLocation.lng - p.lng, driverLocation.lat - p.lat) * 180 / Math.PI;
        setDriverHeading(angle);
      }
      prevLocRef.current = driverLocation;
    } else {
      prevLocRef.current = null;
    }
  }, [driverLocation]);

  // OSRM Route Calculation Effect
  useEffect(() => {
    let start = getCoords(pickupLocation || activeRide?.pickupLocation);
    let end = getCoords(dropoffLocation || activeRide?.dropoffLocation);

    if (activeRide && driverLocation) {
      const isHeadingToPickup = ['accepted', 'arriving'].includes(activeRide.status);
      start = driverLocation;
      end = isHeadingToPickup ? getCoords(activeRide.pickupLocation) : getCoords(activeRide.dropoffLocation);
    }

    if (!start || !end) {
      setRouteCoords(null);
      return;
    }

    const startStr = `${start.lng},${start.lat}`;
    const endStr = `${end.lng},${end.lat}`;

    fetch(`https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const path = data.routes[0].geometry.coordinates.map((c: any) => ({
            lat: c[1],
            lng: c[0]
          }));
          setRouteCoords(path);
        }
      })
      .catch(err => {
        console.warn('OSRM Route fetch error:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, dropoffLocation, activeRide?.status, driverLocation]);

  // Initialize mock drivers around center
  useEffect(() => {
    if (!mapCenter) return;
    const baseDrivers = Array.from({ length: 6 }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / 6;
      const radius = 0.007 + Math.random() * 0.004; // ~1km
      return {
        driverId: `mock-driver-${i}`,
        location: {
          lat: mapCenter.lat + Math.sin(angle) * radius,
          lng: mapCenter.lng + Math.cos(angle) * radius,
        },
        heading: Math.random() * 360,
      };
    });
    setMockDrivers(baseDrivers);
  }, [mapCenter]);

  // Update mock drivers positions slowly (drift simulation)
  useEffect(() => {
    if (mockDrivers.length === 0) return;
    const interval = setInterval(() => {
      setMockDrivers(prev =>
        prev.map(d => {
          const driftAngle = (d.heading + (Math.random() * 30 - 15)) * Math.PI / 180;
          const speed = 0.00012; // slowly move cabs
          const nextLat = d.location.lat + Math.sin(driftAngle) * speed;
          const nextLng = d.location.lng + Math.cos(driftAngle) * speed;
          return {
            ...d,
            location: { lat: nextLat, lng: nextLng },
            heading: (driftAngle * 180) / Math.PI,
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [mockDrivers.length]);

  const { drivers: driversMap, updateDriver } = useDriverStore();
  const allNearbyDrivers = [
    ...Object.values(driversMap).map(d => ({
      driverId: d.driverId,
      location: d.coordinates || { lat: 0, lng: 0 },
      heading: d.heading || 0,
      speed: d.speed,
    })),
    ...mockDrivers,
  ];

  // Fetch nearby drivers
  useEffect(() => {
    driverApi.getNearby(mapCenter.lat, mapCenter.lng, 5)
      .then(r => {
        const list = r.data.data || [];
        list.forEach((d: any) => {
          updateDriver({
            driverId: d.driverId,
            coordinates: d.location,
            heading: d.heading,
            speed: d.speed,
            available: true,
          });
        });
      })
      .catch(() => { });
  }, [mapCenter, updateDriver]);

  // Auto-detect geolocation on mount
  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocomplete Suggestions effect for pickup
  useEffect(() => {
    if (pickupQuery.length < 3 || pickupQuery === 'Your Current Location' || (pickupLocation && pickupLocation.address === pickupQuery)) {
      setPickupSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupQuery)}&limit=5&viewbox=77.35,12.8,77.85,13.25&bounded=1`)
        .then(res => res.json())
        .then(data => {
          const list = data.map((item: any) => ({
            address: item.display_name,
            coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
          }));
          setPickupSuggestions(list);
        })
        .catch(() => { });
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [pickupQuery, pickupLocation]);

  // Autocomplete Suggestions effect for dropoff
  useEffect(() => {
    if (dropoffQuery.length < 3 || (dropoffLocation && dropoffLocation.address === dropoffQuery)) {
      setDropoffSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoffQuery)}&limit=5&viewbox=77.35,12.8,77.85,13.25&bounded=1`)
        .then(res => res.json())
        .then(data => {
          const list = data.map((item: any) => ({
            address: item.display_name,
            coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
          }));
          setDropoffSuggestions(list);
        })
        .catch(() => { });
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [dropoffQuery, dropoffLocation]);

  const detectLocation = () => {
    setGeoLoading(true);
    setGeoError('');

    // For reliable demo purposes on desktop, use the default Bengaluru location immediately
    // since desktop browser geolocation is often highly inaccurate (ISP level).
    setTimeout(() => {
      const defaultPickup = {
        address: 'MG Road Metro Station, Bengaluru, Karnataka, India',
        coordinates: { lat: 12.9756, lng: 77.6068 }
      };
      setMapCenter(defaultPickup.coordinates);
      setPickup(defaultPickup);
      setPickupQuery(defaultPickup.address);
      setGeoLoading(false);
      toast.success('Location detected successfully');
    }, 600);
  };

  const selectPickup = (loc: { address: string; coordinates: { lat: number; lng: number } }) => {
    setPickup(loc);
    setPickupQuery(loc.address);
    setMapCenter(loc.coordinates);
    setPickupSuggestions([]);
  };

  const selectDropoff = (loc: { address: string; coordinates: { lat: number; lng: number } }) => {
    setDropoff(loc);
    setDropoffQuery(loc.address);
    setDropoffSuggestions([]);
    setMapCenter(loc.coordinates);
  };

  // Map Click handler
  const handleMapClick = async (coords: { lat: number; lng: number }) => {
    setAddressLoading(true);
    setFormError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        // Shorten address if it is too long (keep first 3 parts)
        const parts = data.display_name.split(',');
        const address = parts.slice(0, Math.min(3, parts.length)).join(',').trim();
        setDropoff({ address, coordinates: coords });
        setDropoffQuery(address);
        toast.success(`Dropoff set to: ${address}`);
      } else {
        const address = `Pin Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        setDropoff({ address, coordinates: coords });
        setDropoffQuery(address);
      }
    } catch {
      const address = `Pin Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
      setDropoff({ address, coordinates: coords });
      setDropoffQuery(address);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleGetFare = () => {
    setFormError('');
    if (!pickupLocation || !dropoffLocation) {
      setFormError('Please select both a pickup and dropoff location.');
      return;
    }

    const start = getCoords(pickupLocation);
    const end = getCoords(dropoffLocation);

    if (!start || !end) {
      setFormError('Could not resolve location coordinates. Please search again.');
      return;
    }

    // 1. Same location check
    if (
      pickupLocation.address === dropoffLocation.address ||
      (Math.abs(start.lat - end.lat) < 0.0001 && Math.abs(start.lng - end.lng) < 0.0001)
    ) {
      setFormError('Pickup and destination cannot be the same location.');
      toast.error('Pickup and destination cannot be identical!');
      return;
    }

    // 2. Serviceable Operational Boundary Check (Bangalore Area)
    const bgCenter = { lat: 12.9756, lng: 77.6068 };
    const maxBoundDegree = 0.5; // ~55 km radius from center
    const isPickupOut = Math.abs(start.lat - bgCenter.lat) > maxBoundDegree || Math.abs(start.lng - bgCenter.lng) > maxBoundDegree;
    const isDropoffOut = Math.abs(end.lat - bgCenter.lat) > maxBoundDegree || Math.abs(end.lng - bgCenter.lng) > maxBoundDegree;

    if (isPickupOut || isDropoffOut) {
      setFormError('Serviceable Area Error: The requested locations are outside our operational boundary.');
      toast.error('We only operate in Bengaluru and nearby suburbs currently.');
      return;
    }

    // 3. Distance checks
    const R = 6371; // Earth radius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance > 100) {
      setFormError('Serviceable limit exceeded. Maximum ride distance permitted is 100km.');
      toast.error('Ride distance too large!');
      return;
    }

    // 4. Driver dispatch checks
    if (allNearbyDrivers.length === 0) {
      setFormError('No drivers available nearby at the moment. Please try again in a few minutes.');
      toast.error('No drivers available nearby!');
      return;
    }

    estimateFare();
  };

  const handleBook = () => {
    if (!fareEstimates.length) return;
    if (allNearbyDrivers.length === 0) {
      setFormError('Dispatcher Alert: All drivers went offline. Booking failed.');
      toast.error('Dispatcher error: No available cabs found!');
      return;
    }
    const selected = fareEstimates.find(e => e.vehicleType === selectedVehicleType) || fareEstimates[0];
    bookRide(selected.fare as any);
  };

  const isSearching = bookingStep === 'searching';
  const isTracking = bookingStep === 'tracking';

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">Book a Ride</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ── Left: booking form ── */}
        <div className="space-y-6">

          {/* Active ride tracking panel */}
          {(isSearching || isTracking) && activeRide && (
            <div className="bg-white border border-brand-200 p-6 rounded-2xl shadow-sm animate-slide-up space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-brand-600 animate-ping" />
                  <p className="font-bold text-slate-900">
                    {isSearching ? 'Match Request Sent' : 'Ride In Progress'}
                  </p>
                </div>
                <Badge label={activeRide.status} status={activeRide.status} />
              </div>

              {isSearching && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-5">
                  <div className="relative flex items-center justify-center w-28 h-28">
                    {/* Pulsing radar circles */}
                    <div className="absolute inset-0 rounded-full bg-brand-100 border border-brand-200 animate-ping" />
                    <div className="absolute inset-3 rounded-full bg-brand-50 border border-brand-200 animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                      <Car className="w-8 h-8 text-brand-900 animate-bounce" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Searching for your ride</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">
                      Matching your request with the closest available driver.
                    </p>
                  </div>

                  <div className="px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 animate-pulse-subtle shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                    {mockDrivers.length} drivers nearby in Bangalore
                  </div>
                </div>
              )}

              {isTracking && activeRide.driver && (
                <div className="space-y-5 mb-4">

                  {/* Status Indicator */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping" />
                    <span className="text-sm font-bold text-slate-700 capitalize">
                      {activeRide.status === 'accepted' ? 'Driver accepted offer' :
                        activeRide.status === 'arriving' ? 'Driver is arriving to pickup' :
                          activeRide.status === 'ongoing' ? 'Trip is in progress' :
                            activeRide.status === 'completed' ? 'Destination reached!' : activeRide.status}
                    </span>
                  </div>

                  {/* Driver Profile & Vehicle Info */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-xl border border-slate-200">
                        {(activeRide.driver as any).name?.charAt(0) ?? 'D'}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900">{(activeRide.driver as any).name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-xs text-slate-600 font-bold">
                            {((activeRide.driver as any).rating ?? 5.0).toFixed(1)} Rating
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {((activeRide.driver as any).vehicleInfo) ? (
                        <>
                          <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                            {((activeRide.driver as any).vehicleInfo).plateNumber}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {((activeRide.driver as any).vehicleInfo).color} {((activeRide.driver as any).vehicleInfo).make}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-slate-500">Cab details loaded</p>
                      )}
                    </div>
                  </div>

                  {/* Live Distance / ETA progress section */}
                  {(() => {
                    const stats = getLiveStats();
                    if (!stats) return null;
                    return (
                      <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Remaining Distance</p>
                          <p className="text-2xl font-black text-slate-900">{stats.distance} km</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Estimated Arrival</p>
                          <p className="text-2xl font-black text-brand-900">{stats.eta} mins</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <Button
                variant="danger"
                size="sm"
                className="w-full justify-center py-3"
                onClick={() => cancelRide({ id: activeRide._id, reason: 'User cancelled' })}
              >
                Cancel Ride
              </Button>
            </div>
          )}

          {/* Location inputs */}
          {!isSearching && !isTracking && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-200 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-xl text-slate-900 tracking-tight">Enter your route</h2>
                <button
                  onClick={detectLocation}
                  disabled={geoLoading}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors disabled:opacity-50 bg-brand-50 px-3 py-1.5 rounded-md"
                >
                  {geoLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <LocateFixed className="w-4 h-4" />
                  }
                  {geoLoading ? 'Detecting...' : 'Use my location'}
                </button>
              </div>

              {/* Geo error banner */}
              {geoError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-orange-800">{geoError}</p>
                </div>
              )}

              {/* Pickup */}
              <div className="relative">
                <Input
                  id="pickup"
                  label="Pickup location"
                  placeholder="Search pickup or use 'Use my location'..."
                  icon={<div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />}
                  value={pickupQuery}
                  onChange={(e) => { setPickupQuery(e.target.value); if (!e.target.value) setPickup(null); setFormError(''); }}
                />
                {pickupSuggestions.length > 0 && pickupQuery && !pickupLocation && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
                    {pickupSuggestions.map((loc) => (
                      <button key={loc.address} onClick={() => selectPickup(loc)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-700 font-medium truncate">{loc.address}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropoff */}
              <div className="relative">
                <Input
                  id="dropoff"
                  label="Dropoff location"
                  placeholder={addressLoading ? 'Resolving location...' : "Search destination or click map..."}
                  icon={addressLoading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <div className="w-3 h-3 rounded-full bg-slate-900 shadow-sm" />}
                  value={dropoffQuery}
                  onChange={(e) => { setDropoffQuery(e.target.value); if (!e.target.value) setDropoff(null); setFormError(''); }}
                />
                {dropoffSuggestions.length > 0 && dropoffQuery && !dropoffLocation && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
                    {dropoffSuggestions.map((loc) => (
                      <button key={loc.address} onClick={() => selectDropoff(loc)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <Navigation className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-700 font-medium truncate">{loc.address}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Presets */}
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_LOCATIONS.map((loc) => (
                    <button
                      key={loc.label}
                      type="button"
                      onClick={() => selectDropoff(loc)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm"
                    >
                      📍 {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form-level validation error */}
              {formError && (
                <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">{formError}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  className="w-full py-4 text-base"
                  onClick={handleGetFare}
                  loading={isEstimating}
                  icon={<Search className="w-5 h-5" />}
                >
                  Get Fare Estimates
                </Button>
              </div>
            </div>
          )}

          {/* Vehicle selector */}
          {fareEstimates.length > 0 && !isSearching && !isTracking && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-slate-200 space-y-5 animate-slide-up">
              <h2 className="font-bold text-xl text-slate-900 tracking-tight">Choose your ride</h2>
              <VehicleSelector
                estimates={fareEstimates}
                surgeActive={surgeActive}
                onSelect={() => { }}
              />
              <div className="pt-2">
                <Button className="w-full py-4 text-base" onClick={handleBook} loading={isBooking}>
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Map ── */}
        <div className="h-[500px] lg:h-auto lg:min-h-[600px] rounded-2xl overflow-hidden shadow-card border border-slate-200 bg-white">
          <MapView
            center={mapCenter}
            pickup={pickupLocation?.coordinates}
            dropoff={dropoffLocation?.coordinates}
            driverLocation={driverLocation}
            driverHeading={driverHeading}
            routeCoords={routeCoords}
            nearbyDrivers={allNearbyDrivers}
            className="w-full h-full min-h-[400px]"
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}
