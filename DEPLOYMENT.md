# BeatLens — Deployment Guide

Complete guide covering Docker Compose, live deployment with a public URL, and CI/CD pipeline setup.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1 — Docker Compose (Local & Self-Hosted)](#part-1--docker-compose)
3. [Part 2 — Live Deployment with a URL](#part-2--live-deployment-with-a-url)
   - [Option A: Railway (Recommended)](#option-a-railway-recommended)
   - [Option B: Render](#option-b-render)
   - [Option C: VPS with Docker Compose](#option-c-vps-with-docker-compose)
4. [Part 3 — CI/CD Pipeline (GitHub Actions)](#part-3--cicd-pipeline)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | v2+ | Multi-container orchestration |
| Git | 2.30+ | Version control |
| Node.js | 20+ | Frontend build (local dev) |
| Java | 21 | Backend build (local dev) |

Verify installations:

```bash
docker --version
docker compose version
git --version
```

---

## Part 1 — Docker Compose

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Frontend    │────>│   Backend    │────>│  PostgreSQL   │
│  (Nginx:80) │     │  (Java:8080) │     │    (:5432)    │
│  React SPA  │     │  Spring Boot │     │  Data Volume  │
└─────────────┘     └──────────────┘     └──────────────┘
     /api/* proxy ──────^
```

- **Frontend** — Nginx serves the React SPA and proxies `/api/*` requests to the backend
- **Backend** — Spring Boot processes audio fingerprinting and matching
- **Database** — PostgreSQL stores songs and fingerprints, data persisted via Docker volume

### Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url> BeatLens
cd BeatLens

# 2. Create environment file
cp .env.example .env
# Edit .env and set a strong POSTGRES_PASSWORD for production

# 3. Build and start all services
docker compose up --build

# 4. Open the app
# http://localhost (frontend)
# http://localhost:8080/actuator/health (backend health check)
```

### Step-by-Step

#### Step 1: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your preferred settings:

```env
POSTGRES_DB=beatlens
POSTGRES_USER=beatlens
POSTGRES_PASSWORD=your-secure-password-here

DB_PORT=5432
BACKEND_PORT=8080
FRONTEND_PORT=80

CORS_ORIGINS=http://localhost
```

#### Step 2: Build Images

```bash
# Build all images (first build takes ~3-5 minutes)
docker compose build

# Or build a specific service
docker compose build backend
docker compose build frontend
```

#### Step 3: Start Services

```bash
# Start in foreground (see logs)
docker compose up

# Start in background (detached)
docker compose up -d

# Check status
docker compose ps
```

#### Step 4: Verify

```bash
# Check all containers are running
docker compose ps

# Backend health
curl http://localhost:8080/actuator/health

# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

#### Step 5: Stop & Cleanup

```bash
# Stop services (preserves data)
docker compose down

# Stop and remove data volume (DELETES ALL DATA)
docker compose down -v
```

### Useful Commands

```bash
# Rebuild a single service after code changes
docker compose up --build backend

# View live logs
docker compose logs -f

# Access PostgreSQL CLI
docker compose exec db psql -U beatlens -d beatlens

# Restart a service
docker compose restart backend

# Scale (if needed in future)
docker compose up --scale backend=2
```

---

## Part 2 — Live Deployment with a URL

### Option A: Railway (Recommended)

Railway is the simplest way to deploy BeatLens with a public HTTPS URL. It supports monorepo projects and has a generous free tier.

**Cost**: Free tier includes $5/month in credits (sufficient for hobby use).

#### Step 1: Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account

#### Step 2: Create a New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your BeatLens repository
4. Select the BeatLens repository

#### Step 3: Add PostgreSQL

1. In your Railway project, click **"+ New"**
2. Select **"Database" > "Add PostgreSQL"**
3. Railway provisions a PostgreSQL instance automatically
4. Note the connection variables (available in the Variables tab):
   - `DATABASE_URL`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

#### Step 4: Deploy the Backend

1. In your Railway project, click **"+ New" > "GitHub Repo"**
2. Select the same BeatLens repository
3. In the service **Settings**:
   - Set **Root Directory** to `backend`
   - Set **Builder** to "Dockerfile"
4. In the **Variables** tab, add:

   ```
   SPRING_PROFILES_ACTIVE=docker
   DATABASE_URL=jdbc:postgresql://${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/${{Postgres.PGDATABASE}}
   DATABASE_USERNAME=${{Postgres.PGUSER}}
   DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
   BEATLENS_CORS_ALLOWED_ORIGINS=https://your-frontend.up.railway.app
   ```

5. In **Settings > Networking**, click **"Generate Domain"** to get a public URL

#### Step 5: Deploy the Frontend

1. Click **"+ New" > "GitHub Repo"** again
2. Select the BeatLens repository
3. In the service **Settings**:
   - Set **Root Directory** to `frontend`
   - Set **Builder** to "Dockerfile"
4. In **Settings > Networking**, click **"Generate Domain"**
5. Update the `nginx.conf` proxy target:
   - In Railway, the frontend Nginx needs to know the backend's internal URL
   - Set an environment variable: `BACKEND_URL=http://backend.railway.internal:8080`
   - Or use Railway's private networking with service discovery

#### Step 6: Update CORS

Go back to the backend service Variables and update `BEATLENS_CORS_ALLOWED_ORIGINS` with the actual frontend URL that Railway assigned (e.g., `https://beatlens-frontend-production.up.railway.app`).

#### Step 7: Verify

Visit your frontend URL. You should see the BeatLens UI. Test uploading a song and matching audio.

---

### Option B: Render

Render offers a free tier with automatic HTTPS and GitHub integration.

#### Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account

#### Step 2: Create PostgreSQL Database

1. Click **"New" > "PostgreSQL"**
2. Configure:
   - **Name**: `beatlens-db`
   - **Database**: `beatlens`
   - **User**: `beatlens`
   - **Region**: Choose nearest
   - **Plan**: Free (90-day limit) or Starter ($7/month)
3. Note the **Internal Database URL** after creation

#### Step 3: Deploy Backend as Web Service

1. Click **"New" > "Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `beatlens-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Plan**: Free or Starter
4. Add **Environment Variables**:

   ```
   SPRING_PROFILES_ACTIVE=docker
   DATABASE_URL=<Internal Database URL from Step 2>
   DATABASE_USERNAME=beatlens
   DATABASE_PASSWORD=<password from Step 2>
   BEATLENS_CORS_ALLOWED_ORIGINS=https://beatlens-frontend.onrender.com
   ```

5. Click **"Create Web Service"**

#### Step 4: Deploy Frontend as Static Site

1. Click **"New" > "Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `beatlens-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
4. Add a **Redirect/Rewrite Rule** for SPA:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite
5. Add a rewrite rule for API proxy:
   - Source: `/api/*`
   - Destination: `https://beatlens-backend.onrender.com/api/*`
   - Action: Rewrite

#### Step 5: Verify

Visit `https://beatlens-frontend.onrender.com` to access your app.

---

### Option C: VPS with Docker Compose

Deploy to any VPS provider (DigitalOcean, Linode, Hetzner, AWS EC2) using Docker Compose.

**Cost**: ~$5-12/month for a basic VPS.

#### Step 1: Provision a VPS

1. Create an account on your chosen provider
2. Create a droplet/instance:
   - **OS**: Ubuntu 24.04 LTS
   - **RAM**: 2GB minimum (4GB recommended for fingerprinting)
   - **Storage**: 25GB SSD minimum
3. Note the public IP address

#### Step 2: Install Docker on the VPS

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

#### Step 3: Clone and Configure

```bash
# Clone repository
git clone <your-repo-url> /opt/beatlens
cd /opt/beatlens

# Create environment file
cp .env.example .env

# Edit with production values
nano .env
```

Set production values in `.env`:

```env
POSTGRES_PASSWORD=a-very-strong-random-password
FRONTEND_PORT=80
CORS_ORIGINS=http://YOUR_SERVER_IP
```

#### Step 4: Deploy

```bash
# Build and start
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

#### Step 5: Set Up a Domain (Optional)

1. Purchase a domain (e.g., from Namecheap, Cloudflare)
2. Add an A record pointing to your server IP:
   ```
   Type: A
   Name: beatlens (or @)
   Value: YOUR_SERVER_IP
   ```
3. Update `.env`:
   ```env
   CORS_ORIGINS=https://beatlens.yourdomain.com
   ```

#### Step 6: Add HTTPS with Let's Encrypt (Optional)

Install Certbot and obtain a certificate:

```bash
# Install Certbot
apt-get install -y certbot

# Obtain certificate (stop nginx first)
docker compose stop frontend
certbot certonly --standalone -d beatlens.yourdomain.com
docker compose start frontend
```

For automatic HTTPS, consider adding a Traefik or Caddy reverse proxy container to your Docker Compose setup.

---

## Part 3 — CI/CD Pipeline

The repository includes two GitHub Actions workflows in `.github/workflows/`:

### Pipeline Overview

```
Push to main / PR
       │
       ├── ci.yml
       │    ├── test-backend (Maven + PostgreSQL service)
       │    ├── test-frontend (npm lint + build)
       │    └── docker-build (build images, main branch only)
       │
       └── deploy.yml (triggers after CI succeeds on main)
            ├── push-images (push to GitHub Container Registry)
            └── deploy-railway (optional, if RAILWAY_TOKEN is set)
```

### CI Workflow (`ci.yml`)

Runs on every push and pull request to `main`:

| Job | What It Does |
|-----|-------------|
| `test-backend` | Spins up PostgreSQL, runs `./mvnw verify` with Java 21 |
| `test-frontend` | Runs `npm ci`, `npm run lint`, `npm run build` |
| `docker-build` | Builds both Docker images (main branch only, no push) |

### Deploy Workflow (`deploy.yml`)

Runs after CI succeeds on `main`:

| Job | What It Does |
|-----|-------------|
| `push-images` | Builds & pushes images to GitHub Container Registry (ghcr.io) |
| `deploy-railway` | Deploys to Railway (only if `ENABLE_RAILWAY_DEPLOY` variable is `true`) |

### Setup Steps

#### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add Docker and CI/CD configuration"
git remote add origin https://github.com/YOUR_USERNAME/BeatLens.git
git push -u origin main
```

#### Step 2: Verify CI Runs

1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. You should see the "CI" workflow running
4. Wait for all jobs to pass (green checkmarks)

#### Step 3: Configure Deployment Secrets

For the deploy workflow to push Docker images and deploy:

1. Go to **Settings > Secrets and variables > Actions**
2. Add the following secrets:

| Secret | Description | Required For |
|--------|-------------|-------------|
| `RAILWAY_TOKEN` | Railway API token | Railway deploy |

3. Add the following variables (Settings > Secrets and variables > Actions > Variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `ENABLE_RAILWAY_DEPLOY` | `true` | Enable Railway deployment |

#### Step 4: Get Railway Token (if using Railway)

1. Go to [railway.app/account/tokens](https://railway.app/account/tokens)
2. Create a new token
3. Add it as a GitHub secret named `RAILWAY_TOKEN`

#### Step 5: Verify Deployment

After pushing to `main`:

1. CI workflow runs tests
2. If CI passes, Deploy workflow triggers
3. Docker images are pushed to `ghcr.io/YOUR_USERNAME/beatlens/backend:latest` and `ghcr.io/YOUR_USERNAME/beatlens/frontend:latest`
4. If Railway is enabled, the app is deployed automatically

### Using GHCR Images on a VPS

You can pull the CI-built images on any server:

```bash
# Log in to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull latest images
docker pull ghcr.io/YOUR_USERNAME/BeatLens/backend:latest
docker pull ghcr.io/YOUR_USERNAME/BeatLens/frontend:latest
```

To use these pre-built images instead of building locally, create a `docker-compose.prod.yml`:

```yaml
services:
  backend:
    image: ghcr.io/YOUR_USERNAME/BeatLens/backend:latest
    build: !reset null
  frontend:
    image: ghcr.io/YOUR_USERNAME/BeatLens/frontend:latest
    build: !reset null
```

Then run:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `beatlens` | PostgreSQL database name |
| `POSTGRES_USER` | `beatlens` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `beatlens` | PostgreSQL password (**change in production**) |
| `DB_PORT` | `5432` | Exposed PostgreSQL port |
| `BACKEND_PORT` | `8080` | Exposed backend port |
| `FRONTEND_PORT` | `80` | Exposed frontend port |
| `CORS_ORIGINS` | `http://localhost` | Comma-separated allowed CORS origins |
| `SPRING_PROFILES_ACTIVE` | — | Set to `docker` in containerized environments |
| `DATABASE_URL` | — | Full JDBC URL (set by Docker Compose) |
| `DATABASE_USERNAME` | — | DB username (set by Docker Compose) |
| `DATABASE_PASSWORD` | — | DB password (set by Docker Compose) |

---

## Troubleshooting

### Backend fails to start

**Symptom**: Backend container exits immediately or keeps restarting.

```bash
# Check logs
docker compose logs backend

# Common causes:
# 1. Database not ready — backend starts before PostgreSQL is healthy
#    Fix: The healthcheck in docker-compose.yml handles this. If it persists,
#    increase start_period in the backend healthcheck.
#
# 2. Wrong database URL — check environment variables
docker compose exec backend env | grep DATABASE
```

### Frontend shows "502 Bad Gateway"

**Symptom**: Nginx returns 502 when calling `/api/*`.

```bash
# Check if backend is running
docker compose ps backend

# Check Nginx can reach backend
docker compose exec frontend wget -qO- http://backend:8080/actuator/health

# Fix: Ensure backend is healthy before frontend starts (handled by depends_on)
```

### Database connection refused

```bash
# Verify PostgreSQL is running
docker compose ps db

# Check PostgreSQL logs
docker compose logs db

# Test connection
docker compose exec db pg_isready -U beatlens
```

### Build failures

```bash
# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up

# If Maven wrapper has permission issues
chmod +x backend/mvnw
```

### Port conflicts

```bash
# Check if port 80 is already in use
lsof -i :80

# Change port in .env
FRONTEND_PORT=3000
```

### Out of disk space

```bash
# Clean unused Docker resources
docker system prune -a --volumes
```
