# 🐳 Docker Masterclass — Zero to Production

> A complete, command-free teaching guide. Read this end-to-end before touching a terminal.

---

## Chapter 1 — WHY Does Docker Exist?

### The Problem Before Docker

Imagine this real scenario:

> A developer builds an app on their Windows laptop.  
> It works perfectly on their machine.  
> They send it to a teammate on Ubuntu.  
> The teammate says: **"It doesn't work."**

Why? Because:
- Different **OS versions** behave differently
- Different **Python/Node/Java versions** installed
- Different **environment variables** set
- Different **library versions** (e.g., one has `openssl 1.1`, the other has `openssl 3.0`)
- Different **file paths** (`C:\Users\...` vs `/home/...`)

This is the famous **"It works on my machine"** problem.

### The Old Solution — Virtual Machines (VMs)

Before Docker, teams used **Virtual Machines**:
- A VM pretends to be a whole computer inside your computer
- Has its own OS, CPU emulation, RAM allocation
- You can say "run this on Ubuntu 20.04" and it always will

But VMs are **heavy**:
- A VM file can be **10–40 GB**
- Starting a VM takes **1–3 minutes**
- Running 10 VMs needs **10× the RAM**

### Docker's Solution — Containers

Docker uses **containers**:
- A container is like a VM — isolated, consistent environment
- But it **shares your OS kernel** instead of emulating a whole OS
- Container starts in **milliseconds** (not minutes)
- Container is **megabytes** (not gigabytes)
- You can run **100 containers** on one laptop

```
┌──────────────────────────────────────────────────────┐
│                  YOUR COMPUTER                        │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ Container 1 │  │ Container 2│  │ Container 3│     │
│  │  (Python   │  │  (Node.js  │  │ (PostgreSQL│     │
│  │   App)     │  │   API)     │  │  Database) │     │
│  └────────────┘  └────────────┘  └────────────┘     │
│                                                       │
│              Shared OS Kernel (Windows/Linux/Mac)     │
└──────────────────────────────────────────────────────┘
```

Each container is **fully isolated** — they can't see each other's files, processes, or network unless you explicitly allow it.

---

## Chapter 2 — WHAT Is a Docker Image?

### The Blueprint Analogy

Think of it like this:

| Real World | Docker |
|------------|--------|
| Blueprint/Recipe | **Docker Image** |
| Actual house/cake | **Docker Container** |
| Cookbook | **Dockerfile** |
| Library of recipes | **Docker Hub / Registry** |

A **Docker Image** is:
- A **frozen snapshot** of an environment
- Includes the OS base, all libraries, your app code, config
- **Read-only** — you never change an image directly
- Can be **shared** — you push it to a registry, others pull it

A **Docker Container** is:
- A **running instance** of an image
- Like running a program from an installer
- You can start 5 containers from 1 image — they all start identical
- Containers have a **writable layer** — changes inside don't affect the image

### Image Layers — The Onion Model

Images are built in **layers**. Each layer is a step that adds something on top:

```
┌─────────────────────────────────┐  ← Layer 4: Copy your app code
├─────────────────────────────────┤  ← Layer 3: Install npm packages
├─────────────────────────────────┤  ← Layer 2: Install Node.js 20
├─────────────────────────────────┤  ← Layer 1: Base OS (Ubuntu 22.04)
└─────────────────────────────────┘
```

**Why layers matter:**
- Docker **caches** each layer
- If you change your app code (Layer 4), Docker only rebuilds from Layer 4 up
- Layers 1–3 are reused → builds are **fast**
- Layers are **shared** between images → if 10 images use the same Ubuntu base, it's stored only once on disk

---

## Chapter 3 — HOW Are Images Built?

### The Dockerfile

A `Dockerfile` is a plain text file with instructions. It's the "recipe" that tells Docker how to build an image.

Here's a conceptual example for a Node.js app:

```dockerfile
# Start FROM an existing base image (don't build OS from scratch)
FROM node:20-alpine

# Set the working directory INSIDE the container
WORKDIR /app

# COPY the package files first (for layer caching)
COPY package*.json ./

# RUN a command to install dependencies
RUN npm install

# COPY the rest of your application code
COPY . .

# Tell Docker which PORT the app uses (documentation only)
EXPOSE 3000

# The command to RUN when the container starts
CMD ["node", "server.js"]
```

### Dockerfile Instructions Explained

| Instruction | What it does |
|-------------|-------------|
| `FROM` | Start from an existing image (your foundation) |
| `WORKDIR` | Set current directory inside container (like `cd`) |
| `COPY` | Copy files from your computer into the container |
| `RUN` | Execute a command during the **build** phase |
| `ENV` | Set environment variables |
| `EXPOSE` | Document which port the app listens on |
| `CMD` | The default command to run when container **starts** |
| `ENTRYPOINT` | The main process of the container (harder to override) |

### Where Do Base Images Come From?

When you write `FROM node:20-alpine`, Docker looks for that image in a **Registry**.

The default registry is **Docker Hub** (`hub.docker.com`).

Official images on Docker Hub:
- `node` — Node.js runtime
- `python` — Python interpreter
- `postgres` — PostgreSQL database
- `nginx` — Web server / reverse proxy
- `redis` — In-memory cache
- `ubuntu`, `alpine`, `debian` — Base operating systems

`alpine` is a **very tiny** Linux variant (~5 MB). Most images have an `-alpine` variant to keep things small.

---

## Chapter 4 — The Build Process, Step by Step

When you tell Docker to build an image from a Dockerfile:

```
Step 1: Docker reads your Dockerfile line by line
         ↓
Step 2: For each instruction, Docker creates a new LAYER
         ↓
Step 3: Each layer is identified by a HASH (fingerprint)
         ↓
Step 4: If a layer's hash matches one in cache → SKIP (reuse)
         ↓
Step 5: If no cache match → EXECUTE the instruction
         ↓
Step 6: Final image = stack of all layers, given a NAME:TAG
```

### Naming Convention

Images follow this pattern:

```
[registry/][username/]name:tag

Examples:
  node:20-alpine          ← official Node.js, version 20, alpine variant
  postgres:16             ← official PostgreSQL version 16
  myapp:latest            ← your app, "latest" tag
  myapp:v1.2.3            ← your app, specific version
  ghcr.io/myorg/api:prod  ← from GitHub Container Registry, production tag
```

`latest` is just a convention — it means "most recent stable". It's **not** automatic; someone has to manually tag it.

---

## Chapter 5 — HOW to Access Docker Locally

### What's Installed on Your Machine

When you install **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux), you get:

```
┌─────────────────────────────────────────────────────┐
│                  Docker Desktop                      │
│                                                       │
│  ┌──────────────────┐   ┌────────────────────────┐  │
│  │  Docker Daemon   │   │    Docker CLI (client) │  │
│  │  (background     │   │    (the `docker`        │  │
│  │   service that   │   │     command you type)   │  │
│  │   does the work) │   └────────────────────────┘  │
│  └──────────────────┘                               │
│                                                       │
│  ┌──────────────────┐                               │
│  │   Docker Hub     │  ← Remote image registry      │
│  │   (cloud)        │                               │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

- **Docker Daemon** (`dockerd`) — runs in background, manages containers/images
- **Docker CLI** — the `docker` command you type in terminal; talks to the daemon
- **Docker Desktop** — GUI wrapper + daemon + CLI bundled for Windows/Mac

### How Local Access Works

When you run a container, Docker creates a **virtual network**:

```
Your Browser (localhost:3000)
        ↓
Port Mapping: 3000 → container's 3000
        ↓
Container running your app
```

This is called **port mapping** or **port publishing**.  
The container's internal port is exposed on your machine's `localhost`.

So if your app runs on port 3000 inside the container, and you map it to port 3000 on your host:
→ You open `http://localhost:3000` in your browser and it works.

### Docker's Network Types

| Network | What it means |
|---------|---------------|
| `bridge` (default) | Containers get their own IP; they can talk to each other by name |
| `host` | Container shares your machine's network (no isolation) |
| `none` | No network at all |
| Custom named network | You create a named network; containers in it can find each other by container name |

---

## Chapter 6 — WHERE Are Images Stored?

### Locally (on your machine)

When you build or pull an image, it's stored in Docker's **local image store**:
- On Windows: inside the Docker Desktop VM (a hidden virtual disk)
- Layers are stored separately and deduplicated

You can see all local images with `docker images`.

### Remotely (Registries)

A **Registry** is like GitHub but for Docker images.

| Registry | URL | Use |
|----------|-----|-----|
| Docker Hub | `hub.docker.com` | Default, public images |
| GitHub Container Registry | `ghcr.io` | Tied to GitHub repos |
| AWS ECR | `*.dkr.ecr.*.amazonaws.com` | For AWS deployments |
| Google Artifact Registry | `*.pkg.dev` | For GCP deployments |
| Azure Container Registry | `*.azurecr.io` | For Azure deployments |
| Self-hosted | Your own server | Private, on-premise |

**Workflow:**
```
Build image locally → Tag it → Push to registry → 
Others (or servers) pull from registry → Run as container
```

---

## Chapter 7 — Docker Compose (Managing Multiple Containers)

Real apps are never just one container. A typical web app has:
- **Frontend** (React/Next.js)
- **Backend API** (Node/Python/Go)
- **Database** (PostgreSQL)
- **Cache** (Redis)
- **Reverse Proxy** (Nginx)

Running and connecting all these manually is tedious. **Docker Compose** solves this.

### What is docker-compose.yml?

A single YAML file that describes your entire stack:

```yaml
version: '3.9'

services:
  # The database
  db:
    image: postgres:16-alpine          # Use official postgres image
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data   # Persist data
    ports:
      - "5432:5432"                    # host:container

  # The backend API
  api:
    build: ./backend                   # Build from ./backend/Dockerfile
    environment:
      DATABASE_URL: postgres://myuser:mypassword@db:5432/myapp
    ports:
      - "4000:4000"
    depends_on:
      - db                             # Start db BEFORE api

  # The frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:                       # Named volume for DB persistence
```

With this one file, `docker compose up` starts all 4 services, in the right order, connected to each other.

### Why Dockerfile vs. Why docker-compose.yml (or .yaml)?

A common point of confusion for beginners is understanding why we need both a `Dockerfile` and a `docker-compose.yml`:

| Aspect | `Dockerfile` | `docker-compose.yml` / `compose.yaml` |
| :--- | :--- | :--- |
| **Primary Job** | Builds a **single image** | Runs and connects **multiple containers** |
| **Input / Output** | Source code ➔ Docker Image | Docker Images ➔ Running Application Stack |
| **Focus** | Internal OS packages, dependencies, build steps | External networking, port bindings, volumes, environment |
| **Command** | `docker build` | `docker compose up` |

> **What is the difference between `.yml` and `.yaml`?**  
> There is **zero functional difference**; both represent standard YAML format. Historically, early operating systems (like MS-DOS and Windows 95) enforced three-letter file extensions (like `.htm` instead of `.html`, and `.yml` instead of `.yaml`). The official specification uses `.yaml`. Modern Docker Compose v2 seamlessly recognizes `compose.yaml`, `compose.yml`, `docker-compose.yaml`, and `docker-compose.yml`.

### The "One Process per Container" Principle & The Silent Crash Trap

Docker was architected from day one around the Unix philosophy: **"One process per container"**.

#### The Problem: What happens if you run multiple processes in ONE container?
If you write a shell script (`start.sh`) that starts PostgreSQL in the background and Node.js in the foreground:
1. **Docker watches ONLY the foreground process (PID 1)**.
2. If the background process (PostgreSQL) crashes, **PID 1 is still alive and running**.
3. **Docker has no idea the database died!**
4. Docker **does NOT restart the container automatically** (even if `--restart always` is enabled), because from Docker's perspective, the container never exited.
5. The container becomes a **silent zombie**: it shows as `Up`, but user requests fail with database connection errors.

#### The Solution: Decoupled Containers (Docker Compose)
When each process runs in its own dedicated container:
1. That process **is** PID 1 of its container.
2. If the process crashes or encounters an Out-Of-Memory (OOM) error, the container **immediately exits**.
3. Docker detects the exit code and applies your restart policy (`restart: unless-stopped` or `restart: on-failure`).
4. **Docker automatically restarts that specific failed container within seconds!**
5. All sibling containers (the database, Redis cache, and reverse proxy) continue running completely undisturbed.

### How Containers Talk to Each Other

In Docker Compose, containers can **resolve each other by service name**:
- The `api` service connects to the database using the hostname `db`
- Not `localhost`, not an IP address — just `db`

This is because Docker Compose creates a **shared network** for all services automatically.

---

## Chapter 8 — Volumes (Making Data Survive Container Restarts)

### The Problem

Containers are **ephemeral** — if you delete a container, all its data is gone.

For a database, this is catastrophic. You'd lose all your data every time you restart.

### The Solution — Volumes

A **volume** is a storage location that lives **outside** the container:

```
Container (db)              Host Machine / Docker Volume
┌──────────────┐            ┌────────────────────────┐
│ /var/lib/    │ ←mapped to→│  postgres_data volume  │
│ postgresql/  │            │  (survives restarts)   │
│ data/        │            └────────────────────────┘
└──────────────┘
```

Types of volumes:

| Type | Definition | Use case |
|------|-----------|----------|
| **Named volume** | `postgres_data:/var/lib/postgresql/data` | Databases, persistent data |
| **Bind mount** | `./code:/app` | Development (live code reload) |
| **tmpfs** | In-memory only | Secrets, temp files |

**Bind mounts** are especially useful in development — you mount your local source folder into the container. When you edit files on your host, the container sees the changes instantly → hot reload works.

---

## Chapter 9 — Environment Variables & Secrets

### Why Not Hardcode Credentials?

Never put passwords, API keys, or database URLs directly in your `Dockerfile` or code.

Instead, use **environment variables**:

```yaml
# docker-compose.yml
services:
  api:
    environment:
      DB_PASSWORD: ${DB_PASSWORD}   # Read from .env file or shell
```

```bash
# .env file (NEVER commit this to git)
DB_PASSWORD=supersecret
JWT_SECRET=myverylongsecretkey
```

Docker Compose automatically reads `.env` file.  
Add `.env` to `.gitignore` immediately.

---

## Chapter 10 — The Complete Mental Model

```
                        YOU WRITE
                           │
                    ┌──────▼──────┐
                    │ Dockerfile  │  ← Recipe
                    └──────┬──────┘
                           │ docker build
                    ┌──────▼──────┐
                    │  Image      │  ← Frozen snapshot
                    └──────┬──────┘
              ┌────────────┼────────────┐
              │            │            │
       docker push    docker run   docker run
              │            │            │
       ┌──────▼──────┐  ┌──▼──┐    ┌──▼──┐
       │  Registry   │  │ C1  │    │ C2  │  ← Running containers
       │ (Docker Hub)│  └─────┘    └─────┘    (from same image)
       └─────────────┘
              │
        docker pull (on server/teammate's machine)
              │
       ┌──────▼──────┐
       │  Container  │  ← Running on production server
       └─────────────┘
```

---

## Chapter 11 — Enterprise Application Environments & Image Packaging

### How Docker Packages Applications
Instead of installing complex programming language runtimes, web servers, and database connectors directly on the host operating system, Docker packages your application code together with its dependencies into a single immutable artifact:

<p align="center">
  <img src="./images/docker-image-packaging.png" alt="Docker Image Packaging Architecture" width="600"/>
</p>

* **Code + Runtime**: Packages application source code alongside the required runtime stack (e.g. Node.js, Angular, Java, Tomcat, MySQL drivers).
* **Target Delivery**: The generated image runs identically inside local development containers, test environments, or cloud Kubernetes clusters.

---

### The 5 Enterprise Environments (SDLC Promotion Pipeline)

In professional software development, containers are promoted across five structured environments:

<p align="center">
  <img src="./images/application-environments.png" alt="Application Environments: DEV, SIT, UAT, PILOT, PROD" width="650"/>
</p>

| Environment | Target Audience | Primary Focus | Docker Strategy |
|:---|:---|:---|:---|
| **1) DEV** | Developers | Feature development & integration testing | Run locally with Docker Compose bind mounts (`./src:/app`) and hot-reloading. |
| **2) SIT** | Testing / QA Team | System Integration Testing across services | CI builds candidate image tags (`:sha-...`) and runs end-to-end integration test suites. |
| **3) UAT** | Client / Business Users | User Acceptance Testing & sign-off | Client validates business flows against stable containerized release candidate. |
| **4) PILOT** | SRE / DevOps / Security | Pre-Production dress rehearsal | Exact production replica for load testing, failover checks, and SOC 2 security compliance. |
| **5) PROD** | Live End Users | High-availability production workloads | Highly available container clusters with zero-downtime rolling updates and monitoring. |

---

### Why Images Are the Foundation of the SDLC

1. **The Golden Rule ("Build Once, Run Everywhere")**:
   - The image is built **once** in CI (`ghcr.io/repo/app:v1.2.0`).
   - That **exact same image** is promoted through DEV ➔ SIT ➔ UAT ➔ PILOT ➔ PROD.
   - Only the `.env` configuration file changes (pointing to DEV DB, SIT DB, or PROD DB).
2. **Reproducibility**:
   - Same image → same dependencies → same behavior.
   - Completely eliminates the "works on my machine" failure mode.
3. **Isolation & Security**:
   - Each service (DB, API, Frontend) runs in isolated namespaces.
   - Non-root `USER 1001:1001` protects the host kernel across all environments.
4. **Fast Deployment & Instant Rollback**:
   - Servers simply `pull` and `run` pre-built images with no compile delays.
   - Rollback is as simple as switching the container tag to the previous image.

---

## Chapter 12 — Our Project Setup (What We'll Build)

Since your workspace at `docker-masterclass` is fresh, we'll design the full Docker setup for a real project.

### Suggested Project Structure

```
docker-masterclass/
├── docker-compose.yml          ← Orchestrates all services
├── docker-compose.dev.yml      ← Dev overrides (hot reload, debug)
├── .env.example                ← Template (commit this)
├── .env                        ← Real secrets (gitignore this)
├── .gitignore
│
├── backend/
│   ├── Dockerfile              ← How to build the API image
│   ├── Dockerfile.dev          ← Dev variant (with dev tools)
│   ├── src/
│   └── package.json
│
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── src/
│   └── package.json
│
└── nginx/
    ├── nginx.conf              ← Reverse proxy config
    └── Dockerfile
```

### The Flow When You Run It

```
Your Browser
     │
     ▼ localhost:80
  [Nginx Container]  ← Reverse proxy
     │          │
     ▼          ▼
[Frontend]   [API Container]  ← localhost:4000/api/*
                  │
                  ▼
          [PostgreSQL Container]
                  │
                  ▼
          [Redis Container]  ← Session/cache
```

---

## Quick Reference Glossary

| Term | Simple Definition |
|------|-------------------|
| **Image** | Frozen blueprint of an environment |
| **Container** | Running instance of an image |
| **Dockerfile** | Instructions to build an image |
| **Registry** | Remote storage for images (like Docker Hub) |
| **Layer** | One step/change in an image |
| **Volume** | Persistent storage outside a container |
| **Bind mount** | Link a local folder into a container |
| **Port mapping** | Connect container port to host port (`3000:3000`) |
| **Docker Compose** | Tool to run multiple containers from one YAML file |
| **Service** | One container definition in docker-compose.yml |
| **Network** | Virtual network connecting containers |
| `.env` | File with environment variables (never commit) |

---

> **Next Step:** Explore the three architectural paradigms in `01-single-container/`, `02-multi-container/`, and `03-host-database-mysql/`, with hands-on walkthroughs in `docs/taskflow-walkthrough.md`.
