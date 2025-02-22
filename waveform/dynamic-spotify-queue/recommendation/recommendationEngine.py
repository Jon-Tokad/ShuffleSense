import numpy as np
from typing import Dict
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

TRAINING_DATA = []
model = None
scaler = None

# We'll store the last track's features to generate an example explanation
last_track_features = None

def add_feedback(track_features: Dict[str, float], feedback: int, skip_reason: str=None):
    """
    track_features: keys like 'danceability', 'energy', 'valence', 'tempo', etc.
    feedback: 1 if liked, 0 if skipped
    skip_reason: string explaining the skip type (NOT_IN_MOOD, HEARD_TOO_OFTEN, etc.)
    """
    global last_track_features

    features_vec = [
        track_features.get('danceability', 0),
        track_features.get('energy', 0),
        track_features.get('valence', 0),
        track_features.get('tempo', 0),
        track_features.get('loudness', 0),
        track_features.get('speechiness', 0),
        track_features.get('instrumentalness', 0),
        track_features.get('liveness', 0),
        track_features.get('acousticness', 0),
    ]
    # For demonstration, encode skip_reason as extra numeric or just ignore
    # You could store it in TRAINING_DATA for advanced modeling
    TRAINING_DATA.append((features_vec, feedback))

    # Keep track of last track
    last_track_features = track_features.copy()

def train_model():
    global model, scaler
    if not TRAINING_DATA:
        print("No training data available.")
        return

    X = [d[0] for d in TRAINING_DATA]
    y = [d[1] for d in TRAINING_DATA]

    X = np.array(X)
    y = np.array(y)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = LogisticRegression()
    model.fit(X_scaled, y)
    print("Model trained with", len(X), "data points.")

def predict_preference(track_features: Dict[str, float]):
    """
    Returns a dict with:
      probability: float
      reason: str (why we recommended it, e.g., BPM similarity)
    """
    global last_track_features

    if model is None or scaler is None:
        # fallback
        return {"probability": 0.5, "reason": "Default guess (model not trained)"}

    # Convert features to vector
    features_vec = [
        track_features.get('danceability', 0),
        track_features.get('energy', 0),
        track_features.get('valence', 0),
        track_features.get('tempo', 0),
        track_features.get('loudness', 0),
        track_features.get('speechiness', 0),
        track_features.get('instrumentalness', 0),
        track_features.get('liveness', 0),
        track_features.get('acousticness', 0),
    ]
    X = np.array(features_vec).reshape(1, -1)
    X_scaled = scaler.transform(X)
    prob = model.predict_proba(X_scaled)[0, 1]

    # Generate a simple reason
    reason = "Recommended!"
    if last_track_features:
        # Compare tempo & energy, for instance
        prev_tempo = last_track_features.get('tempo', 0)
        curr_tempo = track_features.get('tempo', 0)
        prev_energy = last_track_features.get('energy', 0)
        curr_energy = track_features.get('energy', 0)

        # If difference in tempo < 10 & energy < 0.2, say they're similar
        if abs(prev_tempo - curr_tempo) < 10 and abs(prev_energy - curr_energy) < 0.2:
            reason = "Because it has a similar BPM and energy to your last track."
        else:
            reason = "Because it fits your listening profile."

    return {"probability": float(prob), "reason": reason}
