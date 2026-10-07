# 📦 Single-Container Architecture (All-in-One Monolith)

Welcome to the **Single-Container Architecture** module of the Docker Curriculum. This module demonstrates how to package an entire full-stack application (Interactive UI + REST API + Embedded Persistent Database) into a **single, lightweight, self-contained Docker image**.

---

## 🏛️ Architecture Overview

```
                      +------------------------------------------+
                      |         Host Browser (Client)            |
                      |         http://localhost:5000            |
                      +--------------------+---------------------+
                                           |
                                           v  [Port Mapping: 5000:4000]
+----------------------------------------------------------------------------------------+
| 🐳 SINGLE DOCKER CONTAINER (taskflow-single)                                           |
|                                                                                        |
|   +--------------------------------------------------------------------------------+   |
|   │                      Express Node.js Server (PID 1)                            │   |
|   │                                                                                │   │
|   │   +------------------------------------+   +-------------------------------+   │   │
|   │   │    Static File Host (/*)           │   │   REST API Router (/api/*)    │   │   │
|   │   │    Serves compiled React SPA       │   │   GET/POST/PATCH /api/tasks   │   │   │
|   │   │    from /app/public/index.html     │   │   GET /api/health             │   │   │
|   │   +------------------------------------+   +---------------+---------------+   │   │
|   +------------------------------------------------------------|-------------------+   |
|                                                                |                       |
|                                                                v (In-Process C-Driver) |
|                                                +-------------------------------+       |
|                                                |   Embedded SQLite Database    |       |
|                                                |   File: /data/tasks.db        |       |
|                                                |   (NO NETWORK PORT NEEDED!)   |       |
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

## 🔌 The Single Port Mystery: How Frontend, API, and Database Share Port 5000

A frequent question from developers inspecting this single container is:
> *"If we only map port 5000 (`-p 5000:4000`), which component gets this port? And where are the ports for the React frontend and the SQLite database?"*

Here is the exact architectural answer:

### 1. 🌐 The Single Port Belongs Exclusively to the Express Server
* When Docker maps `-p 5000:4000`, the **only process listening on a TCP socket is Node.js Express** (running on internal port 4000).
* Express acts as the single unified gateway for **both** the user interface and backend API routes.

### 2. 🎨 What About the Frontend? (Why It Needs No Separate Port)
* In traditional development, React runs on its own Vite development server on port `3000`.
* In this production single container, **React is compiled at build time** into static HTML, JavaScript, and CSS files (`dist/`).
* Express serves these compiled static assets directly using `express.static('/app/public')`.
* When you open `http://localhost:5000/`, Express responds with `index.html`. No separate frontend server or port is needed!

### 3. ⚡ What About the REST API? (Zero CORS Errors)
* Express handles the API routes directly on that same port:
  - `GET http://localhost:5000/api/tasks`
  - `GET http://localhost:5000/api/health`
* **Major Advantage:** Because the Frontend and Backend share the exact same origin (`http://localhost:5000`), **Cross-Origin Resource Sharing (CORS) errors are eliminated entirely**!

### 4. 💾 What About the Database? (Why SQLite Has NO Port At All)
* Traditional databases like **PostgreSQL (5432)**, **MySQL (3306)**, and **MongoDB (27017)** are client-server network daemons that listen on TCP ports.
* **SQLite is NOT a network server.** It is a **serverless, embedded library** compiled directly into the Node.js runtime (`sqlite3`).
* It interacts with disk storage at `/data/tasks.db` through in-memory C function calls.
* **Zero Network Ports Required:**
  - Uses 0 network ports on the host.
  - Zero network latency (reads and writes execute at memory and local disk speeds).
  - Cannot be reached or attacked over the network from the outside!

### 📊 Port Comparison Across All Three Tracks

| Track | Frontend | Backend API | Database | Total Ports |
| :--- | :--- | :--- | :--- | :--- |
| **📦 01-Single-Container** | `5000` (Served by Express) | `5000` (`/api/*`) | **None** (Embedded SQLite) | **1 Port** (`5000:4000`) |
| **🏗️ 02-Multi-Container** | `3000` (Vite / Nginx) | `4000` (Express) | `5432` (Postgres) + `6379` (Redis) | **4 Ports** |
| **🐬 03-Host-DB Bridge** | `4001` (Served by Express) | `4001` (`/api/*`) | `3306` (Host-native MySQL) | **1 Container Port** (`4001`) |

---

## 💡 When Should You Use Single-Container Architecture?

In real-world software engineering, you do not always need or want the overhead of 5 orchestrated containers just to test a feature or verify a build. A Single-Container setup is ideal for:

1. **⚡ Rapid Development & Speed Checks**: Instant local verification of UI and backend logic without managing multiple background services, databases, or port conflicts.
2. **🚀 Zero-Config Developer & QA Onboarding**: Hand a frontend engineer or QA tester a single command (`docker run -p 5000:4000 taskflow-single`) and they have a fully working, populated stack running in **5 seconds**.
3. **🧪 Lightning-Fast CI/CD Smoke Tests**: Instead of spinning up full PostgreSQL and Redis clusters in GitHub Actions (adding 2–3 minutes to every commit), a single container boots in milliseconds, runs automated Playwright/Cypress smoke tests, and tears down instantly.
4. **🔍 Ephemeral PR Preview Environments**: Create lightweight, disposable preview environments for every pull request at near-zero cloud cost.
5. **🛠️ Internal Tools & Admin Portals**: Low-traffic internal dashboards and utilities where multi-server complexity is unnecessary.
6. **📟 Edge Computing & IoT Hardware**: Deploying to Raspberry Pi, field servers, or factory hardware with strict RAM limits (**uses only ~45MB RAM**).
7. **💰 Ultra-Low Cost Deployments**: Runs comfortably on a **$3.50/month VPS with only 512MB RAM** (where Postgres + Redis alone would exhaust memory).
8. **✈️ Air-Gapped & Offline Demos**: Export as a single `.tar` archive (`docker save`) to run client demos on laptops with zero internet or cloud dependencies.

### 📈 The Real-World Architectural Progression

| Project Lifecycle Phase | Recommended Architecture | Why |
| :--- | :--- | :--- |
| **Phase 1: Proof-of-Concept & Rapid MVP** | 📦 **Single Container** | Maximum velocity, zero ops friction, instant iteration. |
| **Phase 2: CI/CD Smoke Tests & PR Previews** | 📦 **Single Container** | Ultra-fast pipeline execution, low runner costs, disposable testing. |
| **Phase 3: High-Scale Production SaaS** | 🏗️ **Multi-Container (Track 2)** | Decoupled horizontal scaling, failure recovery, dedicated caching. |
| **Phase 4: Enterprise System Integration** | 🐬 **Host DB Bridge (Track 3)** | Securely connect containerized microservices to native company DBs. |

> [!CAUTION]
> ### ⚠️ Architectural Reality Check: The "One Process per Container" Philosophy
> 
> Running a database, frontend, and backend inside a single Docker container goes against Docker’s core design philosophy of **"one concern / one process per container"**.
> 
> While bundling everything into one image is extremely effective for **development speed checks, CI/CD pipelines, offline field devices, or easy demos**, it requires specific architectural trade-offs (such as embedded single-file storage or process supervisors like supervisord) and is generally discouraged for high-scale production environments.
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
> ### 💥 The "Silent Zombie" Trap: Why Docker Cannot Auto-Restart Crashed Background Daemons
> When using a shell script (`start.sh`) with backgrounded processes:
> 1. **Docker Monitors ONLY PID 1**: Docker’s lifecycle engine only tracks the single process invoked by `CMD` (the shell script or the foreground command).
> 2. **Silent Background Deaths**: If the backend API (`node server.js &`) crashes due to an uncaught exception or out-of-memory error, **PID 1 never exits** because the shell script or foreground web server is still running.
> 3. **No Automatic Restart**: Even if you started your container with `--restart unless-stopped` or `--restart always`, **Docker will NEVER restart the container** because from Docker's perspective, PID 1 is alive and healthy!
> 4. **Zombie State**: Your container becomes a "zombie" — Docker reports `STATUS: Up`, but client requests to the API fail with `502 Bad Gateway` or `Connection Refused` indefinitely without recovery.
> 5. **Broken Signals**: A plain shell script does not forward `SIGTERM` signals, causing Docker to wait 10 seconds and forcefully kill (`SIGKILL`) the container during shutdowns.
> 
> *In contrast, in a decoupled architecture (**02-multi-container/**), each service is PID 1 of its own container. If the API crashes, Docker immediately catches the exit code and restarts that container in seconds without touching the database!*

### Approach B: Process Supervisors (`supervisord` / `tini`)
If you are strictly forced to run multiple daemons in one container, you should never use raw shell scripts; you must install a process supervisor like **Supervisor** (`supervisord`) or **S6-overlay**, which monitors child process health, automatically restarts dead child processes internally, and forwards OS termination signals.

### Approach C: The Unified Monolith Pattern (What Track 1 Implements)
Rather than fighting multi-process supervisor complexity, Track 1 implements the **cleanest single-container pattern**:
- Compile the React SPA into static HTML/CSS/JS assets during the build stage.
- Have the Node.js Express server serve both the REST API (`/api/*`) and the static frontend (`express.static('public')`).
- Use an embedded SQLite database (`sqlite3`) that runs inside the Node.js process memory.
- **Result**: The container runs **strictly ONE process (PID 1)**. If Express crashes, the container cleanly exits, allowing Docker’s `--restart` policy to kick in and restart it immediately!

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
  -p 5000:4000 \
  -v taskflow_data:/data \
  taskflow-single
```

### 3. Open in Browser
Visit **[http://localhost:5000](http://localhost:5000)**:
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
