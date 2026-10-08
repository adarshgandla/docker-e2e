# ==============================================================================
# 🐳 TRACK 3: BACKEND DOCKERFILE (EXPRESS + HOST MYSQL BRIDGE)
# ==============================================================================
# Mirrors the exact same architecture pattern as Track 2 Backend!
# No new concepts to learn here: standard Node.js runtime with non-root security.
# ==============================================================================

FROM node:20-alpine3.20 AS base

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm install

# ------------------------------------------------------------------------------
# DEVELOPMENT STAGE (Used with live hot-reloading)
# ------------------------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 4001
CMD ["npm", "run", "dev"]

# ------------------------------------------------------------------------------
# PRODUCTION STAGE (Hardened, Non-Root UID 1001)
# ------------------------------------------------------------------------------
FROM node:20-alpine3.20 AS production

WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-root user (UID 1001) instead of root (UID 0)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -u 1001 -G appgroup appuser

COPY package*.json ./
RUN npm install --omit=dev

COPY --chown=1001:1001 . .

# Switch to non-root user
USER 1001:1001

EXPOSE 4001

CMD ["node", "src/server.js"]
