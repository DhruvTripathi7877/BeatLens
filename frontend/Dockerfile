# ═══════════════════════════════════════════════════════════════
# BeatLens Frontend — Multi-stage Docker Build
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build with Node ──
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build production bundle
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ──
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx runs as non-root by default in the alpine image
CMD ["nginx", "-g", "daemon off;"]
