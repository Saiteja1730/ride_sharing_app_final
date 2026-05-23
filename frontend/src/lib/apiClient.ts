import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('rideshare-auth');
    if (raw) {
      try {
        const { state } = JSON.parse(raw);
        if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
      } catch {}
    }
  }
  return config;
});

// Global response error handler
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rideshare-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (data: any) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data: Partial<{ name: string; phone: string; avatar: string }>) =>
    apiClient.patch('/auth/me', data),
};

// ─── Rides ────────────────────────────────────────────────
export const rideApi = {
  estimateFare: (data: {
    pickupLat: number; pickupLng: number;
    dropoffLat: number; dropoffLng: number;
  }) => apiClient.post('/rides/estimate', data),

  bookRide: (data: {
    pickupLocation: { address: string; coordinates: { lat: number; lng: number } };
    dropoffLocation: { address: string; coordinates: { lat: number; lng: number } };
    vehicleType: string;
    fareEstimate: Record<string, number | string>;
  }) => apiClient.post('/rides', data),

  getActiveRide: () => apiClient.get('/rides/active'),
  getHistory: (params: { page?: number; limit?: number }) =>
    apiClient.get('/rides/history', { params }),
  cancelRide: (id: string, reason?: string) =>
    apiClient.patch(`/rides/${id}/cancel`, { reason }),
  rateRide: (id: string, rating: number, comment?: string) =>
    apiClient.post(`/rides/${id}/rate`, { rating, comment }),
  searchRides: (q: string) => apiClient.get('/rides/search', { params: { q } }),
};

// ─── Drivers ──────────────────────────────────────────────
export const driverApi = {
  getNearby: (lat: number, lng: number, radius?: number, vehicleType?: string) =>
    apiClient.get('/drivers/nearby', { params: { lat, lng, radius, vehicleType } }),
  toggleAvailability: (isAvailable: boolean, lat?: number, lng?: number) =>
    apiClient.patch('/drivers/availability', { isAvailable, lat, lng }),
  updateLocation: (lat: number, lng: number) =>
    apiClient.patch('/drivers/location', { lat, lng }),
  getRideRequests: () => apiClient.get('/drivers/ride-requests'),
  acceptRide: (rideId: string) => apiClient.patch(`/drivers/accept/${rideId}`),
  updateRideStatus: (rideId: string, status: string) =>
    apiClient.patch(`/drivers/status/${rideId}`, { status }),
  getStats: () => apiClient.get('/drivers/stats'),
};

// ─── Admin ────────────────────────────────────────────────
export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  listUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/users', { params }),
  toggleUser: (id: string) => apiClient.patch(`/admin/users/${id}/toggle`),
  getFleet: () => apiClient.get('/admin/fleet'),
  listRides: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/rides', { params }),
};
