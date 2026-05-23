import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Ride } from '../models/Ride';
import { config } from '../config';
import { invalidateCache } from '../config/redis';
import { logger } from '../utils/logger';

interface SocketData {
  userId: string;
  role: 'rider' | 'driver' | 'admin';
}

interface DriverLocationPayload {
  driverId: string;
  coordinates: { lat: number; lng: number };
  heading?: number;
  speed?: number;
  timestamp: number;
}

export function registerSocketHandlers(io: Server): void {
  // ---- Auth middleware for Socket.IO ----
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) return next(new Error('No token provided'));

      const payload = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        role: string;
      };

      const user = await User.findById(payload.userId).select('isActive role');
      if (!user || !user.isActive) return next(new Error('User not found or inactive'));

      socket.data.userId = payload.userId;
      socket.data.role = payload.role as 'rider' | 'driver' | 'admin';

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data;
    logger.info(`Socket connected: ${userId} (${role}) [${socket.id}]`);

    // Join personal room on connect
    socket.join(`user:${userId}`);
    if (role === 'driver') {
      socket.join('drivers');
    }

    // ─── Driver: broadcast location update ───
    socket.on('driver:location-update', async (payload: DriverLocationPayload) => {
      try {
        if (role !== 'driver') return;

        payload.driverId = userId;

        // Update DB
        await User.findByIdAndUpdate(userId, {
          $set: {
            currentLocation: {
              type: 'Point',
              coordinates: [payload.coordinates.lng, payload.coordinates.lat],
            },
          },
        });

        // Invalidate nearby drivers cache
        await invalidateCache('drivers:nearby:*');

        // Emit to all rooms driver is part of (active ride room)
        socket.rooms.forEach((room) => {
          if (room.startsWith('ride:')) {
            io.to(room).emit('driver:location-updated', payload);
          }
        });

        // Also emit globally for riders tracking nearby drivers
        io.emit('driver:location-updated', payload);
      } catch (err) {
        logger.error('Socket location update error:', err);
      }
    });

    // ─── Driver: toggle availability ───
    socket.on('driver:toggle-availability', async (available: boolean) => {
      try {
        if (role !== 'driver') return;
        await User.findByIdAndUpdate(userId, { $set: { isAvailable: available } });
        await invalidateCache('drivers:nearby:*');
        logger.debug(`Driver ${userId} availability → ${available}`);

        // Broadcast availability change globally
        io.emit('driver:availability-changed', { driverId: userId, available });
      } catch (err) {
        logger.error('Socket availability error:', err);
      }
    });

    // ─── Rider: join ride room after booking ───
    socket.on('join:room', (roomId: string) => {
      socket.join(roomId);
      logger.debug(`${userId} joined room: ${roomId}`);
    });

    socket.on('leave:room', (roomId: string) => {
      socket.leave(roomId);
    });

    // ─── Driver: accept ride via socket ───
    socket.on('ride:accept', async (rideId: string) => {
      try {
        if (role !== 'driver') return;

        const ride = await Ride.findOneAndUpdate(
          { _id: rideId, status: 'searching' },
          {
            $set: { driver: userId, status: 'accepted' },
            $push: { timeline: { status: 'accepted', timestamp: new Date() } },
          },
          { new: true }
        ).populate('rider driver', 'name phone rating vehicleInfo');

        if (!ride) {
          socket.emit('error', 'Ride no longer available');
          return;
        }

        // Join ride room
        const roomId = `ride:${rideId}`;
        socket.join(roomId);

        // Notify rider
        io.to(`user:${(ride.rider as any)._id.toString()}`).emit('ride:accepted', ride as any);

        // Notify driver room
        io.to(roomId).emit('ride:status-changed', {
          rideId,
          status: 'accepted',
          timestamp: new Date().toISOString(),
        });

        logger.info(`Driver ${userId} accepted ride ${rideId}`);
      } catch (err) {
        logger.error('Socket ride accept error:', err);
        socket.emit('error', 'Failed to accept ride');
      }
    });

    // ─── Driver: status transitions ───
    socket.on('ride:start', async (rideId: string) => {
      try {
        const ride = await Ride.findOneAndUpdate(
          { _id: rideId, driver: userId, status: 'arriving' },
          {
            $set: { status: 'ongoing' },
            $push: { timeline: { status: 'ongoing', timestamp: new Date() } },
          },
          { new: true }
        );

        if (!ride) return;

        const roomId = `ride:${rideId}`;
        io.to(roomId).emit('ride:status-changed', {
          rideId,
          status: 'ongoing',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error('Socket ride start error:', err);
      }
    });

    socket.on('ride:complete', async (rideId: string) => {
      try {
        const ride = await Ride.findOneAndUpdate(
          { _id: rideId, driver: userId, status: 'ongoing' },
          {
            $set: { status: 'completed', completedAt: new Date() },
            $push: { timeline: { status: 'completed', timestamp: new Date() } },
          },
          { new: true }
        );

        if (!ride) return;

        // Update earnings
        await User.findByIdAndUpdate(userId, {
          $inc: { totalRides: 1, earnings: ride.fare.total },
        });
        await User.findByIdAndUpdate(ride.rider, { $inc: { totalRides: 1 } });
        await invalidateCache(`history:${ride.rider}:*`);
        await invalidateCache(`history:${userId}:*`);

        const roomId = `ride:${rideId}`;
        io.to(roomId).emit('ride:completed', ride as any);
        io.to(roomId).emit('ride:status-changed', {
          rideId,
          status: 'completed',
          timestamp: new Date().toISOString(),
        });

        logger.info(`Ride ${rideId} completed`);
      } catch (err) {
        logger.error('Socket ride complete error:', err);
      }
    });

    socket.on('ride:cancel', async ({ rideId, reason }) => {
      try {
        const ride = await Ride.findOneAndUpdate(
          {
            _id: rideId,
            status: { $in: ['searching', 'accepted', 'arriving'] },
          },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: new Date(),
              cancellationReason: reason,
            },
            $push: { timeline: { status: 'cancelled', timestamp: new Date(), note: reason } },
          },
          { new: true }
        );

        if (!ride) return;

        const roomId = `ride:${rideId}`;
        io.to(roomId).emit('ride:cancelled', { rideId, reason });
        io.to(roomId).emit('ride:status-changed', {
          rideId,
          status: 'cancelled',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error('Socket ride cancel error:', err);
      }
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${userId}`);
      if (role === 'driver') {
        await User.findByIdAndUpdate(userId, { $set: { isAvailable: false } });
        await invalidateCache('drivers:nearby:*');
      }
    });
  });
}
