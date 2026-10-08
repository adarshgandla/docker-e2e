# ==============================================================================
# 🐳 TRACK 3: FRONTEND DOCKERFILE (REACT + VITE)
# ==============================================================================
# Mirrors the exact same architecture pattern as Track 2 Frontend!
# Development: Runs Vite dev server with Hot Module Replacement (HMR).
# ==============================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Cache frontend dependencies
COPY package*.json ./
RUN npm install

# ------------------------------------------------------------------------------
# DEVELOPMENT STAGE (Vite Dev Server with HMR)
# ------------------------------------------------------------------------------
FROM base AS development

COPY . .

EXPOSE 3000

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]

# ------------------------------------------------------------------------------
# PRODUCTION STAGE (Compiler Sandbox)
# ------------------------------------------------------------------------------
FROM base AS build

COPY . .
RUN npm run build

# Lean Nginx runner with API reverse proxy
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

