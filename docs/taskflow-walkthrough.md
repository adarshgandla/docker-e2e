# 🐳 TaskFlow — Complete Docker Walkthrough & System Architecture Guide

> **Stack Architecture**: 
> - **Track 1 (`01-single-container/`)**: All-in-One Monolith (Node.js Express + React 18 SPA + Embedded SQLite3 + Volume Persistence)
> - **Track 2 (`02-multi-container/`)**: Microservices Cluster (React Vite + Node Express + PostgreSQL 16 + Redis 7 + Resource Governance)

---

## 🧭 Repository Layout & Integrity Check

The repository is divided into three distinct, production-grade architectural tracks:

```text
docker-masterclass/
│
├── 📦 01-single-container/          # ALL-IN-ONE ARCHITECTURE (Monolith Track)
│   ├── src/
│   │   └── server.js                # Combined Express API + SQLite engine + React static host
│   ├── frontend/                    # Complete React 18 + Vite SPA client
│   │   ├── src/ (App.jsx, main.jsx)
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── Dockerfile                   # Multi-stage build (Vite build -> Alpine Express runtime)
│   ├── .dockerignore                # Build context protection
│   ├── .env.example                 # Environment defaults
│   ├── package.json                 # Backend dependencies (sqlite3, express, cors)
│   └── README.md                    # Single-container deep dive
│
├── 🏗️ 02-multi-container/           # MICROSERVICES ARCHITECTURE (Decoupled Track)
│   ├── backend/
│   │   ├── src/server.js            # Express API with PG retry loop, Redis caching, SIGTERM drain
│   │   ├── Dockerfile               # Multi-stage development & production runner (non-root nodejs)
│   │   ├── .dockerignore
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/ (App.jsx, main.jsx) # React UI with cache-vs-db latency tags
│   │   ├── Dockerfile               # Multi-stage build (Vite dev -> Alpine Nginx prod)
│   │   ├── nginx-spa.conf           # Client-side routing try_files fallback
│   │   ├── vite.config.js
│   │   ├── .dockerignore
│   │   └── package.json
│   ├── nginx/
│   │   └── nginx.conf               # Reverse proxy gateway routing /api to backend
│   ├── scripts/
│   │   └── init.sql                 # PostgreSQL automatic schema & seed data creation
│   ├── docker-compose.yml           # Compose orchestration (Networks, Volumes, Healthchecks, Limits)
│   ├── .dockerignore
│   ├── .env.example
│   └── README.md                    # Multi-container deep dive
│
├── 🐬 03-host-database-mysql/       # HOST DATABASE BRIDGE ARCHITECTURE (Hybrid Track)
│   ├── src/
│   │   └── server.js                # Express API connecting to host.docker.internal:3306
│   ├── frontend/
│   │   └── src/ (App.jsx, main.jsx) # React 18 UI with host DB diagnostic banner
│   ├── scripts/
│   │   └── setup-host-mysql.sql     # SQL script for user root@% permissions
│   ├── Dockerfile                   # Non-root multi-stage production build
│   ├── docker-compose.yml           # extra_hosts bridge & port 4001 configuration
│   ├── .dockerignore
│   ├── .env.example
│   └── README.md                    # Deep dive into host.docker.internal & MySQL grants
│
├── 🎨 docker_explained.html         # 26-Slide Interactive Visual Masterclass
├── ⚡ manual-exe.html               # 10-Step Interactive SOP Workbench
├── 📚 docs/                         # Technical Reference Manuals
│   ├── docker-masterclass.md
│   ├── docker-pattern-library.md
│   └── taskflow-walkthrough.md
├── .gitignore
└── README.md                        # Master curriculum landing page
```

---

## ⚡ The Three Architectural Paradigms Compared

| Feature | 📦 Track 1: `01-single-container` | 🏗️ Track 2: `02-multi-container` | 🐬 Track 3: `03-host-database-mysql` |
| :--- | :--- | :--- | :--- |
| **Philosophy** | Zero-ops, lightweight monolith | Independently scalable microservices | Containerized app bridging to host DB |
| **Containers** | **1 container** | **4 containers** (Postgres, Redis, API, Frontend) | **1 container** (App + Host DB Bridge) |
| **RAM Footprint** | **~45 MB total** | ~350 MB total | **~45 MB – 70 MB** (Host DB external) |
| **Database** | Embedded SQLite file (`/data/tasks.db`) | PostgreSQL 16 Alpine cluster | Native Host MySQL 8.0 on Port 3306 |
| **Cache Engine** | In-memory process cache | Dedicated Redis 7 In-Memory store | In-memory connection pool |
| **Frontend Serving** | Express `express.static()` | Vite Dev Server (Dev) / Alpine Nginx (Prod) | Express `express.static()` |
| **Port Mapping** | `5000:4000` | Frontend `3000`, API `4000`, Postgres `5432`, Redis `6379` | `4001:4001` |
| **Best Used For** | MVPs, CLI tools, IoT Edge | Enterprise SaaS, high concurrency | Corporate DBs, Native Dev MySQL |

---

## 🏗️ Track 2 Deep-Dive: How Multi-Container Microservices Communicate

```text
Browser Client
   │
   ├──▶ Frontend UI (http://localhost:3000)
   │        │ (Calls API via internal/external route)
   │        ▼
   └──▶ Express API (http://localhost:4000)
            │
            ├──▶ Redis Cache (redis:6379) ───[ Cache Hit: < 2ms ]
            │
            └──▶ PostgreSQL (postgres:5432) ──[ Cache Miss: Query & Cache ]
```

### 1. Service Discovery via Internal Docker DNS
Containers on the custom bridge network `app-network` talk to each other using **service names as hostnames**:
- Express connects to PostgreSQL at `postgres:5432` (NOT `localhost:5432`).
- Express connects to Redis at `redis:6379` (NOT `localhost:6379`).
- `localhost` inside a container means **that container itself**, never sibling containers.

### 2. Cache-Aside Pattern (Redis + PostgreSQL)
1. **GET `/api/tasks`**:
   - First checks Redis: `GET tasks`.
   - **Cache Hit**: Returns cached JSON in under 2ms with `"source": "cache"`.
   - **Cache Miss**: Queries PostgreSQL, writes result to Redis with a 30s TTL, and returns `"source": "database"`.
2. **POST / PUT / DELETE `/api/tasks`**:
   - Updates PostgreSQL table.
   - Executes `redis.del('tasks')` (cache invalidation) to ensure no stale data is served.

### 3. Enterprise Hardening Features
- **Non-Root Execution**: Runs under unprivileged user `nodejs:1001` (SOC 2 / CIS Benchmark compliance).
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT` to drain in-flight HTTP requests and close database connection pools safely.
- **Resource Limits**: Compose enforces `cpus: '0.50'` and `memory: 512M` to protect host stability and prevent silent kernel OOM terminations.

---

## 📦 Track 1 Deep-Dive: How Single-Container All-in-One Works

In `01-single-container/Dockerfile`:
1. **Stage 1 (`builder`)**: Uses `node:20-alpine`, installs Vite dependencies, and runs `npm run build` to generate pure static assets in `/app/dist`.
2. **Stage 2 (`runner`)**: Uses a clean `node:20-alpine` base image, installs lightweight backend dependencies (`sqlite3`, `express`, `cors`), copies `/app/dist` from the builder, and creates unprivileged user `appuser:1001`.
3. **Data Persistence**: Mounts `/data` as a Docker volume. SQLite database `/data/tasks.db` persists across container restarts, image updates, and rebuilds.

> [!CAUTION]
> **Architectural Reality Check: The "One Process per Container" Philosophy & The Silent Crash Trap**:
> Bundling frontend, API, and an external database daemon into a single container using a shell script (`start.sh`) goes against Docker’s core design philosophy:
> - **The Silent Failure Flaw**: Docker monitors only the root process (**PID 1**). If a backgrounded service (e.g. database or Node.js) crashes in a multi-process container, PID 1 stays alive. **Docker never knows the service died and will NOT restart the container automatically**, turning the container into an unresponsive "zombie".
> - **How Track 1 Solves It**: Instead of running multiple daemons, Track 1 compiles React into static assets and lets Express run as **strictly ONE process (PID 1)** serving the frontend, API, and embedded SQLite. If Express dies, the container exits immediately and restarts cleanly.
> - **How Track 2 Solves It**: Every component (PostgreSQL, Redis, Express, Nginx) runs as its own container with `restart: unless-stopped`. If one service crashes, Docker automatically restarts that container within seconds without disturbing other running services.

---

## 🐬 Track 3 Deep-Dive: Host Database Bridge (`host.docker.internal`)

In `03-host-database-mysql/`:
1. **The `localhost` Dilemma**: Inside a container, `localhost:3306` queries the container itself, resulting in `ECONNREFUSED`.
2. **The Gateway Bridge**: Docker Desktop maps `host.docker.internal` to the host's internal network gateway.
3. **Linux Compatibility**: `docker-compose.yml` includes `extra_hosts: ["host.docker.internal:host-gateway"]` to guarantee identical functionality on Linux servers.
4. **MySQL Privilege Grant**: Because the container arrives from the Docker subnet (`172.17.0.x`), MySQL requires `'root'@'%'` permissions (`scripts/setup-host-mysql.sql`).

---

## 🔌 Port Mapping & Running All Three Tracks Simultaneously

All three tracks are specifically assigned unique host ports to run side-by-side with zero collisions:

| Track | Service | Host Port | Internal Port | Browser Access URL |
| :--- | :--- | :--- | :--- | :--- |
| **Track 1 (Single)** | Express + React + SQLite | **5000** | 4000 | [`http://localhost:5000`](http://localhost:5000) |
| **Track 2 (Multi)** | Frontend (Vite) | **3000** | 3000 | [`http://localhost:3000`](http://localhost:3000) |
| **Track 2 (Multi)** | Backend API (Express) | **4000** | 4000 | [`http://localhost:4000/api/tasks`](http://localhost:4000/api/tasks) |
| **Track 2 (Multi)** | PostgreSQL 16 | **5432** | 5432 | `localhost:5432` |
| **Track 2 (Multi)** | Redis 7 Cache | **6379** | 6379 | `localhost:6379` |
| **Track 3 (Host DB)** | Express + React (Host MySQL) | **4001** | 4001 | [`http://localhost:4001`](http://localhost:4001) |

---

## 🚀 Execution Commands

### To run Track 1 (Single Container):
```bash
cd 01-single-container
docker build -t taskflow-single:latest .
docker run -d --name taskflow-single-app -p 5000:4000 -v taskflow_single_data:/data taskflow-single:latest
```

### To run Track 2 (Multi Container):
```bash
cd 02-multi-container
docker compose up -d --build
```

### To run Track 3 (Host Database Bridge):
```bash
cd 03-host-database-mysql
docker compose up -d --build
```

### To stop all tracks:
```bash
# Stop Track 1
docker stop taskflow-single-app && docker rm taskflow-single-app

# Stop Track 2
cd 02-multi-container && docker compose down

# Stop Track 3
cd 03-host-database-mysql && docker compose down
```
