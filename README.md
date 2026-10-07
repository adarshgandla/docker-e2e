# 🐳 The Production Docker Masterclass & Architecture Curriculum

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./VERSION)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/node.js-v20-green.svg?logo=node.js)](https://nodejs.org/)

> **A production-ready, hands-on Docker learning repository for software developers, DevOps practitioners, and platform engineers.**
> Covers everything from single-container monolithic deployment to multi-container microservices orchestration, host database bridging, enterprise security hardening, and cross-platform compilation.

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
│   ├── src/                         # Express API connecting to host.docker.internal:3306
│   ├── frontend/                    # React 18 UI with host DB diagnostic banner
│   ├── scripts/                     # setup-host-mysql.sql (permissions & schema)
│   ├── Dockerfile                   # Non-root multi-stage production build
│   ├── docker-compose.yml           # extra_hosts bridge & port 4001 configuration
│   └── README.md                    # Deep-dive host.docker.internal & MySQL permissions guide
│
├── 🎨 docker_explained.html        # 27-SLIDE VISUAL MASTERCLASS DECK (Interactive Presentation)
├── ⚡ manual-exe.html               # INTERACTIVE PRODUCTION RUNBOOK (SOP Checklist)
│
├── 📜 LICENSE                      # MIT Open Source License (Adarsh Gandla)
├── 🏷️ VERSION                      # Release version tracker (1.0.0)
│
└── 📚 docs/                         # REFERENCE MANUALS & SPECIFICATIONS
    ├── docker-masterclass.md        # Comprehensive technical manual
    ├── docker-pattern-library.md    # 15 battle-tested production Docker patterns
    └── taskflow-walkthrough.md      # End-to-end implementation walkthrough
```

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

---

## 🛡️ Enterprise Production Standards Enforced

1. **Non-Root Execution (SOC 2 & CIS Benchmark 4.1 Compliance)**
   * Avoids running containers as default `root (UID 0)`.
   * Creates isolated unprivileged system user `nodejs / appuser (UID 1001)` to eliminate container breakout risks upon Remote Code Execution (RCE).

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

# Run with persistent volume
docker run -d -p 4000:4000 -v taskflow_data:/data --name taskflow_app taskflow-single

# Access in browser
# http://localhost:4000
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

---

## 📖 Deep-Dive Reference Guides

* **[Comprehensive Docker Masterclass](./docs/docker-masterclass.md)** — Architectural principles, container lifecycles, and debugging cheat sheets.
* **[15 Production Docker Patterns](./docs/docker-pattern-library.md)** — Battle-tested recipes including Multi-Stage builds, Nginx SPAs, and Redis caching.
* **[TaskFlow Implementation Walkthrough](./docs/taskflow-walkthrough.md)** — Complete step-by-step creation notes from scratch.

---

## 📄 License
This repository is released under the **MIT License** — free for educational, commercial, and enterprise training use.
