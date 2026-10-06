# 🐳 Docker Pattern Library — Stack-Agnostic Master Guide

> You work with all stacks. So learn the PATTERNS. The pattern is always the same —
> only the language commands change.

---

## The Universal Dockerfile Pattern (Works for Everything)

Every Dockerfile, regardless of language, follows this exact skeleton:

```
1. FROM      ← Pick your base (language runtime)
2. WORKDIR   ← Set where you'll work inside the container
3. COPY      ← Copy dependency manifest first (for caching)
4. RUN       ← Install dependencies
5. COPY      ← Copy the rest of your source code
6. EXPOSE    ← Document the port
7. CMD       ← How to start the app
```

That's it. The words change per language. The structure never does.

---

## Chapter 1 — Dockerfile Patterns Per Language

### 🟢 Node.js / Express / Fastify

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy manifest first (cache trick — see Chapter 2)
COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
```

**Why `npm ci` and not `npm install`?**  
`npm ci` uses the lockfile exactly — reproducible, no accidental upgrades.

---

### 🟡 Python / FastAPI / Django / Flask

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Copy dependency list first
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Why `--host 0.0.0.0`?**  
By default, servers bind to `127.0.0.1` (loopback — only accessible inside container).  
`0.0.0.0` means "accept connections from outside the container" — required for Docker.

---

### 🔵 Go

```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o server ./cmd/main.go

# ------- Final stage (tiny image) -------
FROM alpine:3.19

WORKDIR /app
COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
```

Go compiles to a single binary — the final image can be tiny (no runtime needed).  
This uses a **multi-stage build** (explained in Chapter 2).

---

### ☕ Java / Spring Boot

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline

COPY src src
RUN ./mvnw package -DskipTests

# ------- Final stage -------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

---

### ⚛️ React (Create React App / Vite)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build       # Produces /app/dist or /app/build

# ------- Final stage: serve with Nginx -------
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

React apps compile to **static files** (HTML/CSS/JS). You don't need Node.js at runtime — Nginx serves the files.

---

### 🔺 Next.js

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## Chapter 2 — Multi-Stage Builds (The Most Important Pattern)

### The Problem Without Multi-Stage

If you build a Go app in one stage:
```
golang:1.22 image    =  ~800 MB (Go compiler + everything)
Your actual binary   =  ~10 MB
```
You'd ship an 800 MB image to production just to run a 10 MB binary.

### Multi-Stage Solution

```dockerfile
# Stage 1: Builder — has all tools needed to compile
FROM golang:1.22-alpine AS builder
# ... compile your code ...
RUN go build -o myapp .

# Stage 2: Runner — just the minimum to RUN the result
FROM alpine:3.19          # Only ~5 MB
COPY --from=builder /app/myapp .   # Copy ONLY the binary
CMD ["./myapp"]
```

**Result:**
| Approach | Image Size |
|----------|-----------|
| Single stage (Go) | ~800 MB |
| Multi-stage (Go) | ~12 MB |
| Single stage (Node) | ~900 MB |
| Multi-stage (Node→Nginx) | ~25 MB |

### The `AS name` Label

Every stage gets a name with `AS`:
```dockerfile
FROM node:20 AS builder     ← named "builder"
FROM nginx AS runner        ← named "runner"

COPY --from=builder ...     ← reference by name
```

You can have **unlimited stages**. Only the last stage becomes the final image.

---

## Chapter 3 — Development vs Production Dockerfiles

This is critical. Dev and Prod have different needs:

| Need | Development | Production |
|------|------------|-----------|
| Speed | Hot reload | Optimized build |
| Size | Don't care | As small as possible |
| Debug tools | Yes | No |
| Source code | Mounted (bind mount) | Copied in |
| Dev dependencies | Yes | No |
| Environment | `.env` file | Secrets manager |

### Development Dockerfile (Dockerfile.dev)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install ALL deps including dev
COPY package*.json ./
RUN npm install            # Not npm ci — faster iteration

# Don't copy source (we'll use bind mount)
EXPOSE 4000

# Use nodemon for hot reload
CMD ["npx", "nodemon", "src/server.js"]
```

### Production Dockerfile (Dockerfile)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .

EXPOSE 4000

# No nodemon — direct node
CMD ["node", "src/server.js"]
```

---

## Chapter 4 — The Universal docker-compose.yml

This covers **every common service** you'll ever need.  
Pick what applies to your project, delete the rest.

```yaml
version: '3.9'

# ─────────────────────────────────────────────────────
# NETWORKS — containers in the same network find each
# other by service name (not IP address)
# ─────────────────────────────────────────────────────
networks:
  app-network:
    driver: bridge

# ─────────────────────────────────────────────────────
# VOLUMES — data that survives container restarts
# ─────────────────────────────────────────────────────
volumes:
  postgres_data:
  mysql_data:
  mongo_data:
  redis_data:
  minio_data:

services:

  # ─── POSTGRESQL ───────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: project_postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"           # Access from host (e.g., TablePlus, DBeaver)
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:              # Other services wait for DB to be ready
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── MYSQL ────────────────────────────────────────
  mysql:
    image: mysql:8.0
    container_name: project_mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network

  # ─── MONGODB ──────────────────────────────────────
  mongo:
    image: mongo:7
    container_name: project_mongo
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
      MONGO_INITDB_DATABASE: ${DB_NAME}
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network

  # ─── REDIS ────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: project_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

  # ─── BACKEND API ──────────────────────────────────
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev          # Use dev variant
    container_name: project_api
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 4000
    ports:
      - "4000:4000"
      - "9229:9229"           # Node.js debugger port
    volumes:
      - ./backend/src:/app/src           # Bind mount for hot reload
      - /app/node_modules                # Anonymous vol: keep container's node_modules
    depends_on:
      postgres:
        condition: service_healthy       # Wait for healthcheck to pass
      redis:
        condition: service_started
    networks:
      - app-network
    restart: unless-stopped

  # ─── FRONTEND ─────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: project_frontend
    environment:
      VITE_API_URL: http://localhost:4000    # Or NEXT_PUBLIC_API_URL for Next.js
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src              # Hot reload
      - /app/node_modules
    depends_on:
      - api
    networks:
      - app-network

  # ─── NGINX (Reverse Proxy) ────────────────────────
  nginx:
    image: nginx:alpine
    container_name: project_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api
      - frontend
    networks:
      - app-network

  # ─── MAILHOG (Local Email Testing) ───────────────
  # Catches all outgoing emails — shows them in a UI
  mailhog:
    image: mailhog/mailhog
    container_name: project_mailhog
    ports:
      - "1025:1025"          # SMTP — your app sends to this port
      - "8025:8025"          # Web UI — open in browser to see emails
    networks:
      - app-network

  # ─── MINIO (Local S3-compatible Storage) ─────────
  # Use this when your app uploads files to S3
  minio:
    image: minio/minio
    container_name: project_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    ports:
      - "9000:9000"          # S3 API endpoint
      - "9001:9001"          # MinIO web console
    volumes:
      - minio_data:/data
    networks:
      - app-network

  # ─── PGADMIN (Postgres GUI) ───────────────────────
  pgadmin:
    image: dpage/pgadmin4
    container_name: project_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"            # Open http://localhost:5050
    depends_on:
      - postgres
    networks:
      - app-network
```

---

## Chapter 5 — The .env Pattern

### .env.example (commit this — it's the template)
```bash
# Database
DB_USER=myuser
DB_PASSWORD=
DB_ROOT_PASSWORD=
DB_NAME=myapp

# Redis
REDIS_PASSWORD=

# Auth
JWT_SECRET=

# Storage
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=

# App
NODE_ENV=development
PORT=4000
```

### .env (never commit — real secrets)
```bash
DB_USER=myuser
DB_PASSWORD=strongpassword123
DB_ROOT_PASSWORD=rootpassword456
DB_NAME=myapp

REDIS_PASSWORD=redispass789

JWT_SECRET=a_very_long_random_secret_string_here

MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

NODE_ENV=development
PORT=4000
```

### .gitignore entries
```
.env
.env.local
.env.production
```

---

## Chapter 6 — The Bind Mount "Anonymous Volume" Trick

This pattern solves a common problem in development:

```yaml
volumes:
  - ./backend/src:/app/src      # ← Your source code from host
  - /app/node_modules           # ← Keep container's node_modules (anonymous)
```

**Why the second line?**

Without it:
1. Container has `/app/node_modules` (installed for Linux)
2. You mount `./backend` (your Windows folder) over `/app`
3. Your Windows `node_modules` **overwrites** the Linux one
4. Native modules break (wrong OS binaries)

With the anonymous volume:
1. Docker mounts `./backend/src` into `/app/src` only
2. `/app/node_modules` is a separate named anonymous volume
3. Container's Linux `node_modules` is preserved
4. Everything works

---

## Chapter 7 — Health Checks

Health checks tell Docker "this container is actually ready, not just running":

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U myuser"]   # Command to check
  interval: 10s       # Check every 10 seconds
  timeout: 5s         # Fail if no response in 5 seconds
  retries: 5          # Mark unhealthy after 5 failures
  start_period: 30s   # Grace period at startup
```

Used with `depends_on`:
```yaml
api:
  depends_on:
    postgres:
      condition: service_healthy    # Wait for postgres healthcheck to PASS
```

Without this, your API might start before Postgres is ready → connection errors.

---

## Chapter 8 — How to Choose a Base Image

**Decision Tree:**

```
Do you need a full language runtime in production?
│
├── YES (Node, Python, Ruby)
│     ├── Use slim variant:  python:3.12-slim   (~100 MB)
│     └── Or Alpine:         python:3.12-alpine (~50 MB)
│         ⚠️  Alpine uses musl libc — some C packages break
│
├── NO (Go, Rust — compile to binary)
│     └── Use alpine:3.19  (~5 MB) or scratch (0 MB)
│
└── Serving static files only (React build, HTML)
      └── nginx:alpine  (~25 MB)
```

**Size comparison:**
| Base Image | Compressed Size |
|-----------|----------------|
| `ubuntu:22.04` | ~30 MB |
| `debian:bookworm-slim` | ~30 MB |
| `python:3.12` | ~330 MB |
| `python:3.12-slim` | ~45 MB |
| `python:3.12-alpine` | ~18 MB |
| `node:20` | ~340 MB |
| `node:20-alpine` | ~40 MB |
| `alpine:3.19` | ~3 MB |

---

## Chapter 9 — Nginx as Reverse Proxy

When you have both a frontend and an API, Nginx sits in front:

```
Browser → localhost:80 → Nginx → decides where to route:
  /api/*    → Backend container (port 4000)
  /*        → Frontend container (port 3000)
```

### nginx.conf for this setup

```nginx
server {
    listen 80;

    # API requests → backend
    location /api/ {
        proxy_pass http://api:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Everything else → frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Notice: `http://api:4000` — using the **service name** `api`, not `localhost`.  
Containers talk to each other by service name inside Docker's network.

---

## Chapter 10 — The Complete Project Structure (Universal)

```
your-project/
│
├── .env                          ← Real secrets (gitignored)
├── .env.example                  ← Template (committed)
├── .gitignore
├── docker-compose.yml            ← Production compose
├── docker-compose.dev.yml        ← Development overrides
├── docker-compose.test.yml       ← Test environment
│
├── backend/                      ← Your API (any language)
│   ├── Dockerfile                ← Production image
│   ├── Dockerfile.dev            ← Development image
│   └── src/
│
├── frontend/                     ← Your UI (any framework)
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
│
├── nginx/
│   └── nginx.conf
│
└── scripts/
    ├── init-db.sql               ← Database seed data
    └── setup.sh                  ← First-time setup script
```

### docker-compose.dev.yml (overrides)

You don't duplicate the whole compose file for dev.  
You only write the **differences**:

```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  api:
    build:
      dockerfile: Dockerfile.dev    # Override to use dev Dockerfile
    environment:
      NODE_ENV: development
    volumes:
      - ./backend/src:/app/src      # Add bind mount (not in prod)
```

Then run them together: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`

---

## Chapter 11 — Common Docker Mistakes & How to Avoid Them

| Mistake | Problem | Fix |
|---------|---------|-----|
| `COPY . .` before `COPY package.json` | Cache busts on every file change | Always copy dependency file first |
| Hardcoding `localhost` for services | Containers can't reach each other | Use service name: `postgres`, `redis` |
| No `.dockerignore` | Copies `node_modules`, `.git`, `.env` into image | Always create `.dockerignore` |
| Binding to `127.0.0.1` inside container | Not reachable from outside | Always bind to `0.0.0.0` |
| No health checks | API starts before DB is ready | Add `healthcheck` + `depends_on: condition: service_healthy` |
| Running as `root` inside container | Security risk | Add `USER node` or `USER nobody` |
| No `.env.example` | Team doesn't know what vars are needed | Always commit `.env.example` |

### .dockerignore (Always Create This)

```
node_modules
.git
.env
*.log
dist
build
.next
__pycache__
*.pyc
.pytest_cache
.DS_Store
Thumbs.db
```

This file tells Docker what NOT to include when copying files into the image.  
Without it, `COPY . .` might copy gigabytes of `node_modules` into the image.

---

## Your Decision Map for Any New Project

```
Starting a new project?
│
├── 1. What language?
│     → Pick your base image (FROM)
│
├── 2. Need a database?
│     PostgreSQL → relational, complex queries
│     MongoDB   → documents, flexible schema
│     MySQL     → relational, legacy projects
│
├── 3. Need caching/sessions?
│     → Add Redis
│
├── 4. Need file uploads?
│     → Add MinIO (local S3)
│
├── 5. Need to test emails?
│     → Add Mailhog
│
├── 6. Need a reverse proxy?
│     → Add Nginx
│
└── 7. Create Dockerfiles
      → Dockerfile.dev (for development, hot reload)
      → Dockerfile     (for production, multi-stage)
```

---

> **Next:** Explore the three architectural tracks in `01-single-container/`, `02-multi-container/`, and `03-host-database-mysql/`, and launch the interactive runbook at `manual-exe.html`.
