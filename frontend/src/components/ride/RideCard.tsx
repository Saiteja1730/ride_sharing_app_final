'use client';
import React from 'react';
import { MapPin, Navigation, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ActiveRide } from '@/stores/rideStore';
import { formatDistanceToNow } from 'date-fns';

interface RideCardProps {
  ride: Partial<ActiveRide> & {
    _id: string;
    status: string;
    pickupLocation: { address: string };
    dropoffLocation: { address: string };
    fare: { total: number; currency: string; surgeMultiplier: number };
    createdAt: string;
    distance?: number;
  };
  onCancel?: (id: string) => void;
  onRate?: (id: string) => void;
  compact?: boolean;
}

const statusLabel: Record<string, string> = {
  searching: 'Searching', accepted: 'Driver Accepted',
  arriving: 'Arriving', ongoing: 'On the Way',
  completed: 'Completed', cancelled: 'Cancelled',
};

export function RideCard({ ride, onCancel, onRate, compact = false }: RideCardProps) {
  const isCancellable = ['searching', 'accepted'].includes(ride.status);
  const isRatable = ride.status === 'completed';

  return (
    <div className="glass-card p-5 hover:border-brand-500/20 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            {formatDistanceToNow(new Date(ride.createdAt), { addSuffix: true })}
          </p>
          <Badge label={statusLabel[ride.status] ?? ride.status} status={ride.status} />
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {ride.fare.currency === 'USD' || ride.fare.currency === 'INR' ? '₹' : ride.fare.currency} {ride.fare.total.toFixed(2)}
          </p>
          {ride.fare.surgeMultiplier > 1 && (
            <p className="text-xs text-amber-400">{ride.fare.surgeMultiplier}x surge</p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <p className="text-sm text-slate-300 leading-tight">{ride.pickupLocation.address}</p>
          </div>
          <div className="ml-1 w-px h-4 bg-slate-700" />
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
            <p className="text-sm text-slate-300 leading-tight">{ride.dropoffLocation.address}</p>
          </div>
        </div>
      )}

      {ride.distance && (
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3" /> {ride.distance.toFixed(1)} km
          </span>
        </div>
      )}

      {(isCancellable || isRatable) && (
        <div className="flex gap-2 pt-3 border-t border-white/5">
          {isCancellable && onCancel && (
            <Button variant="danger" size="sm" onClick={() => onCancel(ride._id)}>
              Cancel
            </Button>
          )}
          {isRatable && onRate && (
            <Button variant="secondary" size="sm" onClick={() => onRate(ride._id)}>
              ⭐ Rate Ride
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
