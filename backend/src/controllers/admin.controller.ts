import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Ride } from '../models/Ride';
import { HttpError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide analytics
 *     security:
 *       - bearerAuth: []
 */
export const getPlatformStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [totalUsers, totalDrivers, totalRiders, totalRides, activeRides] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'driver' }),
        User.countDocuments({ role: 'rider' }),
        Ride.countDocuments(),
        Ride.countDocuments({ status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] } }),
      ]);

    const revenueAgg = await Ride.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare.total' }, totalCommission: { $sum: '$fare.platformCommission' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalCommission = revenueAgg[0]?.totalCommission || 0;

    const payoutAgg = await User.aggregate([
      { $match: { role: 'driver' } },
      { $group: { _id: null, totalPendingPayouts: { $sum: '$pendingPayouts' } } }
    ]);
    const totalPendingPayouts = payoutAgg[0]?.totalPendingPayouts || 0;

    // Rides per day last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ridesPerDay = await Ride.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$fare.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalRiders,
        totalRides,
        activeRides,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalPendingPayouts: Math.round(totalPendingPayouts * 100) / 100,
        ridesPerDay,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with pagination
 */
export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;

    const filter = role ? { role } : {};
    const [users, total] = await Promise.all([
      User.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/users/{id}/toggle:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate or deactivate a user
 */
export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError('User not found', 404);
    user.isActive = !user.isActive;
    await user.save();
    res.json({
      success: true,
      data: { isActive: user.isActive },
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/fleet:
 *   get:
 *     tags: [Admin, B2B]
 *     summary: Fleet analytics for B2B partners
 */
export const getFleetAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [activeDrivers, totalDrivers] = await Promise.all([
      User.countDocuments({ role: 'driver', isAvailable: true }),
      User.countDocuments({ role: 'driver' }),
    ]);

    const popularRoutes = await Ride.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            origin: '$pickupLocation.address',
            destination: '$dropoffLocation.address',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          origin: '$_id.origin',
          destination: '$_id.destination',
          count: 1,
        },
      },
    ]);

    const vehicleBreakdown = await User.aggregate([
      { $match: { role: 'driver' } },
      { $group: { _id: '$vehicleInfo.type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: { activeDrivers, totalDrivers, popularRoutes, vehicleBreakdown },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/rides:
 *   get:
 *     tags: [Admin]
 *     summary: List all rides across the platform with pagination
 */
export const listRides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    const query = status ? { status } : {};

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('rider', 'name email phone avatar')
        .populate('driver', 'name email phone vehicleInfo avatar rating'),
      Ride.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: rides,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/drivers/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Get all pending driver KYC requests
 */
export const getPendingDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pendingDrivers = await User.find({
      role: 'driver',
      kycStatus: 'pending'
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingDrivers,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/drivers/{id}/kyc:
 *   patch:
 *     tags: [Admin]
 *     summary: Update driver KYC status
 */
export const updateDriverKycStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      throw new HttpError('Invalid KYC status', 400);
    }

    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'driver') {
      throw new HttpError('Driver not found', 404);
    }

    driver.kycStatus = status;
    driver.isVerified = status === 'approved';
    await driver.save();

    res.json({
      success: true,
      data: driver,
      message: `Driver KYC status updated to ${status}`,
    });
  } catch (err) {
    next(err);
  }
};
