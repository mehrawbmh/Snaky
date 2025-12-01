// Settings Management
import { setLoggingEnabled } from './UI.js';

export class Settings {
  constructor() {
    this.playerName = "Player";
    this.snakeColor = '#0000ff';
    this.template = 'classic';
    this.obstacleColorMode = 'random';
    this.singleObstacleColor = '#8B0000';
    this.bulletColor = '#ffff00';
    this.bulletSize = 3;
    this.bulletSpeed = 1;
    this.showScoreboard = true;
    this.showLogging = false; // Default false
    this.enableFoodEffects = true;
    
    // New Settings
    this.enableWalls = true;
    this.wallColor = '#555555';
    this.showStatus = false; // Default false
    
    this.isOpen = false;
  }
  
  openSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    this.isOpen = true;
    
    document.getElementById('playerNameInput').value = this.playerName;
    document.getElementById('snakeColorInput').value = this.snakeColor;
    document.getElementById('snakeColorDisplay').textContent = this.snakeColor;
    document.getElementById('templateSelect').value = this.template;
    document.getElementById('obstacleColorMode').value = this.obstacleColorMode;
    document.getElementById('singleObstacleColor').value = this.singleObstacleColor;
    document.getElementById('bulletColorInput').value = this.bulletColor;
    document.getElementById('bulletColorDisplay').textContent = this.bulletColor;
    document.getElementById('bulletSizeInput').value = this.bulletSize;
    document.getElementById('bulletSpeedInput').value = this.bulletSpeed;
    document.getElementById('showScoreboardToggle').checked = this.showScoreboard;
    document.getElementById('showLoggingToggle').checked = this.showLogging;
    document.getElementById('enableFoodEffectsToggle').checked = this.enableFoodEffects;
    
    // New Settings UI
    document.getElementById('enableWallsToggle').checked = this.enableWalls;
    document.getElementById('wallColorInput').value = this.wallColor;
    document.getElementById('wallColorDisplay').textContent = this.wallColor;
    document.getElementById('showStatusToggle').checked = this.showStatus;

    this.updateObstacleColorPicker();
    this.updateWallColorPicker(); // Helper to show/hide wall color input based on toggle? Or just always show.
    modal.style.display = 'flex';
  }
  
  closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.isOpen = false;
  }
  
  applySettings() {
    const nameInput = document.getElementById('playerNameInput');
    if (nameInput && nameInput.value.trim() !== '') {
      this.playerName = nameInput.value.trim();
    }
    
    this.snakeColor = document.getElementById('snakeColorInput').value;
    this.template = document.getElementById('templateSelect').value;
    this.obstacleColorMode = document.getElementById('obstacleColorMode').value;
    this.singleObstacleColor = document.getElementById('singleObstacleColor').value;
    this.bulletColor = document.getElementById('bulletColorInput').value;
    this.bulletSize = parseInt(document.getElementById('bulletSizeInput').value);
    this.bulletSpeed = parseInt(document.getElementById('bulletSpeedInput').value);
    this.showScoreboard = document.getElementById('showScoreboardToggle').checked;
    this.showLogging = document.getElementById('showLoggingToggle').checked;
    this.enableFoodEffects = document.getElementById('enableFoodEffectsToggle').checked;
    
    // New Settings Apply
    this.enableWalls = document.getElementById('enableWallsToggle').checked;
    this.wallColor = document.getElementById('wallColorInput').value;
    this.showStatus = document.getElementById('showStatusToggle').checked;

    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
      scoreboard.classList.toggle('hidden', !this.showScoreboard);
    }
    
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
      logContainer.classList.toggle('hidden', !this.showLogging);
    }
    
    // Status Visibility
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.classList.toggle('hidden', !this.showStatus);
    }

    setLoggingEnabled(this.showLogging);
    this.closeSettings();
    
    return this.getAllSettings();
  }
  
  updateObstacleColorPicker() {
    const mode = document.getElementById('obstacleColorMode').value;
    const picker = document.getElementById('singleObstacleColorPicker');
    if (picker) {
      picker.style.display = mode === 'single' ? 'block' : 'none';
    }
  }
  
  updateWallColorPicker() {
      // Can implement logic here if we want to hide wall color when walls are disabled
      const enabled = document.getElementById('enableWallsToggle').checked;
      const container = document.getElementById('wallColorContainer');
      if (container) {
          container.style.opacity = enabled ? '1' : '0.5';
          container.style.pointerEvents = enabled ? 'auto' : 'none';
      }
  }

  getAllSettings() {
    return {
      playerName: this.playerName,
      snakeColor: this.snakeColor,
      template: this.template,
      obstacleColorMode: this.obstacleColorMode,
      singleObstacleColor: this.singleObstacleColor,
      bulletColor: this.bulletColor,
      bulletSize: this.bulletSize,
      bulletSpeed: this.bulletSpeed,
      showScoreboard: this.showScoreboard,
      showLogging: this.showLogging,
      enableFoodEffects: this.enableFoodEffects,
      enableWalls: this.enableWalls,
      wallColor: this.wallColor,
      showStatus: this.showStatus
    };
  }
}

