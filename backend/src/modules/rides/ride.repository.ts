import { Ride, IRideDocument, RideStatus } from '../../models/Ride';

export class RideRepository {
  public async findById(id: string): Promise<IRideDocument | null> {
    return Ride.findById(id);
  }

  public async findActiveRide(userId: string, role: 'rider' | 'driver', tenantId: string): Promise<IRideDocument | null> {
    return Ride.findActiveRide(userId, role, tenantId);
  }

  public async create(rideData: Partial<IRideDocument>): Promise<IRideDocument> {
    return Ride.create(rideData);
  }

  public async countActiveRides(): Promise<number> {
    return Ride.countDocuments({ status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] } });
  }

  public async updateStatus(id: string, status: RideStatus, note?: string): Promise<IRideDocument | null> {
    return Ride.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: { timeline: { status, timestamp: new Date(), note } },
      },
      { new: true }
    );
  }
}
