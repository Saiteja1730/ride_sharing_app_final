import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Ride } from '../models/Ride';
import { HttpError } from '../middleware/errorHandler';
import {
  getFromCache,
  setCache,
  CACHE_KEYS,
  CACHE_TTL,
  invalidateCache,
} from '../config/redis';
import { mongoGeoToCoords, estimateEta, haversineDistance } from '../utils/geoUtils';

/**
 * @swagger
 * /api/drivers/nearby:
 *   get:
 *     tags: [Drivers]
 *     summary: Get nearby available drivers
 */
export const getNearbyDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 5;
    const vehicleType = req.query.vehicleType as string | undefined;

    if (isNaN(lat) || isNaN(lng)) throw new HttpError('Invalid lat/lng', 400);

    const cacheKey = CACHE_KEYS.nearbyDrivers(lat, lng);
    const cached = await getFromCache<unknown[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const drivers = await (User as any).findNearbyDrivers(lat, lng, radius, vehicleType);

    const result = drivers.map((d: any) => {
      const coords = mongoGeoToCoords(d.currentLocation.coordinates);
      return {
        driverId: d._id,
        name: d.name,
        rating: d.rating,
        vehicleInfo: d.vehicleInfo,
        location: coords,
        distanceKm: Math.round(haversineDistance(lat, lng, coords.lat, coords.lng) * 10) / 10,
        eta: estimateEta(haversineDistance(lat, lng, coords.lat, coords.lng)),
      };
    });

    await setCache(cacheKey, result, CACHE_TTL.nearbyDrivers);
    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/drivers/availability:
 *   patch:
 *     tags: [Drivers]
 *     summary: Toggle driver availability
 */
export const toggleAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { isAvailable, lat, lng } = req.body;

    const driver = await User.findById(userId);
    if (!driver) throw new HttpError('Driver not found', 404);

    if (isAvailable && driver.kycStatus !== 'approved') {
      throw new HttpError('Cannot go online without KYC approval', 403);
    }

    const updateData: Record<string, unknown> = { isAvailable };
    if (lat !== undefined && lng !== undefined) {
      updateData.currentLocation = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    const updatedDriver = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    if (!updatedDriver) throw new HttpError('Driver not found', 404);

    await invalidateCache('drivers:nearby:*');

    res.json({
      success: true,
      data: { isAvailable: updatedDriver.isAvailable },
      message: `You are now ${isAvailable ? 'online' : 'offline'}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/drivers/location:
 *   patch:
 *     tags: [Drivers]
 *     summary: Update driver location
 */
export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { lat, lng } = req.body;

    await User.findByIdAndUpdate(userId, {
      $set: {
        currentLocation: { type: 'Point', coordinates: [lng, lat] },
      },
    });

    await invalidateCache('drivers:nearby:*');
    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/drivers/ride-requests:
 *   get:
 *     tags: [Drivers]
 *     summary: Get pending ride requests near driver
 */
export const getRideRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const driver = await User.findById(userId);
    if (!driver) {
      throw new HttpError('Driver not found', 404);
    }
    if (driver.kycStatus !== 'approved') {
      throw new HttpError('KYC approval required to view requests', 403);
    }
    if (!driver.currentLocation) {
      throw new HttpError('Driver location not set', 400);
    }

    const [lng, lat] = driver.currentLocation.coordinates;

    const rides = await Ride.find({
      status: 'searching',
      vehicleType: driver.vehicleInfo?.type,
      'pickupLocation.coordinates': {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 5000, // 5km
        },
      },
    })
      .limit(5)
      .populate('rider', 'name phone rating avatar');

    res.json({ success: true, data: rides });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/drivers/accept/{rideId}:
 *   patch:
 *     tags: [Drivers]
 *     summary: Accept a ride request
 */
export const acceptRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { rideId } = req.params;

    const driver = await User.findById(userId);
    if (!driver) throw new HttpError('Driver not found', 404);
    if (driver.kycStatus !== 'approved') {
      throw new HttpError('KYC approval required to accept rides', 403);
    }

    const activeRide = await Ride.findActiveRide(userId, 'driver');
    if (activeRide) throw new HttpError('You already have an active ride', 409);

    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'searching' },
      {
        $set: {
          driver: userId,
          status: 'accepted',
        },
        $push: { timeline: { status: 'accepted', timestamp: new Date() } },
      },
      { new: true }
    ).populate('rider driver', 'name phone rating avatar vehicleInfo');

    if (!ride) throw new HttpError('Ride not available or already taken', 404);

    await invalidateCache(`history:${userId}:*`);

    const io = (req as any).io;
    if (io) {
      io.to(`user:${ride.rider._id}`).emit('ride:accepted', { ride });
      const roomId = `ride:${rideId}`;
      io.to(roomId).emit('ride:status-changed', {
        rideId,
        status: 'accepted',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, data: ride, message: 'Ride accepted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/drivers/status/{rideId}:
 *   patch:
 *     tags: [Drivers]
 *     summary: Update ride status (arriving → ongoing → completed)
 */
export const updateRideStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { rideId } = req.params;
    const { status } = req.body;

    const validTransitions: Record<string, string> = {
      accepted: 'arriving',
      arriving: 'ongoing',
      ongoing: 'completed',
    };

    const ride = await Ride.findOne({ _id: rideId, driver: userId });
    if (!ride) throw new HttpError('Ride not found', 404);

    if (validTransitions[ride.status] !== status) {
      throw new HttpError(
        `Invalid status transition: ${ride.status} → ${status}`,
        400
      );
    }

    ride.status = status;
    ride.timeline.push({ status, timestamp: new Date() });
    if (status === 'completed') {
      ride.completedAt = new Date();
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          totalRides: 1, 
          earnings: ride.fare.driverEarnings,
          totalLifetimeEarnings: ride.fare.driverEarnings,
          pendingPayouts: ride.fare.driverEarnings,
        },
        $set: { isAvailable: true }
      });
      await User.findByIdAndUpdate(ride.rider, { $inc: { totalRides: 1 } });
      await invalidateCache(`history:${ride.rider}:*`);
      await invalidateCache(`history:${userId}:*`);
    }

    await ride.save();

    const io = (req as any).io;
    if (io) {
      const roomId = `ride:${rideId}`;
      io.to(roomId).emit('ride:status-changed', {
        rideId,
        status,
        timestamp: new Date().toISOString(),
      });
      if (status === 'completed') {
        io.to(roomId).emit('ride:completed', { rideId, ride });
      }
    }

    res.json({ success: true, data: ride, message: `Ride status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/drivers/stats:
 *   get:
 *     tags: [Drivers]
 *     summary: Get driver earnings and stats
 */
export const getDriverStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const driver = await User.findById(userId);
    if (!driver) throw new HttpError('Driver not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRides, weekRides] = await Promise.all([
      Ride.countDocuments({ driver: userId, status: 'completed', completedAt: { $gte: today } }),
      Ride.countDocuments({
        driver: userId,
        status: 'completed',
        completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRides: driver.totalRides,
        totalEarnings: driver.earnings,
        pendingPayouts: driver.pendingPayouts || 0,
        rating: driver.rating,
        todayRides,
        weekRides,
        isAvailable: driver.isAvailable,
      },
    });
  } catch (err) {
    next(err);
  }
};
