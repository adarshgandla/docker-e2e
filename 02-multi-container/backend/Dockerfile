# ==============================================================================
# 🐳 MULTI-STAGE DOCKERFILE: Express Backend API
# ==============================================================================
# This Dockerfile demonstrates modern production best practices:
# 1. Multi-stage build pattern (separate development and production targets)
# 2. Docker layer caching optimization (package*.json copied before source code)
# 3. Security: Non-root user execution (never run app as root)
# 4. Lean production image footprint (node:20-alpine base image ~120MB)
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: BASE LAYER
# ------------------------------------------------------------------------------
# Shared foundation containing the Node.js runtime and dependencies.
# Using Alpine Linux (3.20) keeps the base image under 50MB.
# ------------------------------------------------------------------------------
FROM node:20-alpine3.20 AS base

# Set container working directory. All subsequent commands execute here.
WORKDIR /app

# 🔑 CRITICAL LAYER CACHING RULE:
# Copy ONLY dependency manifests first. Docker calculates the cryptographic hash
# of package*.json. As long as dependencies haven't changed, Docker reuses the
# cached 'RUN npm install' layer. Editing server.js will NEVER re-download packages!
COPY package*.json ./

# Install application dependencies inside the container
RUN npm install

# ------------------------------------------------------------------------------
# STAGE 2: DEVELOPMENT TARGET (Hot Reloading via Bind Mounts)
# ------------------------------------------------------------------------------
# Inherits from 'base'. Used by Docker Compose during local feature development.
# Code is mounted dynamically from host; nodemon restarts server on file save.
# ------------------------------------------------------------------------------
FROM base AS development

# Declare development environment
ENV NODE_ENV=development

# Copy initial source code (fallback if no bind mount is attached)
COPY . .

# Document the network port this container listens on (Express PORT 4000)
EXPOSE 4000

# Start server in watch mode using nodemon
CMD ["npm", "run", "dev"]

# ------------------------------------------------------------------------------
# STAGE 3: PRODUCTION TARGET (Hardened & Minimized)
# ------------------------------------------------------------------------------
# Built for production deployment (AWS ECS, Kubernetes, DigitalOcean).
# Security Hardening: Never run containers as root (UID 0)!
# ------------------------------------------------------------------------------
FROM node:20-alpine3.20 AS production

WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-root user (UID 1001) instead of root (UID 0)
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nodejs

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies (skips nodemon)
RUN npm install --omit=dev

# Copy app code with non-root ownership
COPY --chown=1001:1001 . .

# Switch to non-root user
USER 1001:1001

EXPOSE 4000

# Launch server with direct node binary (PID 1 receives SIGTERM signals directly)
CMD ["node", "src/server.js"]
