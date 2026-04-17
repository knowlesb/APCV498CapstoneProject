const { getAllAlbums, saveAlbum } = require('../models/albumModel');

async function getAlbums(req, res) {
  try {
    const albums = await getAllAlbums();
    res.json({
      success: true,
      albums: albums
    });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error retrieving albums'
    });
  }
}

async function createAlbum(req, res) {
  const {
    spotifyId,
    artistName,
    albumName,
    releaseDate,
    imageUrl,
    extractedArtist,
    extractedAlbum,
    rawOcrText
  } = req.body;

  if (!spotifyId || !artistName || !albumName) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_PARAMS',
      message: 'Spotify ID, artist name, and album name are required'
    });
  }

  try {
    const album = await saveAlbum({
      artistName,
      albumName,
      spotifyId,
      releaseDate: releaseDate || null,
      imageUrl: imageUrl || null,
      extractedArtist: extractedArtist || null,
      extractedAlbum: extractedAlbum || null,
      rawOcrText: rawOcrText || null
    });

    res.json({
      success: true,
      album: album
    });
  } catch (error) {
    console.error('Save album error:', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Error saving album'
    });
  }
}

module.exports = { getAlbums, createAlbum };

