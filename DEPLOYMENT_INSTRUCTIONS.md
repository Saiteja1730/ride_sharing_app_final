# Production Deployment Instructions

The RideShare platform is fully containerized and designed for simple, robust orchestrations. Below are the steps to deploy the application in a production-ready cloud or local virtual machine environment.

---

## 🛠️ Prerequisites
*   **Docker Engine** (version 20.10 or newer)
*   **Docker Compose V2**
*   **Git** (to fetch files)

---

## 📦 Option 1: Complete Containerized Deployment (Recommended)

This option spins up the entire fleet of services—including MongoDB, Redis, the Node/Express backend API, and the Next.js frontend web app—interconnected via an isolated virtual bridge network.

### Step 1: Clone and Configure Environment Variables
Create a production `.env` file in the root directory to store secure configurations:
```bash
# Generate a robust 32-character secret key
JWT_SECRET=production-secret-change-me-to-a-secure-32char-string
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### Step 2: Spin Up the Stack
Run Docker Compose in detached (background) mode:
```bash
docker compose up -d --build
```
This single command will:
1.  Initialize **MongoDB** database cluster with persistent volume stores on local disk.
2.  Spin up **Redis** caching cluster on port 6379.
3.  Compile and launch the **Backend API Engine** (exposed on ports 4000 and 4001).
4.  Compile and bundle the **Next.js Web App** (exposed on port 3000).

### Step 3: Verify Container Health
Check container logs and running status:
```bash
docker compose ps
```
Ensure all containers show `Up` and `healthy` status indicators.

---

## 💻 Option 2: Hybrid Local Hosting (Local Dev / Native)

If you are running database engines locally on the host VM, you can deploy the servers natively:

### Step 1: Seed the Databases
Verify that your local **MongoDB** server is running:
*   On Windows: `Start-Service MongoDB` or ensure `mongod` is active.
*   The system will automatically auto-seed the default Admin credentials on start:
    *   **Username**: `admin@rideshare.com`
    *   **Password**: `adminpassword`

### Step 2: Start Backend
Navigate to `/backend`, verify your `.env` connects to `localhost` databases, and launch the dev or production start script:
```bash
cd backend
npm install
npm run build
npm start
```
*The backend will automatically fallback to high-speed in-memory Map stores if local Redis is offline.*

### Step 3: Start Frontend
Navigate to `/frontend`, verify `.env.local` points to `http://localhost:4000` API, and launch:
```bash
cd ../frontend
npm install
npm run build
npm start
```

---

## 🚨 Security Hardening Checklist for Production
1.  **Change Default Credentials**: Log into the admin console immediately and update the seeded `admin@rideshare.com` account password.
2.  **Firewalling**: Ensure MongoDB (port 27018) and Redis (port 6379) ports are closed to the public internet. Only ports `3000` (Frontend) and `4000`/`4001` (Backend) should receive external traffic.
3.  **Use HTTPS**: Put the application behind a reverse proxy (e.g. Nginx or Caddy) to handle Let's Encrypt SSL/TLS handshakes securely.
