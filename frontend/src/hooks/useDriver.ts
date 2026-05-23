'use client';
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { driverApi } from '@/lib/apiClient';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';

export function useDriver() {
  const qc = useQueryClient();
  const { user, updateUser } = useAuthStore();

  // Driver stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: () => driverApi.getStats().then(r => r.data.data),
    staleTime: 30000,
  });

  // Pending ride requests
  const { data: rideRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['ride-requests'],
    queryFn: () => driverApi.getRideRequests().then(r => r.data.data),
    refetchInterval: 15000,
  });

  // Toggle availability
  const availabilityMutation = useMutation({
    mutationFn: ({ isAvailable, lat, lng }: { isAvailable: boolean; lat?: number; lng?: number }) =>
      driverApi.toggleAvailability(isAvailable, lat, lng),
    onSuccess: (res) => {
      const { isAvailable } = res.data.data;
      updateUser({ isAvailable });
      const socket = getSocket();
      socket?.emit('driver:toggle-availability', isAvailable);
      toast.success(isAvailable ? '🟢 You are now online' : '🔴 You are now offline');
      qc.invalidateQueries({ queryKey: ['driver-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update status'),
  });

  // Accept ride
  const acceptMutation = useMutation({
    mutationFn: (rideId: string) => driverApi.acceptRide(rideId),
    onSuccess: (res) => {
      const ride = res.data.data;
      const socket = getSocket();
      socket?.emit('join:room', `ride:${ride._id}`);
      qc.invalidateQueries({ queryKey: ['ride-requests', 'driver-stats'] });
      toast.success('Ride accepted! Head to pickup. 📍');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Could not accept ride'),
  });

  // Update ride status
  const statusMutation = useMutation({
    mutationFn: ({ rideId, status }: { rideId: string; status: string }) =>
      driverApi.updateRideStatus(rideId, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['driver-stats'] });
      const messages: Record<string, string> = {
        arriving: '🚗 Marked as arriving',
        ongoing: '🛣️ Ride started',
        completed: '✅ Ride completed!',
      };
      toast.success(messages[status] || 'Status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Status update failed'),
  });

  // Emit live location via socket
  const emitLocation = useCallback((lat: number, lng: number, heading = 0) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('driver:location-update', {
      driverId: user?._id || '',
      coordinates: { lat, lng },
      heading,
      timestamp: Date.now(),
    });
  }, [user?._id]);

  return {
    stats,
    statsLoading,
    rideRequests,
    refetchRequests,
    toggleAvailability: availabilityMutation.mutate,
    acceptRide: acceptMutation.mutate,
    updateStatus: statusMutation.mutate,
    emitLocation,
    isAccepting: acceptMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,
  };
}
