'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Car, Star, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { rideApi, driverApi } from '@/lib/apiClient';
import { useDriver } from '@/hooks/useDriver';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RideCardSkeleton } from '@/components/ui/Skeletons';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const statusLabel: Record<string, string> = {
  searching: 'Searching', accepted: 'Accepted', arriving: 'Arriving',
  ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
};

export default function DriverTripsPage() {
  const { user, updateUser } = useAuthStore();
  const { updateStatus, isUpdatingStatus, acceptRide, isAccepting, emitLocation } = useDriver();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStats, setSimStats] = useState<{ distance: string; eta: number; phase: string } | null>(null);
  const qc = useQueryClient();

  const simulateFullRide = async () => {
    if (!activeRideData) return;
    setIsSimulating(true);

    const getCoords = (loc: any) => {
      if (Array.isArray(loc.coordinates?.coordinates)) {
        return { lat: loc.coordinates.coordinates[1], lng: loc.coordinates.coordinates[0] };
      }
      return { lat: loc.coordinates?.lat || 12.9756, lng: loc.coordinates?.lng || 77.6068 };
    };

    const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const fetchOSRMRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }): Promise<{ lat: number; lng: number }[]> => {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates; // array of [lng, lat]
          return coords.map((c: any) => ({ lat: c[1], lng: c[0] }));
        }
      } catch (err) {
        console.warn('OSRM routing failed, using straight-line path fallback:', err);
      }
      // Fallback straight path
      const steps = 15;
      const path: { lat: number; lng: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const r = i / steps;
        path.push({
          lat: start.lat + (end.lat - start.lat) * r,
          lng: start.lng + (end.lng - start.lng) * r
        });
      }
      return path;
    };

    const interpolatePath = (coords: { lat: number; lng: number }[]) => {
      if (coords.length < 2) return coords;
      const result: { lat: number; lng: number }[] = [];
      for (let i = 0; i < coords.length - 1; i++) {
        const start = coords[i];
        const end = coords[i + 1];
        const dist = getHaversineDistance(start.lat, start.lng, end.lat, end.lng);
        // Desired spacing ~30 meters (0.03 km) for smoothness
        const segmentSteps = Math.max(1, Math.ceil(dist / 0.03));
        result.push(start);
        for (let j = 1; j < segmentSteps; j++) {
          const ratio = j / segmentSteps;
          result.push({
            lat: start.lat + (end.lat - start.lat) * ratio,
            lng: start.lng + (end.lng - start.lng) * ratio,
          });
        }
      }
      result.push(coords[coords.length - 1]);
      return result;
    };

    const pickup = getCoords(activeRideData.pickupLocation);
    const dropoff = getCoords(activeRideData.dropoffLocation);

    // Starting location (MG Road)
    let currentLat = 12.9756;
    let currentLng = 77.6068;

    const animateToPath = (path: { lat: number; lng: number }[], targetCoords: { lat: number; lng: number }, phase: 'pickup' | 'destination') => {
      return new Promise<void>((resolve) => {
        let step = 0;
        const totalSteps = path.length;

        const interval = setInterval(() => {
          if (step >= totalSteps) {
            clearInterval(interval);
            resolve();
            return;
          }

          const currentPoint = path[step];
          currentLat = currentPoint.lat;
          currentLng = currentPoint.lng;

          // Calculate heading/bearing
          let heading = 0;
          if (step < totalSteps - 1) {
            const nextPoint = path[step + 1];
            heading = Math.atan2(nextPoint.lng - currentPoint.lng, nextPoint.lat - currentPoint.lat) * 180 / Math.PI;
          }

          emitLocation(currentLat, currentLng, heading);

          // Update real-time remaining stats
          const distRemaining = getHaversineDistance(currentLat, currentLng, targetCoords.lat, targetCoords.lng);
          setSimStats({
            distance: distRemaining.toFixed(2),
            eta: Math.max(1, Math.round(distRemaining * 1.5)),
            phase
          });

          step++;
        }, 500); // 500ms updates
      });
    };

    try {
      // 1. Move to pickup
      toast.success('🚗 Querying road route to pickup...');
      const pickupRoute = await fetchOSRMRoute({ lat: currentLat, lng: currentLng }, pickup);
      const smoothPickupPath = interpolatePath(pickupRoute);
      const initialDist = getHaversineDistance(currentLat, currentLng, pickup.lat, pickup.lng);

      toast.success(`🚗 Starting auto-drive to pickup (${initialDist.toFixed(2)} km)...`);
      if (activeRideData.status === 'accepted') {
        await driverApi.updateRideStatus(activeRideData._id, 'arriving');
        qc.invalidateQueries({ queryKey: ['active-ride'] });
      }

      await animateToPath(smoothPickupPath, pickup, 'pickup');

      // 2. Arrived at pickup, start ride
      toast.success('📍 Arrived at pickup. Starting ride...');
      await driverApi.updateRideStatus(activeRideData._id, 'ongoing');
      qc.invalidateQueries({ queryKey: ['active-ride'] });

      // Wait a moment
      await new Promise((r) => setTimeout(r, 2000));

      // 3. Move to dropoff
      toast.success('🛣️ Querying road route to destination...');
      const dropoffRoute = await fetchOSRMRoute(pickup, dropoff);
      const smoothDropoffPath = interpolatePath(dropoffRoute);
      const dropoffDistance = getHaversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

      toast.success(`🛣️ Driving to destination (${dropoffDistance.toFixed(2)} km)...`);
      await animateToPath(smoothDropoffPath, dropoff, 'destination');

      // 4. Arrived at dropoff, complete ride
      toast.success('✅ Destination reached. Completing ride...');
      await driverApi.updateRideStatus(activeRideData._id, 'completed');
      updateUser({ isAvailable: true });
      qc.invalidateQueries({ queryKey: ['active-ride', 'driver-stats'] });
    } catch (err: any) {
      toast.error('Simulation interrupted: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSimulating(false);
      setSimStats(null);
    }
  };

  const { data: activeRideData } = useQuery({
    queryKey: ['active-ride'],
    queryFn: () => rideApi.getActiveRide().then(r => r.data.data),
    refetchInterval: 8000,
  });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['driver-history', 1],
    queryFn: () => rideApi.getHistory({ page: 1, limit: 20 }).then(r => r.data),
  });

  const rides = historyData?.data || [];

  const nextStatusMap: Record<string, string> = {
    accepted: 'arriving',
    arriving: 'ongoing',
    ongoing: 'completed',
  };

  const nextStatusLabel: Record<string, string> = {
    arriving: 'Mark Arriving',
    ongoing: 'Start Ride',
    completed: 'Complete Ride',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-white">My Trips</h1>

      {/* Active ride controls */}
      {activeRideData && (
        <div className="glass-card p-5 border-brand-500/30 bg-brand-500/5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Active Ride
            </p>
            <Badge label={statusLabel[activeRideData.status]} status={activeRideData.status} />
          </div>

          <div className="space-y-1.5 mb-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              <p className="text-slate-300">{activeRideData.pickupLocation?.address}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
              <p className="text-slate-300">{activeRideData.dropoffLocation?.address}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Rider</p>
              <p className="text-sm text-white font-medium">{(activeRideData.rider as any)?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Fare</p>
              <p className="font-bold text-white">₹{activeRideData.fare?.total?.toFixed(2)}</p>
            </div>
          </div>

          {simStats && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-4 animate-pulse">
              <div>
                <p className="text-xs text-slate-500 capitalize">Dist to {simStats.phase}</p>
                <p className="text-lg font-bold text-white mt-0.5">{simStats.distance} km</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Simulated ETA</p>
                <p className="text-lg font-bold text-brand-400 mt-0.5">{simStats.eta} min</p>
              </div>
            </div>
          )}

          {nextStatusMap[activeRideData.status] && (
            <Button
              className="w-full"
              loading={isUpdatingStatus}
              onClick={() => updateStatus({
                rideId: activeRideData._id,
                status: nextStatusMap[activeRideData.status],
              })}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              {nextStatusLabel[nextStatusMap[activeRideData.status]]}
            </Button>
          )}

          {activeRideData.status === 'searching' && (
            <Button
              className="w-full"
              loading={isAccepting}
              onClick={() => acceptRide(activeRideData._id)}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Accept Ride
            </Button>
          )}

          {/* SIMULATE COMPLETE RIDE BUTTON */}
          {['accepted', 'arriving', 'ongoing'].includes(activeRideData.status) && (
            <Button
              className="w-full mt-3 border-brand-400 text-brand-400"
              variant="secondary"
              loading={isSimulating}
              onClick={simulateFullRide}
            >
              Simulate Complete Ride (Auto-Drive)
            </Button>
          )}
        </div>
      )}

      {/* Trip history */}
      <div>
        <h2 className="section-heading mb-4">Trip History</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <RideCardSkeleton key={i} />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Car className="w-14 h-14 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No completed trips yet</p>
            <p className="text-sm text-slate-600 mt-1">Go online to start accepting rides</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map((ride: any) => (
              <div key={ride._id} className="glass-card p-5 hover:border-white/15 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      {formatDistanceToNow(new Date(ride.createdAt), { addSuffix: true })}
                    </p>
                    <Badge label={statusLabel[ride.status] ?? ride.status} status={ride.status} />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₹{ride.fare?.total?.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 capitalize">{ride.vehicleType}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    <p className="text-slate-400 leading-tight">{ride.pickupLocation?.address}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                    <p className="text-slate-400 leading-tight">{ride.dropoffLocation?.address}</p>
                  </div>
                </div>

                {ride.rating?.driverRating && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-400">
                      Rider rated you {ride.rating.driverRating}/5
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
