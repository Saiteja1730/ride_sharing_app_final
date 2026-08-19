import mongoose, { Schema, Document, Model } from 'mongoose';

export type RideStatus =
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface ILocationPoint {
  address: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  placeId?: string;
}

export interface IRideDocument extends Document {
  rider: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  pickupLocation: ILocationPoint;
  dropoffLocation: ILocationPoint;
  status: RideStatus;
  tenantId: string;
  vehicleType: 'economy' | 'premium' | 'suv' | 'xl' | 'bike' | 'auto' | 'mini' | 'sedan';

  fare: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeMultiplier: number;
    total: number;
    platformCommission: number;
    driverEarnings: number;
    currency: string;
  };
  distance: number;
  duration: number;
  otp?: string;
  rating?: {
    riderRating?: number;
    driverRating?: number;
    riderComment?: string;
    driverComment?: string;
  };
  timeline: {
    status: RideStatus;
    timestamp: Date;
    note?: string;
  }[];
  cancelledAt?: Date;
  completedAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IRideModel extends Model<IRideDocument> {
  findActiveRide(userId: string, role: 'rider' | 'driver', tenantId: string): Promise<IRideDocument | null>;
}

const LocationPointSchema = new Schema<ILocationPoint>(
  {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    placeId: String,
  },
  { _id: false }
);

const RideSchema = new Schema<IRideDocument>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: Schema.Types.ObjectId, ref: 'User' },
    pickupLocation: { type: LocationPointSchema, required: true },
    dropoffLocation: { type: LocationPointSchema, required: true },
    status: {
      type: String,
      enum: ['searching', 'accepted', 'arriving', 'ongoing', 'completed', 'cancelled'],
      default: 'searching',
    },
    tenantId: { type: String, default: 'default-tenant', index: true },

    vehicleType: {
      type: String,
      enum: ['economy', 'premium', 'suv', 'xl', 'bike', 'auto', 'mini', 'sedan'],
      default: 'economy',
    },
    fare: {
      baseFare: { type: Number, required: true },
      distanceFare: { type: Number, required: true },
      timeFare: { type: Number, required: true },
      surgeMultiplier: { type: Number, default: 1.0 },
      total: { type: Number, required: true },
      platformCommission: { type: Number, required: true },
      driverEarnings: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    distance: { type: Number, required: true },
    duration: { type: Number, required: true },
    otp: { type: String, select: false },
    rating: {
      riderRating: Number,
      driverRating: Number,
      riderComment: String,
      driverComment: String,
    },
    timeline: [
      {
        status: { type: String, enum: ['searching', 'accepted', 'arriving', 'ongoing', 'completed', 'cancelled'] },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    cancelledAt: Date,
    completedAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

// ---- Indexes ----
RideSchema.index({ tenantId: 1, rider: 1, status: 1, createdAt: -1 });
RideSchema.index({ tenantId: 1, driver: 1, status: 1, createdAt: -1 });
RideSchema.index({ rider: 1, status: 1 });
RideSchema.index({ driver: 1, status: 1 });
RideSchema.index({ status: 1, createdAt: -1 });
RideSchema.index({ rider: 1, createdAt: -1 });
RideSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
RideSchema.index({ 'dropoffLocation.coordinates': '2dsphere' });
// Compound index for ride history queries
RideSchema.index({ rider: 1, status: 1, createdAt: -1 });
RideSchema.index({ driver: 1, status: 1, createdAt: -1 });

// Text index for Atlas Search fallback
RideSchema.index({
  'pickupLocation.address': 'text',
  'dropoffLocation.address': 'text',
});

// Authoritative Ride State Machine Transitions
export const isValidTransition = (from: RideStatus, to: RideStatus): boolean => {
  const transitions: Record<RideStatus, RideStatus[]> = {
    searching: ['accepted', 'cancelled'],
    accepted: ['arriving', 'cancelled'],
    arriving: ['ongoing', 'cancelled'],
    ongoing: ['completed'],
    completed: [],
    cancelled: [],
  };
  return transitions[from]?.includes(to) || false;
};


// ---- Static methods ----
RideSchema.statics.findActiveRide = function (
  userId: string,
  role: 'rider' | 'driver',
  tenantId: string
) {
  const field = role === 'rider' ? 'rider' : 'driver';
  return this.findOne({
    [field]: userId,
    tenantId,
    status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] },
  }).populate('rider driver', '-password');
};

export const Ride = mongoose.model<IRideDocument, IRideModel>('Ride', RideSchema);
