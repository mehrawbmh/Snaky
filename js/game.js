// Main Game Module
import { CONFIG, SPEEDS, FOOD_EFFECT_DELAY, FOOD_EFFECT_DURATION } from './config.js';
import { CanvasManager } from './canvas.js';
import { Snake } from './snake.js';
import { FoodManager } from './food.js';
import { ObstacleManager } from './obstacles.js';
import { BulletManager } from './bullets.js';
import { ParticleManager } from './particles.js';
import { Settings } from './settings.js';
import { InputManager } from './input.js';
import { updateScore, updateSpeed, updateStatus, log, hidePlayButton, showPlayButton, showGameOver } from './ui.js';
import { saveScore, displayHighScores } from './storage.js';

export class Game {
  constructor() {
    this.canvasManager = new CanvasManager('gameCanvas');
    this.snake = new Snake();
    this.foodManager = new FoodManager();
    this.obstacleManager = new ObstacleManager();
    this.bulletManager = new BulletManager();
    this.particleManager = new ParticleManager();
    this.settings = new Settings();
    this.inputManager = new InputManager(this);
    
    this.score = 0;
    this.currentSpeedIndex = 0;
    this.gameOver = false;
    this.gameRunning = false;
    this.gameStarted = false;
    this.lastFrameTime = 0;
    this.gameLoopId = null;
    
    // Drunk state
    this.isDrunk = false;
    this.drunkStartTime = 0;
    this.drunkEndTime = 0;
    this.drunkMoveCounter = 0;
    
    // Food effect state
    this.foodEffectActive = false;
    this.foodEffectStartTime = 0;
    this.foodEffectEndTime = 0;
    this.foodEffectColor = null;
    this.foodEffectTemplate = null;
    this.pendingEffectColor = null; // New effect waiting to activate
    this.pendingEffectTemplate = null;
    this.originalSnakeColor = null;
    this.originalTemplate = null;
    
    this.setupEventListeners();
    this.setupCanvasResize();
  }
  
  setupEventListeners() {
    // Settings modal events
    document.getElementById('snakeColorInput').addEventListener('input', function() {
      document.getElementById('snakeColorDisplay').textContent = this.value;
    });
    
    document.getElementById('bulletColorInput').addEventListener('input', function() {
      document.getElementById('bulletColorDisplay').textContent = this.value;
    });
    
    document.getElementById('obstacleColorMode').addEventListener('change', () => {
      this.settings.updateObstacleColorPicker();
    });
  }
  
  setupCanvasResize() {
    window.addEventListener('resize', () => {
      if (this.gameRunning) {
        this.draw();
      }
    });
  }
  
  init() {
    hidePlayButton();
    
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    
    // Reset game state
    this.snake.reset();
    this.score = 0;
    this.currentSpeedIndex = 0;
    this.gameOver = false;
    this.gameRunning = true;
    this.lastFrameTime = 0;
    
    // Reset managers
    this.bulletManager.reset();
    this.particleManager.reset();
    this.isDrunk = false;
    this.drunkStartTime = 0;
    this.drunkEndTime = 0;
    this.drunkMoveCounter = 0;
    
    // Reset food effects
    this.foodEffectActive = false;
    this.foodEffectStartTime = 0;
    this.foodEffectEndTime = 0;
    this.foodEffectColor = null;
    this.foodEffectTemplate = null;
    this.pendingEffectColor = null;
    this.pendingEffectTemplate = null;
    this.originalSnakeColor = null;
    this.originalTemplate = null;
    
    // Get current settings
    const currentSettings = this.settings.getAllSettings();
    
    // Update managers with settings
    this.obstacleManager.setColorMode(currentSettings.obstacleColorMode, currentSettings.singleObstacleColor);
    this.bulletManager.setBulletSettings(currentSettings.bulletColor, currentSettings.bulletSize, currentSettings.bulletSpeed);
    
    // Generate obstacles
    this.obstacleManager.generate(5, this.snake.getSegments(), this.canvasManager.getTileCount());
    
    // Generate food
    this.foodManager.generate(
      this.snake.getSegments(),
      this.obstacleManager.getObstacles(),
      this.bulletManager.getBullets(),
      this.canvasManager.getTileCount()
    );
    
    // Update displays
    updateScore(this.score);
    updateSpeed(SPEEDS, this.currentSpeedIndex);
    updateStatus("Ready");
    
    // Start game loop
    this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  start() {
    this.gameStarted = true;
    this.init();
  }
  
  gameLoop(currentTime) {
    if (!this.gameRunning) return;
    
    this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      this.draw();
      return;
    }
    
    const deltaTime = currentTime - this.lastFrameTime;
    const targetDelay = SPEEDS[this.currentSpeedIndex].delay;
    
    if (deltaTime < targetDelay) {
      return;
    }
    
    this.lastFrameTime = currentTime;
    
    if (this.gameOver) return;
    
    // Check if food expired
    if (this.foodManager.isExpired()) {
      log('Food disappeared! New food spawned.');
      updateStatus('Food disappeared!');
      this.foodManager.generate(
        this.snake.getSegments(),
        this.obstacleManager.getObstacles(),
        this.bulletManager.getBullets(),
        this.canvasManager.getTileCount()
      );
    }
    
    const velocity = this.snake.getVelocity();
    
    // Check and apply food effects (200ms delay)
    const currentSettings = this.settings.getAllSettings();
    if (currentSettings.enableFoodEffects && this.foodEffectStartTime > 0 && !this.foodEffectActive) {
      if (Date.now() >= this.foodEffectStartTime + FOOD_EFFECT_DELAY) {
        // Activate the pending effect
        this.foodEffectActive = true;
        this.foodEffectColor = this.pendingEffectColor;
        this.foodEffectTemplate = this.pendingEffectTemplate;
        log(`✨ ${this.foodEffectTemplate.toUpperCase()} effect activated!`);
        updateStatus(`✨ ${this.foodEffectTemplate.toUpperCase()} mode!`);
      }
    }
    
    // Check if food effect should end
    if (this.foodEffectActive && Date.now() >= this.foodEffectEndTime) {
      this.foodEffectActive = false;
      this.foodEffectStartTime = 0;
      this.foodEffectColor = null;
      this.foodEffectTemplate = null;
      this.pendingEffectColor = null;
      this.pendingEffectTemplate = null;
      log('Effect ended - back to normal');
      updateStatus('Effect ended');
    }
    
    if (velocity.x !== 0 || velocity.y !== 0) {
      // Check drunk state
      if (!this.isDrunk && this.drunkStartTime > 0 && Date.now() >= this.drunkStartTime + CONFIG.DRUNK_DELAY) {
        this.isDrunk = true;
        updateStatus('🍺 DRUNK! Snake moves randomly!');
        log('Drunk effect started!');
      }
      
      if (this.isDrunk && Date.now() > this.drunkEndTime) {
        this.isDrunk = false;
        this.drunkStartTime = 0;
        updateStatus('Sober again!');
        log('Drunk effect ended');
      }
      
      // Determine actual movement direction
      let moveX = velocity.x;
      let moveY = velocity.y;
      
      if (this.isDrunk) {
        this.drunkMoveCounter++;
        if (this.drunkMoveCounter % 2 === 0) {
          const directions1 = [{x: 0, y: -1}, {x: 0, y: 1}];
          const directions2 = [{x: 1, y: 0}, {x: -1, y: 0}];
          
          let selectedDirections;
          
          if (velocity.x <= -1) {
            selectedDirections = directions1;
          } else if (velocity.x >= 1) {
            selectedDirections = directions1;
          } else if (velocity.y <= -1) {
            selectedDirections = directions2;
          } else if (velocity.y >= 1) {
            selectedDirections = directions2;
          } else {
            selectedDirections = directions1;
          }
          
          const randomDir = selectedDirections[Math.floor(Math.random() * selectedDirections.length)];
          moveX = randomDir.x;
          moveY = randomDir.y;
        }
      }
      
      // Move snake
      const newHead = this.snake.move(moveX, moveY, this.canvasManager.getTileCount());
      
      // Check self collision
      if (this.snake.checkSelfCollision(newHead.x, newHead.y)) {
        this.endGame();
        return;
      }
      
      // Check obstacle collision
      if (this.obstacleManager.checkCollision(newHead.x, newHead.y)) {
        this.endGame();
        return;
      }
      
      // Add new head
      this.snake.addHead(newHead.x, newHead.y);
      
      // Check if food eaten
      const food = this.foodManager.getFood();
      if (food && newHead.x === food.x && newHead.y === food.y) {
        this.handleFoodEaten(food);
      } else {
        this.snake.removeTail();
      }
      
      // Update bullets
      this.bulletManager.update(
        this.obstacleManager.getObstacles(),
        this.canvasManager.getTileCount(),
        (obstacle, obstacleIndex) => {
          this.particleManager.createExplosion(
            obstacle.x * this.canvasManager.getGridSize() + this.canvasManager.getGridSize()/2,
            obstacle.y * this.canvasManager.getGridSize() + this.canvasManager.getGridSize()/2,
            obstacle.color
          );
          
          if (obstacle.health <= 0) {
            this.obstacleManager.getObstacles().splice(obstacleIndex, 1);
            this.score += 5;
            updateScore(this.score);
            log("Obstacle destroyed! +5 points");
            updateStatus("Obstacle destroyed!");
          }
        }
      );
      
      // Generate trail particles
      const currentSettings = this.settings.getAllSettings();
      this.particleManager.generateTrailParticles(
        this.snake.getSegments(),
        this.canvasManager.getGridSize(),
        currentSettings.template,
        this.currentSpeedIndex,
        this.snake.animationFrame
      );
      
      this.particleManager.limitParticles();
    }
    
    this.draw();
  }
  
  handleFoodEaten(food) {
    // Handle special foods
    if (food.type === 'toxic') {
      log('☠️ Toxic food eaten! GAME OVER!');
      updateStatus('☠️ Toxic! You died!');
      this.endGame();
      return;
    }
    
    // Add score
    this.score += food.points;
    updateScore(this.score);
    
    // Handle beer drunk effect
    if (food.type === 'beer') {
      this.drunkStartTime = Date.now();
      this.drunkEndTime = Date.now() + CONFIG.DRUNK_DELAY + CONFIG.DRUNK_DURATION;
      this.drunkMoveCounter = 0;
      log(`🍺 Beer consumed! Drunk effect in 1 second... +${food.points} points`);
      updateStatus('🍺 Beer consumed! Drunk effect starting soon...');
    } else {
      log(`${food.emoji} ${food.name} eaten! +${food.points} point${food.points > 1 ? 's' : ''}`);
      updateStatus(`${food.emoji} ${food.name} +${food.points}`);
    }
    
    // Apply visual food effect (if enabled)
    const currentSettings = this.settings.getAllSettings();
    if (currentSettings.enableFoodEffects && food.effect) {
      // Store original settings if not already stored
      if (!this.originalSnakeColor) {
        this.originalSnakeColor = currentSettings.snakeColor;
        this.originalTemplate = currentSettings.template;
      }
      
      // Set new PENDING effect (will be applied after delay)
      this.pendingEffectColor = food.effect.color;
      this.pendingEffectTemplate = food.effect.template;
      this.foodEffectStartTime = Date.now();
      this.foodEffectEndTime = Date.now() + FOOD_EFFECT_DELAY + FOOD_EFFECT_DURATION;
      
      // Mark as not active yet - will activate after delay
      // This allows the activation check to trigger
      this.foodEffectActive = false;
      
      log(`⏳ Visual effect starting in ${FOOD_EFFECT_DELAY}ms...`);
    }
    
    // Generate new food
    this.foodManager.generate(
      this.snake.getSegments(),
      this.obstacleManager.getObstacles(),
      this.bulletManager.getBullets(),
      this.canvasManager.getTileCount()
    );
  }
  
  draw() {
    const ctx = this.canvasManager.getContext();
    const gridSize = this.canvasManager.getGridSize();
    const currentSettings = this.settings.getAllSettings();
    
    // Determine snake color and template
    let snakeColor = currentSettings.snakeColor;
    let snakeTemplate = currentSettings.template;
    
    // If a food effect is currently active, use it
    if (this.foodEffectActive && this.foodEffectColor) {
      snakeColor = this.foodEffectColor;
      snakeTemplate = this.foodEffectTemplate;
    }
    // If we're in transition (pending effect), keep showing current active effect
    // This prevents flashing back to original color during the 200ms delay
    else if (this.foodEffectStartTime > 0 && this.foodEffectColor) {
      // Keep showing the current effect during transition to new effect
      snakeColor = this.foodEffectColor;
      snakeTemplate = this.foodEffectTemplate;
    }
    
    this.canvasManager.clear();
    this.obstacleManager.draw(ctx, gridSize);
    this.bulletManager.draw(ctx, gridSize);
    this.particleManager.updateAndDrawExplosions(ctx);
    this.foodManager.draw(ctx, gridSize);
    this.snake.draw(ctx, gridSize, snakeColor, snakeTemplate);
    this.particleManager.updateAndDrawParticles(ctx);
  }
  
  endGame() {
    this.gameOver = true;
    this.gameRunning = false;
    
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    
    log(`Game Over! Final score: ${this.score}`);
    
    if (this.score > 0) {
      const currentSettings = this.settings.getAllSettings();
      saveScore(this.score, currentSettings.playerName);
    }
    displayHighScores();
    
    showGameOver(this.canvasManager.getCanvas(), this.score, this.settings.getAllSettings().playerName);
  }
  
  shootBullet() {
    const velocity = this.snake.getVelocity();
    if ((velocity.x !== 0 || velocity.y !== 0) && !this.gameOver) {
      const success = this.bulletManager.shoot(this.snake.getSegments(), velocity.x, velocity.y);
      if (success) {
        log("Shot fired!");
        updateStatus("Shot fired!");
      }
    }
  }
  
  increaseSpeed() {
    const velocity = this.snake.getVelocity();
    if (velocity.x !== 0 || velocity.y !== 0 || this.gameOver) {
      this.currentSpeedIndex = (this.currentSpeedIndex + 1) % SPEEDS.length;
      updateSpeed(SPEEDS, this.currentSpeedIndex);
      updateStatus(`Speed: ${SPEEDS[this.currentSpeedIndex].name}`);
    }
  }
  
  decreaseSpeed() {
    const velocity = this.snake.getVelocity();
    if (velocity.x !== 0 || velocity.y !== 0 || this.gameOver) {
      this.currentSpeedIndex = (this.currentSpeedIndex - 1 + SPEEDS.length) % SPEEDS.length;
      updateSpeed(SPEEDS, this.currentSpeedIndex);
      updateStatus(`Speed: ${SPEEDS[this.currentSpeedIndex].name}`);
    }
  }
  
  getSnakeVelocity() {
    return this.snake.getVelocity();
  }
  
  setSnakeVelocity(x, y) {
    this.snake.setVelocity(x, y);
  }
}

// Global functions to expose to HTML
let gameInstance = null;

window.startGame = function() {
  if (!gameInstance) {
    gameInstance = new Game();
  }
  gameInstance.start();
};

window.openSettings = function() {
  if (!gameInstance) {
    gameInstance = new Game();
  }
  gameInstance.settings.openSettings();
};

window.closeSettings = function() {
  if (gameInstance) {
    gameInstance.settings.closeSettings();
  }
};

window.applySettings = function() {
  if (gameInstance) {
    gameInstance.settings.applySettings();
    log("Settings saved! Press the PLAY button to start.");
    showPlayButton();
  }
};

// Initialize on page load
window.onload = function() {
  gameInstance = new Game();
  displayHighScores();
  openSettings();
};

