# 🚀 End-to-End Automated Docker CI/CD & Continuous Deployment Guide

> **Architecture Goal:** Push code to GitHub `main` ➔ GitHub Actions automatically builds and publishes Docker images to GitHub Container Registry (`ghcr.io`) ➔ Running containers automatically detect the new image, pull it, and restart with zero downtime or data loss!

---

## 🏛️ System Architecture Flow

```text
  Developer / Team
         │
         ▼ (git push origin main)
┌────────────────────────────────────────────────────────────────────────┐
│ 🐙 GITHUB ACTIONS (CI PIPELINE)                                         │
│                                                                        │
│   1. Triggered on: push to `main` or release tag `v*.*.*`               │
│   2. Buildx compiles multi-stage Docker images with layer caching      │
│   3. Pushes tagged images to GitHub Container Registry:                │
│      - ghcr.io/adarshgandla/docker-e2e-single:latest                   │
│      - ghcr.io/adarshgandla/docker-e2e-api:latest                      │
│      - ghcr.io/adarshgandla/docker-e2e-frontend:latest                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ 📦 Published Image (ghcr.io)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 🖥️ PRODUCTION HOST / SERVER / LOCAL ENGINE (CD ENGINE)                  │
│                                                                        │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │ 🤖 Watchtower Daemon (containrrr/watchtower)                   │    │
│   │    - Polls GHCR every 60 seconds                              │    │
│   │    - Detects new image SHA / digest                           │    │
│   │    - Pulls latest image automatically                         │    │
│   │    - Gracefully stops old container                           │    │
│   │    - Starts new container with identical volumes & ports!     │    │
│   └───────────────────────────────┬───────────────────────────────┘    │
│                                   │                                    │
│                                   ▼ (Auto-Updated Live)                │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │ 🐳 Running Application (taskflow_prod_app)                    │    │
│   │    - Port: http://localhost:5000                              │    │
│   │    - Volume: taskflow_prod_data (100% Data Preserved)         │    │
│   └───────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How It Works (Step-by-Step)

### 1. 🐙 Continuous Integration (`.github/workflows/docker-ci-cd.yml`)
When you merge or push code to the `main` branch:
1. GitHub Actions boots an `ubuntu-latest` virtual environment.
2. It sets up **Docker Buildx** with GitHub Actions layer caching (`type=gha`), reducing build times from minutes to seconds.
3. It authenticates with **GitHub Container Registry (GHCR)** using the native `secrets.GITHUB_TOKEN` (zero external configuration required).
4. It builds:
   - **Track 1**: `ghcr.io/adarshgandla/docker-e2e-single:latest` (and `:sha-<hash>`)
   - **Track 2 Backend**: `ghcr.io/adarshgandla/docker-e2e-api:latest`
   - **Track 2 Frontend**: `ghcr.io/adarshgandla/docker-e2e-frontend:latest`

### 2. 🤖 Continuous Deployment (`04-cicd-automation/`)
To have your server or machine run the latest build automatically:
1. Run the deployment stack once:
   ```bash
   cd 04-cicd-automation
   docker compose -f docker-compose.single-deploy.yml up -d
   ```
2. Two containers start:
   - `taskflow_prod_app`: Runs the production app on port `5000`.
   - `taskflow_watchtower`: Runs the Watchtower daemon monitoring the Docker socket (`/var/run/docker.sock`).
3. Whenever GitHub Actions pushes an updated image, Watchtower:
   - Detects the new image digest on GHCR.
   - Pulls the new layers.
   - Performs a zero-downtime rolling restart of `taskflow_prod_app`.
   - Cleans up the old image to save disk space (`WATCHTOWER_CLEANUP=true`).

---

## 🚀 How to Run the Automated Deployment Locally

```bash
cd 04-cicd-automation

# 1. Pull the published image and start with Watchtower
docker compose -f docker-compose.single-deploy.yml up -d

# 2. View running containers
docker ps

# 3. View Watchtower live monitoring logs
docker logs -f taskflow_watchtower
```

---

## 🔒 Security Best Practices Implemented

1. **Least-Privilege Token Permissions**:
   The workflow explicitly scopes permissions to:
   ```yaml
   permissions:
     contents: read
     packages: write
   ```
   It cannot alter repository settings, pull requests, or secrets.

2. **Pull Request Safety**:
   Pull requests triggered by contributors build the Docker images to verify syntax and tests, but **never push images to the registry** (`push: false`). Only verified merges to `main` publish images.

3. **Persistent Volume Protection**:
   Because SQLite data lives on named volume `taskflow_prod_data:/data`, container updates never erase database records or user tasks.

4. **Non-Root Runtime Hardening (`USER 1001:1001`)**:
   All published container images enforce numeric UID `1001:1001` to pass enterprise SOC 2 and CIS Docker Benchmark audits.

   | Question | Practical Answer to Tell Your Team |
   |---|---|
   | **What does it do?** | Drops root permissions so our Node.js app runs as an unprivileged user (`UID 1001:1001`). |
   | **Why is it necessary?** | If our web app or an npm dependency gets compromised, the attacker is locked in restricted user space and cannot touch host system files or kernel boundaries. |
   | **Is it mandatory?** | **Optional** on local developer laptops (Docker runs fine without it). **Mandatory** for production deployments and CI/CD pipelines (automated scanners will block root images). |
   | **When is it used?** | Placed at the very bottom of the production runtime stage in your Dockerfile, right before `CMD`. |
