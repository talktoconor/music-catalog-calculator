export default function handler(req, res) {
  res.json({
    hasCredentials: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
  });
}
