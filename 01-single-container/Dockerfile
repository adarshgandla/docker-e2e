# ==============================================================================
# 🐳 ALL-IN-ONE MULTI-STAGE DOCKERFILE (SINGLE CONTAINER ARCHITECTURE)
# ==============================================================================
# This Dockerfile compiles both the frontend and backend into ONE single image:
#
# STAGE 1: Compiles React (Vite) into minified static assets in /app/frontend/dist
# STAGE 2: Prepares Express Node.js runtime, mounts /data for SQLite persistence,
#          copies the static frontend into /app/public, and drops root privileges.
# ==============================================================================
# Processes in Single Container Architecture: 1. React Frontend (Vite) -> 2. Express Backend (Node.js) -> 3. SQLite Database (Persistent Volume)
# 🧩 3-in-1 CONSOLIDATION: How 3 separate containers are combined into ONE:
#
# 1. FRONTEND (Normally a separate Nginx container):
#    React (Vite) is compiled in Stage 1 into static HTML/JS/CSS, then copied
#    into Express (/app/public). Express serves the UI directly on port 4000.
#
# 2. BACKEND (Normally a separate Node.js API container):
#    Express runs as the single Node process (CMD node src/server.js) on port 4000,
#    handling both UI file delivery ('4000/') and REST API routes ('4000/api/*').
#
# 3. DATABASE (Normally a separate PostgreSQL / MySQL container):
#    Instead of a dedicated DB server container, embedded SQLite runs inside
#    the Node process, writing to '/data/tasks.db' backed by a persistent Docker volume.
# ==============================================================================
# ------------------------------------------------------------------------------
# STAGE 1: FRONTEND COMPILATION SANDBOX
# ------------------------------------------------------------------------------
# Process 1: React Frontend (Vite) - Compiles static production bundle
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Cache frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and compile static production bundle (Vite -> dist/)
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: PRODUCTION RUNTIME (EXPRESS + SQLITE + STATIC SPA)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app

# Security: Run as non-root user (UID 1001) instead of root (UID 0)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# Process 2: Express (Node.js REST API Server) - Dependencies, source code & static host
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend server source code
COPY --chown=1001:1001 src/ ./src/

# Copy compiled React frontend into public directory (SPA hosted by Express)
COPY --from=frontend-builder --chown=1001:1001 /app/frontend/dist ./public/

# Process 3: SQLite (Embedded Database) - Database directory path and persistent volume mount
# - Inside Container: /data (internal directory where SQLite writes 'tasks.db')
# - Host Physical Path: mapped at runtime via '-v taskflow_data:/data'
# - How to find on Host: run 'docker volume inspect taskflow_data' -> check "Mountpoint"
ENV DB_DIR=/data
# -p refers to parent directory, so SQLite will create /data/tasks.db inside the container --> (Linux will seamlessly create /data, then /data/application, and finally /data/application/user without throwing a "No such file or directory" error).
RUN mkdir -p /data && chown -R 1001:1001 /data
# Above -R 1001:1001 recursively changes ownership of /data to the non-root user, ensuring SQLite can write to it.(Applicable for every newly created User file or directory inside /data, including the SQLite database file itself.)
VOLUME /data

# Switch to non-root user
USER 1001:1001

# Expose single unified web + API port
EXPOSE 4000

# Start server directly (PID 1 handles SIGTERM / SIGINT for graceful shutdown)
CMD ["node", "src/server.js"]