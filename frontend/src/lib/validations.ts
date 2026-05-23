import { z } from 'zod';

// Helper: Trim spaces from text inputs
export const trimmedString = z.string().trim();

// ─── AUTHENTICATION SCHEMAS ───────────────────────────────────────────

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces')
      .refine(
        (val) => !/<script>|<\/script>|javascript:/i.test(val),
        'XSS injection pattern detected'
      ),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6-9'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    role: z.enum(['rider', 'driver']),
    // Driver-specific optional fields (validated conditionally)
    vehicleMake: z.string().trim().optional(),
    vehicleModel: z.string().trim().optional(),
    vehicleYear: z.string().optional(),
    vehicleColor: z.string().trim().optional(),
    vehiclePlate: z.string().trim().optional(),
    vehicleType: z.enum(['economy', 'premium', 'suv', 'xl']).optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Confirm password match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }

    // 2. Conditionally validate driver vehicle fields
    if (data.role === 'driver') {
      if (!data.vehicleMake || data.vehicleMake.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehicleMake'],
          message: 'Vehicle make is required',
        });
      }
      if (!data.vehicleModel || data.vehicleModel.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehicleModel'],
          message: 'Vehicle model is required',
        });
      }
      if (!data.vehicleYear || isNaN(Number(data.vehicleYear))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehicleYear'],
          message: 'Valid year is required',
        });
      } else {
        const year = Number(data.vehicleYear);
        const currentYear = new Date().getFullYear();
        if (year < 2005 || year > currentYear + 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['vehicleYear'],
            message: `Vehicle year must be between 2005 and ${currentYear + 1}`,
          });
        }
      }
      if (!data.vehicleColor || data.vehicleColor.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehicleColor'],
          message: 'Vehicle color is required',
        });
      }
      if (!data.vehiclePlate || data.vehiclePlate.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehiclePlate'],
          message: 'License plate is required',
        });
      } else {
        // Indian RTO Format check: e.g. KA-03-HA-1234 or MH12PQ5678
        const rtoRegex = /^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4}$/i;
        if (!rtoRegex.test(data.vehiclePlate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['vehiclePlate'],
            message: 'Invalid plate format. Expected format: KA-03-HA-1234',
          });
        }
      }
    }
  });

// ─── RIDE BOOKING SCHEMAS ─────────────────────────────────────────────

export const BookingSchema = z
  .object({
    pickupAddress: z.string().min(1, 'Pickup location is required'),
    pickupCoords: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    dropoffAddress: z.string().min(1, 'Destination location is required'),
    dropoffCoords: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    vehicleType: z.enum(['economy', 'premium', 'suv', 'xl']),
  })
  .superRefine((data, ctx) => {
    // Block duplicate pickup and dropoff
    if (
      data.pickupAddress === data.dropoffAddress ||
      (Math.abs(data.pickupCoords.lat - data.dropoffCoords.lat) < 0.0001 &&
        Math.abs(data.pickupCoords.lng - data.dropoffCoords.lng) < 0.0001)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dropoffAddress'],
        message: 'Pickup and destination cannot be the same location',
      });
    }
  });

// ─── PROFILE UPDATE SCHEMAS ───────────────────────────────────────────

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces')
    .refine(
      (val) => !/<script>|<\/script>|javascript:/i.test(val),
      'XSS injection pattern detected'
    ),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
});

// ─── ADMIN SETTINGS SCHEMAS ───────────────────────────────────────────

export const AdminSettingsSchema = z.object({
  platformName: z.string().trim().min(1, 'Platform name is required'),
  supportEmail: z.string().trim().email('Valid support email required'),
  supportPhone: z.string().trim().min(5, 'Support phone is required'),
  defaultCity: z.string(),
  currency: z.string(),
  
  // Pricing
  baseFare: z.number().min(0, 'Base fare must be positive').max(10000, 'Base fare too high'),
  perKmRate: z.number().min(0, 'Per KM rate must be positive').max(1000, 'KM rate too high'),
  perMinRate: z.number().min(0, 'Per minute rate must be positive').max(1000, 'Minute rate too high'),
  minFare: z.number().min(0, 'Minimum fare must be positive').max(10000, 'Min fare too high'),
  maxSurgeMultiplier: z.number().min(1.0, 'Surge multiplier must be at least 1.0').max(10.0, 'Surge limit exceeded'),
  surgeThreshold: z.number().min(1, 'Threshold must be positive').max(1000, 'Threshold too high'),
  
  // Security
  jwtExpiry: z.number().min(1, 'Expiry must be at least 1 hour').max(8760, 'Expiry too long'),
  maxLoginAttempts: z.number().min(1, 'Min login attempts is 1').max(20, 'Max login attempts exceeded'),
  rateLimit: z.number().min(1, 'Rate limit must be positive').max(10000, 'Rate limit too high'),
  
  // Dispatch
  maxPickupRadius: z.number().min(1, 'Radius must be at least 1km').max(100, 'Radius too large'),
  driverTimeout: z.number().min(5, 'Timeout must be at least 5 seconds').max(300, 'Timeout too long'),
  maxRetries: z.number().min(1, 'Min retries is 1').max(10, 'Max retries is 10'),
  matchingStrategy: z.string(),
  
  // Integrations
  mapsApiKey: z.string().trim().min(1, 'Maps API Key is required'),
  paymentGatewayKey: z.string().trim().min(1, 'Payment Gateway Key is required'),
  smsProviderKey: z.string().trim().min(1, 'SMS Provider Key is required'),
  webhookUrl: z.string().trim().url('Please enter a valid webhook URL').or(z.string().length(0)),
});
