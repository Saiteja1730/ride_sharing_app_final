'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, Search, Star, Filter, Calendar, CreditCard, ArrowRight, 
  Download, User, Car, Navigation, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { rideApi } from '@/lib/apiClient';
import { RideCard } from '@/components/ride/RideCard';
import { RideCardSkeleton } from '@/components/ui/Skeletons';
import { Input } from '@/components/ui/Input';
import { useRide } from '@/hooks/useRide';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function RideHistoryPage() {
  const [page, setPage] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [ratingRide, setRatingRide] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  
  const { rateRide } = useRide();

  // Fetch standard page history
  const { data, isLoading } = useQuery({
    queryKey: ['ride-history', page],
    queryFn: () => rideApi.getHistory({ page, limit: 10 }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  // Search rides
  const { data: searchData } = useQuery({
    queryKey: ['search-rides', searchQ],
    queryFn: () => rideApi.searchRides(searchQ).then(r => r.data),
    enabled: searchQ.length > 2,
  });

  const baseRides = searchQ.length > 2 ? (searchData?.data || []) : (data?.data || []);
  const meta = data?.meta;

  // Apply filters client-side for enhanced responsiveness
  const rides = baseRides.filter((ride: any) => {
    const typeMatch = filterType === 'all' || ride.vehicleType?.toLowerCase() === filterType.toLowerCase();
    const statusMatch = filterStatus === 'all' || ride.status?.toLowerCase() === filterStatus.toLowerCase();
    return typeMatch && statusMatch;
  });

  const downloadInvoice = (ride: any) => {
    try {
      const invoiceId = `INV-${ride._id.slice(-6).toUpperCase()}`;
      const baseFare = ride.fare?.baseFare ?? 50;
      const distanceFare = ride.fare?.distanceFare ?? 0;
      const timeFare = ride.fare?.timeFare ?? 0;
      const surgeMultiplier = ride.fare?.surgeMultiplier ?? 1.0;
      const total = ride.fare?.total ?? 0;
      const dateString = new Date(ride.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const invoiceText = `
==================================================
                 RIDESHARE INVOICE
==================================================
Invoice ID     : ${invoiceId}
Booking Ref ID : ${ride._id}
Date & Time    : ${dateString}
Vehicle Type   : ${ride.vehicleType?.toUpperCase() ?? 'SEDAN'}
Payment Status : PAID (Successful)
--------------------------------------------------
ROUTE DETAILS:
Pickup Location:
  ${ride.pickupLocation?.address}

Dropoff Location:
  ${ride.dropoffLocation?.address}

Trip Metrics:
  Distance Travelled : ${(ride.distance ?? 4.2).toFixed(1)} km
  Trip Duration      : ${Math.round(ride.duration ?? 12)} mins
--------------------------------------------------
FARE BREAKDOWN:
  Base Ride Fare      : INR ${baseFare.toFixed(2)}
  Distance Charge     : INR ${distanceFare.toFixed(2)}
  Duration Charge     : INR ${timeFare.toFixed(2)}
  Surge Surcharge     : ${surgeMultiplier > 1 ? `${surgeMultiplier}x multiplier` : 'None (1.0x)'}
  ------------------------------------------------
  TOTAL PAID FARE     : INR ${total.toFixed(2)}
==================================================
          Thank you for riding with RideShare!
         For 24/7 support, contact sos@rideshare.com
==================================================
`;

      const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Invoice ${invoiceId} downloaded successfully!`);
    } catch {
      toast.error("Failed to generate downloadable invoice.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Ride History</h1>
          <p className="text-xs text-slate-400 mt-1">Manage invoices, receipts, and past trip breakdowns</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Clock className="w-4 h-4 text-brand-400" />
          {meta?.total ?? 0} total rides
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <Input
            id="search"
            placeholder="Search by destination..."
            icon={<Search className="w-4 h-4 text-slate-500" />}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {/* Vehicle Type Filter */}
          <div className="flex-1 relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-10 px-3.5 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-500 appearance-none font-semibold cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Vehicles</option>
              <option value="bike" className="bg-slate-900">🏍️ Bike</option>
              <option value="auto" className="bg-slate-900">🛺 Auto</option>
              <option value="mini" className="bg-slate-900">🚗 Mini</option>
              <option value="sedan" className="bg-slate-900">🚕 Sedan</option>
              <option value="suv" className="bg-slate-900">🚙 SUV</option>
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none text-[8px] text-slate-400">▼</div>
          </div>

          {/* Status Filter */}
          <div className="flex-1 relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-10 px-3.5 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-500 appearance-none font-semibold cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="completed" className="bg-slate-900">🟢 Completed</option>
              <option value="cancelled" className="bg-slate-900">🔴 Cancelled</option>
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none text-[8px] text-slate-400">▼</div>
          </div>
        </div>
      </div>

      {/* Rating modal */}
      {ratingRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-sm mx-4 animate-slide-up bg-surface-950 border border-brand-500/35">
            <h3 className="text-lg font-display font-bold text-white mb-4">Rate your ride</h3>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 transition-colors ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRatingRide(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors">
                Skip
              </button>
              <button
                onClick={() => { rateRide({ id: ratingRide, rating }); setRatingRide(null); }}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ride Detail Modal */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 border border-white/15 shadow-2xl relative overflow-hidden animate-scale-up bg-surface-950 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRide(null)}
              className="absolute top-4 right-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ✕ Close
            </button>

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-brand-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Ride Receipt Summary</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(selectedRide.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <Badge label={selectedRide.status} status={selectedRide.status} />
            </div>

            {/* Journey points */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Pickup Address</p>
                  <p className="text-xs text-slate-200 mt-0.5 leading-normal">{selectedRide.pickupLocation?.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Dropoff Destination</p>
                  <p className="text-xs text-slate-200 mt-0.5 leading-normal">{selectedRide.dropoffLocation?.address}</p>
                </div>
              </div>
            </div>

            {/* Travel details & vehicle info */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Vehicle Class</p>
                <p className="text-sm font-bold text-white mt-1 capitalize">🚗 {selectedRide.vehicleType ?? 'Economy'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Distance</p>
                <p className="text-sm font-bold text-white mt-1">{(selectedRide.distance ?? 4.2).toFixed(1)} km</p>
              </div>
              <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Duration</p>
                <p className="text-sm font-bold text-white mt-1">{Math.round(selectedRide.duration ?? 12)} mins</p>
              </div>
            </div>

            {/* Invoice breakdowns */}
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2 mb-6">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-400" /> Fare Invoice Breakups (INR)
              </p>
              
              <div className="flex justify-between text-xs text-slate-400">
                <span>Base Booking Fare</span>
                <span className="font-semibold text-white">₹{(selectedRide.fare?.baseFare ?? 50.00).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Distance Charges</span>
                <span className="font-semibold text-white">₹{(selectedRide.fare?.distanceFare ?? 0.00).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
                <span>Journey Duration Charges</span>
                <span className="font-semibold text-white">₹{(selectedRide.fare?.timeFare ?? 0.00).toFixed(2)}</span>
              </div>
              
              {selectedRide.fare?.surgeMultiplier > 1 && (
                <div className="flex justify-between text-xs text-amber-400 font-semibold py-1">
                  <span>⚡ Surge Multiplier (Peak Hour)</span>
                  <span>{selectedRide.fare.surgeMultiplier}x surcharge</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-white font-extrabold pt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Total Paid (Successful)
                </span>
                <span className="text-emerald-400">₹{selectedRide.fare?.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="justify-center border-white/10 hover:bg-white/5 font-bold"
                icon={<Download className="w-4 h-4" />}
                onClick={() => downloadInvoice(selectedRide)}
              >
                Download Invoice
              </Button>

              <Button
                className="justify-center font-bold"
                onClick={() => setSelectedRide(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rides list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <RideCardSkeleton key={i} />)}
        </div>
      ) : rides.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/5 bg-white/3">
          <Clock className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No rides found</p>
          <p className="text-sm text-slate-600 mt-1">
            {searchQ ? 'Try a different search term or change your active filters' : 'Your completed rides will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride: any) => (
            <div 
              key={ride._id} 
              onClick={() => setSelectedRide(ride)}
              className="cursor-pointer group relative block"
            >
              {/* Highlight effect on hover */}
              <div className="absolute inset-0 bg-brand-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              
              <RideCard
                ride={ride}
                onRate={(id) => { setRatingRide(id); setRating(5); }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && !searchQ && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!meta.hasPrevPage}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-400 disabled:opacity-40 hover:bg-white/5 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!meta.hasNextPage}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-400 disabled:opacity-40 hover:bg-white/5 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
