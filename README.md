# BeatLens

Production-grade audio fingerprinting and recognition application, inspired by Shazam's constellation-map algorithm.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Java 21 + Spring Boot 3.5.0 |
| Database | PostgreSQL with Flyway migrations |
| Caching | Caffeine (lazy-loaded, bounded LRU) |
| FFT | Apache Commons Math 3 |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |

## Project Structure

```
BeatLens/
├── backend/                         # Spring Boot API
│   ├── pom.xml                      # Maven dependencies (Java 21, Spring Boot 3.5.0)
│   └── src/main/java/com/beatlens/
│       ├── BeatLensApplication.java # Entry point
│       ├── core/                    # Pure-Java fingerprinting algorithms
│       ├── controller/              # REST endpoints
│       ├── service/                 # Business logic
│       ├── repository/              # Spring Data JPA
│       ├── model/                   # JPA entities + DTOs
│       ├── config/                  # Spring configuration
│       └── exception/               # Error handling
├── frontend/                        # React SPA
│   ├── package.json
│   └── src/
│       ├── components/              # UI components
│       ├── hooks/                   # Custom React hooks
│       └── api/                     # Backend API client
└── .cursor/rules/                   # AI context rules
```

## Prerequisites

- **Java 21** (LTS)
- **PostgreSQL 15+**
- **Node.js 18+**

## Quick Start

### 1. Start PostgreSQL

```bash
docker run -d --name beatlens-db \
  -e POSTGRES_DB=beatlens \
  -e POSTGRES_USER=beatlens \
  -e POSTGRES_PASSWORD=beatlens \
  -p 5432:5432 \
  postgres:17
```

### 2. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`. Flyway runs migrations automatically on startup.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:3000` and proxies `/api/*` to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/songs/upload` | Upload and index a song |
| GET | `/api/songs` | List all indexed songs |
| GET | `/api/songs/{id}` | Get song details |
| DELETE | `/api/songs/{id}` | Remove a song |
| POST | `/api/match` | Match an audio clip |
| GET | `/api/stats` | Database statistics |

## Algorithm

BeatLens uses a constellation-map fingerprinting approach:

1. **Spectrogram**: Hann-windowed FFT (4096-sample frames, 50% overlap)
2. **Peak Detection**: Local maxima across 5 frequency bands (0-5000 Hz)
3. **Fingerprinting**: Anchor-target peak pairs hashed as `(freq1 << 20) | (freq2 << 10) | timeDelta`
4. **Matching**: Caffeine-cached hash lookup + time-alignment histogram scoring

See `.cursor/rules/shazam-context.mdc` for full algorithm documentation.
