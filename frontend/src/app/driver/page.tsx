'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, DollarSign, Star, TrendingUp, Clock, MapPin, CheckCircle, Navigation, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCardSkeleton, RideCardSkeleton } from '@/components/ui/Skeletons';
import { useDriver } from '@/hooks/useDriver';
import { useAuthStore } from '@/stores/authStore';
import { rideApi } from '@/lib/apiClient';
import Link from 'next/link';

const MapView = dynamic(() => import('@/components/map/MapView').then(m => ({ default: m.MapView })), { ssr: false });

const DEMAND_HOTSPOTS = [
  { lat: 12.9348, lng: 77.6189, radius: 450, label: 'Koramangala 5th Block' },
  { lat: 12.9719, lng: 77.6412, radius: 400, label: 'Indiranagar 100ft Rd' },
  { lat: 12.9698, lng: 77.7500, radius: 550, label: 'Whitefield IT Hub' }
];

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const {
    stats, statsLoading, rideRequests,
    toggleAvailability, acceptRide, updateStatus, emitLocation,
    isAccepting, isUpdatingStatus, refetchRequests,
  } = useDriver();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rejectedRides, setRejectedRides] = useState<string[]>([]);
  const [busyMode, setBusyMode] = useState(false);

  // Active Ride Query
  const { data: activeRide } = useQuery({
    queryKey: ['active-ride'],
    queryFn: () => rideApi.getActiveRide().then(r => r.data.data),
    refetchInterval: 5000,
  });

  // Get GPS and start broadcasting
  useEffect(() => {
    // For reliable demo matching, always use MG Road Bengaluru default
    const coords = { lat: 12.9756, lng: 77.6068 };
    setUserLocation(coords);
    if (user?.isAvailable && !busyMode) emitLocation(coords.lat, coords.lng);
  }, [user?.isAvailable, busyMode, emitLocation]);

  const handleToggle = () => {
    setBusyMode(false);
    toggleAvailability({
      isAvailable: !user?.isAvailable,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    });
  };

  const handleToggleBusy = () => {
    setBusyMode(!busyMode);
    if (!busyMode && user?.isAvailable) {
      // Toggle offline in backend when busy
      toggleAvailability({
        isAvailable: false,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
    } else if (busyMode && !user?.isAvailable) {
      // Toggle online in backend when returning from busy
      toggleAvailability({
        isAvailable: true,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
    }
  };

  const statCards = [
    { label: 'Total Rides', value: stats?.totalRides ?? 0, icon: Car, color: 'from-brand-500 to-brand-700' },
    { label: 'Total Earnings', value: `₹${(stats?.totalEarnings ?? 0).toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-700' },
    { label: 'Rating', value: `${(stats?.rating ?? 5.0).toFixed(1)}★`, icon: Star, color: 'from-amber-500 to-orange-700' },
    { label: 'This Week', value: stats?.weekRides ?? 0, icon: TrendingUp, color: 'from-violet-500 to-purple-700' },
  ];

  // Inject Countdown animation style
  useEffect(() => {
    const id = 'driver-dashboard-custom-css';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.innerHTML = `
        @keyframes countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-countdown {
          animation: countdown 30s linear forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const activeRequests = rideRequests.filter(
    (r: any) => !rejectedRides.includes(r._id) && r.status === 'searching'
  );
  const currentRequest = activeRequests[0];

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      
      {/* Active Ride Sticky Card */}
      {activeRide && (
        <div className="glass-card border border-brand-500/30 bg-brand-500/10 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white">
              <Car className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-brand-500/20 text-brand-300">
                Active Ride - {activeRide.status}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Trip to {activeRide.dropoffLocation?.address?.split(',')[0]}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rider: {activeRide.rider?.name} • ₹{activeRide.fare?.total?.toFixed(2)}
              </p>
            </div>
          </div>
          <Link href="/driver/trips" className="w-full md:w-auto">
            <Button size="sm" className="w-full md:w-auto bg-brand-500 hover:bg-brand-400" icon={<Navigation className="w-4 h-4 animate-pulse" />}>
              Go to Simulation Dashboard
            </Button>
          </Link>
        </div>
      )}

      {/* Header + status toggler (Offline / Busy / Online) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Driver Console
          </h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => {
              if (user?.isAvailable) handleToggle();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              !user?.isAvailable && !busyMode
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Offline
          </button>
          
          <button
            onClick={handleToggleBusy}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              busyMode
                ? 'bg-amber-650 text-white shadow bg-amber-500/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Busy
          </button>
          
          <button
            onClick={() => {
              if (!user?.isAvailable || busyMode) {
                if (busyMode) {
                  handleToggleBusy();
                } else {
                  handleToggle();
                }
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              user?.isAvailable && !busyMode
                ? 'bg-green-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-card p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-display font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))
        }
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Left Column: Earnings Graph & Hotspots */}
        <div className="space-y-6">
          {/* Weekly Earnings Custom SVG Chart */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-350 text-slate-200">Weekly Performance</h3>
                <p className="text-xs text-slate-500">Earnings distribution over the past 7 days</p>
              </div>
              <span className="text-xs text-green-400 font-semibold px-2 py-0.5 bg-green-500/10 rounded-full">+18.4%</span>
            </div>
            <div className="h-32 w-full flex items-end justify-between gap-3 pt-4">
              {[
                { day: 'Mon', amount: 1200 },
                { day: 'Tue', amount: 1900 },
                { day: 'Wed', amount: 1500 },
                { day: 'Thu', amount: 2400 },
                { day: 'Fri', amount: 3100 },
                { day: 'Sat', amount: 2800 },
                { day: 'Sun', amount: 3500 }
              ].map((d, idx) => {
                const max = 3500;
                const pct = (d.amount / max) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="relative w-full flex items-end justify-center h-20 bg-white/5 rounded-md overflow-hidden">
                      <div 
                        style={{ height: `${pct}%` }}
                        className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t transition-all duration-500 group-hover:from-brand-500 group-hover:to-brand-300"
                      />
                      <span className="absolute bottom-1 text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{d.amount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotspots Card */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">High Demand Hotspots</h3>
            <p className="text-xs text-slate-500 leading-tight">Drive towards these zones in Bengaluru for 1.2x - 1.5x higher search frequencies.</p>
            
            <div className="space-y-2 pt-1">
              {[
                { name: 'Koramangala 5th Block', multiplier: '1.5x Surge', distance: '1.2 km', color: 'text-red-400' },
                { name: 'Indiranagar 100ft Rd', multiplier: '1.4x Surge', distance: '3.4 km', color: 'text-orange-400' },
                { name: 'Whitefield IT Hub', multiplier: '1.3x Surge', distance: '9.8 km', color: 'text-amber-400' }
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{h.name}</p>
                      <p className="text-[10px] text-slate-500">{h.distance} away</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${h.color}`}>
                    {h.multiplier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Map with Hotspot layers */}
        <div className="space-y-4">
          <h2 className="section-heading">Active Heatmap & Location</h2>
          <MapView
            center={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
            driverLocation={userLocation}
            hotspots={DEMAND_HOTSPOTS}
            className="h-[360px] w-full"
          />
        </div>
      </div>

      {/* Animated Ride Request Popup Overlay (Accept / Reject workflow) */}
      {currentRequest && !activeRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 border border-brand-500/35 shadow-2xl relative overflow-hidden animate-scale-up bg-surface-950">
            {/* Animated countdown border progress line */}
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-brand-400 to-emerald-400 w-full animate-countdown" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-brand-500/10 text-brand-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
                Live Offer Detected
              </span>
              <span className="text-xs text-slate-500 font-medium">Declines in 30s</span>
            </div>

            <div className="flex items-center justify-between mb-5 bg-white/5 p-3 rounded-xl border border-white/5">
              <div>
                <p className="text-2xl font-black text-white">₹{currentRequest.fare?.total?.toFixed(2)}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">
                  {currentRequest.vehicleType} • {currentRequest.distance?.toFixed(1) || '4.2'} km
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-sm">
                  {currentRequest.rider?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{currentRequest.rider?.name}</p>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] text-slate-400 font-bold">{currentRequest.rider?.rating?.toFixed(1) || '4.9'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-start gap-2.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Pickup Location</p>
                  <p className="text-slate-200 text-xs mt-0.5 leading-snug">{currentRequest.pickupLocation?.address}</p>
                </div>
              </div>
              <div className="ml-1 w-0.5 h-3 bg-slate-800" />
              <div className="flex items-start gap-2.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Dropoff Location</p>
                  <p className="text-slate-200 text-xs mt-0.5 leading-snug">{currentRequest.dropoffLocation?.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                onClick={() => setRejectedRides(prev => [...prev, currentRequest._id])}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                disabled={isAccepting}
                onClick={() => acceptRide(currentRequest._id)}
              >
                {isAccepting ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
