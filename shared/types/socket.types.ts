import { ICoordinates } from './user.types';
import { IRide, RideStatus, NearbyDriver } from './ride.types';

// ---- Events emitted by CLIENT → SERVER ----
export interface ClientToServerEvents {
  'driver:location-update': (payload: DriverLocationPayload) => void;
  'driver:toggle-availability': (available: boolean) => void;
  'ride:request': (rideId: string) => void;
  'ride:accept': (rideId: string) => void;
  'ride:reject': (rideId: string) => void;
  'ride:start': (rideId: string) => void;
  'ride:complete': (rideId: string) => void;
  'ride:cancel': (payload: { rideId: string; reason: string }) => void;
  'join:room': (roomId: string) => void;
  'leave:room': (roomId: string) => void;
}

// ---- Events emitted by SERVER → CLIENT ----
export interface ServerToClientEvents {
  'driver:location-updated': (payload: DriverLocationPayload) => void;
  'drivers:nearby': (drivers: NearbyDriver[]) => void;
  'ride:new-request': (ride: IRide) => void;
  'ride:accepted': (ride: IRide) => void;
  'ride:rejected': (rideId: string) => void;
  'ride:status-changed': (payload: RideStatusPayload) => void;
  'ride:completed': (ride: IRide) => void;
  'ride:cancelled': (payload: { rideId: string; reason: string }) => void;
  'ride:otp': (otp: string) => void;
  error: (message: string) => void;
}

// ---- Socket data stored on socket instance ----
export interface SocketData {
  userId: string;
  role: 'rider' | 'driver' | 'admin';
}

// ---- Payload types ----
export interface DriverLocationPayload {
  driverId: string;
  coordinates: ICoordinates;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface RideStatusPayload {
  rideId: string;
  status: RideStatus;
  driverLocation?: ICoordinates;
  timestamp: string;
}
