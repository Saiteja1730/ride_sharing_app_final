# 🚗 RideShare — Production-Grade Real-Time Ride-Sharing Platform

[![CI](https://github.com/your-org/rideshare/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/rideshare/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](docker-compose.yml)

A production-grade, full-stack real-time ride-sharing platform inspired by Uber/Ola, built with **Next.js 14**, **Node.js**, **MongoDB**, **Redis**, **Socket.IO**, **GraphQL**, and **Docker**.

---

## 📐 Architecture Overview

```
ride-sharing-app-final/
├── frontend/           # Next.js 14 App Router + TypeScript + Tailwind CSS
│   ├── src/app/        # Pages (rider, driver, auth, landing)
│   ├── src/components/ # UI + Map + Ride + Layout components
│   ├── src/hooks/      # useAuth, useRide, useDriver
│   ├── src/stores/     # Zustand state (auth, ride, driver)
│   └── src/lib/        # API client (Axios) + Socket.IO client
│
├── backend/            # Node.js + Express.js + Socket.IO + GraphQL
│   ├── src/config/     # DB, Redis, Swagger, env config
│   ├── src/models/     # User, Ride (Mongoose + 2dsphere indexes)
│   ├── src/controllers/# Auth, Ride, Driver, Admin
│   ├── src/routes/     # REST API routes with validation
│   ├── src/middleware/ # JWT auth, rate limiter, error handler
│   ├── src/socket/     # Socket.IO event handlers
│   ├── src/graphql/    # Apollo Server schema + resolvers
│   └── src/utils/      # Logger, geoUtils, fareCalculator
│
├── shared/types/       # Shared TypeScript interfaces
├── docker/             # MongoDB init scripts
├── docker-compose.yml  # Full-stack orchestration
└── .github/workflows/  # CI/CD pipeline
```

### 🔌 Real-Time Socket.IO Dispatch Architecture

The platform uses a hybrid REST + WebSocket architecture to manage real-time ride matching and live driver tracking:

1. **Express & Socket.IO Integration**: The server binds Socket.IO directly to the main HTTP server on port `4000`. Custom middleware injects the `io` instance into every Express request context (`(req as any).io = io`), allowing REST controller endpoints (like `bookRide` and `acceptRide`) to emit real-time updates instantly.
2. **GPS Stream & Available Drivers**: When drivers go online, they join the `'drivers'` socket room. Location coordinate changes are streamed via the socket, saved to MongoDB, and broadcasted globally to all active riders.
3. **Real-time Ride Cycle**:
   - **Ride Booking**: A rider initiates a ride booking via `POST /api/rides`. The controller saves the ride to MongoDB and emits `ride:created` globally to all connections in the `'drivers'` room.
   - **Driver Notification**: Available drivers receive the `ride:created` event in real time. They see the notification immediately, and React Query cache invalidation refreshes the requests list instantly.
   - **Driver Action**: The driver accepts the ride via `PATCH /api/drivers/accept/:id`. The controller saves driver info and emits `ride:accepted` to the rider's private channel `user:${riderId}` and `ride:status-changed` to the private room `ride:${rideId}`.
   - **Live Tracking**: As the driver travels, location updates trigger `driver:location-updated`, synchronizing the Leaflet vehicle icon coordinates on the rider's MapView.
4. **Zustand & React Query Sync**: Client-side modular hooks (`useSocket`, `useRideSocket`, `useDriverSocket`) intercept WebSocket events, update local Zustand state (`rideStore`, `driverStore`), show animated toasts, and trigger React Query cache invalidation (e.g. `'active-ride'`, `'ride-requests'`) for robust fallback polling.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### Option A: Docker (Recommended)

```bash
# 1. Clone
git clone https://github.com/your-org/rideshare.git
cd rideshare

# 2. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Set your Mapbox token in frontend/.env.local
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# 4. Start all services
docker compose up -d

# 5. With Mongo Express UI
docker compose --profile dev up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Swagger UI | http://localhost:4000/api-docs |
| GraphQL Playground | http://localhost:4000/graphql |
| Mongo Express | http://localhost:8081 |

### Option B: Local Development

```bash
# Terminal 1: Start MongoDB + Redis via Docker
docker compose up mongodb redis -d

# Terminal 2: Backend
cd backend
npm install
cp .env.example .env    # Edit MONGODB_URI_LOCAL and REDIS_URL_LOCAL
npm run dev

# Terminal 3: Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## 🔐 API Reference

### REST (Swagger)
Full documentation at `http://localhost:4000/api-docs`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register rider or driver |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/rides/estimate` | JWT | Get fare estimates |
| POST | `/api/rides` | Rider | Book a ride |
| GET | `/api/rides/active` | JWT | Get active ride |
| GET | `/api/rides/history` | JWT | Paginated ride history |
| GET | `/api/rides/search?q=...` | JWT | Text search rides |
| PATCH | `/api/rides/:id/cancel` | JWT | Cancel ride |
| POST | `/api/rides/:id/rate` | JWT | Rate a completed ride |
| GET | `/api/drivers/nearby` | JWT | Nearby drivers (cached 30s) |
| PATCH | `/api/drivers/availability` | Driver | Toggle online/offline |
| PATCH | `/api/drivers/accept/:id` | Driver | Accept ride request |
| PATCH | `/api/drivers/status/:id` | Driver | Update ride status |
| GET | `/api/admin/stats` | Admin | Platform analytics |
| GET | `/api/admin/fleet` | Admin | B2B fleet analytics |

### GraphQL
Endpoint: `http://localhost:4000/graphql`

```graphql
# B2C - Rider ride history
query RideHistory($userId: ID!, $page: Int) {
  rideHistory(userId: $userId, page: $page) {
    rides { id status fare { total } createdAt }
    total
    totalPages
  }
}

# B2B - Platform analytics
query PlatformStats {
  platformStats {
    totalUsers totalDrivers totalRides totalRevenue activeRides
  }
}

# B2B - Fleet analytics
query FleetAnalytics {
  fleetAnalytics {
    activeDrivers totalDrivers
    ridesPerDay { date count revenue }
    vehicleBreakdown { type count }
  }
}
```

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `driver:location-update` | `{ driverId, coordinates, timestamp }` | Broadcast GPS position |
| `driver:toggle-availability` | `boolean` | Go online/offline |
| `join:room` | `rideId` | Join a ride's private room |
| `ride:accept` | `rideId` | Accept a ride request |
| `ride:start` | `rideId` | Mark ride as ongoing |
| `ride:complete` | `rideId` | Complete a ride |
| `ride:cancel` | `{ rideId, reason }` | Cancel a ride |

### Server → Client
| Event | Description |
|-------|-------------|
| `driver:location-updated` | Driver GPS coordinates |
| `ride:accepted` | Rider notified when driver accepts |
| `ride:status-changed` | Any status transition |
| `ride:completed` | Ride completion notification |
| `ride:cancelled` | Cancellation notification |

---

## 🏗️ Ride State Machine

```
SEARCHING → ACCEPTED → ARRIVING → ONGOING → COMPLETED
                ↘                           ↘
              CANCELLED ←─────────────── CANCELLED
```

---

## 📊 Database Design

### Indexes (MongoDB)

| Collection | Index | Type | Purpose |
|---|---|---|---|
| `users` | `currentLocation` | 2dsphere | Nearby driver geospatial queries |
| `users` | `email` | unique | Auth lookup |
| `users` | `role, isAvailable` | compound | Driver filtering |
| `rides` | `rider, status` | compound | Active ride check |
| `rides` | `driver, status` | compound | Driver's active ride |
| `rides` | `rider, status, createdAt` | compound | History with sort |
| `rides` | `pickupLocation.coordinates` | 2dsphere | Proximity matching |
| `rides` | `address` | text | Full-text search |
| `locations` | `timestamp` | TTL | Auto-delete after 1h |

---

## 🗄️ Redis Caching Strategy

| Key Pattern | TTL | Data Cached |
|---|---|---|
| `drivers:nearby:{lat}:{lng}` | 30s | Nearby drivers list |
| `fare:{origin}:{dest}:{type}` | 5min | Fare estimates |
| `history:{userId}:page:{n}` | 10min | Paginated ride history |
| `session:{token}` | 24h | JWT session |
| `surge:{zone}` | 60s | Surge multiplier per zone |

**Cache Invalidation:**
- Driver location update → invalidates `drivers:nearby:*`
- Ride complete/cancel → invalidates `history:{riderId}:*` + `history:{driverId}:*`
- Toggle availability → invalidates `drivers:nearby:*`

---

## ⚡ Dynamic Surge Pricing

```
demandRatio = activeRides / availableDrivers

if demandRatio < 0.7  → multiplier = 1.0x (no surge)
if demandRatio = 1.0  → multiplier = ~1.9x
if demandRatio ≥ 1.4  → multiplier = 3.0x (max cap)
```

Linear interpolation between 0.7 and 1.4 demand ratios, capped at 3.0x.

---

## 🧪 Testing

```bash
# Backend: unit + integration tests with coverage
cd backend && npm run test:coverage

# Coverage report
open backend/coverage/index.html
```

**Test coverage includes:**
- Fare calculator (unit) — all vehicle types, surge logic, edge cases
- Geospatial utils (unit) — Haversine, ETA, bounding box
- Auth API (integration) — register, login, profile, token validation
- Error cases — invalid email, weak password, duplicate user, bad token

---

## 🐳 Docker Commands

```bash
# Start full stack
docker compose up -d

# With dev tools (Mongo Express)
docker compose --profile dev up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild after code changes
docker compose up -d --build backend
docker compose up -d --build frontend

# Stop everything
docker compose down

# Stop + remove volumes
docker compose down -v
```

---

## 🚦 CI/CD Pipeline (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Backend CI**: ESLint → Jest tests (with MongoDB + Redis) → TypeScript build
2. **Frontend CI**: ESLint → Type check → Next.js production build
3. **Docker Build**: Build backend + frontend images (main branch only)

---

## 🛠️ Performance Optimizations

| Optimization | Implementation |
|---|---|
| Nearby driver caching | Redis 30s TTL — eliminates repeated $nearSphere queries |
| Fare estimate caching | Redis 5min TTL — cached per route/vehicle combo |
| Ride history caching | Redis 10min TTL — paginated results |
| Connection pooling | MongoDB maxPoolSize: 10 |
| Query optimization | Compound indexes on hot query paths |
| Response compression | gzip via `compression` middleware |
| Rate limiting | 100 req/15min global, 10 req/15min auth |
| Socket.IO rooms | Per-ride rooms, not global broadcasts |
| Next.js standalone | Minimal production image (~150MB) |

---

## 🌍 Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=4000
MONGODB_URI_LOCAL=mongodb://localhost:27017/rideshare
REDIS_URL_LOCAL=redis://localhost:6379
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
BASE_FARE_ECONOMY=2.50
PRICE_PER_KM=1.20
SURGE_THRESHOLD=0.7
MAX_SURGE_MULTIPLIER=3.0
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 👥 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query, Mapbox GL |
| Backend | Node.js, Express.js, TypeScript, JWT |
| Real-time | Socket.IO |
| GraphQL | Apollo Server 4, graphql-tag |
| Database | MongoDB 7 + Mongoose (2dsphere indexes) |
| Cache | Redis 7 + ioredis |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Docs | Swagger/OpenAPI 3.0 |
