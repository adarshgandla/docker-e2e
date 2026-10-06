# 📦 Single-Container Architecture (All-in-One Monolith)

Welcome to the **Single-Container Architecture** module of the Docker Curriculum. This module demonstrates how to package an entire full-stack application (Interactive UI + REST API + Embedded Persistent Database) into a **single, lightweight, self-contained Docker image**.

---

## 🏛️ Architecture Overview

```
                      +------------------------------------------+
                      |         Host Browser (Client)            |
                      |         http://localhost:4000            |
                      +--------------------+---------------------+
                                           |
                                           v  [Port 4000]
+----------------------------------------------------------------------------------------+
| 🐳 SINGLE DOCKER CONTAINER (taskflow-single)                                           |
|                                                                                        |
|   +--------------------------------------------------------------------------------+   |
|   |                      Express Node.js Server (PID 1)                            |   |
|   |                                                                                |   |
|   |   +------------------------------------+   +-------------------------------+   |   |
|   |   |    Static File Host (/*)           |   |   REST API Router (/api/*)    |   |   |
|   |   |    Serves compiled React SPA       |   |   GET/POST/PATCH /api/tasks   |   |   |
|   |   |    from /app/public/index.html     |   |   GET /api/health             |   |   |
|   |   +------------------------------------+   +---------------+---------------+   |   |
|   +------------------------------------------------------------|-------------------+   |
|                                                                |                       |
|                                                                v (Reads & Writes)      |
|                                                +-------------------------------+       |
|                                                |   Embedded SQLite Database    |       |
|                                                |   File: /data/tasks.db        |       |
|                                                +---------------+---------------+       |
+----------------------------------------------------------------|-----------------------+
                                                                 |
                                                                 v
                                                      +--------------------+
                                                      |   taskflow_data    |
                                                      |   (Docker Volume)  |
                                                      +--------------------+
```

---

## 💡 When Should You Use Single-Container Architecture?

In software development, you do not always need 5 separate microservice containers with Redis, RabbitMQ, and PostgreSQL. A Single-Container setup is ideal for:

1. **Internal Tools & Admin Portals**: Quick internal dashboards where high traffic concurrency is not needed.
2. **Edge Computing & IoT Devices**: Deploying to Raspberry Pi, field servers, or factory computers with strict RAM limits.
3. **Low-Cost Cloud Deployments**: Runs comfortably on a **$3.50/month VPS with only 512MB RAM**!
4. **Air-Gapped & Offline Deployments**: Ships as a single standalone `.tar` image requiring zero external networks.
5. **Instant Demos & Proof-of-Concepts**: Give stakeholders or clients one command to run the whole app with zero setup.

> [!CAUTION]
> ### ⚠️ Architectural Reality Check: The "One Process per Container" Philosophy
> 
> Running a database, frontend, and backend inside a single Docker container goes against Docker’s core design philosophy of **"one concern / one process per container"**.
> 
> While bundling everything into one image is entirely practical for **rapid prototyping, offline field devices, or easy demos**, it requires specific architectural trade-offs (such as embedded single-file storage or process supervisors like supervisord) and is generally discouraged for high-scale production environments.
> 
> In enterprise production, decoupling components into independent containers—as demonstrated in **[02-multi-container/](../02-multi-container/)**—ensures independent horizontal scalability, failure isolation, and zero-downtime rolling upgrades.

---

## 🔑 Key Docker Techniques Demonstrated

### 1. Multi-Stage Pipeline (Frontend Compiler -> Lean Runtime)
* **Stage 1 (`frontend-builder`)**: Uses Node.js to compile JSX and assets into `/app/frontend/dist`.
* **Stage 2 (`runtime`)**: A fresh Alpine runtime copies **only the built static files** into Express `/app/public`. Node.js development tooling and Vite are completely discarded.

### 2. Embedded Database Persistence via Docker Volume
* The database is stored in a single binary file at `/data/tasks.db`.
* By mounting a Docker volume (`-v taskflow_data:/data`), the SQLite file lives on the host storage engine. When you rebuild or upgrade the container image, **your data is 100% preserved**.

### 3. Non-Root Least Privilege Security
* The container creates an unprivileged user `appuser (UID 1001)`.
* Process execution drops root rights before launching `server.js` to meet enterprise compliance (SOC 2 & CIS Docker Benchmark).

---

## 🛠️ How Multi-Process Single Containers Are Technically Done (If Absolutely Required)

If you are working with a legacy system, an air-gapped device, or an IoT appliance where you **must** run multiple distinct server daemons (e.g., PostgreSQL + Express API + Nginx) inside one container, a single `CMD` instruction cannot start them all. You have two technical approaches:

### Approach A: Initialization Shell Script (`start.sh`)
Background all secondary services with `&` and keep the final service in the foreground:

```bash
#!/bin/bash
# 1. Start the database daemon
service postgresql start

# 2. Start the backend API in the background
node /app/backend/server.js &

# 3. Start the frontend web server in the foreground (PID 1)
npm --prefix /app/frontend start
```

And call it in your `Dockerfile`:
```dockerfile
FROM ubuntu:22.04
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]
```

> [!WARNING]
> **Caveat with Shell Scripts**: If a backgrounded process (`node ... &`) crashes, the shell script won't detect it, leaving the container running in a corrupted zombie state. It also often fails to forward `SIGTERM` signals properly during container shutdowns.

### Approach B: Process Supervisors (`supervisord` / `tini`)
For robust multi-process management, production teams use **Supervisor** (`supervisord`), which monitors child processes, restarts them on failure, and forwards OS termination signals.

### Approach C: The Unified Monolith Pattern (What Track 1 Implements)
Instead of running multiple daemons, compile the React SPA into static HTML/JS/CSS assets and have the Node.js Express server serve both the API routes (`/api/*`) and the static frontend (`express.static('public')`), using an embedded SQLite database (`sqlite3`). **This keeps the container strictly at ONE process (PID 1)!**

---

## 🚀 Quick Start Guide

### 1. Build the Single-Container Image
Navigate to the directory and run:
```bash
docker build -t taskflow-single .
```

### 2. Run the Container with Persistent Storage
```bash
docker run -d \
  --name taskflow_app \
  -p 4000:4000 \
  -v taskflow_data:/data \
  taskflow-single
```

### 3. Open in Browser
Visit **[http://localhost:4000](http://localhost:4000)**:
* **The React UI** loads instantly from the root URL `/`.
* **The REST API** is active at `/api/tasks` and `/api/health`.
* Create or toggle tasks in the UI; they are saved directly into `/data/tasks.db`.

### 4. Verify Data Persistence
Stop and remove the container, then start a brand-new container with the same volume:
```bash
# Remove container
docker rm -f taskflow_app

# Start a new container with the same volume
docker run -d -p 4000:4000 -v taskflow_data:/data --name taskflow_app taskflow-single
```
Refresh **[http://localhost:4000](http://localhost:4000)** — all your tasks remain intact!

### 5. Inspect the SQLite Database Inside the Container
```bash
docker exec -it taskflow_app ls -la /data
```

### 6. Clean Up
```bash
# Stop and remove the container
docker rm -f taskflow_app

# (Optional) Remove the volume if you want a complete reset
docker volume rm taskflow_data
```

---

## ⚖️ Single-Container vs Multi-Container Comparison

| Criterion | 📦 Single Container (Monolith) | 🏗️ Multi-Container (Microservices) |
| :--- | :--- | :--- |
| **Complexity** | Extremely low (1 Dockerfile, 1 command) | Moderate (Docker Compose, networking, configs) |
| **RAM Footprint** | **~40MB – 60MB total** | ~250MB – 500MB total |
| **Database** | Embedded SQLite (file-based) | Dedicated PostgreSQL Server 16 |
| **Caching** | In-memory JavaScript Map / LRU | Dedicated Redis 7 Cluster |
| **Scalability** | Vertical (scale server CPU/RAM) | Horizontal (scale API containers independently) |
| **Best For** | MVPs, Internal Tools, Edge IoT, Proof of Concepts | Production SaaS, High Concurrency, Multi-Team Orgs |
