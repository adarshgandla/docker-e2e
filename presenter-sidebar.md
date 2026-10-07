# 🎙️ Presenter Sidebar: 20% Screen Glance-and-Execute Cheatsheet

> **Designed specifically for a side-by-side split screen view (80% VS Code / 20% Sidebar).**  
> Open this file in VS Code and press `Ctrl + K, V` to open the preview in the right pane. Glance over to know instantly what to type, what to say, and what to verify.

---

## ⏱️ Master Demo Timeline

* **00-03 min**: [Act 1: Docker Core Primitives](#-act-1-docker-core-primitives)
* **03-08 min**: [Act 2: Track 1 Single Container](#-act-2-track-1-single-container-monolith)
* **08-14 min**: [Act 3: Track 2 Microservices Mesh](#-act-3-track-2-microservices-mesh)
* **14-19 min**: [Act 4: Track 3 Host MySQL Bridge](#-act-4-track-3-host-mysql-bridge)
* **19-24 min**: [Act 5: Track 4 CI/CD & Security](#-act-5-track-4-cicd-automation--security)

---

## 🚀 ACT 1: Docker Core Primitives

### Step 1.1: The 4 Pillars
* 🎙️ **Say:** *"Dockerfile is the recipe, Image is the frozen cake, Registry is the warehouse, Container is the running cake."*
* 💻 **Run:**
```bash
docker images
```
* 👁️ **Verify:** Local image list displays.

---

### Step 1.2: Pull an Image
* 🎙️ **Say:** *"Pull downloads the immutable image layers without starting anything."*
* 💻 **Run:**
```bash
docker pull nginx
```
* 👁️ **Verify:** Hash layers download successfully.

---

### Step 1.3: Run Foreground vs Detached
* 🎙️ **Say:** *"Normal `docker run` locks your terminal. Adding `-d` runs it in the background as a daemon and gives back your shell."*
* 💻 **Run:**
```bash
docker run -d -p 8080:80 --name demo-web nginx
```
* 👁️ **Verify:** Container ID hash printed; shell remains free.

---

### Step 1.4: Verify & Inspect Logs
* 🎙️ **Say:** *"In detached mode, we use `docker ps` to verify it's alive, and `docker logs` to peek inside."*
* 💻 **Run:**
```bash
docker ps
docker logs demo-web
```
* 👁️ **Verify:** Status is `Up`, port mapping shows `0.0.0.0:8080->80/tcp`. Test in browser: `http://localhost:8080`.

---

### Step 1.5: Teardown & Cleanup
* 🎙️ **Say:** *"Containers are temporary. Stop sends SIGTERM, rm deletes, and prune wipes unused cache."*
* 💻 **Run:**
```bash
docker stop demo-web
docker rm demo-web
docker system prune -a -f
```
* 👁️ **Verify:** `demo-web` removed, disk space reclaimed.

---

## 📦 ACT 2: Track 1 Single Container Monolith

### Step 2.1: Navigate & Explain Architecture
* 🎙️ **Say:** *"Track 1 is an all-in-one monolith. Multi-stage build compiles React into Vite dist, then Alpine Express serves API and static files with SQLite volume."*
* 💻 **Run:**
```bash
cd 01-single-container
```

---

### Step 2.2: Build the Monolith
* 🎙️ **Say:** *"Notice stage 1 builds the frontend, stage 2 copies the static dist and drops privileges to user 1001."*
* 💻 **Run:**
```bash
docker build -t taskflow-single:1.2.0 .
```
* 👁️ **Verify:** Multi-stage build succeeds; final image size is ~180MB.

---

### Step 2.3: Run with Volume Persistence
* 🎙️ **Say:** *"Host port 5000 routes to internal 4000. Volume `taskflow_data` ensures tasks persist even if container is destroyed."*
* 💻 **Run:**
```bash
docker run -d -p 5000:4000 -v taskflow_data:/data --name taskflow_app taskflow-single:1.2.0
```
* 👁️ **Verify:**
  * Open: `http://localhost:5000`
  * Add 2 sample tasks in UI.
  * Check health: `http://localhost:5000/api/health`

---

### Step 2.4: Demonstrate Data Persistence
* 🎙️ **Say:** *"Watch this: I delete the container completely. But when I recreate it, the tasks are still there because of the named volume!"*
* 💻 **Run:**
```bash
docker rm -f taskflow_app
docker run -d -p 5000:4000 -v taskflow_data:/data --name taskflow_app taskflow-single:1.2.0
```
* 👁️ **Verify:** Refresh `http://localhost:5000` — tasks are still present!

---

## 🏗️ ACT 3: Track 2 Microservices Mesh

### Step 3.1: Navigate & Explain Transition
* 🎙️ **Say:** *"In production, we don't type long `docker run` commands with 10 flags. We declare services, networks, and volumes in `docker-compose.yml`."*
* 💻 **Run:**
```bash
cd ../02-multi-container
```

---

### Step 3.2: Spin Up Full Mesh
* 🎙️ **Say:** *"With one single command, Compose spins up 4 independent microservices: React UI, Express API, PostgreSQL, and Redis cache."*
* 💻 **Run:**
```bash
docker compose up -d --build
```
* 👁️ **Verify:** 4 containers created: `frontend`, `backend`, `postgres`, `redis`.

---

### Step 3.3: Show Internal DNS & Service Discovery
* 🎙️ **Say:** *"Express connects to Postgres using host `postgres` and Redis using host `redis`. No hardcoded IPs! Docker's embedded DNS resolves container names automatically."*
* 💻 **Run:**
```bash
docker compose ps
docker compose logs -f backend
```
* 👁️ **Verify:**
  * UI: `http://localhost:3000`
  * API: `http://localhost:4000/api/health`
  * Logs show: `Database connected` & `Redis cache ready`.

---

### Step 3.4: Teardown
* 🎙️ **Say:** *"One command stops and tears down the entire network cleanly."*
* 💻 **Run:**
```bash
docker compose down
```

---

## 🐬 ACT 4: Track 3 Host MySQL Bridge

### Step 4.1: The Real-World Problem
* 🎙️ **Say:** *"Many companies have a massive MySQL database already running on the physical host or corporate server. How can containerized microservices talk to it? Through `host.docker.internal`!"*
* 💻 **Run:**
```bash
cd ../03-host-database-mysql
```

---

### Step 4.2: Explain Symmetrical Decoupled Design
* 🎙️ **Say:** *"Look at the Dockerfiles: backend and frontend are 100% identical to Track 2! The ONLY difference is in `docker-compose.yml` where DB_HOST points to `host.docker.internal:3306`."*

---

### Step 4.3: Start the Hybrid Stack
* 💻 **Run:**
```bash
docker compose up -d --build
```
* 👁️ **Verify:**
  * UI: `http://localhost:3001` (displays diagnostic host MySQL banner)
  * API: `http://localhost:4001/api/health`

---

### Step 4.4: Teardown
* 💻 **Run:**
```bash
docker compose down
```

---

## ⚙️ ACT 5: Track 4 CI/CD Automation & Security

### Step 5.1: The Promotion Ladder
* 🎙️ **Say:** *"Code is packaged once in CI and promoted: DEV ➔ SIT ➔ UAT ➔ PILOT ➔ PROD. The container image NEVER changes; only the `.env` database connection changes."*
* 💻 **Run:**
```bash
cd ../04-cicd-automation
```

---

### Step 5.2: The Non-Root Security Talking Point (20s)
* 🎙️ **Question to anticipate:** *"Why do our Dockerfiles have `USER 1001:1001`?"*
* 🎙️ **Say:** *"By default, Docker runs as root. If our web app gets compromised, an attacker could exploit container escapes (like runc CVE-2019-5736) to take over the host cloud server. Dropping to UID 1001 locks them in an unprivileged sandbox and satisfies SOC 2 / CIS compliance."*

---

### Step 5.3: Watchtower Auto-Continuous Deployment
* 🎙️ **Say:** *"Watchtower monitors our GitHub Container Registry. As soon as a developer merges code and GitHub Actions pushes a new image tag, Watchtower restarts the container with zero manual intervention."*
* 💻 **Show:** `.github/workflows/docker-ci-cd.yml` and `docker-compose.single-deploy.yml`.

---

## 🎯 Emergency Recovery Cheatsheet

| Issue | Quick Fix Command |
|:---|:---|
| **Port Collision (e.g. 5000 busy)** | `docker ps` ➔ `docker stop <id>` or change host port `5001:4000` |
| **Old containers blocking names** | `docker rm -f $(docker ps -aq)` |
| **Out of disk space** | `docker system prune -a -f` |
| **Container exited immediately** | `docker logs <container-id>` |
| **Want to enter running container** | `docker exec -it <container-id> sh` |
