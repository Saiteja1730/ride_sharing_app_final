// src/hooks/useRideSocket.ts

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useRideStore } from '@/stores/rideStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useRideSocket() {
  const { on, off } = useSocket();
  const {
    setActiveRide,
    updateRideStatus,
    setDriverLocation,
  } = useRideStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Ride accepted (driver assigned)
    const handleAccepted = (payload: any) => {
      const ride = payload?.ride || payload;
      if (ride) {
        setActiveRide(ride);
        toast.success('Your driver is on the way!', { icon: '🚗' });
        queryClient.invalidateQueries({ queryKey: ['active-ride'] });
      }
    };

    // 2. Status changes (arriving, ongoing, completed, cancelled)
    const handleStatusChanged = (payload: any) => {
      const { rideId, status, driverLocation } = payload;
      updateRideStatus(status);
      if (driverLocation) {
        setDriverLocation(driverLocation);
      }

      const messages: Record<string, string> = {
        arriving: '🚗 Driver is arriving!',
        ongoing: '🛣️ Ride started!',
        completed: '✅ Ride completed!',
        cancelled: '❌ Ride cancelled',
      };
      if (messages[status]) {
        toast(messages[status]);
      }
      if (status === 'completed' || status === 'cancelled') {
        setTimeout(() => setActiveRide(null), 2000);
      }
      queryClient.invalidateQueries({ queryKey: ['active-ride'] });
    };

    // 3. Ride cancelled directly
    const handleCancelled = (payload: any) => {
      const { reason } = payload;
      setActiveRide(null);
      toast.error(`Ride cancelled: ${reason || 'No reason provided'}`);
      queryClient.invalidateQueries({ queryKey: ['active-ride'] });
    };

    on('ride:accepted', handleAccepted);
    on('ride:status-changed', handleStatusChanged);
    on('ride:cancelled', handleCancelled);

    return () => {
      off('ride:accepted', handleAccepted);
      off('ride:status-changed', handleStatusChanged);
      off('ride:cancelled', handleCancelled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
