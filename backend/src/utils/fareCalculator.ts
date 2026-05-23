import { config } from '../config';
import { logger } from './logger';

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  total: number;
  platformCommission: number;
  driverEarnings: number;
  currency: string;
}

const BASE_FARES: Record<string, number> = {
  economy: config.fare.economy,
  premium: config.fare.premium,
  suv: config.fare.suv,
  xl: config.fare.xl,
  bike: 20.00,
  auto: 35.00,
  mini: 55.00,
  sedan: 80.00,
};

export const PRICE_PER_KM: Record<string, number> = {
  economy: config.fare.pricePerKm,
  premium: config.fare.pricePerKm * 1.5,
  suv: config.fare.pricePerKm * 2.0,
  xl: config.fare.pricePerKm * 2.2,
  bike: 8.00,
  auto: 12.00,
  mini: 15.00,
  sedan: 18.00,
};

export const PRICE_PER_MIN: Record<string, number> = {
  economy: config.fare.pricePerMin,
  premium: config.fare.pricePerMin * 1.5,
  suv: config.fare.pricePerMin * 2.0,
  xl: config.fare.pricePerMin * 2.2,
  bike: 1.00,
  auto: 1.50,
  mini: 2.00,
  sedan: 2.50,
};

/**
 * Calculate surge multiplier based on supply/demand ratio
 * demandRatio = activeRides / availableDrivers
 */
export function calculateSurgeMultiplier(
  activeRides: number,
  availableDrivers: number
): number {
  if (availableDrivers === 0) return config.fare.maxSurgeMultiplier;

  const demandRatio = activeRides / availableDrivers;

  if (demandRatio < config.fare.surgeThreshold) return 1.0;

  // Linear interpolation: 0.7 → 1.0x, 1.4+ → 3.0x
  const surgeRange = config.fare.maxSurgeMultiplier - 1.0;
  const surge = 1.0 + surgeRange * Math.min((demandRatio - config.fare.surgeThreshold) / 0.7, 1.0);

  const multiplier = Math.round(surge * 10) / 10; // round to 1dp
  logger.debug(`Surge: demandRatio=${demandRatio.toFixed(2)}, multiplier=${multiplier}`);
  return multiplier;
}

/**
 * Calculate full fare breakdown
 */
export function calculateFare(
  vehicleType: string,
  distanceKm: number,
  durationMin: number,
  surgeMultiplier = 1.0
): FareBreakdown {
  const baseFare = BASE_FARES[vehicleType] ?? BASE_FARES.economy;
  const perKm = PRICE_PER_KM[vehicleType] ?? PRICE_PER_KM.economy;
  const perMin = PRICE_PER_MIN[vehicleType] ?? PRICE_PER_MIN.economy;

  const distanceFare = distanceKm * perKm;
  const timeFare = durationMin * perMin;

  const subtotal = baseFare + distanceFare + timeFare;
  const total = Math.round(subtotal * surgeMultiplier * 100) / 100;

  // 10% platform commission
  const platformCommission = Math.round(total * 0.10 * 100) / 100;
  const driverEarnings = Math.round((total - platformCommission) * 100) / 100;

  return {
    baseFare: Math.round(baseFare * 100) / 100,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    surgeMultiplier,
    total,
    platformCommission,
    driverEarnings,
    currency: 'INR',
  };
}

