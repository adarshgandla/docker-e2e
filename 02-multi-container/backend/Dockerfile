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

# 🛡️ SECURITY STEP 1: Create an unprivileged system user and group (Alpine Linux)
# - 'addgroup -g 1001 -S nodejs' : Creates system group (-S) with Group ID 1001 (-g) named 'nodejs'
# - '&&'                         : Chains commands into a SINGLE Docker image layer (saves disk space)
# - 'adduser -S -u 1001 ...'     : Creates system user (-S) with User ID 1001 (-u), assigned to group (-G nodejs), named 'nodejs'
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nodejs

# ⚡ LAYER CACHE OPTIMIZATION: Copy dependency manifests first
# - 'package*.json' : Wildcard matches both 'package.json' and 'package-lock.json'
# - './'            : Destination is current container WORKDIR (/app)
# Docker caches this layer: editing server.js later will NEVER re-trigger 'npm install'!
COPY package*.json ./

# 📦 PRODUCTION INSTALL: Install only production runtime dependencies
# - '--omit=dev' : Skips all devDependencies (e.g. nodemon, linters) to keep production image lean
RUN npm install --omit=dev

# 📂 CODE TRANSFER WITH PERMISSIONS:
# - '--chown=1001:1001' : Sets file ownership to UID:GID 1001:1001 so non-root user owns the code
# - First '.'           : Source on host (all files not excluded by .dockerignore)
# - Second '.'          : Destination in container (/app)
# for new user 1002 they will have permissions as well, but the ownership will be 1001:1001. This is important for security and proper file access.
# here group 1001 is the group that the user 1001 belongs to, so any files created by user 1001 will have group ownership of 1001 as well. This allows other users in the same group (like user 1002) to access those files if the permissions allow it.
# if user belong to different group, they will not have access to the files owned by user 1001 unless the permissions are set to allow it. This is a common practice in multi-user environments to ensure that users can only access files that they are supposed to.
# in the same owned group every new user will have auto generated uid and gid as 1002:1001, 1003:1001, 1004:1001, etc. and they will have access to the files owned by user 1001 as long as the permissions allow it.
# Server 2 Env can be set to GID 1002 ,And same UID user from GID 1001 can access both group files as long as the permissions allow it. This allows multi traffic and multi-user access to the same files in a secure way.
COPY --chown=1001:1001 . .

# 🔒 SECURITY STEP 2: Drop root (UID 0) and switch to unprivileged user (UID 1001)
# - Setting up the entire container environment to run as a non-root user is a security best practice
# - Subsequent instructions (CMD) execute as non-root user 1001, preventing container-escape attacks
# - This is a best practice for production containers, as it limits the potential damage if an attacker compromises the application.
USER 1001:1001

EXPOSE 4000

# Launch server with direct node binary (PID 1 receives SIGTERM signals directly)
CMD ["node", "src/server.js"]

