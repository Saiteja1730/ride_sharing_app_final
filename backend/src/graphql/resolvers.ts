import { User } from '../models/User';
import { Ride } from '../models/Ride';
import { logger } from '../utils/logger';

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: { userId?: string }) => {
      if (!context.userId) throw new Error('Not authenticated');
      return User.findById(context.userId);
    },

    rideHistory: async (
      _: unknown,
      { userId, page = 1, limit = 10 }: { userId: string; page: number; limit: number }
    ) => {
      const skip = (page - 1) * limit;
      const query = { rider: userId, status: { $in: ['completed', 'cancelled'] } };
      const [rides, total] = await Promise.all([
        Ride.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('rider driver'),
        Ride.countDocuments(query),
      ]);
      return { rides, total, page, totalPages: Math.ceil(total / limit) };
    },

    ride: async (_: unknown, { id }: { id: string }) => {
      return Ride.findById(id).populate('rider driver');
    },

    nearbyDrivers: async (
      _: unknown,
      { lat, lng, radius = 5 }: { lat: number; lng: number; radius: number }
    ) => {
      return (User as any).findNearbyDrivers(lat, lng, radius);
    },

    platformStats: async () => {
      const [totalUsers, totalDrivers, totalRiders, totalRides, activeRides] =
        await Promise.all([
          User.countDocuments(),
          User.countDocuments({ role: 'driver' }),
          User.countDocuments({ role: 'rider' }),
          Ride.countDocuments(),
          Ride.countDocuments({
            status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] },
          }),
        ]);
      const agg = await Ride.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fare.total' } } },
      ]);
      return {
        totalUsers,
        totalDrivers,
        totalRiders,
        totalRides,
        activeRides,
        totalRevenue: agg[0]?.total || 0,
      };
    },

    fleetAnalytics: async () => {
      const [activeDrivers, totalDrivers, ridesPerDay, vehicleBreakdown] = await Promise.all([
        User.countDocuments({ role: 'driver', isAvailable: true }),
        User.countDocuments({ role: 'driver' }),
        Ride.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              revenue: { $sum: '$fare.total' },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: '$_id', count: 1, revenue: 1 } },
        ]),
        User.aggregate([
          { $match: { role: 'driver' } },
          { $group: { _id: '$vehicleInfo.type', count: { $sum: 1 } } },
          { $project: { _id: 0, type: '$_id', count: 1 } },
        ]),
      ]);
      return { activeDrivers, totalDrivers, ridesPerDay, vehicleBreakdown };
    },

    allUsers: async (
      _: unknown,
      { role, page = 1, limit = 20 }: { role?: string; page: number; limit: number }
    ) => {
      const filter = role ? { role } : {};
      return User.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
    },

    allRides: async (
      _: unknown,
      { status, page = 1, limit = 20 }: { status?: string; page: number; limit: number }
    ) => {
      const filter = status ? { status } : {};
      const skip = (page - 1) * limit;
      const [rides, total] = await Promise.all([
        Ride.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('rider driver'),
        Ride.countDocuments(filter),
      ]);
      return { rides, total, page, totalPages: Math.ceil(total / limit) };
    },
  },

  Mutation: {
    toggleDriverAvailability: async (
      _: unknown,
      { isAvailable }: { isAvailable: boolean },
      context: { userId?: string }
    ) => {
      if (!context.userId) throw new Error('Not authenticated');
      return User.findByIdAndUpdate(
        context.userId,
        { $set: { isAvailable } },
        { new: true }
      );
    },

    updateRideStatus: async (
      _: unknown,
      { rideId, status }: { rideId: string; status: string }
    ) => {
      return Ride.findByIdAndUpdate(
        rideId,
        {
          $set: { status },
          $push: { timeline: { status, timestamp: new Date() } },
        },
        { new: true }
      ).populate('rider driver');
    },

    toggleUserActive: async (_: unknown, { userId }: { userId: string }) => {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      user.isActive = !user.isActive;
      return user.save();
    },
  },

  // Field-level resolvers
  User: {
    id: (parent: any) => parent._id?.toString(),
  },
  Ride: {
    id: (parent: any) => parent._id?.toString(),
  },
};
