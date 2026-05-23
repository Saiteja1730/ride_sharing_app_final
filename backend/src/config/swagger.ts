import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RideShare API',
      version: '1.0.0',
      description:
        'Production-grade ride-sharing REST API similar to Uber/Ola. Includes B2C endpoints for riders and drivers, and B2B endpoints for fleet analytics and partner integrations.',
      contact: { name: 'RideShare Team', email: 'api@rideshare.com' },
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phone', 'role'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            phone: { type: 'string', example: '+1234567890' },
            role: { type: 'string', enum: ['rider', 'driver'], example: 'rider' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        FareEstimateRequest: {
          type: 'object',
          required: ['pickupLat', 'pickupLng', 'dropoffLat', 'dropoffLng'],
          properties: {
            pickupLat: { type: 'number', example: 40.7128 },
            pickupLng: { type: 'number', example: -74.006 },
            dropoffLat: { type: 'number', example: 40.758 },
            dropoffLng: { type: 'number', example: -73.9855 },
          },
        },
        BookRideRequest: {
          type: 'object',
          required: ['pickupLocation', 'dropoffLocation', 'vehicleType', 'fareEstimate'],
          properties: {
            pickupLocation: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
            dropoffLocation: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
            vehicleType: { type: 'string', enum: ['economy', 'premium', 'suv', 'xl'] },
            fareEstimate: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                currency: { type: 'string', example: 'USD' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & Authorization' },
      { name: 'Rides', description: 'Ride booking and management' },
      { name: 'Drivers', description: 'Driver operations' },
      { name: 'Admin', description: 'Admin panel operations' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
