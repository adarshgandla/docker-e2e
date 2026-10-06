# ==============================================================================
# 🐳 MULTI-STAGE DOCKERFILE: React Frontend (Vite Dev Server + Nginx Production)
# ==============================================================================
# This Dockerfile demonstrates an essential production pattern:
# - Development: Runs Node.js Vite dev server with Hot Module Replacement (HMR)
# - Production: Uses Node.js strictly as a compiler, then discards Node completely!
#   The compiled static files (dist/) are transferred into an ultra-lean 25MB Nginx image.
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: BASE LAYER
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Cache package dependencies before copying application code
COPY package*.json ./
RUN npm install

# ------------------------------------------------------------------------------
# STAGE 2: DEVELOPMENT TARGET (Vite Dev Server with HMR)
# ------------------------------------------------------------------------------
# Used by docker-compose during local frontend development.
# --host 0.0.0.0 binds Vite to all container interfaces so the host machine can access it.
# ------------------------------------------------------------------------------
FROM base AS development

COPY . .

EXPOSE 3000
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]

# ------------------------------------------------------------------------------
# STAGE 3: BUILD TARGET (Compiler Sandbox)
# ------------------------------------------------------------------------------
# Compiles raw JSX, CSS, and assets into static, minified HTML/JS/CSS bundles in /app/dist.
# ------------------------------------------------------------------------------
FROM base AS build

COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 4: PRODUCTION TARGET (Ultra-Lean Nginx Web Server)
# ------------------------------------------------------------------------------
# Why Nginx instead of Node.js for production React?
# 1. Size: Alpine Nginx is ~25MB vs ~400MB for a Node runtime image.
# 2. Performance: Nginx is written in C and serves static files at 10x higher concurrency.
# 3. Security: No Node runtime vulnerabilities; purely a static web server.
# ------------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy custom Nginx configuration with SPA try_files fallback (prevents 404 on refresh)
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

# Multi-stage copy: grab ONLY the compiled /dist folder from the build stage!
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Run Nginx in foreground mode (daemon off) so the container stays alive as PID 1
CMD ["nginx", "-g", "daemon off;"]