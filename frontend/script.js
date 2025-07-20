let creators = [];
let userId = 'guest';

let leftCreator = null;
let rightCreator = null;
let defeatedIds = new Set();

let pageLoadTime = Date.now();

async function loadCreators() {
  const res = await fetch('http://localhost:5000/creators');
  const data = await res.json();

  creators = data.map((c, index) => ({
    id: c.id || index + 1,
    name: c.name,
    image: c.image,
    elo: c.elo || 1200,
    instagram: c.instagram || null
  }));

  leftCreator = pickRandomCreator();
  rightCreator = pickRandomCreator([leftCreator.id]);

  showCreators();
}

function pickRandomCreator(excludeIds = []) {
  const available = creators.filter(c =>
    !defeatedIds.has(c.id) && !excludeIds.includes(c.id)
  );

  if (available.length === 0) return null;

  return available[Math.floor(Math.random() * available.length)];
}

function getRank(creator) {
  const sorted = [...creators].sort((a, b) => b.elo - a.elo);
  return sorted.findIndex(c => c.id === creator.id) + 1;
}

function showCreators() {
  if (!leftCreator || !rightCreator) {
    // 🎉 Confetti when all are eliminated
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });

    document.getElementById('arena').innerHTML = `
      <div class="text-center text-xl text-[#86efac] mt-20">
        🔥 You’ve voted on everyone!<br>
        We’re adding more soon. Thanks for helping shape the rankings 🙏
      </div>
    `;
    document.getElementById('voteA').classList.add('hidden');
    document.getElementById('voteB').classList.add('hidden');
    return;
  }

  document.getElementById('creatorAName').innerText = leftCreator.name;
  document.getElementById('imgA').src = leftCreator.image;
  document.getElementById('rankA').innerText = `Rank: #${getRank(leftCreator)} | Elo: ${leftCreator.elo}`;

  document.getElementById('creatorBName').innerText = rightCreator.name;
  document.getElementById('imgB').src = rightCreator.image;
  document.getElementById('rankB').innerText = `Rank: #${getRank(rightCreator)} | Elo: ${rightCreator.elo}`;

  document.getElementById('voteA').onclick = () => handleVote(leftCreator, rightCreator, 'left');
  document.getElementById('voteB').onclick = () => handleVote(rightCreator, leftCreator, 'right');
}

async function handleVote(winner, loser, side) {
  const timeSinceLoad = Date.now() - pageLoadTime;
  if (timeSinceLoad < 500) {
    alert("Suspicious voting speed.");
    return;
  }

  const res = await fetch('http://localhost:5000/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      winner_id: winner.id,
      loser_id: loser.id,
      user_id: userId,
      trap: document.getElementById('trap')?.value || ''
    }),
  });

  const result = await res.json();

  if (res.status === 429 || result.error) {
    console.warn("Spam or bot block triggered:", result.error);
    return;
  }

  defeatedIds.add(loser.id);

  document.getElementById('xpValue').innerText = result.total_xp;
  document.getElementById('profileXp').innerText = result.total_xp;
  document.getElementById('profileVotes').innerText = result.vote_count;

  const updateLocal = (id, newRating) => {
    const c = creators.find((c) => c.id === id);
    if (c) c.elo = newRating;
  };
  updateLocal(winner.id, result.winner.rating);
  updateLocal(loser.id, result.loser.rating);

  const newOpponent = pickRandomCreator([winner.id]);

  if (side === 'left') {
    rightCreator = newOpponent;
  } else {
    leftCreator = newOpponent;
  }

  if (!leftCreator || !rightCreator) {
    showCreators();
    return;
  }

  showCreators();
}

function showCooldownBanner(message) {
  const banner = document.getElementById('cooldownBanner');
  const voteA = document.getElementById('voteA');
  const voteB = document.getElementById('voteB');

  let cooldownTime = 5;
  banner.innerText = `${message} (${cooldownTime}s)`;
  banner.classList.remove('hidden');

  voteA.disabled = true;
  voteB.disabled = true;
  voteA.classList.add('opacity-50', 'cursor-not-allowed');
  voteB.classList.add('opacity-50', 'cursor-not-allowed');

  const interval = setInterval(() => {
    cooldownTime -= 1;
    banner.innerText = `${message} (${cooldownTime}s)`;

    if (cooldownTime <= 0) {
      clearInterval(interval);
      banner.classList.add('hidden');
      voteA.disabled = false;
      voteB.disabled = false;
      voteA.classList.remove('opacity-50', 'cursor-not-allowed');
      voteB.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }, 1000);
}

document.getElementById('accountBtn').addEventListener('click', () => {
  document.getElementById('profileUserId').innerText = userId;
  document.getElementById('modalOverlay').classList.remove('hidden');
});

document.getElementById('closeProfile').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.add('hidden');
});

document.getElementById('leaderboardBtn').addEventListener('click', () => {
  const leaderboard = [...creators].sort((a, b) => b.elo - a.elo).slice(0, 10);
  const list = leaderboard.map((c, i) =>
    `<li>#${i + 1} — <strong>${c.name}</strong> (Elo: ${c.elo})</li>`
  ).join('');
  document.getElementById('leaderboardList').innerHTML = list;
  document.getElementById('leaderboardModal').classList.remove('hidden');
});

document.getElementById('rewardsBtn').addEventListener('click', () => {
  document.getElementById('rewardsModal').classList.remove('hidden');
});

loadCreators();
