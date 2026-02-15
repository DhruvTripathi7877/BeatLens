-- V2: canonical songs to support multiple recordings/versions per logical song

CREATE TABLE canonical_songs (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(500) NOT NULL,
    artist              VARCHAR(500),
    normalized_title    VARCHAR(500) NOT NULL,
    normalized_artist   VARCHAR(500) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_song_id      BIGINT UNIQUE
);

ALTER TABLE songs
    ADD COLUMN canonical_song_id BIGINT;

-- Backfill: each existing recording gets its own canonical row first.
INSERT INTO canonical_songs (title, artist, normalized_title, normalized_artist, source_song_id)
SELECT
    s.title,
    s.artist,
    trim(regexp_replace(lower(coalesce(s.title, '')), '[^a-z0-9]+', ' ', 'g')) AS normalized_title,
    trim(regexp_replace(lower(coalesce(s.artist, '')), '[^a-z0-9]+', ' ', 'g')) AS normalized_artist,
    s.id
FROM songs s;

UPDATE songs s
SET canonical_song_id = cs.id
FROM canonical_songs cs
WHERE cs.source_song_id = s.id;

ALTER TABLE songs
    ALTER COLUMN canonical_song_id SET NOT NULL;

ALTER TABLE songs
    ADD CONSTRAINT fk_songs_canonical_song
    FOREIGN KEY (canonical_song_id) REFERENCES canonical_songs(id) ON DELETE RESTRICT;

CREATE INDEX idx_canonical_songs_normalized
    ON canonical_songs(normalized_title, normalized_artist);

CREATE INDEX idx_songs_canonical_song_id
    ON songs(canonical_song_id);

ALTER TABLE canonical_songs
    DROP COLUMN source_song_id;
-- V2: canonical songs to support multiple recordings/versions per logical song

CREATE TABLE canonical_songs (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(500) NOT NULL,
    artist              VARCHAR(500),
    normalized_title    VARCHAR(500) NOT NULL,
    normalized_artist   VARCHAR(500) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_song_id      BIGINT UNIQUE
);

ALTER TABLE songs
    ADD COLUMN canonical_song_id BIGINT;

-- Backfill: each existing recording gets its own canonical row first.
INSERT INTO canonical_songs (title, artist, normalized_title, normalized_artist, source_song_id)
SELECT
    s.title,
    s.artist,
    trim(regexp_replace(lower(coalesce(s.title, '')), '[^a-z0-9]+', ' ', 'g')) AS normalized_title,
    trim(regexp_replace(lower(coalesce(s.artist, '')), '[^a-z0-9]+', ' ', 'g')) AS normalized_artist,
    s.id
FROM songs s;

UPDATE songs s
SET canonical_song_id = cs.id
FROM canonical_songs cs
WHERE cs.source_song_id = s.id;

ALTER TABLE songs
    ALTER COLUMN canonical_song_id SET NOT NULL;

ALTER TABLE songs
    ADD CONSTRAINT fk_songs_canonical_song
    FOREIGN KEY (canonical_song_id) REFERENCES canonical_songs(id) ON DELETE RESTRICT;

CREATE INDEX idx_canonical_songs_normalized
    ON canonical_songs(normalized_title, normalized_artist);

CREATE INDEX idx_songs_canonical_song_id
    ON songs(canonical_song_id);

ALTER TABLE canonical_songs
    DROP COLUMN source_song_id;
