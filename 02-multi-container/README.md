# 🏗️ Multi-Container Architecture (TaskFlow Microservices)

Welcome to the **Multi-Container Microservices Architecture** of the Docker Curriculum. This module demonstrates how enterprise engineering teams orchestrate decoupled, independently scalable services using **Docker Compose**.

---

## 🏛️ Architecture Overview

```
                      +-----------------------------+
                      |   Host Browser (Client)     |
                      |  http://localhost:3000      |
                      +--------------+--------------+
                                     |
                                     v [Port 3000]
                      +-----------------------------+
                      |     task_frontend           |
                      |  (Vite Dev / Nginx Prod)    |
                      +--------------+--------------+
                                     |
                                     v [Port 4000: http://localhost:4000/api]
+-----------------------------------------------------------------------------------+
|  Docker Virtual Bridge Network: app-network                                       |
|                                                                                   |
|    +-----------------------------+         DNS: redis:6379                        |
|    |          task_api           |-------------------------------+                |
|    |    (Express Node.js)        |                               |                |
|    +--------------+--------------+                               v                |
|                   | DNS: postgres:5432             +---------------------------+  |
|                   v                                |        task_redis         |  |
|    +-----------------------------+                 |     (Redis 7 Cache)       |  |
|    |        task_postgres        |                 +-------------+-------------+  |
|    |      (PostgreSQL 16)        |                               |                |
|    +--------------+--------------+                               |                |
+-------------------|----------------------------------------------|----------------+
                    |                                              |
                    v                                              v
         +--------------------+                         +--------------------+
         |   postgres_data    |                         |     redis_data     |
         |   (Named Volume)   |                         |   (Named Volume)   |
         +--------------------+                         +--------------------+
```

---

## 📦 The 4 Decoupled Services

| Service | Technology | Role | Network Identifier | Port Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | PostgreSQL 16 Alpine | Relational persistence store | `postgres:5432` | `5432:5432` |
| **`redis`** | Redis 7 Alpine | Millisecond in-memory cache | `redis:6379` | `6379:6379` |
| **`api`** | Express (Node 20 Alpine) | Backend REST API & DB queries | `api:4000` | `4000:4000` |
| **`frontend`** | React 18 + Vite | Interactive task management UI | `frontend:3000` | `3000:3000` |

---

## 🔑 Core Docker Concepts Demonstrated

### 1. User-Defined Bridge Network (`app-network`)
* Containers attached to `app-network` can resolve each other by **service name** (e.g. `postgresql://user:pass@postgres:5432/taskflow`).
* Containers are completely isolated from unauthorized external network access.

### 2. The 3 Types of Storage Used
1. **Named Volumes (`postgres_data`, `redis_data`)**: Managed by Docker in the storage pool. Ensures data survives container deletion (`docker compose down`).
2. **Host Bind Mounts (`./backend:/app`, `./frontend:/app`)**: Enables instantaneous live code editing with Hot Module Replacement (HMR) and `nodemon`.
3. **Anonymous Volumes (`/app/node_modules`)**: Masks host dependencies. Prevents Windows/macOS binaries from overwriting container-compiled Linux modules.

### 3. Multi-Stage Dockerfile Optimization
* **Backend**: Provides a `development` stage with `nodemon` and a hardened `production` stage running under unprivileged user `nodejs (UID 1001)`.
* **Frontend**: Compiles React in Node.js, throws Node.js away, and ships a **25MB Alpine Nginx** production web server.

### 4. Enterprise Production Governance
* **Resource Ceilings**: Enforces `memory: 512M` and `cpus: '0.50'` to protect the host against runaway queries and the **Linux OOM Killer (Exit Code 137)**.
* **Graceful Termination**: Sets `stop_grace_period: 15s`. When containers stop, Express catches `SIGTERM` to drain active user HTTP connections and safely close database pools before terminating.

---

## 🚀 Quick Start Guide

### 1. Launch All Services (Development Mode)
```bash
docker compose up --build
```

### 2. Verify Running Containers
```bash
docker compose ps
```
You should see all 4 containers in state `Up`:
* `task_postgres`
* `task_redis`
* `task_api`
* `task_frontend`

### 3. Test Endpoints
* **Frontend UI**: Open [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: Open [http://localhost:4000/api/tasks](http://localhost:4000/api/tasks)
* **Health Check**: Open [http://localhost:4000/api/health](http://localhost:4000/api/health)

### 4. Inspect Volume Data on Host
```bash
docker exec -it task_postgres ls -la /var/lib/postgresql/data
```

### 5. Gracefully Stop the Stack
```bash
# Stops containers without deleting database data
docker compose down

# Or stop and completely wipe database volumes for a clean slate
docker compose down -v
```
