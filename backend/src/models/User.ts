import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'rider' | 'driver' | 'admin';
  avatar?: string;
  rating: number;
  ratingCount: number;
  totalRides: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  // Driver-specific
  licenseNumber?: string;
  isAvailable?: boolean;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    type: 'economy' | 'premium' | 'suv' | 'xl' | 'bike' | 'auto' | 'mini' | 'sedan';
  };
  documents?: {
    licenseUrl?: string;
    aadhaarUrl?: string;
    rcUrl?: string;
  };
  earnings?: number;
  pendingPayouts?: number;
  totalLifetimeEarnings?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
  findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
    vehicleType?: string
  ): Promise<IUserDocument[]>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ['rider', 'driver', 'admin'], default: 'rider' },
    avatar: { type: String },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    ratingCount: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isActive: { type: Boolean, default: true },
    // Driver fields
    licenseNumber: { type: String, sparse: true },
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    vehicleInfo: {
      make: String,
      model: String,
      year: Number,
      color: String,
      plateNumber: String,
      type: { type: String, enum: ['economy', 'premium', 'suv', 'xl', 'bike', 'auto', 'mini', 'sedan'], default: 'economy' },
    },
    documents: {
      licenseUrl: String,
      aadhaarUrl: String,
      rcUrl: String,
    },
    earnings: { type: Number, default: 0 },
    pendingPayouts: { type: Number, default: 0 },
    totalLifetimeEarnings: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_: any, ret: any) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// ---- Indexes ----
UserSchema.index({ role: 1 });
UserSchema.index({ isAvailable: 1, role: 1 });
UserSchema.index({ currentLocation: '2dsphere' }, { sparse: true });
UserSchema.index({ role: 1, isAvailable: 1, 'vehicleInfo.type': 1 });
UserSchema.index({ isActive: 1, role: 1 });

// ---- Pre-save hook ----
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ---- Instance method ----
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ---- Static method for geospatial driver search ----
UserSchema.statics.findNearbyDrivers = function (
  lat: number,
  lng: number,
  radiusKm: number,
  vehicleType?: string
) {
  const query: Record<string, unknown> = {
    role: 'driver',
    isAvailable: true,
    isActive: true,
    kycStatus: 'approved',
    currentLocation: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000, // convert to meters
      },
    },
  };
  if (vehicleType) query['vehicleInfo.type'] = vehicleType;
  return this.find(query).limit(10).select('-password');
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);
