// src/hooks/useDriverSocket.ts

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useDriverStore } from '@/stores/driverStore';
import { useRideStore } from '@/stores/rideStore';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useDriverSocket() {
  const { on, off } = useSocket();
  const { updateDriver, setAvailability, removeDriver } = useDriverStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Nearby driver location updates
    const handleDriverLocation = (payload: any) => {
      const { driverId, coordinates, heading, speed } = payload;
      updateDriver({
        driverId,
        coordinates,
        heading,
        speed,
        available: true,
      });

      // Also sync active ride driver location
      const activeRide = useRideStore.getState().activeRide;
      if (activeRide && activeRide.driver?._id === driverId) {
        useRideStore.getState().setDriverLocation(coordinates);
      }
    };

    // 2. Driver availability changes
    const handleDriverAvailability = (payload: any) => {
      const { driverId, available } = payload;
      if (available) {
        setAvailability(driverId, true);
      } else {
        removeDriver(driverId);
      }
    };

    // 3. New Ride Request (from driver's perspective)
    const handleRideCreated = (ride: any) => {
      if (user?.role === 'driver') {
        toast('New ride request nearby!', { icon: '🔍' });
        queryClient.invalidateQueries({ queryKey: ['ride-requests'] });
      }
    };

    on('driver:location-updated', handleDriverLocation);
    on('driver:availability-changed', handleDriverAvailability);
    on('ride:created', handleRideCreated);

    return () => {
      off('driver:location-updated', handleDriverLocation);
      off('driver:availability-changed', handleDriverAvailability);
      off('ride:created', handleRideCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);
}
