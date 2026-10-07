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

## 🚀 Hands-On Live Walkthrough: From Editor Edit to Automated Deployment

This step-by-step tutorial walks new users and learners through the entire continuous deployment loop in real time:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               THE LIVE DEMO LOOP                                       │
│                                                                                        │
│   [1. VS Code Edit] ──> [2. Git Push main] ──> [3. GitHub Actions CI] ──> [4. GHCR]    │
│                                                                               │        │
│   [6. Live Browser F5] <── [5. Running Container Replaced] <── [Watchtower Polls] ◄───┘│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 0: Free Up Port 5000 (If Running Track 1)
If you previously ran Track 1 on port 5000, stop it so the production container can bind to the port:
```bash
docker stop taskflow-single-app
```

### Step 1: Start the Production Stack with Watchtower
Launch the single-container production deployment:
```bash
cd 04-cicd-automation
docker compose -f docker-compose.single-deploy.yml up -d
```
* **Verify in browser**: Open `http://localhost:5000` to see the currently running application.

### Step 2: Stream Watchtower Logs in a Terminal
In a split terminal window, watch Watchtower monitor GitHub Container Registry in real time:
```bash
docker logs -f taskflow_watchtower_single
```

### Step 3: Make a Code Edit in Your Editor
Open `01-single-container/frontend/src/App.jsx` in VS Code and modify a visible UI element (e.g., around line 45):
```jsx
// Change this line:
<h1>TaskFlow</h1>

// To:
<h1>TaskFlow 🚀 [v1.2.1 Live Auto-Deploy Demo]</h1>
```
Save the file.

### Step 4: Commit and Push to Git (`main`)
Push your change to the repository `main` branch to trigger the CI/CD pipeline:
```bash
git add 01-single-container/frontend/src/App.jsx
git commit -m "feat(ui): update title for live auto-deploy demo"
git push origin dev
git checkout main
git merge dev
git push origin main
git checkout dev
```

### Step 5: Observe GitHub Actions Building
Open your repository's GitHub Actions page in your browser:
* **Workflow**: `🐳 Docker CI/CD — Build, Test & Auto-Deploy`
* **Job**: `📦 Build & Publish Single Container`
* GitHub Actions compiles the Vite frontend, packages the Alpine runtime, and pushes the new image tag `:latest` to `ghcr.io`.

### Step 6: Watchtower Detects and Updates the Container Automatically
Watch your terminal from Step 2. Within 30 seconds of the GitHub Action completing, Watchtower detects the new image digest:
```text
Found new ghcr.io/adarshgandla/docker-e2e-single:latest image
Stopping /taskflow_prod_single (SIGTERM)...
Creating /taskflow_prod_single with new image...
Removing old image...
```

Refresh your browser at `http://localhost:5000` (`F5`):
**Your new code is live without ever touching the server or running manual `docker` commands!**

---

### 🎙️ The 20-Second Takeaway for Your Team
> *"Notice what just happened:*  
> *1. We never touched the production server.*  
> *2. We never typed `docker build` or `docker pull` manually.*  
> *3. We never restarted the container by hand.*  
> *All we did was push code to GitHub. CI built an immutable Docker image, and Watchtower updated our production container with zero downtime and zero human intervention."*
