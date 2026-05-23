import { create } from 'zustand';

export type RideStatus =
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface Coordinates { lat: number; lng: number; }
export interface LocationPoint { address: string; coordinates: Coordinates; placeId?: string; }

export interface ActiveRide {
  _id: string;
  rider: { _id: string; name: string; phone: string; rating: number; avatar?: string };
  driver?: { _id: string; name: string; phone: string; rating: number; avatar?: string; vehicleInfo?: Record<string, string> };
  pickupLocation: LocationPoint;
  dropoffLocation: LocationPoint;
  status: RideStatus;
  vehicleType: string;
  fare: { baseFare: number; distanceFare: number; timeFare: number; surgeMultiplier: number; total: number; currency: string };
  distance: number;
  duration: number;
  createdAt: string;
}

export interface FareEstimate {
  vehicleType: string;
  fare: ActiveRide['fare'];
  distance: number;
  duration: number;
  eta: number;
}

interface RideState {
  // Booking flow
  pickupLocation: LocationPoint | null;
  dropoffLocation: LocationPoint | null;
  selectedVehicleType: string;
  fareEstimates: FareEstimate[];
  surgeActive: boolean;
  surgeMultiplier: number;

  // Active ride
  activeRide: ActiveRide | null;
  driverLocation: Coordinates | null;

  // UI state
  bookingStep: 'idle' | 'select-location' | 'select-vehicle' | 'confirming' | 'searching' | 'tracking';

  // Actions
  setPickup: (location: LocationPoint | null) => void;
  setDropoff: (location: LocationPoint | null) => void;
  setVehicleType: (type: string) => void;
  setFareEstimates: (estimates: FareEstimate[], surgeActive: boolean, surgeMultiplier: number) => void;
  setActiveRide: (ride: ActiveRide | null) => void;
  updateRideStatus: (status: RideStatus) => void;
  setDriverLocation: (coords: Coordinates) => void;
  setBookingStep: (step: RideState['bookingStep']) => void;
  resetBooking: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  pickupLocation: null,
  dropoffLocation: null,
  selectedVehicleType: 'economy',
  fareEstimates: [],
  surgeActive: false,
  surgeMultiplier: 1.0,
  activeRide: null,
  driverLocation: null,
  bookingStep: 'idle',

  setPickup: (location) => set({ pickupLocation: location }),
  setDropoff: (location) => set({ dropoffLocation: location }),
  setVehicleType: (type) => set({ selectedVehicleType: type }),
  setFareEstimates: (estimates, surgeActive, surgeMultiplier) =>
    set({ fareEstimates: estimates, surgeActive, surgeMultiplier }),
  setActiveRide: (ride) =>
    set({
      activeRide: ride,
      bookingStep: ride
        ? (ride.status === 'searching' ? 'searching' : 'tracking')
        : 'idle',
    }),
  updateRideStatus: (status) =>
    set((state) =>
      state.activeRide
        ? { activeRide: { ...state.activeRide, status } }
        : {}
    ),
  setDriverLocation: (coords) => set({ driverLocation: coords }),
  setBookingStep: (step) => set({ bookingStep: step }),
  resetBooking: () =>
    set({
      pickupLocation: null,
      dropoffLocation: null,
      fareEstimates: [],
      surgeActive: false,
      surgeMultiplier: 1.0,
      bookingStep: 'idle',
    }),
}));
