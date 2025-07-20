import time

users = {}

def get_user(user_id):
    if user_id not in users:
        users[user_id] = {'xp': 0, 'votes': 0, 'last_votes': []}
    return users[user_id]

def is_spamming(user_id, limit=20, window=15):
    user = get_user(user_id)
    now = time.time()

    user['last_votes'].append(now)

    user['last_votes'] = [t for t in user['last_votes'] if now - t <= window]

    print(f"[DEBUG] Votes in last {window}s for {user_id}: {len(user['last_votes'])}")

    return len(user['last_votes']) >= limit



def update_ratings(user, winner_id, loser_id):
    user['xp'] += 10  # Base XP
    user['votes'] += 1
    return 10
