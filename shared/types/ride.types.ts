import { ICoordinates, IUser, IDriver, VehicleType } from './user.types';

export type RideStatus =
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface ILocation {
  address: string;
  coordinates: ICoordinates;
  placeId?: string;
}

export interface IRide {
  _id: string;
  rider: IUser | string;
  driver?: IDriver | string;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  status: RideStatus;
  vehicleType: VehicleType;
  fare: IFare;
  distance: number;        // km
  duration: number;        // minutes
  otp?: string;
  rating?: IRideRating;
  timeline: IRideTimeline[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface IFare {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  total: number;
  currency: string;
}

export interface IRideRating {
  riderRating?: number;
  driverRating?: number;
  riderComment?: string;
  driverComment?: string;
}

export interface IRideTimeline {
  status: RideStatus;
  timestamp: string;
  note?: string;
}

export interface FareEstimateRequest {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  vehicleType: VehicleType;
}

export interface FareEstimateResponse {
  estimates: {
    vehicleType: VehicleType;
    fare: IFare;
    distance: number;
    duration: number;
    eta: number;
  }[];
  surgeActive: boolean;
  surgeMultiplier: number;
}

export interface BookRideRequest {
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  vehicleType: VehicleType;
  fareEstimate: IFare;
}

export interface NearbyDriver {
  driverId: string;
  name: string;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
    type: VehicleType;
  };
  rating: number;
  location: ICoordinates;
  distanceKm: number;
  eta: number; // minutes
}
