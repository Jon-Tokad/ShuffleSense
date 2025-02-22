require('dotenv').config();
const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(express.json());

// Spotify config
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

let accessToken = '';
let refreshToken = '';

// ========== In-memory user settings/demo data ==========
// In production, store these in a DB keyed by user
const userPreferences = {
  energyRange: [0.0, 1.0],
  tempoRange: [50, 200],
  releaseYearRange: [1970, 2025],
  blockExplicit: false,
  blockArtists: [],          // e.g. ['Drake']
  focusObscure: false,       // if true, prefer lower popularity
  mood: null,                // e.g. 'relaxing', 'workout'
  context: null,             // 'raining', 'gym', 'lateNight'
};

// ========== Spotify OAuth ==========
function encodeCredentials(id, secret) {
  return Buffer.from(`${id}:${secret}`).toString('base64');
}

app.get('/login', (req, res) => {
  const scope = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-library-read'
  ].join(' ');

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          Authorization: `Basic ${encodeCredentials(CLIENT_ID, CLIENT_SECRET)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    res.send('Authentication successful! You can close this tab.');
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).send('Auth failed');
  }
});

// ========== Spotify API endpoints ==========

app.get('/liked-songs', async (req, res) => {
  try {
    // Example: fetch up to 20 liked tracks
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/tracks?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send('Failed to fetch liked songs');
  }
});

app.post('/queue/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await axios.post(
      `${SPOTIFY_API_BASE}/me/player/queue?uri=spotify:track:${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    res.send('Song added to queue');
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send('Failed to update queue');
  }
});

// ========== Python Recommendation Service URL ==========
const PYTHON_SERVICE_URL = 'http://localhost:5001';

// ========== Multiple Skip Reasons ==========
app.post('/api/skip', async (req, res) => {
  const { trackFeatures, skipReason } = req.body; 
  // skipReason could be: 'NOT_IN_MOOD', 'HEARD_TOO_OFTEN', 'DONT_LIKE_ARTIST', etc.
  try {
    await axios.post(`${PYTHON_SERVICE_URL}/add_feedback`, {
      track_features: trackFeatures,
      feedback: 0,
      skip_reason: skipReason || 'UNSPECIFIED'
    });
    res.send('Skip recorded');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error recording skip feedback');
  }
});

app.post('/api/played', async (req, res) => {
  const { trackFeatures } = req.body;
  try {
    // feedback: 1 means liked/fully played
    await axios.post(`${PYTHON_SERVICE_URL}/add_feedback`, {
      track_features: trackFeatures,
      feedback: 1,
      skip_reason: null
    });
    res.send('Play recorded');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error recording play feedback');
  }
});

// ========== Train model ==========
app.post('/api/train', async (req, res) => {
  try {
    await axios.post(`${PYTHON_SERVICE_URL}/train`);
    res.send('Model trained');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error training model');
  }
});

// ========== Predict preference ==========
app.post('/api/predict', async (req, res) => {
  const { trackFeatures } = req.body;
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
      track_features: trackFeatures
    });
    // { probability, reason }
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error predicting preference');
  }
});

// ========== Settings / Preferences APIs ==========
// For demonstration only, we'd store these in a DB for each user
app.post('/api/preferences', (req, res) => {
  const { 
    energyRange, 
    tempoRange, 
    releaseYearRange, 
    blockExplicit,
    blockArtists,
    focusObscure,
    mood,
    context
  } = req.body;

  if (energyRange) userPreferences.energyRange = energyRange;
  if (tempoRange) userPreferences.tempoRange = tempoRange;
  if (releaseYearRange) userPreferences.releaseYearRange = releaseYearRange;
  if (typeof blockExplicit === 'boolean') userPreferences.blockExplicit = blockExplicit;
  if (blockArtists) userPreferences.blockArtists = blockArtists;
  if (typeof focusObscure === 'boolean') userPreferences.focusObscure = focusObscure;
  if (mood) userPreferences.mood = mood;
  if (context) userPreferences.context = context;

  return res.json({ status: 'Preferences updated', userPreferences });
});

app.get('/api/preferences', (req, res) => {
  return res.json(userPreferences);
});

// ========== Audio Summaries / Usage Stats ==========
app.get('/api/usage-summary', async (req, res) => {
  try {
    // Demo: In real life, you'd store track usage data and produce an actual summary
    // For now, we just return a placeholder
    const summary = {
      message: "You’ve listened to 20% more chill tracks this week!",
      topGenre: "Lo-fi",
      skipReasonsCount: {
        NOT_IN_MOOD: 5,
        HEARD_TOO_OFTEN: 2,
        DONT_LIKE_ARTIST: 1,
      }
    };
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating summary');
  }
});

// ========== Example dynamic queue with filters and explainability ==========
app.post('/dynamic-queue', async (req, res) => {
  try {
    // 1. Example: fetch 20 liked songs
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/tracks?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // 2. Filter out blocked artists, explicit content, etc.
    let candidateSongs = response.data.items
      .map(item => item.track)
      .filter(track => track != null);

    candidateSongs = candidateSongs.filter(track => {
      // Basic checks
      if (userPreferences.blockArtists.includes(track.artists[0].name)) {
        return false;
      }
      if (userPreferences.blockExplicit && track.explicit) {
        return false;
      }
      if (track.album && track.album.release_date) {
        const year = parseInt(track.album.release_date.slice(0,4), 10);
        if (year < userPreferences.releaseYearRange[0] ||
            year > userPreferences.releaseYearRange[1]) {
          return false;
        }
      }
      // If we want obscure tracks, skip if popularity > 70
      if (userPreferences.focusObscure && track.popularity > 70) {
        return false;
      }
      return true;
    });

    if (!candidateSongs.length) {
      return res.json({ message: 'No candidate songs after filtering!', nextTrack: null });
    }

    // 3. Retrieve audio features for each candidate
    //    Then call predict on each to get probability + reason
    const predictions = [];
    for (let song of candidateSongs) {
      // Fetch audio features from Spotify
      const audioRes = await axios.get(`${SPOTIFY_API_BASE}/audio-features/${song.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const features = audioRes.data; // { danceability, energy, tempo, etc. }

      // Filter by user’s energy/tempo preferences
      if (features.energy < userPreferences.energyRange[0] || features.energy > userPreferences.energyRange[1]) {
        continue;
      }
      if (features.tempo < userPreferences.tempoRange[0] || features.tempo > userPreferences.tempoRange[1]) {
        continue;
      }

      // Predict preference
      const { data } = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
        track_features: features
      });

      predictions.push({
        track: song,
        features,
        prob: data.probability,
        reason: data.reason,  // e.g. 'Similar BPM and energy...'
      });
    }

    if (!predictions.length) {
      return res.json({ message: 'No tracks passed all filters.', nextTrack: null });
    }

    // 4. Sort by prob desc
    predictions.sort((a, b) => b.prob - a.prob);

    // 5. Pick top
    const nextTrack = predictions[0].track;
    const nextReason = predictions[0].reason;

    // 6. Add to Spotify queue
    await axios.post(
      `${SPOTIFY_API_BASE}/me/player/queue?uri=spotify:track:${nextTrack.id}`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    res.json({
      message: 'Queue updated',
      nextTrack: {
        id: nextTrack.id,
        name: nextTrack.name,
        artist: nextTrack.artists?.[0]?.name,
      },
      reason: nextReason
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating dynamic queue');
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
