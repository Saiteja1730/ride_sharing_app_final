'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useRideStore } from '@/stores/rideStore';
import { useDriverStore } from '@/stores/driverStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket() {
  const { token, isAuthenticated, user } = useAuthStore();
  const { setActiveRide, updateRideStatus, setDriverLocation } = useRideStore();
  const { updateDriver, setAvailability, removeDriver } = useDriverStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    // ── Ride events ──────────────────────────────────
    socket.on('ride:accepted', (payload) => {
      // payload could be { ride } or direct ride object depending on context
      const ride = payload?.ride || payload;
      setActiveRide(ride);
      toast.success('Your driver is on the way!', { icon: '🚗' });
      queryClient.invalidateQueries({ queryKey: ['active-ride'] });
    });

    socket.on('ride:status-changed', ({ status, driverLocation, rideId }) => {
      updateRideStatus(status);
      if (driverLocation) setDriverLocation(driverLocation);

      const messages: Record<string, string> = {
        arriving: '🚗 Driver is arriving!',
        ongoing: '🛣️ Ride started!',
        completed: '✅ Ride completed!',
        cancelled: '❌ Ride cancelled',
      };
      if (messages[status]) toast(messages[status]);
      if (status === 'completed' || status === 'cancelled') {
        setTimeout(() => setActiveRide(null), 2000);
      }
      queryClient.invalidateQueries({ queryKey: ['active-ride'] });
    });

    socket.on('ride:cancelled', ({ reason }) => {
      setActiveRide(null);
      toast.error(`Ride cancelled: ${reason}`);
      queryClient.invalidateQueries({ queryKey: ['active-ride'] });
    });

    // ── Driver events (Rider perspective) ─────────────
    socket.on('driver:location-updated', (payload) => {
      const { driverId, coordinates, heading, speed } = payload;
      // Update nearby drivers store
      updateDriver({
        driverId,
        coordinates,
        heading,
        speed,
        available: true,
      });

      // If this is the active ride's driver, update driverLocation in rideStore too
      const currentActiveRide = useRideStore.getState().activeRide;
      if (currentActiveRide && currentActiveRide.driver?._id === driverId) {
        setDriverLocation(coordinates);
      }
    });

    socket.on('driver:availability-changed', ({ driverId, available }) => {
      if (available) {
        setAvailability(driverId, true);
      } else {
        removeDriver(driverId);
      }
    });

    // ── Driver events (Driver perspective) ─────────────
    socket.on('ride:created', (ride) => {
      if (user?.role === 'driver') {
        toast('New ride request nearby!', { icon: '🔍' });
        queryClient.invalidateQueries({ queryKey: ['ride-requests'] });
      }
    });

    socket.on('error', (msg) => {
      toast.error(msg);
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, user?.role]);

  return socketRef.current;
}
