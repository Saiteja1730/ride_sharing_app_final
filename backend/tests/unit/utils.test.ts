import { calculateFare, calculateSurgeMultiplier } from '../../src/utils/fareCalculator';
import { haversineDistance, estimateEta } from '../../src/utils/geoUtils';

// Mock config for tests
jest.mock('../../src/config', () => ({
  config: {
    fare: {
      economy: 2.5,
      premium: 5.0,
      suv: 6.0,
      xl: 7.0,
      pricePerKm: 1.2,
      pricePerMin: 0.25,
      surgeThreshold: 0.7,
      maxSurgeMultiplier: 3.0,
    },
    logging: { level: 'silent' },
    isProduction: false,
  },
}));

describe('Fare Calculator', () => {
  describe('calculateFare', () => {
    it('calculates economy fare correctly', () => {
      const fare = calculateFare('economy', 10, 20, 1.0);
      expect(fare.baseFare).toBe(2.5);
      expect(fare.distanceFare).toBe(12.0);
      expect(fare.timeFare).toBe(5.0);
      expect(fare.total).toBeCloseTo(19.5);
      expect(fare.currency).toBe('INR');
      expect(fare.surgeMultiplier).toBe(1.0);
    });

    it('calculates surge fare correctly', () => {
      const fare = calculateFare('economy', 10, 20, 2.0);
      expect(fare.total).toBeCloseTo(39.0);
      expect(fare.surgeMultiplier).toBe(2.0);
    });

    it('calculates premium fare with higher base', () => {
      const fare = calculateFare('premium', 5, 10, 1.0);
      expect(fare.baseFare).toBe(5.0);
      expect(fare.distanceFare).toBe(9.0);
      expect(fare.timeFare).toBeCloseTo(3.75);
    });

    it('falls back to economy for unknown vehicle type', () => {
      const fare = calculateFare('unknown', 10, 20, 1.0);
      expect(fare.baseFare).toBe(2.5);
    });
  });

  describe('calculateSurgeMultiplier', () => {
    it('returns 1.0 when below threshold', () => {
      expect(calculateSurgeMultiplier(5, 10)).toBe(1.0); // ratio = 0.5 < 0.7
    });

    it('returns max multiplier when no drivers available', () => {
      expect(calculateSurgeMultiplier(10, 0)).toBe(3.0);
    });

    it('returns increased multiplier above threshold', () => {
      const surge = calculateSurgeMultiplier(10, 10); // ratio = 1.0
      expect(surge).toBeGreaterThan(1.0);
      expect(surge).toBeLessThanOrEqual(3.0);
    });

    it('caps multiplier at max', () => {
      const surge = calculateSurgeMultiplier(100, 1); // very high demand
      expect(surge).toBeLessThanOrEqual(3.0);
    });
  });
});

describe('Geo Utils', () => {
  describe('haversineDistance', () => {
    it('calculates distance between NYC and Newark correctly', () => {
      // NYC: 40.7128, -74.0060 | Newark: 40.7357, -74.1724
      const dist = haversineDistance(40.7128, -74.006, 40.7357, -74.1724);
      expect(dist).toBeGreaterThan(13);
      expect(dist).toBeLessThan(16);
    });

    it('returns 0 for same coordinates', () => {
      const dist = haversineDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(dist).toBeCloseTo(0, 5);
    });
  });

  describe('estimateEta', () => {
    it('estimates ETA at 30km/h default speed', () => {
      const eta = estimateEta(15); // 15 km at 30 km/h = 30 min
      expect(eta).toBe(30);
    });

    it('estimates ETA at custom speed', () => {
      const eta = estimateEta(60, 60); // 60 km at 60 km/h = 60 min
      expect(eta).toBe(60);
    });
  });
});
