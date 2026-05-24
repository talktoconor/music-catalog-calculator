let spotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;
  if (spotifyToken && Date.now() < tokenExpiry) return spotifyToken;

  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  const data = await resp.json();
  if (data.error) {
    console.error('Spotify token error:', data);
    return null;
  }
  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyToken;
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const token = await getSpotifyToken();
    if (!token) {
      // Try getting token again and capture the raw Spotify response for debugging
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      let tokenDebug = null;
      if (clientId && clientSecret) {
        const debugResp = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          },
          body: 'grant_type=client_credentials',
        });
        tokenDebug = await debugResp.json();
      }
      return res.status(500).json({
        error: 'Failed to get Spotify token',
        tokenResponse: tokenDebug,
      });
    }

    const artistResp = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!artistResp.ok) {
      return res.status(artistResp.status).json({ error: 'Artist not found' });
    }

    const artist = await artistResp.json();

    const topTracksResp = await fetch(
      `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const topTracks = await topTracksResp.json();

    res.json({ artist, topTracks: topTracks.tracks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
