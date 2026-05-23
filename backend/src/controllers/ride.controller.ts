import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Ride } from '../models/Ride';
import { HttpError } from '../middleware/errorHandler';
import {
  getFromCache,
  setCache,
  invalidateCache,
  CACHE_KEYS,
  CACHE_TTL,
} from '../config/redis';
import {
  haversineDistance,
  estimateEta,
  mongoGeoToCoords,
} from '../utils/geoUtils';
import {
  calculateFare,
  calculateSurgeMultiplier,
  PRICE_PER_KM,
  PRICE_PER_MIN,
} from '../utils/fareCalculator';
import { logger } from '../utils/logger';

/**
 * @swagger
 * /api/rides/estimate:
 *   post:
 *     tags: [Rides]
 *     summary: Get fare estimates for all vehicle types
 */
export const estimateFare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    const cacheKey = CACHE_KEYS.fareEstimate(
      `${pickupLat},${pickupLng}`,
      `${dropoffLat},${dropoffLng}`,
      'all'
    );

    // Cache check
    const cached = await getFromCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const distanceKm = haversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const durationMin = Math.ceil((distanceKm / 30) * 60); // ~30 km/h avg

    // Surge: count active rides vs available drivers
    const [activeRides, availableDrivers, activeDriversByType] = await Promise.all([
      Ride.countDocuments({ status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] } }),
      User.countDocuments({ role: 'driver', isAvailable: true }),
      User.aggregate([
        { $match: { role: 'driver', isAvailable: true } },
        { $group: { _id: '$vehicleInfo.type', count: { $sum: 1 } } }
      ])
    ]);
    const surgeMultiplier = calculateSurgeMultiplier(activeRides, availableDrivers);

    const availableTypes = ['bike', 'auto', 'mini', 'sedan', 'suv'];

    // Map through only available vehicle types
    const estimates = availableTypes.map((type) => ({
      vehicleType: type as any,
      fare: calculateFare(type as any, distanceKm, durationMin, surgeMultiplier),
      distance: Math.round(distanceKm * 10) / 10,
      duration: durationMin,
      eta: estimateEta(distanceKm),
    }));

    const result = {
      estimates,
      surgeActive: surgeMultiplier > 1.0,
      surgeMultiplier,
    };

    await setCache(cacheKey, result, CACHE_TTL.fareEstimate);
    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/rides:
 *   post:
 *     tags: [Rides]
 *     summary: Book a ride
 */
export const bookRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const riderId = req.user!.userId;

    // Check no active ride
    const activeRide = await Ride.findActiveRide(riderId, 'rider');
    if (activeRide) throw new HttpError('You already have an active ride', 409);

    const { pickupLocation, dropoffLocation, vehicleType, fareEstimate } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await Ride.create({
      rider: riderId,
      pickupLocation: {
        address: pickupLocation.address,
        coordinates: {
          type: 'Point',
          coordinates: [pickupLocation.coordinates.lng, pickupLocation.coordinates.lat],
        },
        placeId: pickupLocation.placeId,
      },
      dropoffLocation: {
        address: dropoffLocation.address,
        coordinates: {
          type: 'Point',
          coordinates: [dropoffLocation.coordinates.lng, dropoffLocation.coordinates.lat],
        },
        placeId: dropoffLocation.placeId,
      },
      vehicleType,
      fare: fareEstimate,
      distance: fareEstimate.distanceFare / (PRICE_PER_KM[vehicleType] ?? 12.00),
      duration: fareEstimate.timeFare / (PRICE_PER_MIN[vehicleType] ?? 2.00),
      otp,
      status: 'searching',
      timeline: [{ status: 'searching', timestamp: new Date() }],
    });

    await invalidateCache(`history:${riderId}:*`);

    logger.info(`Ride booked: ${ride.id} by rider ${riderId}`);

    const io = (req as any).io;
    if (io) {
      io.to('drivers').emit('ride:created', {
        rideId: ride._id,
        riderId,
        pickupLocation: {
          address: ride.pickupLocation.address,
          coordinates: {
            lat: ride.pickupLocation.coordinates.coordinates[1],
            lng: ride.pickupLocation.coordinates.coordinates[0],
          },
        },
        dropoffLocation: {
          address: ride.dropoffLocation.address,
          coordinates: {
            lat: ride.dropoffLocation.coordinates.coordinates[1],
            lng: ride.dropoffLocation.coordinates.coordinates[0],
          },
        },
        vehicleType: ride.vehicleType,
        fare: {
          total: ride.fare.total,
          currency: ride.fare.currency,
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: { ...ride.toObject(), otp: undefined }, // don't expose OTP
      message: 'Ride requested. Searching for drivers...',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/rides/active:
 *   get:
 *     tags: [Rides]
 *     summary: Get current active ride
 */
export const getActiveRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role } = req.user!;
    const ride = await Ride.findActiveRide(userId, role as 'rider' | 'driver');
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/rides/history:
 *   get:
 *     tags: [Rides]
 *     summary: Get ride history with pagination
 */
export const getRideHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = CACHE_KEYS.rideHistory(userId, page);
    const cached = await getFromCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, ...(cached as object) });
      return;
    }

    const field = role === 'driver' ? 'driver' : 'rider';
    const query = { [field]: userId, status: { $in: ['completed', 'cancelled'] } };

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('rider driver', 'name email phone avatar rating'),
      Ride.countDocuments(query),
    ]);

    const result = {
      data: rides,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };

    await setCache(cacheKey, result, CACHE_TTL.rideHistory);
    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/rides/{id}/cancel:
 *   patch:
 *     tags: [Rides]
 *     summary: Cancel a ride
 */
export const cancelRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { reason } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) throw new HttpError('Ride not found', 404);

    const isRider = role === 'rider' && ride.rider.toString() === userId;
    const isDriver = role === 'driver' && ride.driver?.toString() === userId;
    if (!isRider && !isDriver && role !== 'admin') {
      throw new HttpError('Not authorized to cancel this ride', 403);
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      throw new HttpError(`Ride is already ${ride.status}`, 400);
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason || 'No reason provided';
    ride.timeline.push({ status: 'cancelled', timestamp: new Date(), note: reason });
    await ride.save();

    await invalidateCache(`history:${userId}:*`);

    const io = (req as any).io;
    if (io) {
      const roomId = `ride:${ride._id}`;
      io.to(roomId).emit('ride:cancelled', { rideId: ride._id, reason: ride.cancellationReason });
      io.to(roomId).emit('ride:status-changed', {
        rideId: ride._id,
        status: 'cancelled',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, data: ride, message: 'Ride cancelled' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/rides/{id}/rate:
 *   post:
 *     tags: [Rides]
 *     summary: Rate a completed ride
 */
export const rateRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { rating, comment } = req.body;

    const ride = await Ride.findById(id).populate('rider driver');
    if (!ride) throw new HttpError('Ride not found', 404);
    if (ride.status !== 'completed') throw new HttpError('Only completed rides can be rated', 400);

    if (role === 'rider') {
      ride.rating = ride.rating || {};
      ride.rating.driverRating = rating;
      ride.rating.riderComment = comment;

      // Update driver's avg rating
      if (ride.driver) {
        const driver = await User.findById(ride.driver);
        if (driver) {
          const newCount = driver.ratingCount + 1;
          driver.rating = (driver.rating * driver.ratingCount + rating) / newCount;
          driver.ratingCount = newCount;
          await driver.save();
        }
      }
    } else {
      ride.rating = ride.rating || {};
      ride.rating.riderRating = rating;
      ride.rating.driverComment = comment;
    }

    await ride.save();
    res.json({ success: true, data: ride, message: 'Rating submitted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/rides/search:
 *   get:
 *     tags: [Rides]
 *     summary: Search ride history by destination (text search)
 */
export const searchRides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query;
    const { userId } = req.user!;

    if (!q) throw new HttpError('Search query required', 400);

    const rides = await Ride.find({
      rider: userId,
      $text: { $search: q as string },
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('driver', 'name vehicleInfo rating');

    res.json({ success: true, data: rides });
  } catch (err) {
    next(err);
  }
};
