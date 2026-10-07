# ==============================================================================
# 🐳 TRACK 3 DOCKERFILE: HOST DATABASE BRIDGE (EXPRESS + REACT + HOST MYSQL)
# ==============================================================================
# This multi-stage Dockerfile builds a secure, non-root application container
# engineered specifically to bridge to host-native databases via host.docker.internal.
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: FRONTEND BUILDER (REACT + VITE)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Cache package manifests
COPY frontend/package*.json ./
RUN npm install

# Build static SPA assets
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: PRODUCTION RUNTIME (NODE.JS + HOST DB CONNECTOR)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# 🛡️ NON-ROOT SECURITY (SOC 2 / CIS Benchmark):
# Never run container processes as root. Create dedicated unprivileged user 1001.
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# Install production dependencies only (mysql2, express, cors)
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY --chown=1001:1001 src/ ./src/

# Copy compiled frontend SPA from Stage 1 into static public directory
COPY --from=frontend-builder --chown=1001:1001 /app/frontend/dist ./public/

# 🔒 DROP ROOT PRIVILEGES (SOC 2 & Kubernetes runAsNonRoot Compliance):
# Using numeric UID:GID (1001:1001) guarantees Kubernetes admission controllers
# pass static manifest inspection without needing to resolve names against /etc/passwd.
USER 1001:1001

# Expose Track 3 port (4001 to avoid colliding with 4000 and 5000)
EXPOSE 4001

# Start server directly
CMD ["node", "src/server.js"]
