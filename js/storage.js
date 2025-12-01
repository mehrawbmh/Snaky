// High Score Storage Management

let highScores = [];

export function saveScore(score, playerName) {
  const now = new Date();
  const scoreEntry = {
    score: score,
    date: now.toLocaleString(),
    player: playerName
  };
  
  try {
    let storedScores = [];
    const saved = localStorage.getItem('snakeHighScores');
    if (saved) {
      storedScores = JSON.parse(saved);
    }
    
    storedScores.push(scoreEntry);
    storedScores.sort((a, b) => b.score - a.score);
    storedScores = storedScores.slice(0, 10);
    
    localStorage.setItem('snakeHighScores', JSON.stringify(storedScores));
    return storedScores;
  } catch (e) {
    highScores.push(scoreEntry);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    return highScores;
  }
}

export function loadScores() {
  try {
    const saved = localStorage.getItem('snakeHighScores');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (e) {
    return highScores.length > 0 ? highScores : [];
  }
}

export function displayHighScores() {
  const scoreList = document.getElementById('scoreList');
  if (!scoreList) return;
  
  scoreList.innerHTML = '';
  
  const scoresToDisplay = loadScores();
  
  if (scoresToDisplay.length === 0) {
    scoreList.innerHTML = '<div class="score-entry">No scores yet</div>';
    return;
  }
  
  scoresToDisplay.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'score-entry';
    entryDiv.innerHTML = `<strong>#${index + 1}</strong>: ${entry.player} - ${entry.score} points - ${entry.date}`;
    scoreList.appendChild(entryDiv);
  });
}

