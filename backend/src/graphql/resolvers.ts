import { User } from '../models/User';
import { Ride, isValidTransition } from '../models/Ride';
import { logger } from '../utils/logger';
import { invalidateCache } from '../config/redis';

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: { userId?: string; tenantId?: string }) => {
      if (!context.userId) throw new Error('Not authenticated');
      return User.findOne({ _id: context.userId, tenantId: context.tenantId || 'default-tenant' });
    },

    rideHistory: async (
      _: unknown,
      { userId, page = 1, limit = 10 }: { userId: string; page: number; limit: number },
      context: { tenantId?: string }
    ) => {
      const skip = (page - 1) * limit;
      const queryLimit = Math.min(100, Math.max(1, limit));
      const query = { rider: userId, tenantId: context.tenantId || 'default-tenant', status: { $in: ['completed', 'cancelled'] } };
      const [rides, total] = await Promise.all([
        Ride.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(queryLimit)
          .populate('rider driver'),
        Ride.countDocuments(query),
      ]);
      return { rides, total, page, totalPages: Math.ceil(total / queryLimit) };
    },

    ride: async (_: unknown, { id }: { id: string }, context: { tenantId?: string }) => {
      return Ride.findOne({ _id: id, tenantId: context.tenantId || 'default-tenant' }).populate('rider driver');
    },

    nearbyDrivers: async (
      _: unknown,
      { lat, lng, radius = 5 }: { lat: number; lng: number; radius: number },
      context: { tenantId?: string }
    ) => {
      if (!context.tenantId) throw new Error('Not authenticated');
      return (User as any).findNearbyDrivers(lat, lng, radius, context.tenantId);
    },

    platformStats: async (_: unknown, __: unknown, context: { role?: string; tenantId?: string; userId?: string }) => {
      if (!context.userId || context.role !== 'admin') throw new Error('Unauthorized');
      const tenantId = context.tenantId || 'default-tenant';
      const [totalUsers, totalDrivers, totalRiders, totalRides, activeRides] =
        await Promise.all([
          User.countDocuments({ tenantId }),
          User.countDocuments({ role: 'driver', tenantId }),
          User.countDocuments({ role: 'rider', tenantId }),
          Ride.countDocuments({ tenantId }),
          Ride.countDocuments({
            status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] },
            tenantId,
          }),
        ]);
      const agg = await Ride.aggregate([
        { $match: { status: 'completed', tenantId } },
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

    fleetAnalytics: async (_: unknown, __: unknown, context: { role?: string; tenantId?: string; userId?: string }) => {
      if (!context.userId || context.role !== 'admin') throw new Error('Unauthorized');
      const tenantId = context.tenantId || 'default-tenant';
      const [activeDrivers, totalDrivers, ridesPerDay, vehicleBreakdown] = await Promise.all([
        User.countDocuments({ role: 'driver', isAvailable: true, tenantId }),
        User.countDocuments({ role: 'driver', tenantId }),
        Ride.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }, tenantId } },
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
          { $match: { role: 'driver', tenantId } },
          { $group: { _id: '$vehicleInfo.type', count: { $sum: 1 } } },
          { $project: { _id: 0, type: '$_id', count: 1 } },
        ]),
      ]);
      return { activeDrivers, totalDrivers, ridesPerDay, vehicleBreakdown };
    },

    allUsers: async (
      _: unknown,
      { role, page = 1, limit = 20 }: { role?: string; page: number; limit: number },
      context: { role?: string; tenantId?: string; userId?: string }
    ) => {
      if (!context.userId || context.role !== 'admin') throw new Error('Unauthorized');
      const tenantId = context.tenantId || 'default-tenant';
      const queryLimit = Math.min(100, Math.max(1, limit));
      const filter = role ? { role, tenantId } : { tenantId };
      return User.find(filter)
        .skip((page - 1) * queryLimit)
        .limit(queryLimit)
        .sort({ createdAt: -1 });
    },

    allRides: async (
      _: unknown,
      { status, page = 1, limit = 20 }: { status?: string; page: number; limit: number },
      context: { role?: string; tenantId?: string; userId?: string }
    ) => {
      if (!context.userId || context.role !== 'admin') throw new Error('Unauthorized');
      const tenantId = context.tenantId || 'default-tenant';
      const queryLimit = Math.min(100, Math.max(1, limit));
      const filter = status ? { status, tenantId } : { tenantId };
      const skip = (page - 1) * queryLimit;
      const [rides, total] = await Promise.all([
        Ride.find(filter).skip(skip).limit(queryLimit).sort({ createdAt: -1 }).populate('rider driver'),
        Ride.countDocuments(filter),
      ]);
      return { rides, total, page, totalPages: Math.ceil(total / queryLimit) };
    },
  },

  Mutation: {
    toggleDriverAvailability: async (
      _: unknown,
      { isAvailable }: { isAvailable: boolean },
      context: { userId?: string; tenantId?: string }
    ) => {
      if (!context.userId) throw new Error('Not authenticated');
      return User.findOneAndUpdate(
        { _id: context.userId, tenantId: context.tenantId || 'default-tenant' },
        { $set: { isAvailable } },
        { new: true }
      );
    },

    updateRideStatus: async (
      _: unknown,
      { rideId, status }: { rideId: string; status: any },
      context: { userId?: string; role?: string; tenantId?: string }
    ) => {
      if (!context.userId) throw new Error('Not authenticated');
      const tenantId = context.tenantId || 'default-tenant';
      const query: Record<string, any> = { _id: rideId, tenantId };
      if (context.role !== 'admin') {
        query.driver = context.userId;
      }
      const ride = await Ride.findOne(query);
      if (!ride) throw new Error('Ride not found');
      if (!isValidTransition(ride.status, status)) {
        throw new Error(`Invalid status transition: ${ride.status} -> ${status}`);
      }

      const updated = await Ride.findOneAndUpdate(
        { _id: rideId, tenantId, status: ride.status },
        {
          $set: { status },
          $push: { timeline: { status, timestamp: new Date() } },
        },
        { new: true }
      ).populate('rider driver');

      if (status === 'completed' && updated) {
        updated.completedAt = new Date();
        await updated.save();
        await User.findOneAndUpdate(
          { _id: updated.driver, tenantId },
          {
            $inc: {
              totalRides: 1,
              earnings: updated.fare.driverEarnings,
              totalLifetimeEarnings: updated.fare.driverEarnings,
              pendingPayouts: updated.fare.driverEarnings,
            },
            $set: { isAvailable: true }
          }
        );
        await User.findOneAndUpdate(
          { _id: updated.rider, tenantId },
          { $inc: { totalRides: 1 } }
        );
        await invalidateCache(`history:${updated.rider}:*`);
        await invalidateCache(`history:${updated.driver}:*`);
      }

      return updated;
    },

    toggleUserActive: async (
      _: unknown,
      { userId }: { userId: string },
      context: { role?: string; tenantId?: string; userId?: string }
    ) => {
      if (!context.userId || context.role !== 'admin') throw new Error('Unauthorized');
      const user = await User.findOne({ _id: userId, tenantId: context.tenantId || 'default-tenant' });
      if (!user) throw new Error('User not found');
      user.isActive = !user.isActive;
      return user.save();
    },
  },

  User: {
    id: (parent: any) => parent._id?.toString(),
  },
  Ride: {
    id: (parent: any) => parent._id?.toString(),
  },
};
