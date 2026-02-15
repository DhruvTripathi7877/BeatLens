# ═══════════════════════════════════════════════════════════════
# BeatLens Frontend — Multi-stage Docker Build
# ═══════════════════════════════════════════════════════════════
# Works for both Docker Compose (defaults) and Railway (env vars).
#
#   Docker Compose:  PORT=80, BACKEND_URL=http://backend:8080
#   Railway:         PORT=$PORT, BACKEND_URL=http://<name>.railway.internal:<port>
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

# ── Stage 2: Serve with Nginx (Railway-compatible — no VOLUME) ──
FROM alpine:3.21

RUN apk add --no-cache nginx gettext && \
    mkdir -p /run/nginx /var/cache/nginx /var/log/nginx

# Defaults work for Docker Compose; Railway overrides via env vars
ENV PORT=80
ENV BACKEND_URL=http://backend:8080

# Copy nginx template (envsubst fills PORT and BACKEND_URL at startup)
RUN rm -f /etc/nginx/http.d/default.conf
COPY nginx.conf.template /etc/nginx/http.d/default.conf.template

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE ${PORT}

# envsubst replaces ONLY $PORT and $BACKEND_URL, leaving nginx
# variables like $host, $remote_addr, $uri untouched.
CMD ["sh", "-c", "envsubst '$PORT $BACKEND_URL' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf && nginx -g 'daemon off;'"]
