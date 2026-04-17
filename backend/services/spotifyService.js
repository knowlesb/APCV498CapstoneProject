require('../config/env');

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = now + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

  return accessToken;
}

function calculateMatchScore(spotifyAlbum, extractedArtist, extractedAlbum) {
  let score = 0;
  
  const spotifyArtist = (spotifyAlbum.artists && spotifyAlbum.artists[0]?.name) || '';
  const spotifyAlbumName = spotifyAlbum.name || '';
  const popularity = spotifyAlbum.popularity || 0;
  
  // Artist exact match
  if (spotifyArtist.toLowerCase().trim() === extractedArtist.toLowerCase().trim()) {
    score += 50;
  } else if (spotifyArtist.toLowerCase().includes(extractedArtist.toLowerCase()) || 
             extractedArtist.toLowerCase().includes(spotifyArtist.toLowerCase())) {
    score += 25;
  }
  
  // Album exact match
  if (spotifyAlbumName.toLowerCase().trim() === extractedAlbum.toLowerCase().trim()) {
    score += 30;
  } else if (spotifyAlbumName.toLowerCase().includes(extractedAlbum.toLowerCase()) ||
             extractedAlbum.toLowerCase().includes(spotifyAlbumName.toLowerCase())) {
    score += 15;
  }
  
  // Popularity bonus (0-5 points)
  score += (popularity / 100) * 5;
  
  return score;
}

async function fetchSearch(url, token, allow401Retry = true) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401 && allow401Retry) {
      accessToken = null;
      const newToken = await getAccessToken();
      return fetchSearch(url, newToken, false);
    }
    let details = '';
    try {
      details = await response.text();
    } catch (_err) {
      details = '';
    }
    throw new Error(`Spotify API error ${response.status}: ${response.statusText}${details ? ` | ${details}` : ''}`);
  }

  return response.json();
}

async function searchAlbums(artist, album) {
  try {
    const token = await getAccessToken();

    const fieldParams = new URLSearchParams({
      q: `artist:${artist} album:${album}`,
      type: 'album',
      limit: '10'
    });
    const fieldUrl = `https://api.spotify.com/v1/search?${fieldParams.toString()}`;
    let data = await fetchSearch(fieldUrl, token);

    if (!data.albums?.items?.length) {
      const broadParams = new URLSearchParams({
        q: `${artist} ${album}`.trim(),
        type: 'album',
        limit: '10'
      });
      const broadUrl = `https://api.spotify.com/v1/search?${broadParams.toString()}`;
      data = await fetchSearch(broadUrl, token);
    }

    return processSearchResults(data, artist, album);
  } catch (error) {
    console.error('Spotify search error:', error);
    return {
      success: false,
      error: 'SPOTIFY_API_ERROR',
      message: error.message || 'Spotify service error',
      results: []
    };
  }
}

function processSearchResults(data, extractedArtist, extractedAlbum) {
  if (!data.albums || !data.albums.items || data.albums.items.length === 0) {
    return {
      success: true,
      results: [],
      query: { artist: extractedArtist, album: extractedAlbum },
      warning: null
    };
  }

  const scoredResults = data.albums.items.map(album => ({
    ...album,
    score: calculateMatchScore(album, extractedArtist, extractedAlbum)
  }));

  scoredResults.sort((a, b) => b.score - a.score);

  const topResults = scoredResults.slice(0, 3);
  const topScore = topResults.length > 0 ? topResults[0].score : 0;

  return {
    success: true,
    results: topResults.map(album => ({
      id: album.id,
      name: album.name,
      artist: album.artists[0]?.name || '',
      releaseDate: album.release_date,
      imageUrl: album.images && album.images.length > 0 ? album.images[0].url : '',
      popularity: album.popularity,
      score: album.score
    })),
    query: { artist: extractedArtist, album: extractedAlbum },
    warning: topScore < 30 ? 'LOW_CONFIDENCE' : null
  };
}

module.exports = { searchAlbums };

