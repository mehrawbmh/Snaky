// UI Management
import { CONFIG } from './config.js';

let showLogging = true;

export function setLoggingEnabled(enabled) {
  showLogging = enabled;
}

export function updateScore(score) {
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = score;
  }
}

export function updateSpeed(speeds, currentSpeedIndex) {
  const speedElement = document.getElementById('speed');
  if (speedElement) {
    speedElement.textContent = speeds[currentSpeedIndex].name;
  }
}

export function updateStatus(message) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
  log(message);
}

export function log(message) {
  if (!showLogging) return;
  
  const logContainer = document.getElementById('logContainer');
  if (!logContainer) return;
  
  const logDiv = document.createElement('div');
  logDiv.className = 'log-message';
  logDiv.textContent = message;
  
  logContainer.appendChild(logDiv);
  
  setTimeout(() => {
    logDiv.classList.add('fade-out');
    setTimeout(() => {
      if (logDiv.parentNode === logContainer) {
        logContainer.removeChild(logDiv);
      }
    }, 500);
  }, CONFIG.LOG_DISPLAY_TIME);
  
  while (logContainer.children.length > CONFIG.MAX_LOG_MESSAGES) {
    logContainer.removeChild(logContainer.firstChild);
  }
}

export function showPlayButton() {
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.classList.remove('hidden');
  }
}

export function hidePlayButton() {
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.classList.add('hidden');
  }
}

export function showGameOver(canvas, score, playerName) {
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
  
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText(`${playerName}, press PLAY to restart`, canvas.width / 2, canvas.height / 2 + 50);
  
  showPlayButton();
}

