import { create } from 'zustand';

export interface DriverInfo {
  driverId: string;
  coordinates: { lat: number; lng: number };
  heading?: number;
  speed?: number;
  available: boolean;
}

interface DriverState {
  drivers: Record<string, DriverInfo>;
  // Actions
  updateDriver: (payload: DriverInfo) => void;
  setAvailability: (driverId: string, available: boolean) => void;
  removeDriver: (driverId: string) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  drivers: {},
  updateDriver: (payload) =>
    set((state) => ({
      drivers: { ...state.drivers, [payload.driverId]: payload },
    })),
  setAvailability: (driverId, available) =>
    set((state) => {
      const driver = state.drivers[driverId];
      if (!driver) return {};
      return { drivers: { ...state.drivers, [driverId]: { ...driver, available } } };
    }),
  removeDriver: (driverId) =>
    set((state) => {
      const { [driverId]: _, ...rest } = state.drivers;
      return { drivers: rest };
    }),
}));
