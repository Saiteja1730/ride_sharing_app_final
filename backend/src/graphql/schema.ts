import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Date

  enum RideStatus {
    searching
    accepted
    arriving
    ongoing
    completed
    cancelled
  }

  enum VehicleType {
    economy
    premium
    suv
    xl
  }

  enum UserRole {
    rider
    driver
    admin
  }

  type Coordinates {
    lat: Float!
    lng: Float!
  }

  type LocationPoint {
    address: String!
    coordinates: Coordinates!
  }

  type Fare {
    baseFare: Float!
    distanceFare: Float!
    timeFare: Float!
    surgeMultiplier: Float!
    total: Float!
    currency: String!
  }

  type Rating {
    riderRating: Float
    driverRating: Float
    riderComment: String
    driverComment: String
  }

  type TimelineEvent {
    status: RideStatus!
    timestamp: Date!
    note: String
  }

  type VehicleInfo {
    make: String
    model: String
    year: Int
    color: String
    plateNumber: String
    type: VehicleType
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: UserRole!
    avatar: String
    rating: Float!
    totalRides: Int!
    isAvailable: Boolean
    vehicleInfo: VehicleInfo
    earnings: Float
    createdAt: Date!
  }

  type Ride {
    id: ID!
    rider: User!
    driver: User
    pickupLocation: LocationPoint!
    dropoffLocation: LocationPoint!
    status: RideStatus!
    vehicleType: VehicleType!
    fare: Fare!
    distance: Float!
    duration: Float!
    rating: Rating
    timeline: [TimelineEvent!]!
    createdAt: Date!
    completedAt: Date
  }

  type RidesPerDay {
    date: String!
    count: Int!
    revenue: Float!
  }

  type VehicleBreakdown {
    type: String!
    count: Int!
  }

  type PlatformStats {
    totalUsers: Int!
    totalDrivers: Int!
    totalRiders: Int!
    totalRides: Int!
    activeRides: Int!
    totalRevenue: Float!
  }

  type FleetAnalytics {
    activeDrivers: Int!
    totalDrivers: Int!
    ridesPerDay: [RidesPerDay!]!
    vehicleBreakdown: [VehicleBreakdown!]!
  }

  type PaginatedRides {
    rides: [Ride!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type Query {
    # B2C
    me: User
    rideHistory(userId: ID!, page: Int, limit: Int): PaginatedRides!
    ride(id: ID!): Ride
    nearbyDrivers(lat: Float!, lng: Float!, radius: Float): [User!]!

    # B2B / Admin
    platformStats: PlatformStats!
    fleetAnalytics: FleetAnalytics!
    allUsers(role: UserRole, page: Int, limit: Int): [User!]!
    allRides(status: RideStatus, page: Int, limit: Int): PaginatedRides!
  }

  type Mutation {
    toggleDriverAvailability(isAvailable: Boolean!): User!
    updateRideStatus(rideId: ID!, status: RideStatus!): Ride!
    toggleUserActive(userId: ID!): User!
  }
`;
