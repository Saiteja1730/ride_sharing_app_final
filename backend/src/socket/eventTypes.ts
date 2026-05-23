export interface DriverLocationPayload {
  driverId: string;
  coordinates: { lat: number; lng: number };
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface RideAcceptedPayload {
  rideId: string;
  driverId: string;
  driverInfo: {
    name: string;
    phone: string;
    rating: number;
    vehicleInfo?: Record<string, string>;
  };
  status: 'accepted';
  timestamp: string;
}

export interface RideStatusChangedPayload {
  rideId: string;
  status: 'searching' | 'accepted' | 'arriving' | 'ongoing' | 'completed' | 'cancelled';
  timestamp: string;
}

export interface RideCancelledPayload {
  rideId: string;
  reason: string;
  timestamp: string;
}

export interface RideCompletedPayload {
  rideId: string;
  driverId: string;
  riderId: string;
  fare: {
    total: number;
    currency: string;
  };
  timestamp: string;
}

export interface DriverToggleAvailabilityPayload {
  driverId: string;
  available: boolean;
  timestamp: string;
}
