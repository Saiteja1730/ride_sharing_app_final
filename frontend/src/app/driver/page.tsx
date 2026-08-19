'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, DollarSign, Star, TrendingUp, Clock, MapPin, CheckCircle, Navigation, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCardSkeleton, RideCardSkeleton } from '@/components/ui/Skeletons';
import { useDriver } from '@/hooks/useDriver';
import { useAuthStore } from '@/stores/authStore';
import { rideApi, authApi } from '@/lib/apiClient';
import Link from 'next/link';
import toast from 'react-hot-toast';

const MapView = dynamic(() => import('@/components/map/MapView').then(m => ({ default: m.MapView })), { ssr: false });

const DEMAND_HOTSPOTS = [
  { lat: 12.9348, lng: 77.6189, radius: 450, label: 'Koramangala 5th Block' },
  { lat: 12.9719, lng: 77.6412, radius: 400, label: 'Indiranagar 100ft Rd' },
  { lat: 12.9698, lng: 77.7500, radius: 550, label: 'Whitefield IT Hub' }
];

export default function DriverDashboard() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const {
    stats, statsLoading, rideRequests,
    toggleAvailability, acceptRide, updateStatus, emitLocation,
    isAccepting, isUpdatingStatus, refetchRequests,
  } = useDriver();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rejectedRides, setRejectedRides] = useState<string[]>([]);
  const [busyMode, setBusyMode] = useState(false);

  // Sync profile on mount
  useEffect(() => {
    authApi.getMe().then(res => {
      if (res.data?.data) {
        updateUser(res.data.data);
      }
    }).catch(() => {});
  }, [updateUser]);

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
    { label: 'Total Rides', value: stats?.totalRides ?? 0, icon: Car, color: 'from-brand-600 to-brand-900' },
    { label: 'Total Earnings', value: `₹${(stats?.totalEarnings ?? 0).toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-700' },
    { label: 'Rating', value: `${(stats?.rating ?? 5.0).toFixed(1)}★`, icon: Star, color: 'from-amber-500 to-orange-600' },
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
      
      {/* KYC Alert Banners */}
      {user?.kycStatus !== 'approved' && (
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
          user?.kycStatus === 'rejected'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {user?.kycStatus === 'rejected' ? <XCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <h4 className="font-bold text-base tracking-tight">
                {user?.kycStatus === 'rejected' ? 'KYC Verification Rejected' : 'KYC Verification Pending'}
              </h4>
              <p className="text-sm font-medium mt-0.5 opacity-80">
                {user?.kycStatus === 'rejected'
                  ? 'Your KYC documents were rejected. Please update your documents in your profile to resubmit.'
                  : 'Your registration documents are being reviewed by our compliance team. You will be able to go online once approved.'}
              </p>
            </div>
          </div>
          <Link href="/driver/profile" className="w-full sm:w-auto flex-shrink-0">
            <Button size="sm" className={`w-full sm:w-auto font-bold text-sm ${
              user?.kycStatus === 'rejected' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200'
            }`}>
              {user?.kycStatus === 'rejected' ? 'Update Documents' : 'Check Status'}
            </Button>
          </Link>
        </div>
      )}
      
      {/* Active Ride Sticky Card */}
      {activeRide && (
        <div className="bg-white border border-brand-200 p-6 rounded-2xl shadow-card flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse-subtle">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center border border-brand-200">
              <Car className="w-7 h-7 text-brand-700 animate-bounce" />
            </div>
            <div>
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded-md bg-brand-100 text-brand-700">
                Active Ride - {activeRide.status}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1.5 tracking-tight">
                Trip to {activeRide.dropoffLocation?.address?.split(',')[0]}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Rider: <span className="font-bold">{activeRide.rider?.name}</span> • ₹{activeRide.fare?.total?.toFixed(2)}
              </p>
            </div>
          </div>
          <Link href="/driver/trips" className="w-full md:w-auto">
            <Button size="lg" className="w-full md:w-auto" icon={<Navigation className="w-5 h-5 animate-pulse" />}>
              Go to Simulation Dashboard
            </Button>
          </Link>
        </div>
      )}

      {/* Header + status toggler (Offline / Busy / Online) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            Driver Console
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
          <button
            onClick={() => {
              if (user?.isAvailable) handleToggle();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              !user?.isAvailable && !busyMode
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Offline
          </button>
          
          <button
            onClick={() => {
              if (user?.kycStatus !== 'approved') {
                toast.error('Cannot go online without KYC approval');
                return;
              }
              handleToggleBusy();
            }}
            disabled={user?.kycStatus !== 'approved'}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              busyMode
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            } ${user?.kycStatus !== 'approved' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Busy
          </button>
          
          <button
            onClick={() => {
              if (user?.kycStatus !== 'approved') {
                toast.error('Cannot go online without KYC approval');
                return;
              }
              if (!user?.isAvailable || busyMode) {
                if (busyMode) {
                  handleToggleBusy();
                } else {
                  handleToggle();
                }
              }
            }}
            disabled={user?.kycStatus !== 'approved'}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              user?.isAvailable && !busyMode
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            } ${user?.kycStatus !== 'approved' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading
          ? [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 hover:border-slate-300 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
              </div>
            ))
        }
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Earnings Graph & Hotspots */}
        <div className="space-y-6">
          {/* Weekly Earnings Custom SVG Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Weekly Performance</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Earnings distribution over the past 7 days</p>
              </div>
              <span className="text-xs text-green-700 font-bold px-2.5 py-1 bg-green-100 rounded-full">+18.4%</span>
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
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex items-end justify-center h-24 bg-slate-100 rounded-md overflow-hidden">
                      <div 
                        style={{ height: `${pct}%` }}
                        className="w-full bg-brand-900 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-300"
                      />
                      <span className="absolute bottom-1.5 text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{d.amount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotspots Card */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">High Demand Hotspots</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Drive towards these zones for higher search frequencies.</p>
            </div>
            
            <div className="space-y-3 pt-2">
              {[
                { name: 'Koramangala 5th Block', multiplier: '1.5x Surge', distance: '1.2 km', color: 'text-red-700 bg-red-100' },
                { name: 'Indiranagar 100ft Rd', multiplier: '1.4x Surge', distance: '3.4 km', color: 'text-orange-700 bg-orange-100' },
                { name: 'Whitefield IT Hub', multiplier: '1.3x Surge', distance: '9.8 km', color: 'text-amber-700 bg-amber-100' }
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔥</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{h.name}</p>
                      <p className="text-xs font-medium text-slate-500">{h.distance} away</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${h.color}`}>
                    {h.multiplier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Map with Hotspot layers */}
        <div className="space-y-4">
          <h2 className="font-bold text-xl text-slate-900 tracking-tight">Active Heatmap & Location</h2>
          <div className="rounded-2xl overflow-hidden shadow-card border border-slate-200 bg-white">
            <MapView
              center={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
              driverLocation={userLocation}
              hotspots={DEMAND_HOTSPOTS}
              className="h-[400px] w-full"
            />
          </div>
        </div>
      </div>

      {/* Animated Ride Request Popup Overlay (Accept / Reject workflow) */}
      {currentRequest && !activeRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden animate-scale-up border border-slate-200">
            {/* Animated countdown border progress line */}
            <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-brand-600 to-emerald-500 w-full animate-countdown" />
            
            <div className="flex items-center justify-between mb-6 mt-2">
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
                Live Offer Detected
              </span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Declines in 30s</span>
            </div>

            <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-3xl font-black text-slate-900">₹{currentRequest.fare?.total?.toFixed(2)}</p>
                <p className="text-xs font-bold text-slate-500 capitalize mt-1 uppercase tracking-wider">
                  {currentRequest.vehicleType} • {currentRequest.distance?.toFixed(1) || '4.2'} km
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-900 text-lg border border-slate-300">
                  {currentRequest.rider?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{currentRequest.rider?.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs text-slate-600 font-bold">{currentRequest.rider?.rating?.toFixed(1) || '4.9'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 flex-shrink-0 shadow-sm" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pickup Location</p>
                  <p className="text-slate-900 font-medium text-sm mt-0.5 leading-snug">{currentRequest.pickupLocation?.address}</p>
                </div>
              </div>
              <div className="ml-1 w-0.5 h-4 bg-slate-200" />
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-600 mt-1 flex-shrink-0 shadow-sm" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dropoff Location</p>
                  <p className="text-slate-900 font-medium text-sm mt-0.5 leading-snug">{currentRequest.dropoffLocation?.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                className="w-full py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                onClick={() => setRejectedRides(prev => [...prev, currentRequest._id])}
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
              <button
                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                disabled={isAccepting}
                onClick={() => acceptRide(currentRequest._id)}
              >
                {isAccepting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
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
