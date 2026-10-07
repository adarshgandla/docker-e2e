# 🚀 Track 4: Automated CI/CD & Continuous Deployment (Watchtower)

Welcome to **Track 4**, the DevOps Capstone module of the Docker Masterclass.

In Tracks 1, 2, and 3, you learned how to run Docker containers **locally on your machine**. In Track 4, you learn how enterprise engineering teams automate the entire pipeline:
> **Push to GitHub `main` ➔ GitHub Actions builds and publishes to GitHub Container Registry (`ghcr.io`) ➔ Watchtower automatically detects the new image and updates running containers with zero downtime!**

---

## 🏛️ The Three Production Deployment Flavors

Track 4 provides continuous deployment configurations for every architecture:

| Deployment Option | Compose File | Architecture | Best Used For |
| :--- | :--- | :--- | :--- |
| **Option A (Monolith)** | `docker-compose.single-deploy.yml` | Unified image + SQLite + Watchtower | MVPs, Internal Portals, IoT edge nodes |
| **Option B (Microservices)** | `docker-compose.multi-deploy.yml` | API + React Nginx + Postgres + Redis + Watchtower | Production SaaS with horizontal scaling |
| **Option C (Hybrid Host DB)** | `docker-compose.host-db-deploy.yml` | App + Native Host MySQL (`host.docker.internal`) + Watchtower | Existing corporate databases, bare-metal DBs |

---

## 🔐 Secrets Management & Dynamic Environment Variables

In Track 4, **zero passwords are baked into Docker images**, and **zero passwords are committed to Git**.

### How Environment Variables Work Across Different Servers:
1. Copy the template to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the credentials for **your specific server or machine**:
   ```bash
   MYSQL_HOST=host.docker.internal
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_private_password
   MYSQL_DATABASE=simple_app
   ```
3. Docker Compose reads your local `.env` and passes variables into the container at runtime.
4. When Watchtower restarts the container after a GitHub update, **it preserves your local `.env` variables automatically!**

---

## 🚀 How to Run Track 4 on Any Server or Laptop

### Option A: Running Single-Container Continuous Deployment
```bash
docker compose -f docker-compose.single-deploy.yml up -d
```

### Option B: Running Multi-Container Microservices Continuous Deployment
```bash
docker compose -f docker-compose.multi-deploy.yml up -d
```

### Option C: Running Host-Database Bridge Continuous Deployment
```bash
# Ensure .env exists with your local MySQL password
docker compose -f docker-compose.host-db-deploy.yml up -d
```

---

## 🤖 Observing Automated Updates with Watchtower

Watchtower checks GitHub Container Registry every 60 seconds:
```bash
docker logs -f taskflow_watchtower_multi
```

When you merge a PR or push a commit to `main`:
1. GitHub Actions finishes building the new image.
2. Watchtower log displays:
   ```text
   Found new ghcr.io/adarshgandla/docker-e2e-api:latest image
   Stopping /taskflow_prod_api (SIGTERM)...
   Creating /taskflow_prod_api with new image...
   Removing old image...
   ```
3. Your application is live with the new code—with zero manual commands!
