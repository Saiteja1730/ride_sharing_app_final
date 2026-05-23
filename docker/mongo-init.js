// MongoDB initialization script
db = db.getSiblingDB('rideshare');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'phone', 'role'],
      properties: {
        email: { bsonType: 'string' },
        role: { enum: ['rider', 'driver', 'admin'] },
      },
    },
  },
});

db.createCollection('rides');
db.createCollection('locations');

// Geospatial index on users (drivers)
db.users.createIndex({ currentLocation: '2dsphere' }, { sparse: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isAvailable: 1 });

// Ride indexes
db.rides.createIndex({ rider: 1, status: 1 });
db.rides.createIndex({ driver: 1, status: 1 });
db.rides.createIndex({ status: 1, createdAt: -1 });
db.rides.createIndex({ 'pickupLocation.coordinates': '2dsphere' });
db.rides.createIndex({ 'dropoffLocation.coordinates': '2dsphere' });
db.rides.createIndex(
  { 'pickupLocation.address': 'text', 'dropoffLocation.address': 'text' },
  { name: 'ride_text_search' }
);

// TTL index for location history (auto-delete after 1 hour)
db.locations.createIndex({ timestamp: 1 }, { expireAfterSeconds: 3600 });

print('✅ RideShare MongoDB initialized with indexes');
