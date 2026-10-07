# 🐳 The Production Docker Masterclass & Architecture Curriculum

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](./VERSION)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker CI/CD](https://github.com/adarshgandla/docker-e2e/actions/workflows/docker-ci-cd.yml/badge.svg)](https://github.com/adarshgandla/docker-e2e/actions/workflows/docker-ci-cd.yml)
[![Node.js](https://img.shields.io/badge/node.js-v20-green.svg?logo=node.js)](https://nodejs.org/)
[![YouTube Course](https://img.shields.io/badge/YouTube-Video%20Masterclass-FF0000.svg?logo=youtube&logoColor=white)](https://youtu.be/2bg9MAtiHwo?si=HVE5_7IaKjV9kuex)

> **A production-ready, hands-on Docker learning repository for software developers, DevOps practitioners, and platform engineers.**
> Covers everything from single-container monolithic deployment to multi-container microservices orchestration, host database bridging, enterprise security hardening, and cross-platform compilation.  
> 
> 📺 **Companion Video Masterclass:** Built around the core architectural paradigms taught in [Ashok IT - Docker & Kubernetes Full Course in 5 Hours](https://youtu.be/2bg9MAtiHwo?si=HVE5_7IaKjV9kuex). See [imgs.md](./imgs.md) for the slide diagrams and speaker cues.

---

## 🧭 Repository Architecture Map

This repository is structured into three production-grade architectural paradigms, alongside comprehensive interactive visual guides and runbooks:

```
docker-e2e/
│
├── 📦 01-single-container/          # ALL-IN-ONE ARCHITECTURE (Monolith Track)
│   ├── src/                         # Express API + Static React Server + SQLite
│   ├── frontend/                    # React Vite source code
│   ├── Dockerfile                   # Multi-stage build (Vite build -> Alpine Express runtime)
│   ├── .dockerignore                # Build context protection
│   └── README.md                    # Deep-dive single-container guide & tradeoffs
│
├── 🏗️ 02-multi-container/           # MICROSERVICES ARCHITECTURE (Decoupled Track)
│   ├── backend/                     # Express REST API (PostgreSQL + Redis + SIGTERM handler)
│   ├── frontend/                    # React 18 + Vite Dev Server / Nginx Production Runner
│   ├── nginx/                       # Reverse proxy configuration
│   ├── scripts/                     # Automated PostgreSQL database initialization scripts
│   ├── docker-compose.yml           # Compose orchestration (Networks, Volumes, Healthchecks)
│   └── README.md                    # Deep-dive multi-container orchestration guide
│
├── 🐬 03-host-database-mysql/       # HOST DATABASE BRIDGE ARCHITECTURE (Hybrid Track)
│   ├── backend/                     # Express API connecting to host.docker.internal:3306
│   ├── frontend/                    # React 18 UI with host DB diagnostic banner
│   ├── scripts/                     # setup-host-mysql.sql (permissions & schema)
│   ├── docker-compose.yml           # extra_hosts bridge, backend (:4001) & frontend (:3001)
│   └── README.md                    # Deep-dive host.docker.internal & MySQL permissions guide
│
├── ⚙️ 04-cicd-automation/           # AUTOMATED CI/CD & CONTINUOUS DEPLOYMENT (DevOps Track)
│   ├── docker-compose.single-deploy.yml   # Single container deployment + Watchtower auto-updater
│   ├── docker-compose.multi-deploy.yml    # Microservices deployment + Watchtower auto-updater
│   ├── docker-compose.host-db-deploy.yml  # Host DB bridge deployment + Watchtower auto-updater
│   ├── .env.example                       # Production environment & database secrets template
│   └── README.md                          # Comprehensive CI/CD and deployment tutorial
│
├── 🐙 .github/workflows/           # GITHUB ACTIONS CI/CD AUTOMATION
│   └── docker-ci-cd.yml             # Automatic build, GHCR publish, and semver tag on push
│
├── 🎨 docker_explained.html        # 27-SLIDE VISUAL MASTERCLASS DECK (Interactive Presentation)
├── ⚡ manual-exe.html               # INTERACTIVE PRODUCTION RUNBOOK (SOP Checklist)
├── 🖼️ imgs.md                     # COMPLETE VISUAL SLIDES DECK (7 Diagrams + Speaker Notes)
├── 💻 commands.md                 # COMMON DOCKER COMMANDS (Natural CLI Reference Manual)
├── 🎙️ presenter-sidebar.md        # 20% SPLIT SCREEN SIDEBAR (Glance-and-Execute Cue Cards)
├── 🎛️ presenter-hud.html          # INTERACTIVE SIDEBAR HUD (1-Click Copy, Stopwatch, Cues)
│
├── 📜 LICENSE                      # MIT Open Source License (Adarsh Gandla)
├── 🏷️ VERSION                      # Release version tracker (1.2.0)
│
└── 📚 docs/                         # REFERENCE MANUALS & SPECIFICATIONS
    ├── docker-masterclass.md        # Comprehensive technical manual
    ├── docker-pattern-library.md    # 15 battle-tested production Docker patterns
    ├── taskflow-walkthrough.md      # End-to-end implementation walkthrough
    └── ci-cd-automation.md          # Complete CI/CD & Watchtower Continuous Deployment guide
```

---

## 🌐 Enterprise Application Environments & Packaging Pipeline

In modern software engineering, software delivery follows a rigorous environment promotion lifecycle to guarantee reliability, security, and zero-downtime releases:

### 1. The Packaging Principle (Code + Runtime Dependencies)
Instead of installing language runtimes, web servers, and database drivers directly on host operating systems, Docker packages application code together with its exact runtime dependencies into a single immutable artifact:

<p align="center">
  <img src="./docs/images/docker-image-packaging.png" alt="Docker Image Packaging Architecture" width="650"/>
</p>

* **Application Code**: Source code, configs, business logic.
* **Dependencies & Runtimes**: Node.js/Java, web server (Tomcat/Nginx/Express), database drivers (MySQL/PostgreSQL), and Linux OS libraries.
* **Result**: An immutable, portable **Docker Image** that behaves identically across every environment.

### 2. The 5 Enterprise Application Environments

<p align="center">
  <img src="./docs/images/application-environments.png" alt="Enterprise Application Environments: DEV, SIT, UAT, PILOT, PROD" width="700"/>
</p>

| Environment | Primary Users | Purpose & Validation Scope | Docker & CI/CD Strategy |
|:---|:---|:---|:---|
| **1) DEV** | Developers | Rapid feature engineering, debugging, and initial integration. | Docker Compose with **bind mounts** (`./src:/app`) and hot-reloading (Vite/Nodemon) for sub-second updates without image rebuilds. |
| **2) SIT** | Testing Team | **System Integration Testing**: Validates end-to-end communication across microservices, queues, and databases. | Automated CI builds test image tags (`:sha-<hash>`) deployed to isolated testing clusters with automated integration test suites. |
| **3) UAT** | Client / Business | **User Acceptance Testing**: Business stakeholders test real-world scenarios for contractual sign-off. | Stable release-candidate images running with sanitized real-world seed data for client sign-off. |
| **4) PILOT** | SRE / DevOps / Security | **Pre-Production Staging**: Exact replica of live production infrastructure (sizing, network, security policies). | Final rehearsals, stress/load testing, non-root UID 1001 security audits, and database migration dry-runs. |
| **5) PROD** | Live End Users | **Production**: Live business transactions demanding 99.99% uptime and zero data loss. | Immutable, cryptographically verified images from GHCR deployed with rolling updates and Watchtower/Kubernetes monitoring. |

> [!IMPORTANT]
> **The Docker Golden Rule: "Build Once, Deploy Everywhere"**  
> Never rebuild an image for each environment! The Docker image is compiled **once** in CI. The exact same immutable binary artifact is promoted through DEV ➔ SIT ➔ UAT ➔ PILOT ➔ PROD. **Only the `.env` configuration file changes** from stage to stage.

---

## ⚡ The Three Architectural Paths: Which One to Use?

| Architectural Criterion | 📦 01-Single-Container (Monolith) | 🏗️ 02-Multi-Container (Microservices) | 🐬 03-Host-Database-MySQL (Host DB Bridge) |
| :--- | :--- | :--- | :--- |
| **Directory** | [`01-single-container/`](./01-single-container/) | [`02-multi-container/`](./02-multi-container/) | [`03-host-database-mysql/`](./03-host-database-mysql/) |
| **Core Paradigm** | Single self-contained image | Decoupled services in Docker network | Container app bridged to host-native DB |
| **Technologies** | Node Express + SQLite + React SPA | React UI + Express + Postgres 16 + Redis 7 | React UI + Express + Native Host MySQL 8 |
| **RAM Footprint** | **~40MB – 60MB total** | ~250MB – 500MB total | **~45MB – 70MB total** (excl. host DB) |
| **Default Host Port**| **Port 5000** (`http://localhost:5000`) | **Port 3000** (UI) & **Port 4000** (API) | **Port 4001** (`http://localhost:4001`) |
| **Data Storage** | Embedded SQLite file on named volume | Dedicated PostgreSQL data cluster volume | Native MySQL instance on Host Machine |
| **Caching Engine** | In-memory process cache | Dedicated Redis 7 container | In-memory connection pool |
| **Ideal For** | MVPs, Internal Portals, IoT Edge | High-Concurrency SaaS, Microservices | Existing Corporate DBs, Dev Workstations |

> [!NOTE]
> **Architectural Philosophy Note**:
> While bundling frontend, API, and embedded database into a single container (**Track 1**) is efficient for rapid prototyping and offline edge nodes, it diverges from Docker's core **"one process per container"** philosophy. For horizontally scalable enterprise systems, decoupling services (**Track 2**) is the standard practice.

> [!TIP]
> **🔌 Why does Track 1 have only ONE port (5000)? Where are the frontend and database ports?**
> * **Frontend**: Pre-compiled into static assets at build time; Express serves them directly via `express.static('public')` at `http://localhost:5000/`.
> * **REST API**: Served by Express routes on `/api/*` on that identical port `5000` (completely eliminating Cross-Origin CORS headaches!).
> * **Database (SQLite)**: An **embedded in-process C library** reading and writing directly to disk (`/data/tasks.db`). It is **serverless and has NO network port**, meaning zero open ports, zero network latency, and zero network attack surface!

---

## 🧠 Core DevOps Realities & Architectural Decisions

### 1. 📄 Why `Dockerfile` vs. Why `docker-compose.yml` (or `.yaml`)?

| Question | `Dockerfile` | `docker-compose.yml` / `compose.yaml` |
| :--- | :--- | :--- |
| **What does it do?** | Builds a **single container image** | Orchestrates and runs **multiple containers together** |
| **Scope** | One individual service (e.g., just the Node.js API) | The entire application stack (API + Postgres + Redis + Frontend) |
| **Format & Nature** | **Imperative recipe** (`FROM`, `RUN`, `COPY`, `EXPOSE`, `CMD`) | **Declarative specification** (`services`, `networks`, `volumes`, `ports`, `restart`) |
| **Output** | A portable Docker **Image** (`myapp:1.0.0`) | An active **Networked Cluster** of live running containers |
| **Analogy** | Blueprint for a **single brick** or room | Master architectural plan for the **entire building** |

> **Why `.yml` vs `.yaml`?**
> They use the **exact same YAML syntax**. The `.yml` extension became popular in early DOS/Windows days due to 3-letter file extension limits (`.htm` vs `.html`). The official YAML standard specifies `.yaml`. Modern Docker Compose v2 treats both **`compose.yaml`**, **`compose.yml`**, and **`docker-compose.yml`** completely interchangeably!

---

### 2. ⚠️ The "One Process per Container" Rule & The Silent Failure Trap

A common question from engineers is: *"Why can't I just run PostgreSQL, Express, and React inside ONE single container using a shell script?"*

While technically possible using background processes (`service postgresql start && node server.js &`), it introduces the **Silent Zombie Failure Trap**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ❌ MULTI-PROCESS SINGLE CONTAINER (THE ZOMBIE TRAP)                                    │
│                                                                                        │
│   PID 1: Foreground Shell Script (/start.sh) ──▶ ALWAYS REPORTED AS HEALTHY            │
│     ├── PID 15: Background PostgreSQL Daemon                                           │
│     └── PID 24: Background Node.js Express API  ──💥 (CRASHES / THROWS UNCAUGHT ERROR!) │
│                                                                                        │
│   ⚠️ RESULT: PID 1 is still alive! Docker monitors ONLY PID 1.                         │
│   🚫 Docker DOES NOT KNOW the API crashed!                                             │
│   🚫 Docker DOES NOT RESTART the container!                                            │
│   ❌ The container stays Up (healthy) but returns HTTP 502/500 connection errors!      │
└────────────────────────────────────────────────────────────────────────────────────────┘

                                           VS

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ✅ DECOUPLED MULTI-CONTAINER ARCHITECTURE (DOCKER COMPOSE)                             │
│                                                                                        │
│   Container 1: [task_postgres]  ── PID 1: postgres  ──▶ Running Healthy               │
│   Container 2: [task_redis]     ── PID 1: redis     ──▶ Running Healthy               │
│   Container 3: [task_frontend]  ── PID 1: nginx     ──▶ Running Healthy               │
│   Container 4: [task_api]       ── PID 1: node      ──💥 (CRASHES!)                    │
│                                                                                        │
│   ✨ RESULT: Container 4's PID 1 exits immediately with code 1.                        │
│   🔄 Docker Daemon instantly detects container exit.                                   │
│   🛡️ Docker auto-restarts ONLY Container 4 within seconds (restart: unless-stopped)!    │
│   ✅ Database, cache, and frontend remain completely online and untouched!             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

* **In Track 1 (`01-single-container/`)**: We achieve single-container stability safely **not** by launching multiple broken daemons, but by compiling the React SPA into static assets and letting the Express server serve both the frontend and an embedded SQLite database as **strictly ONE process (PID 1)**.
* **In Track 2 (`02-multi-container/`)**: Every service runs isolated in its own container with automatic restart policies and dedicated health checks.

---

### 3. 🎯 When is a Single Container Actually the Right Choice? (The Development Speed Reality)

Engineers often ask: *"If multi-container is best for production, why bother with single containers at all?"*

In real-world engineering, a Single Container is an invaluable **speed and velocity multiplier** during specific project phases:

1. **⚡ Zero-Config Developer & QA Onboarding**: Instead of having a new team member configure PostgreSQL credentials, database migration scripts, and Redis caches just to test a frontend component, they run `docker run -p 5000:4000 taskflow-single` and have a working app in **5 seconds**.
2. **🧪 Lightning-Fast CI/CD Smoke Testing**: Starting a full multi-container stack in GitHub Actions adds minutes to every commit. A single self-contained image boots in milliseconds, executes end-to-end integration tests (Cypress/Playwright), and tears down instantly.
3. **🔍 Ephemeral PR Preview Deployments**: Spin up disposable preview environments for every pull request at near-zero cloud cost.
4. **💰 Ultra-Low Memory Overhead**: Track 1 consumes only **~40MB–60MB RAM total**, running easily on a $3.50/month VPS where a multi-container stack (~400MB+ RAM) would exhaust memory.
5. **✈️ Air-Gapped Offline Demos**: Easily exportable as a standalone `.tar` file (`docker save`) for client presentations without internet or cloud database access.

#### 📈 The Architecture Progression Lifecycle

| Phase | Architecture | Strategic Objective |
| :--- | :--- | :--- |
| **Phase 1: Rapid Prototyping & Speed Checks** | 📦 **Single Container** | Zero setup friction, maximum developer velocity. |
| **Phase 2: CI/CD Automation & PR Reviews** | 📦 **Single Container** | Sub-second pipeline startup, low CI runner cost. |
| **Phase 3: High-Scale Production SaaS** | 🏗️ **Multi-Container (Compose / K8s)** | Decoupled scaling, process restart isolation, dedicated caching. |
| **Phase 4: Enterprise System Integration** | 🐬 **Host DB Bridge (Track 3)** | Connect modern microservices to native corporate databases. |

---

## 🖥️ Interactive Presentation & Workbench Tools

Open these files in any modern web browser for immediate interactive training:

### 1. 🎨 [Visual Masterclass Slide Deck (`docker_explained.html`)](./docker_explained.html)
* **27 Interactive Slides** covering:
  * Linux Namespaces, Cgroups, and Host Kernel sharing
  * Virtual Machines vs Containers
  * Layer Caching mechanics and Build Engine internals
  * The 3 Storage Types: Bind Mounts, Named Volumes, Anonymous Volumes
  * Container Networking and Virtual Bridge DNS
  * `Dockerfile` vs `docker-compose.yml` (`compose.yaml`) & `.yml` vs `.yaml` conventions
  * **Process Lifecycle & Resilience**: The Single-Container Multi-Process Failure Trap vs Compose Auto-Recovery
  * `npm install` vs `npm ci` in CI/CD pipelines
  * **Module 11 (Enterprise Hardening)**: Non-root execution (UID 1001), `docker buildx` cross-compilation, and OOM Killer Exit Code 137 governance.
* **Navigation**: Use keyboard Left/Right Arrow keys, or click the Table of Contents drawer.

### 2. ⚡ [Interactive Implementation Runbook (`manual-exe.html`)](./manual-exe.html)
* **Standard Operating Procedure (SOP)**: Designed to be opened side-by-side with VS Code during live coding.
* **1-Click Clean Code Copying**: Strips comments on copy so developers can paste pure code directly into terminal or editors while reading architectural rationale on screen.
* **10 Step Checkpoints**: Real-time completion progress tracking with live endpoint tests.

### 3. 🖼️ [Visual Presentation Slides Deck (`imgs.md`)](./imgs.md)
* **7 Comprehensive Architecture Slides**:
  * The 4 Core Pillars of Docker Architecture (Dockerfile, Image, Registry, Container)
  * The Packaging Principle: Application Code + Stack Dependencies
  * Multi-Environment Promotion Pipeline (DEV ➔ SIT ➔ UAT ➔ PILOT ➔ PROD)
  * Build & Push CI/CD Lifecycle Flow
  * Host OS, Docker Engine, and Container Virtualization Mechanics
* **Built-in Speaker Notes**: Word-for-word talking points to explain each slide to your team in under 60 seconds.

---

## 🛡️ Enterprise Production Standards Enforced

1. **Non-Root Execution (SOC 2, CIS Benchmark 4.1 & Kubernetes `runAsNonRoot` Compliance)**
   * Avoids running containers as default `root (UID 0)`.
   * Enforces **numeric UID/GID context (`USER 1001:1001`)** rather than string names (`USER appuser`) so Kubernetes admission controllers and OCI runtimes verify non-root compliance directly from image manifests without inspecting `/etc/passwd`.
   * **Multi-Distribution Syntax Standard**:
     * **Alpine (BusyBox)**: `RUN addgroup -g 1001 -S appgroup && adduser -S -u 1001 -G appgroup appuser`
     * **Ubuntu / Debian**: `RUN groupadd -g 1001 appgroup && useradd -r -u 1001 -g appgroup appuser`
     * **RedHat / Rocky**: `RUN groupadd -g 1001 appgroup && useradd -r -u 1001 -g appgroup appuser`
   * Safely pre-provisions write permissions for runtime disks (e.g. SQLite `/data` via `chown -R 1001:1001 /data`).
   * **⏱️ Quick Team Talking Points & Decision Matrix**:
     | Question | Practical Answer to Tell Your Team |
     |---|---|
     | **What does it do?** | Drops root permissions so our Node.js app runs as an unprivileged user (`UID 1001:1001`). |
     | **Why is it necessary?** | If our web app or an npm dependency gets compromised, the attacker is locked in restricted user space and cannot touch host system files or kernel boundaries. |
     | **Is it mandatory?** | **Optional** on local developer laptops (Docker runs fine without it). **Mandatory** for production deployments and CI/CD pipelines (automated scanners will block root images). |
     | **When is it used?** | Placed at the very bottom of the production runtime stage in your Dockerfile, right before `CMD`. |

2. **Cross-Architecture Multi-Platform Builds (`docker buildx`)**
   * Eliminates the `exec format error` crash between Apple Silicon (`ARM64`) laptops and Cloud (`AMD64 / x86_64`) servers.
   * Compiles OCI Multi-Platform Manifest Lists using QEMU emulation.

3. **Resource Governance & Graceful Termination (OOM 137 & SIGTERM)**
   * Enforces CPU and memory limits (`memory: 512M`) to protect the host machine against the **Linux OOM Killer (Exit Code 137)**.
   * Node/Express intercepts `SIGTERM` with `stop_grace_period: 15s` to drain active client HTTP connections, finish ongoing database writes, and close connection pools before container termination.

4. **Cryptographic Layer Caching**
   * Copies `package*.json` before application source code to ensure dependency installation layers are cached across routine code edits.

---

## 🚀 Quick Execution Cheatsheet

### Option A: Running the All-In-One Single Container
```bash
cd 01-single-container

# Build the unified image
docker build -t taskflow-single .

# Run with persistent volume (Port 5000 on host)
docker run -d -p 5000:4000 -v taskflow_data:/data --name taskflow_app taskflow-single

# Access in browser
# http://localhost:5000
```

### Option B: Running the Multi-Container Microservices Stack
```bash
cd 02-multi-container

# Launch all 4 services with live hot reloading
docker compose up --build

# Access in browser
# Frontend: http://localhost:3000
# REST API: http://localhost:4000/api/tasks
# Healthcheck: http://localhost:4000/api/health
```

### Option C: Running the Host Database Bridge Stack
```bash
cd 03-host-database-mysql

# Run the host bridge container (connects to host MySQL via host.docker.internal:3306)
docker compose up --build -d

# Access in browser
# Frontend UI: http://localhost:3001
# Backend API: http://localhost:4001/api/health
```

### Option D: Automated CI/CD Continuous Deployment (with Watchtower)
```bash
cd 04-cicd-automation

# Copy credentials template (only needed for host DB bridge or custom secrets)
cp .env.example .env

# Launch single-container, microservices, or host-db deployment:
docker compose -f docker-compose.single-deploy.yml up -d
# OR
docker compose -f docker-compose.multi-deploy.yml up -d
# OR
docker compose -f docker-compose.host-db-deploy.yml up -d

# View automated update logs
docker logs -f taskflow_watchtower
```

---

## 📖 Deep-Dive Reference Guides

* **[Automated CI/CD & Continuous Deployment Guide](./docs/ci-cd-automation.md)** — GitHub Actions, GHCR packages, and Watchtower auto-deployments.
* **[Comprehensive Docker Masterclass](./docs/docker-masterclass.md)** — Architectural principles, container lifecycles, and debugging cheat sheets.
* **[15 Production Docker Patterns](./docs/docker-pattern-library.md)** — Battle-tested recipes including Multi-Stage builds, Nginx SPAs, and Redis caching.
* **[TaskFlow Implementation Walkthrough](./docs/taskflow-walkthrough.md)** — Complete step-by-step creation notes from scratch.

---

## 📄 License
This repository is released under the **MIT License** — free for educational, commercial, and enterprise training use.
