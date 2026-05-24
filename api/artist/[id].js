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
  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyToken;
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const token = await getSpotifyToken();
    if (!token) {
      return res.status(500).json({
        error: 'Spotify credentials not configured',
        debug: {
          hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
          hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
          envKeys: Object.keys(process.env).filter(k => k.includes('SPOTIFY')),
          id,
        }
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
