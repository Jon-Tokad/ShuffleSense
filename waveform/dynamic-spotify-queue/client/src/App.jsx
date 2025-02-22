import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Track feature example (for demonstration).
  const [trackFeatures, setTrackFeatures] = useState({
    danceability: 0.5,
    energy: 0.5,
    valence: 0.5,
    tempo: 120,
    loudness: -5,
    speechiness: 0.05,
    instrumentalness: 0.0,
    liveness: 0.1,
    acousticness: 0.3,
  });

  // User preference inputs
  const [energyRange, setEnergyRange] = useState([0.0, 1.0]);
  const [tempoRange, setTempoRange] = useState([50, 200]);
  const [releaseYearRange, setReleaseYearRange] = useState([1970, 2025]);
  const [blockExplicit, setBlockExplicit] = useState(false);
  const [blockArtists, setBlockArtists] = useState([]);
  const [focusObscure, setFocusObscure] = useState(false);

  // For skip reason
  const [skipReason, setSkipReason] = useState('NOT_IN_MOOD');

  // For mood/context
  const [mood, setMood] = useState('');
  const [context, setContext] = useState('');

  // Display messages
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState(null);

  // Next track info
  const [nextTrack, setNextTrack] = useState(null);
  const [explanation, setExplanation] = useState('');

  // Real-time data (just track features, in a real app you'd poll Spotify)
  const [visualData, setVisualData] = useState({
    tempo: trackFeatures.tempo,
    energy: trackFeatures.energy,
    valence: trackFeatures.valence,
  });

  // Fetch usage summary
  const fetchUsageSummary = async () => {
    try {
      const { data } = await axios.get('/api/usage-summary');
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Update user preferences on the server
  const updatePreferences = async () => {
    try {
      const { data } = await axios.post('/api/preferences', {
        energyRange,
        tempoRange,
        releaseYearRange,
        blockExplicit,
        blockArtists,
        focusObscure,
        mood,
        context
      });
      setMessage(data.status);
    } catch (err) {
      console.error(err);
      setMessage('Error updating preferences');
    }
  };

  const handleSkip = async () => {
    try {
      await axios.post('/api/skip', {
        trackFeatures,
        skipReason
      });
      setMessage(`Skip recorded: ${skipReason}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayed = async () => {
    try {
      await axios.post('/api/played', { trackFeatures });
      setMessage('Play recorded');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrain = async () => {
    try {
      await axios.post('/api/train');
      setMessage('Model trained');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetPrediction = async () => {
    try {
      const { data } = await axios.post('/api/predict', { trackFeatures });
      setMessage(`Predicted preference: ${(data.probability * 100).toFixed(1)}%`);
      setExplanation(data.reason);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDynamicQueue = async () => {
    try {
      const { data } = await axios.post('/dynamic-queue');
      setNextTrack(data.nextTrack);
      setExplanation(data.reason);
      setMessage(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  // Example: show real-time visuals of certain trackFeatures
  useEffect(() => {
    setVisualData({
      tempo: trackFeatures.tempo,
      energy: trackFeatures.energy,
      valence: trackFeatures.valence,
    });
  }, [trackFeatures]);

  useEffect(() => {
    // On mount, fetch usage summary
    fetchUsageSummary();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Dynamic Spotify Queue + Advanced Features</h1>
      <p>Refined example with mood prompts, skip reasons, and real-time visuals.</p>

      <hr />

      {/* User Preferences */}
      <h2>Preferences</h2>
      <div>
        <label>Energy Range: </label>
        <input
          type='number'
          step='0.1'
          value={energyRange[0]}
          onChange={(e) => setEnergyRange([parseFloat(e.target.value), energyRange[1]])}
        />{' '}
        to{' '}
        <input
          type='number'
          step='0.1'
          value={energyRange[1]}
          onChange={(e) => setEnergyRange([energyRange[0], parseFloat(e.target.value)])}
        />
      </div>
      <div>
        <label>Tempo Range: </label>
        <input
          type='number'
          value={tempoRange[0]}
          onChange={(e) => setTempoRange([parseInt(e.target.value, 10), tempoRange[1]])}
        />{' '}
        to{' '}
        <input
          type='number'
          value={tempoRange[1]}
          onChange={(e) => setTempoRange([tempoRange[0], parseInt(e.target.value, 10)])}
        />
      </div>
      <div>
        <label>Release Year Range: </label>
        <input
          type='number'
          value={releaseYearRange[0]}
          onChange={(e) => setReleaseYearRange([parseInt(e.target.value, 10), releaseYearRange[1]])}
        />{' '}
        to{' '}
        <input
          type='number'
          value={releaseYearRange[1]}
          onChange={(e) => setReleaseYearRange([releaseYearRange[0], parseInt(e.target.value, 10)])}
        />
      </div>
      <div>
        <label>
          <input
            type='checkbox'
            checked={blockExplicit}
            onChange={() => setBlockExplicit(!blockExplicit)}
          />
          Block Explicit Tracks
        </label>
      </div>
      <div>
        <label>Block Artists (comma separated): </label>
        <input
          type='text'
          onChange={(e) => setBlockArtists(e.target.value.split(',').map(a => a.trim()))}
        />
      </div>
      <div>
        <label>
          <input
            type='checkbox'
            checked={focusObscure}
            onChange={() => setFocusObscure(!focusObscure)}
          />
          Focus on obscure tracks (filter out high popularity)
        </label>
      </div>
      <div>
        <label>Mood: </label>
        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value=''>None</option>
          <option value='relaxing'>Relaxing</option>
          <option value='energetic'>Energetic</option>
          <option value='sad'>Sad</option>
        </select>
      </div>
      <div>
        <label>Context: </label>
        <select value={context} onChange={(e) => setContext(e.target.value)}>
          <option value=''>None</option>
          <option value='raining'>Raining</option>
          <option value='gym'>Gym</option>
          <option value='lateNight'>Late Night</option>
        </select>
      </div>
      <button onClick={updatePreferences}>Save Preferences</button>

      <hr />

      {/* Track Features Demo */}
      <h2>Current Track Features</h2>
      <div>
        <label>Tempo: </label>
        <input
          type='number'
          value={trackFeatures.tempo}
          onChange={(e) => setTrackFeatures({ ...trackFeatures, tempo: parseFloat(e.target.value) })}
        />
      </div>
      <div>
        <label>Energy: </label>
        <input
          type='number'
          step='0.1'
          value={trackFeatures.energy}
          onChange={(e) => setTrackFeatures({ ...trackFeatures, energy: parseFloat(e.target.value) })}
        />
      </div>
      {/* Repeat for other features if desired */}

      <hr />

      {/* Skip Reason */}
      <h2>Skip Reasons</h2>
      <div>
        <label>Select a skip reason: </label>
        <select value={skipReason} onChange={(e) => setSkipReason(e.target.value)}>
          <option value='NOT_IN_MOOD'>Not in the mood</option>
          <option value='HEARD_TOO_OFTEN'>Heard too often</option>
          <option value='DONT_LIKE_ARTIST'>Don't like the artist</option>
        </select>
        <button onClick={handleSkip} style={{ marginLeft: 10 }}>
          Skip Track
        </button>
      </div>
      <button onClick={handlePlayed} style={{ marginTop: 10 }}>
        Finished / Liked Track
      </button>

      <hr />

      {/* Model and Queue Actions */}
      <h2>Model & Queue Actions</h2>
      <button onClick={handleTrain}>Train Model</button>
      <button onClick={handleGetPrediction} style={{ marginLeft: 10 }}>
        Predict Preference
      </button>
      <button onClick={handleDynamicQueue} style={{ marginLeft: 10 }}>
        Dynamic Queue
      </button>

      <hr />

      {/* Status & Explanation */}
      <p><strong>Message:</strong> {message}</p>
      {explanation && <p><strong>Explanation:</strong> {explanation}</p>}
      {nextTrack && (
        <p>
          <strong>Next Track:</strong> {nextTrack.name} by {nextTrack.artist} (ID: {nextTrack.id})
        </p>
      )}

      <hr />

      {/* Usage Summary */}
      <h2>Usage Summary</h2>
      <button onClick={fetchUsageSummary}>Refresh Summary</button>
      {summary && (
        <div style={{ marginTop: 10 }}>
          <p>{summary.message}</p>
          <p>Top Genre: {summary.topGenre}</p>
          <p>Skip Reasons Count:</p>
          <ul>
            {Object.entries(summary.skipReasonsCount).map(([reason, count]) => (
              <li key={reason}>{reason}: {count}</li>
            ))}
          </ul>
        </div>
      )}

      <hr />

      {/* Real-Time Visuals */}
      <h2>Real-Time Track Feature Visualization</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <p>Tempo: {visualData.tempo}</p>
          <div style={{
            height: '20px',
            width: `${visualData.tempo / 2}px`,
            backgroundColor: 'lightblue',
            transition: 'width 0.3s'
          }} />
        </div>
        <div>
          <p>Energy: {visualData.energy.toFixed(2)}</p>
          <div style={{
            height: '20px',
            width: `${visualData.energy * 100}px`,
            backgroundColor: 'lightgreen',
            transition: 'width 0.3s'
          }} />
        </div>
        <div>
          <p>Valence: {visualData.valence.toFixed(2)}</p>
          <div style={{
            height: '20px',
            width: `${visualData.valence * 100}px`,
            backgroundColor: 'pink',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    </div>
  );
}

export default App;
