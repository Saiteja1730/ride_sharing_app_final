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
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Ride History</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage invoices, receipts, and past trip breakdowns</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-700 font-bold bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 shadow-sm">
          <Clock className="w-4 h-4 text-brand-600" />
          {meta?.total ?? 0} total rides
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid md:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="md:col-span-1">
          <Input
            id="search"
            placeholder="Search by destination..."
            icon={<Search className="w-5 h-5 text-slate-400" />}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          {/* Vehicle Type Filter */}
          <div className="flex-1 relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-12 px-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-bold cursor-pointer transition-all"
            >
              <option value="all" className="bg-white">All Vehicles</option>
              <option value="bike" className="bg-white">🏍️ Bike</option>
              <option value="auto" className="bg-white">🛺 Auto</option>
              <option value="mini" className="bg-white">🚗 Mini</option>
              <option value="sedan" className="bg-white">🚕 Sedan</option>
              <option value="suv" className="bg-white">🚙 SUV</option>
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-[10px] text-slate-400 font-black">▼</div>
          </div>

          {/* Status Filter */}
          <div className="flex-1 relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-12 px-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-bold cursor-pointer transition-all"
            >
              <option value="all" className="bg-white">All Statuses</option>
              <option value="completed" className="bg-white">🟢 Completed</option>
              <option value="cancelled" className="bg-white">🔴 Cancelled</option>
            </select>
            <div className="absolute right-4 top-4 pointer-events-none text-[10px] text-slate-400 font-black">▼</div>
          </div>
        </div>
      </div>

      {/* Rating modal */}
      {ratingRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-8 w-full max-w-sm mx-4 animate-scale-up rounded-2xl shadow-2xl border border-slate-200">
            <h3 className="text-xl font-display font-bold text-slate-900 mb-6 text-center">Rate your ride</h3>
            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="hover:scale-110 transition-transform">
                  <Star className={`w-10 h-10 transition-colors ${s <= rating ? 'text-amber-500 fill-amber-500 drop-shadow-sm' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setRatingRide(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                Skip
              </button>
              <button
                onClick={() => { rateRide({ id: ratingRide, rating }); setRatingRide(null); }}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ride Detail Modal */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl relative overflow-hidden animate-scale-up border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRide(null)}
              className="absolute top-5 right-5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              ✕ Close
            </button>

            <div className="flex items-center justify-between mb-6 pr-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg tracking-tight">Ride Receipt Summary</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {new Date(selectedRide.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <Badge label={selectedRide.status} status={selectedRide.status} />
            </div>

            {/* Journey points */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 mb-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0 shadow-sm" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pickup Address</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5 leading-snug">{selectedRide.pickupLocation?.address}</p>
                </div>
              </div>
              
              <div className="ml-1.5 w-0.5 h-6 bg-slate-200 -my-2" />

              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-brand-600 mt-1 flex-shrink-0 shadow-sm" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dropoff Destination</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5 leading-snug">{selectedRide.dropoffLocation?.address}</p>
                </div>
              </div>
            </div>

            {/* Travel details & vehicle info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vehicle Class</p>
                <p className="text-base font-black text-slate-900 mt-1.5 capitalize">🚗 {selectedRide.vehicleType ?? 'Economy'}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Distance</p>
                <p className="text-base font-black text-slate-900 mt-1.5">{(selectedRide.distance ?? 4.2).toFixed(1)} km</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Duration</p>
                <p className="text-base font-black text-slate-900 mt-1.5">{Math.round(selectedRide.duration ?? 12)} mins</p>
              </div>
            </div>

            {/* Invoice breakdowns */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mb-8 shadow-sm">
              <p className="text-xs text-slate-700 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> Fare Invoice Breakups (INR)
              </p>
              
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Base Booking Fare</span>
                <span className="font-bold text-slate-900">₹{(selectedRide.fare?.baseFare ?? 50.00).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Distance Charges</span>
                <span className="font-bold text-slate-900">₹{(selectedRide.fare?.distanceFare ?? 0.00).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-600 border-b border-slate-200 pb-3">
                <span>Journey Duration Charges</span>
                <span className="font-bold text-slate-900">₹{(selectedRide.fare?.timeFare ?? 0.00).toFixed(2)}</span>
              </div>
              
              {selectedRide.fare?.surgeMultiplier > 1 && (
                <div className="flex justify-between text-sm text-orange-600 font-bold py-1">
                  <span>⚡ Surge Multiplier (Peak Hour)</span>
                  <span>{selectedRide.fare.surgeMultiplier}x surcharge</span>
                </div>
              )}

              <div className="flex justify-between text-lg text-slate-900 font-black pt-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> Total Paid (Successful)
                </span>
                <span className="text-emerald-600">₹{selectedRide.fare?.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="secondary"
                className="justify-center border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold"
                icon={<Download className="w-5 h-5" />}
                onClick={() => downloadInvoice(selectedRide)}
              >
                Download Invoice
              </Button>

              <Button
                className="justify-center font-bold text-base"
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
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <RideCardSkeleton key={i} />)}
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-200">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-5" />
          <p className="text-lg text-slate-900 font-bold">No rides found</p>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {searchQ ? 'Try a different search term or change your active filters' : 'Your completed rides will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride: any) => (
            <div 
              key={ride._id} 
              onClick={() => setSelectedRide(ride)}
              className="cursor-pointer group relative block bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
            >
              {/* Highlight effect on hover */}
              <div className="absolute inset-0 bg-brand-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              
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
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!meta.hasPrevPage}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Previous
          </button>
          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!meta.hasNextPage}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
