// src/tests/stores.test.ts
import { useDriverStore } from '../stores/driverStore';
import { useRideStore, ActiveRide } from '../stores/rideStore';

describe('Zustand Stores Realtime Updates', () => {
  beforeEach(() => {
    // Reset stores before each test
    useDriverStore.setState({ drivers: {} });
    useRideStore.setState({
      pickupLocation: null,
      dropoffLocation: null,
      activeRide: null,
      driverLocation: null,
      bookingStep: 'idle',
    });
  });

  describe('driverStore', () => {
    it('should update driver info on driver:location-updated', () => {
      const mockDriver = {
        driverId: 'drv-1',
        coordinates: { lat: 40.7128, lng: -74.006 },
        heading: 90,
        speed: 15,
        available: true,
      };

      useDriverStore.getState().updateDriver(mockDriver);

      const state = useDriverStore.getState();
      expect(state.drivers['drv-1']).toEqual(mockDriver);
    });

    it('should toggle driver availability', () => {
      const mockDriver = {
        driverId: 'drv-1',
        coordinates: { lat: 40.7128, lng: -74.006 },
        available: true,
      };

      useDriverStore.getState().updateDriver(mockDriver);
      useDriverStore.getState().setAvailability('drv-1', false);

      const state = useDriverStore.getState();
      expect(state.drivers['drv-1'].available).toBe(false);
    });

    it('should remove driver from store when they go offline', () => {
      const mockDriver = {
        driverId: 'drv-1',
        coordinates: { lat: 40.7128, lng: -74.006 },
        available: true,
      };

      useDriverStore.getState().updateDriver(mockDriver);
      useDriverStore.getState().removeDriver('drv-1');

      const state = useDriverStore.getState();
      expect(state.drivers['drv-1']).toBeUndefined();
    });
  });

  describe('rideStore', () => {
    it('should set active ride and booking step', () => {
      const mockRide: ActiveRide = {
        _id: 'ride-123',
        rider: { _id: 'rider-1', name: 'Rider', phone: '123', rating: 5 },
        pickupLocation: { address: 'A', coordinates: { lat: 0, lng: 0 } },
        dropoffLocation: { address: 'B', coordinates: { lat: 0, lng: 0 } },
        status: 'searching',
        vehicleType: 'economy',
        fare: { baseFare: 5, distanceFare: 5, timeFare: 2, surgeMultiplier: 1, total: 12, currency: 'USD' },
        distance: 5,
        duration: 10,
        createdAt: new Date().toISOString(),
      };

      useRideStore.getState().setActiveRide(mockRide);

      const state = useRideStore.getState();
      expect(state.activeRide).toEqual(mockRide);
      expect(state.bookingStep).toBe('tracking');
    });

    it('should update ride status', () => {
      const mockRide: ActiveRide = {
        _id: 'ride-123',
        rider: { _id: 'rider-1', name: 'Rider', phone: '123', rating: 5 },
        pickupLocation: { address: 'A', coordinates: { lat: 0, lng: 0 } },
        dropoffLocation: { address: 'B', coordinates: { lat: 0, lng: 0 } },
        status: 'searching',
        vehicleType: 'economy',
        fare: { baseFare: 5, distanceFare: 5, timeFare: 2, surgeMultiplier: 1, total: 12, currency: 'USD' },
        distance: 5,
        duration: 10,
        createdAt: new Date().toISOString(),
      };

      useRideStore.getState().setActiveRide(mockRide);
      useRideStore.getState().updateRideStatus('accepted');

      const state = useRideStore.getState();
      expect(state.activeRide?.status).toBe('accepted');
    });
  });
});
