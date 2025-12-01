// UI Management
import { CONFIG } from '../config/Config.js';

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
  // We should not toggle hidden here, as it might override the settings
  // Just update text if it exists and is not explicitly hidden by settings logic elsewhere
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
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate positions to avoid the centered Play Button (approx 120px height)
  // Button occupies roughly centerY - 60 to centerY + 60
  const centerY = canvas.height / 2;
  
  // Title higher up
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#ff3333';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 10;
  ctx.fillText('GAME OVER', canvas.width / 2, centerY - 150);
  ctx.shadowBlur = 0;
  
  // Score below title, but still well above the button
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2, centerY - 100);
  
  // Instructions well below the button
  ctx.font = '16px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`${playerName}, press SPACE or click PLAY to restart`, canvas.width / 2, centerY + 100);
  
  showPlayButton();
}

