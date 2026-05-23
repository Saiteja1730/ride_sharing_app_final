export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
  stack?: string;
}

// B2B Fleet Analytics
export interface FleetAnalytics {
  totalDrivers: number;
  activeDrivers: number;
  totalRides: number;
  totalRevenue: number;
  avgRating: number;
  ridesPerDay: { date: string; count: number }[];
  revenuePerDay: { date: string; amount: number }[];
  popularRoutes: { origin: string; destination: string; count: number }[];
}

export interface PartnerIntegration {
  partnerId: string;
  apiKey: string;
  name: string;
  webhookUrl?: string;
  permissions: string[];
  isActive: boolean;
}
