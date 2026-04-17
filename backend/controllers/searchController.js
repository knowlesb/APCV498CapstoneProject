const { searchAlbums } = require('../services/spotifyService');

async function searchSpotify(req, res) {
  const { artist, album } = req.body;

  if (!artist || !album) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_PARAMS',
      message: 'Artist and album are required'
    });
  }

  try {
    const result = await searchAlbums(artist.trim(), album.trim());
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'SEARCH_ERROR',
      message: error.message || 'Error searching Spotify'
    });
  }
}

module.exports = { searchSpotify };

