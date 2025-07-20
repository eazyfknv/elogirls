from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from database import get_user, update_ratings, is_spamming
from elo import calculate_elo

app = Flask(__name__)
CORS(app)

# Load static creator data
with open('creators.json') as f:
    creators_data = json.load(f)

# Convert list to dict for quick access
creators = {c['id']: {**c, 'elo': 1200} for c in creators_data}

@app.route('/creators', methods=['GET'])
def get_creators():
    return jsonify(list(creators.values()))

@app.route('/vote', methods=['POST'])
def vote():
    data = request.get_json()
    winner_id = data.get('winner_id')
    loser_id = data.get('loser_id')
    user_id = data.get('user_id', 'guest')

    trap = data.get('trap')
    if trap:
     return jsonify({'error': 'Bot detected'}), 400
    ua = request.headers.get('User-Agent', '').lower()
    if any(bot in ua for bot in ['python', 'bot', 'scrapy', 'curl', 'spider']):
        return jsonify({'error': 'Suspicious activity detected'}), 400



    if not all([winner_id, loser_id]):
        return jsonify({'error': 'Missing data'}), 400

    if is_spamming(user_id):
        return jsonify({'error': "You're clicking too fast!"}), 429

    winner = creators.get(winner_id)
    loser = creators.get(loser_id)

    if not winner or not loser:
        return jsonify({'error': 'Invalid creator IDs'}), 400

    new_winner_elo, new_loser_elo = calculate_elo(winner['elo'], loser['elo'])
    winner['elo'] = new_winner_elo
    loser['elo'] = new_loser_elo

    user = get_user(user_id)
    xp_earned = update_ratings(user, winner_id, loser_id)

    return jsonify({
        'winner': {'id': winner_id, 'rating': new_winner_elo},
        'loser': {'id': loser_id, 'rating': new_loser_elo},
        'total_xp': user['xp'],
        'vote_count': user['votes']
    })


if __name__ == '__main__':
    app.run(debug=True)
from flask import send_from_directory

@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/script.js')
def serve_script():
    return send_from_directory('../frontend', 'script.js')

@app.route('/photos/<path:filename>')
def serve_photos(filename):
    return send_from_directory('../photos', filename)
