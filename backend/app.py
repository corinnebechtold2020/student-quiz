from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error

app = Flask(__name__)
CORS(app)

@app.route('/api/generate_data', methods=['POST'])
def generate_data():
    data = request.get_json()
    num_points = int(data.get('num_points', 100))
    noise = float(data.get('noise', 0.2))
    complexity = int(data.get('complexity', 1))
    np.random.seed(42)
    x = np.linspace(0, 10, num_points)
    y = np.sin(x) * complexity + np.random.normal(0, noise, num_points)
    return jsonify({
        'x': x.tolist(),
        'y': y.tolist()
    })

@app.route('/api/train_rf', methods=['POST'])
def train_rf():
    data = request.get_json()
    x = np.array(data['x']).reshape(-1, 1)
    y = np.array(data['y'])
    n_estimators = int(data.get('n_estimators', 10))
    max_depth = int(data.get('max_depth', 5))
    max_features = int(data.get('max_features', 1))
    rf = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, max_features=max_features, random_state=42)
    rf.fit(x, y)
    x_pred = np.linspace(0, 10, 100).reshape(-1, 1)
    y_pred = rf.predict(x_pred)
    mse = mean_squared_error(y, rf.predict(x))
    # Individual tree predictions
    trees = [tree.predict(x_pred).tolist() for tree in rf.estimators_[:3]]
    return jsonify({
        'x': x_pred.flatten().tolist(),
        'y_true': np.sin(x_pred.flatten()) * data.get('complexity', 1),
        'y_pred': y_pred.tolist(),
        'trees': trees,
        'mse': mse
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
