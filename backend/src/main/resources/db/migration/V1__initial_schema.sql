-- V1: Initial schema for BeatLens audio fingerprinting database (PostgreSQL)

CREATE TABLE songs (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(500) NOT NULL,
    artist              VARCHAR(500),
    file_path           VARCHAR(1000),
    duration_seconds    DOUBLE PRECISION,
    fingerprint_count   INT DEFAULT 0,
    indexed_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fingerprints (
    id          BIGSERIAL PRIMARY KEY,
    hash        BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    time_offset INT NOT NULL,
    CONSTRAINT fk_fingerprints_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Index on hash for fast fingerprint lookups during matching
CREATE INDEX idx_fingerprints_hash ON fingerprints(hash);

-- Index on song_id for fast deletion when removing a song
CREATE INDEX idx_fingerprints_song_id ON fingerprints(song_id);
