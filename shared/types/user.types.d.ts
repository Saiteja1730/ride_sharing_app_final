export type UserRole = 'rider' | 'driver' | 'admin';
export interface IUser {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    avatar?: string;
    rating: number;
    totalRides: number;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface IDriver extends IUser {
    role: 'driver';
    licenseNumber: string;
    vehicleInfo: IVehicle;
    isAvailable: boolean;
    currentLocation?: ICoordinates;
    earnings: number;
    documents: IDriverDocument[];
}
export interface IVehicle {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    type: VehicleType;
}
export type VehicleType = 'economy' | 'premium' | 'suv' | 'xl';
export interface IDriverDocument {
    type: 'license' | 'insurance' | 'registration';
    url: string;
    verified: boolean;
    expiresAt: string;
}
export interface ICoordinates {
    lat: number;
    lng: number;
}
export interface AuthTokenPayload {
    userId: string;
    role: UserRole;
    email: string;
    iat?: number;
    exp?: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
}
export interface AuthResponse {
    token: string;
    user: Omit<IUser, 'password'>;
}
//# sourceMappingURL=user.types.d.ts.map