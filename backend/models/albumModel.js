const pool = require('../config/database');

async function getAllAlbums() {
  const [rows] = await pool.query(
    `SELECT id, extracted_artist, extracted_album, raw_ocr_text,
            artist_name, album_name, spotify_id, release_date, image_url,
            uploaded_at, created_at
     FROM albums
     ORDER BY uploaded_at DESC, created_at DESC`
  );
  return rows;
}

async function getAlbumBySpotifyId(spotifyId) {
  const [rows] = await pool.query(
    'SELECT * FROM albums WHERE spotify_id = ?',
    [spotifyId]
  );
  return rows[0];
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
  
  await pool.query(
    `INSERT INTO albums (
       extracted_artist, extracted_album, raw_ocr_text,
       artist_name, album_name, spotify_id, release_date, image_url
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       extracted_artist = VALUES(extracted_artist),
       extracted_album = VALUES(extracted_album),
       raw_ocr_text = VALUES(raw_ocr_text),
       artist_name = VALUES(artist_name),
       album_name = VALUES(album_name),
       release_date = VALUES(release_date),
       image_url = VALUES(image_url),
       uploaded_at = CURRENT_TIMESTAMP
    `,
    [extractedArtist, extractedAlbum, rawOcrText, artistName, albumName, spotifyId, releaseDate, imageUrl]
  );

  return getAlbumBySpotifyId(spotifyId);
}

module.exports = { getAllAlbums, getAlbumBySpotifyId, saveAlbum };

