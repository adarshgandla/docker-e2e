# 🐳 Track 3: Host Database Bridge (`host.docker.internal`)

> **Architectural Pattern**: Containerized Application bridging to a **Host-Native MySQL Database** (outside Docker).
> **Stack**: React 18 SPA + Node.js Express API + Native Host MySQL 8.0 on Port 3306.

---

## 🧭 Why This Pattern Matters in Production

In many real-world development and enterprise environments:
1. **Existing Enterprise Databases**: Your organization already has a dedicated database running natively on bare metal, AWS RDS, or a central development server.
2. **Resource Constraints**: Running a heavy database (like MySQL 8 or Oracle) inside Docker can consume significant RAM and CPU.
3. **Local Dev Setup**: Developers frequently have MySQL, PostgreSQL, or MongoDB already installed natively on their Windows/Mac laptops and want their containerized application to talk to it directly.

---

## ⚡ The #1 Docker Trap: The `localhost` Confusion

The most common error developers encounter when connecting to a host database is:

```text
Error: connect ECONNREFUSED 127.0.0.1:3306
```

### Why does this happen?
Inside Docker, every container runs in its own **Network Namespace**.
- When code inside a container connects to `localhost` or `127.0.0.1`, it looks for a MySQL server **inside that container**, NOT on your Windows/Mac host computer!
- Because MySQL is installed on your Windows host and not inside the container, the connection fails immediately.

```text
❌ WRONG (Inside Container):
Container (172.17.0.2) ──▶ localhost:3306 ──▶ [Looks inside container -> ECONNREFUSED!]

✅ CORRECT (Using Bridge):
Container (172.17.0.2) ──▶ host.docker.internal:3306 ──▶ [Routes out to Host Windows MySQL!]
```

---

## 🔑 The Solution: `host.docker.internal`

Docker provides a special internal DNS hostname that resolves to the host machine's internal gateway IP:

### 1. Windows & macOS (Docker Desktop)
Docker Desktop automatically resolves `host.docker.internal` to the host's virtual ethernet gateway IP (e.g., `192.168.65.254` or `172.17.0.1`).

### 2. Linux (Docker Engine)
On native Linux, Docker Engine does not resolve `host.docker.internal` by default. You must configure `extra_hosts` in `docker-compose.yml`:

```yaml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

This directive injects the gateway IP into the container's `/etc/hosts` file, ensuring 100% cross-platform compatibility across Windows, Mac, and Linux!

---

## 🔒 The MySQL Privilege Trap: `root@'localhost'` vs `root@'%'`

Even when `host.docker.internal` resolves correctly, MySQL might reject the connection with:

```text
ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'172.17.0.1' (using password: YES)
```

### Why?
In MySQL, user accounts are tied to a specific host:
- `root@'localhost'` **only** permits connections from the host's local loopback (`127.0.0.1`).
- When a Docker container connects via `host.docker.internal`, the connection enters MySQL from the **Docker Bridge Network IP** (e.g. `172.17.0.1` or `192.168.65.1`), NOT `127.0.0.1`!
- Therefore, MySQL perceives this as a **remote network connection** and rejects `root@'localhost'`.

### The Fix:
Execute [`scripts/setup-host-mysql.sql`](./scripts/setup-host-mysql.sql) in your host MySQL client:

```sql
CREATE DATABASE IF NOT EXISTS `taskflow`;
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON `taskflow`.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

---

## 🚀 Quick Start Guide

### 1. Verify your Host MySQL is listening on port 3306:
Ensure your local MySQL service is running on your host machine.

### 2. Launch Track 3 via Docker Compose:
```bash
cd 03-host-database-mysql
docker compose up -d --build
```

### 3. Open in Browser:
- **React Frontend UI**: [`http://localhost:3001`](http://localhost:3001)
- **API Health Endpoint**: [`http://localhost:4001/api/health`](http://localhost:4001/api/health)
- **Tasks JSON**: [`http://localhost:4001/api/tasks`](http://localhost:4001/api/tasks)

---

## 🔌 Port Allocation Across All Tracks

| Track | Directory | Architecture | Host URL |
| :--- | :--- | :--- | :--- |
| **Track 1** | `01-single-container/` | All-in-One Monolith (SQLite) | `http://localhost:5000` |
| **Track 2** | `02-multi-container/` | Microservices (Postgres + Redis) | `http://localhost:3000` (UI) / `:4000` (API) |
| **Track 3** | `03-host-database-mysql/`| Decoupled Host DB Bridge (Host MySQL) | `http://localhost:3001` (UI) / `:4001` (API) |
| **Track 4** | `04-cicd-automation/` | Continuous Deployment (Watchtower) | `http://localhost:5000` / `:4001` |
