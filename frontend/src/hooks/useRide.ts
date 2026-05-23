import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rideApi } from '@/lib/apiClient';
import { useRideStore } from '@/stores/rideStore';
import { getSocket } from '@/lib/socket';

export function useRide() {
  const qc = useQueryClient();
  const {
    pickupLocation, dropoffLocation,
    selectedVehicleType, setFareEstimates,
    setActiveRide, setBookingStep, resetBooking,
    activeRide: storeActiveRide,
  } = useRideStore();

  // Active ride polling
  const { data: activeRideData } = useQuery({
    queryKey: ['active-ride'],
    queryFn: () => rideApi.getActiveRide().then(r => r.data.data),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Sync polling data to Zustand store if store is empty or different
  useEffect(() => {
    if (activeRideData) {
      if (!storeActiveRide || storeActiveRide._id !== activeRideData._id || storeActiveRide.status !== activeRideData.status) {
        setActiveRide(activeRideData);
      }
    } else if (storeActiveRide && activeRideData === null) {
      setActiveRide(null);
    }
  }, [activeRideData, storeActiveRide, setActiveRide]);

  // Fare estimation
  const estimateMutation = useMutation({
    mutationFn: rideApi.estimateFare,
    onSuccess: (res) => {
      const { estimates, surgeActive, surgeMultiplier } = res.data.data;
      setFareEstimates(estimates, surgeActive, surgeMultiplier);
      setBookingStep('select-vehicle');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to get fare'),
  });

  // Book ride
  const bookMutation = useMutation({
    mutationFn: rideApi.bookRide,
    onSuccess: (res) => {
      const ride = res.data.data;
      setActiveRide(ride);
      setBookingStep('searching');
      qc.invalidateQueries({ queryKey: ['active-ride'] });
      // Join socket room
      const socket = getSocket();
      socket?.emit('join:room', `ride:${ride._id}`);
      toast.success('Searching for drivers...', { icon: '🔍' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Booking failed'),
  });

  // Cancel ride
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rideApi.cancelRide(id, reason),
    onSuccess: () => {
      resetBooking();
      setActiveRide(null);
      qc.invalidateQueries({ queryKey: ['active-ride', 'ride-history'] });
      toast('Ride cancelled', { icon: '❌' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Cancel failed'),
  });

  // Rate ride
  const rateMutation = useMutation({
    mutationFn: ({ id, rating, comment }: { id: string; rating: number; comment?: string }) =>
      rideApi.rateRide(id, rating, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride-history'] });
      toast.success('Rating submitted! ⭐');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Rating failed'),
  });

  const estimateFare = () => {
    if (!pickupLocation || !dropoffLocation) return;
    estimateMutation.mutate({
      pickupLat: pickupLocation.coordinates.lat,
      pickupLng: pickupLocation.coordinates.lng,
      dropoffLat: dropoffLocation.coordinates.lat,
      dropoffLng: dropoffLocation.coordinates.lng,
    });
  };

  const bookRide = (fareEstimate: Record<string, number | string>) => {
    if (!pickupLocation || !dropoffLocation) return;
    bookMutation.mutate({
      pickupLocation,
      dropoffLocation,
      vehicleType: selectedVehicleType,
      fareEstimate,
    });
  };

  return {
    activeRide: activeRideData,
    estimateFare,
    bookRide,
    cancelRide: cancelMutation.mutate,
    rateRide: rateMutation.mutate,
    isEstimating: estimateMutation.isPending,
    isBooking: bookMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
