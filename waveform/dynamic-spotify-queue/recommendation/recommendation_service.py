from flask import Flask, request, jsonify
from recommendationEngine import add_feedback, train_model, predict_preference

app = Flask(__name__)

@app.route('/add_feedback', methods=['POST'])
def add_feedback_route():
    data = request.json
    track_features = data.get('track_features', {})
    feedback = data.get('feedback', 0)
    skip_reason = data.get('skip_reason', None)
    add_feedback(track_features, feedback, skip_reason)
    return jsonify({'status': 'ok'}), 200

@app.route('/train', methods=['POST'])
def train():
    train_model()
    return jsonify({'status': 'trained'}), 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    track_features = data.get('track_features', {})
    result = predict_preference(track_features)  # { probability, reason }
    return jsonify(result), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
