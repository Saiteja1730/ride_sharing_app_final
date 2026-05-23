'use client';
import React from 'react';
import { Clock, Zap, Users, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useRideStore, FareEstimate } from '@/stores/rideStore';

const vehicleIcons: Record<string, string> = {
  bike: '🏍️',
  auto: '🛺',
  mini: '🚗',
  sedan: '🚕',
  suv: '🚙',
  economy: '🚗',
  premium: '🚙',
  xl: '🚐',
};

const vehicleDescriptions: Record<string, string> = {
  bike: 'Fast & traffic-proof solo rides',
  auto: 'Eco-friendly and pocket-friendly three-wheelers',
  mini: 'Affordable, compact hatchbacks for everyday use',
  sedan: 'Spacious, high-rated sedans with extra comfort',
  suv: 'Premium SUVs for group travel & heavy luggage',
  economy: 'Affordable everyday rides',
  premium: 'Top-rated luxury drivers',
  xl: 'Up to 6 passengers',
};

const vehicleSeating: Record<string, number> = {
  bike: 1,
  auto: 3,
  mini: 4,
  sedan: 4,
  suv: 6,
  economy: 4,
  premium: 4,
  xl: 6,
};

// Generate realistic nearby counts for visual fidelity
const vehicleNearbyCounts: Record<string, number> = {
  bike: 12,
  auto: 9,
  mini: 14,
  sedan: 6,
  suv: 3,
  economy: 8,
  premium: 4,
  xl: 2,
};

interface VehicleSelectorProps {
  estimates: FareEstimate[];
  surgeActive: boolean;
  onSelect: (type: string) => void;
}

export function VehicleSelector({ estimates, surgeActive, onSelect }: VehicleSelectorProps) {
  const { selectedVehicleType, setVehicleType } = useRideStore();

  return (
    <div className="space-y-3">
      {surgeActive && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            High demand — surge pricing is active
          </p>
        </div>
      )}

      {estimates.map((est) => {
        const selected = selectedVehicleType === est.vehicleType;
        const capacity = vehicleSeating[est.vehicleType] ?? 4;
        const nearbyCount = vehicleNearbyCounts[est.vehicleType] ?? 5;

        return (
          <button
            key={est.vehicleType}
            onClick={() => {
              setVehicleType(est.vehicleType);
              onSelect(est.vehicleType);
            }}
            className={clsx(
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-350 text-left relative overflow-hidden',
              selected
                ? 'border-brand-500/60 bg-brand-500/10 shadow-glow'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 hover:translate-y-[-1px]'
            )}
          >
            {/* Soft background glow for active selection */}
            {selected && (
              <span className="absolute -right-4 -bottom-4 w-16 h-16 bg-brand-500/20 rounded-full blur-xl pointer-events-none" />
            )}

            <div className="text-4xl filter drop-shadow-md select-none">
              {vehicleIcons[est.vehicleType] ?? '🚗'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-base capitalize leading-tight">
                    {est.vehicleType}
                  </p>
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 font-semibold">
                    <Users className="w-2.5 h-2.5 text-slate-500" />
                    {capacity}
                  </span>
                </div>
                <p className="font-black text-white text-base tracking-tight">
                  {est.fare.currency === 'USD' || est.fare.currency === 'INR' ? '₹' : est.fare.currency}{' '}
                  {est.fare.total.toFixed(0)}
                </p>
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-slate-400 truncate pr-2">
                  {vehicleDescriptions[est.vehicleType] ?? 'Premium point-to-point transit'}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-600" /> {est.eta} min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-white/5 text-[10px]">
                <span className="text-emerald-400 font-medium">
                  🟢 {nearbyCount} available nearby
                </span>
                {est.fare.surgeMultiplier > 1 && (
                  <span className="text-amber-450 font-bold bg-amber-500/10 px-1 rounded text-amber-400 animate-pulse">
                    ⚡ {est.fare.surgeMultiplier}x surge
                  </span>
                )}
              </div>
            </div>

            {selected && (
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 z-10 border border-white/20">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

