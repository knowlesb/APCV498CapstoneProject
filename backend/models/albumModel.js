const pool = require('../config/database');

async function getAllAlbums() {
  const result = await pool.query(
    `SELECT id, extracted_artist, extracted_album, raw_ocr_text,
            artist_name, album_name, spotify_id, release_date, image_url,
            uploaded_at, created_at
     FROM albums
     ORDER BY uploaded_at DESC, created_at DESC`
  );
  return result.rows;
}

async function getAlbumBySpotifyId(spotifyId) {
  const result = await pool.query(
    'SELECT * FROM albums WHERE spotify_id = $1',
    [spotifyId]
  );
  return result.rows[0];
}

async function saveAlbum(albumData) {
  const {
    artistName,
    albumName,
    spotifyId,
    releaseDate,
    imageUrl,
    extractedArtist,
    extractedAlbum,
    rawOcrText
  } = albumData;
  
  const result = await pool.query(
    `INSERT INTO albums (
       extracted_artist, extracted_album, raw_ocr_text,
       artist_name, album_name, spotify_id, release_date, image_url
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (spotify_id) DO UPDATE SET
       extracted_artist = EXCLUDED.extracted_artist,
       extracted_album = EXCLUDED.extracted_album,
       raw_ocr_text = EXCLUDED.raw_ocr_text,
       artist_name = EXCLUDED.artist_name,
       album_name = EXCLUDED.album_name,
       release_date = EXCLUDED.release_date,
       image_url = EXCLUDED.image_url,
       uploaded_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      extractedArtist,
      extractedAlbum,
      rawOcrText,
      artistName,
      albumName,
      spotifyId,
      releaseDate,
      imageUrl
    ]
  );
  
  return result.rows[0];
}

module.exports = { getAllAlbums, getAlbumBySpotifyId, saveAlbum };

