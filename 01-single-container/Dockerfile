# ==============================================================================
# 🐳 ALL-IN-ONE MULTI-STAGE DOCKERFILE (SINGLE CONTAINER ARCHITECTURE)
# ==============================================================================
# This Dockerfile compiles both the frontend and backend into ONE single image:
#
# STAGE 1: Compiles React (Vite) into minified static assets in /app/frontend/dist
# STAGE 2: Prepares Express Node.js runtime, mounts /data for SQLite persistence,
#          copies the static frontend into /app/public, and drops root privileges.
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: FRONTEND COMPILATION SANDBOX
# ------------------------------------------------------------------------------
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
ENV NODE_ENV=production
ENV DB_DIR=/data

# 🛡️ SECURITY AUDIT HARDENING (SOC 2 / CIS Benchmark):
# Create a dedicated, unprivileged system user and group (UID 1001)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# 💾 PERSISTENCE DIRECTORY:
# Create /data directory for SQLite and grant ownership to the unprivileged user
RUN mkdir -p /data && chown -R appuser:appgroup /data

# Install backend production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend server source code
COPY --chown=appuser:appgroup src/ ./src/

# 📦 MULTI-STAGE COPY:
# Copy the compiled static React frontend from STAGE 1 directly into /app/public
COPY --from=frontend-builder --chown=appuser:appgroup /app/frontend/dist ./public/

# Declare /data as a Docker Volume so SQLite files persist across container restarts
VOLUME /data

# 🔒 DROP ROOT PRIVILEGES: Switch execution to unprivileged user
USER appuser

# Expose single unified web + API port
EXPOSE 4000

# Start server directly (PID 1 handles SIGTERM / SIGINT for graceful shutdown)
CMD ["node", "src/server.js"]
