const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let spotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (spotifyToken && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

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

app.get('/api/artist/:id', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    if (!token) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    const artistResp = await fetch(`https://api.spotify.com/v1/artists/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!artistResp.ok) {
      return res.status(artistResp.status).json({ error: 'Artist not found' });
    }

    const artist = await artistResp.json();

    const topTracksResp = await fetch(
      `https://api.spotify.com/v1/artists/${req.params.id}/top-tracks?market=US`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const topTracks = await topTracksResp.json();

    res.json({ artist, topTracks: topTracks.tracks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    hasCredentials: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
  });
});

app.listen(PORT, () => {
  console.log(`Music Catalog Calculator running at http://localhost:${PORT}`);
});
