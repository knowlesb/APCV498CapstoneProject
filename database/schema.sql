-- Album database schema
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    extracted_artist VARCHAR(255),
    extracted_album VARCHAR(255),
    raw_ocr_text TEXT,
    artist_name VARCHAR(255) NOT NULL,
    album_name VARCHAR(255) NOT NULL,
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    release_date VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backfill schema for existing databases that already have the albums table
ALTER TABLE albums
    ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE albums
    ADD COLUMN IF NOT EXISTS extracted_artist VARCHAR(255);
ALTER TABLE albums
    ADD COLUMN IF NOT EXISTS extracted_album VARCHAR(255);
ALTER TABLE albums
    ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;

CREATE INDEX IF NOT EXISTS idx_spotify_id ON albums(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artist_name ON albums(artist_name);

