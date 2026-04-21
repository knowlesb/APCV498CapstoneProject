-- Album database schema
CREATE TABLE IF NOT EXISTS albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extracted_artist VARCHAR(255),
    extracted_album VARCHAR(255),
    raw_ocr_text TEXT,
    artist_name VARCHAR(255) NOT NULL,
    album_name VARCHAR(255) NOT NULL,
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    release_date VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_artist_name (artist_name)
);

-- For fresh setup, CREATE TABLE above is enough.
-- If you need backfill migrations on an existing table, run explicit ALTERs manually.

