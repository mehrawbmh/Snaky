// Main Game Module
import { CONFIG, SPEEDS, FOOD_EFFECT_DELAY, FOOD_EFFECT_DURATION, DIFFICULTY_LEVELS, POLICE_SNAKE_CONFIG } from '../config/Config.js';
import { playGameStartSound, playGameOverCollisionSound, playEatFruitFisss } from '../audio/GameAudio.js';
import { CanvasManager } from './Canvas.js';
import { Snake } from '../entities/Snake.js';
import { PoliceSnake } from '../entities/PoliceSnake.js';
import { FoodManager } from '../entities/Food.js';
import { ObstacleManager } from '../entities/Obstacles.js';
import { BulletManager } from '../entities/Bullets.js';
import { ParticleManager } from '../entities/Particles.js';
import { Settings } from '../ui/Settings.js';
import { InputManager } from './Input.js';
import { updateScore, updateSpeed, updateStatus, log, hidePlayButton, showPlayButton, showGameOver } from '../ui/UI.js';
import { saveScore, displayHighScores } from './Storage.js';
import '../styles/main.css';

export class Game {
  constructor() {
    this.canvasManager = new CanvasManager('gameCanvas');
    this.snake = new Snake();
    this.policeSnake = new PoliceSnake(this.canvasManager.getTileCount());
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
    
    // Time accumulator for smooth loop
    this.timeAccumulator = 0;
    
    // Police snake state
    this.policeSnakeEnabled = false;
    this.policeSpawnTime = 0;
    this.policeTimeAccumulator = 0;
    
    // Drunk state
    this.isDrunk = false;
    this.drunkStartTime = 0;
    this.drunkEndTime = 0;
    this.drunkMoveCounter = 0;
    
    // Dying Animation State
    this.isDying = false;
    this.dyingStartTime = 0;
    this.deathByPolice = false; // Track if killed by police
    
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

    this.awaitingFirstMove = false;
    this.deathReason = 'default';
    
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
      if (this.gameRunning || this.isDying) {
        this.draw(1); // Force draw
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
    this.timeAccumulator = 0;
    this.isDying = false; // Reset dying state
    
    // Reset managers
    this.bulletManager.reset();
    this.particleManager.reset();
    this.isDrunk = false;
    this.drunkStartTime = 0;
    this.drunkEndTime = 0;
    this.drunkMoveCounter = 0;
    
    // Reset police snake state
    this.policeSnake.setInitialLength(POLICE_SNAKE_CONFIG.initialLength);
    this.policeSnake.reset(this.canvasManager.getTileCount());
    this.policeSnakeEnabled = false;
    this.policeSpawnTime = Number.MAX_SAFE_INTEGER;
    this.policeTimeAccumulator = 0;
    this.deathByPolice = false;
    this.awaitingFirstMove = true;
    
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
    
    // Apply Status Visibility Immediately on Init
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.classList.toggle('hidden', !currentSettings.showStatus);
    }

    // Generate obstacles based on difficulty
    const difficultyConfig = DIFFICULTY_LEVELS[currentSettings.difficulty] || DIFFICULTY_LEVELS.medium;
    const obstacleCount = Math.floor(
      Math.random() * (difficultyConfig.obstacleMax - difficultyConfig.obstacleMin + 1)
    ) + difficultyConfig.obstacleMin;
    
    this.obstacleManager.generate(
        obstacleCount, 
        this.snake.getSegments(), 
        this.canvasManager.getTileCount(), 
        currentSettings.enableWalls
    );
    
    // Initialize police snake for hard mode (spawn timer starts after first move)
    if (difficultyConfig.policeSnake) {
      this.policeSnakeEnabled = true;
      this.policeSpawnTime = Number.MAX_SAFE_INTEGER;
      this.policeSnake.setDirectionDelay(POLICE_SNAKE_CONFIG.directionDelay);
      log('🚔 HARD MODE: Police arrives a few seconds after you start moving.');
    }
    
    // Food appears only after the first direction (see setSnakeVelocity)
    this.foodManager.clearFood();

    // Update displays
    updateScore(this.score);
    updateSpeed(SPEEDS, this.currentSpeedIndex);
    updateStatus('Choose a direction to begin');
    
    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }
  
  start() {
    this.gameStarted = true;
    this.init();
  }
  
  gameLoop(currentTime) {
    if (!this.gameRunning && !this.isDying) return;
    
    this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    
    if (this.policeSnakeEnabled) {
      this.policeSnake.updateDeathState();
    }

    // Handle Dying Animation
    if (this.isDying) {
        const dyingDuration = 1500;
        const progress = (currentTime - this.dyingStartTime) / dyingDuration;
        
        if (progress >= 1) {
            this.isDying = false;
            this.showGameOverScreen();
            return;
        }
        
        // Draw dying frame
        this.draw(1, progress);
        return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Cap delta time to prevent spiral of death on lag
    const safeDelta = Math.min(deltaTime, 100);
    
    this.timeAccumulator += safeDelta;
    
    const targetDelay = SPEEDS[this.currentSpeedIndex].delay;
    
    // Update Logic Fixed Timestep
    while (this.timeAccumulator >= targetDelay) {
        this.update();
        this.timeAccumulator -= targetDelay;
    }
    
    // Police snake has its own timing (speed 1.1x by default)
    if (this.policeSnakeEnabled && this.policeSnake.active && !this.awaitingFirstMove) {
      const policeDelay = targetDelay / this.policeSnake.speed;
      this.policeTimeAccumulator += safeDelta;
      
      while (this.policeTimeAccumulator >= policeDelay) {
        this.updatePoliceSnake();
        this.policeTimeAccumulator -= policeDelay;
      }
    }
    
    // Interpolation factor for smooth rendering
    const alpha = this.timeAccumulator / targetDelay;
    
    this.draw(alpha);
  }

  update() {
      if (this.gameOver || this.isDying) return;
      if (this.awaitingFirstMove) return;

      // Check if police snake should spawn
      if (
        this.policeSnakeEnabled &&
        !this.policeSnake.wasDefeated &&
        !this.policeSnake.active &&
        Date.now() >= this.policeSpawnTime
      ) {
        const spawnSettings = this.settings.getAllSettings();
        this.policeSnake.placeSpawnAwayFrom(
          this.snake.getSegments(),
          this.obstacleManager.getObstacles(),
          this.canvasManager.getTileCount(),
          spawnSettings.enableWalls
        );
        this.policeSnake.activate();
        log('🚔 POLICE SNAKE HAS SPAWNED! RUN!');
        updateStatus('🚔 POLICE SNAKE ACTIVE!');
      }

      // Check if food expired
    if (this.foodManager.isExpired()) {
      log('Food disappeared! New food spawned.');
      updateStatus('Food disappeared!');
      const currentSettings = this.settings.getAllSettings(); // Need settings for wall info
      this.foodManager.generate(
        this.snake.getSegments(),
        this.obstacleManager.getObstacles(),
        this.bulletManager.getBullets(),
        this.canvasManager.getTileCount(),
        currentSettings.enableWalls
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
      // const currentSettings = this.settings.getAllSettings(); // Remove redeclaration
      const newHead = this.snake.move(moveX, moveY, this.canvasManager.getTileCount(), currentSettings.enableWalls);
      
      // Check wall collision (if walls enabled, newHead might be out of bounds)
      // If move returned same position (clamped) or out of bounds?
      // Snake.move logic: if walls enabled, it returns out-of-bounds coordinate.
      if (currentSettings.enableWalls) {
          const tileCount = this.canvasManager.getTileCount();
          // Walls are drawn at index 0 and index tileCount-1 (if we view them as 1-tile thick borders inside the canvas)
          // BUT, the grid usually starts at 0.
          // If I draw a wall at `rect(0,0,width,gridSize)`, that covers row 0.
          // So row 0 is deadly.
          // If I draw a wall at `rect(0,height-gridSize,width,gridSize)`, that covers row tileCount-1.
          // So row tileCount-1 is deadly.
          // Same for cols 0 and tileCount-1.
          
          // Therefore, safe range is 1 to tileCount-2.
          if (newHead.x <= 0 || newHead.y <= 0 || newHead.x >= tileCount - 1 || newHead.y >= tileCount - 1) {
              this.triggerGameOverSequence('wall');
              return;
          }
      }

      // Check self collision
      if (this.snake.checkSelfCollision(newHead.x, newHead.y)) {
        this.triggerGameOverSequence('self');
        return;
      }
      
      // Check obstacle collision
      if (this.obstacleManager.checkCollision(newHead.x, newHead.y)) {
        this.triggerGameOverSequence('obstacle');
        return;
      }
      
      // Add new head
      this.snake.addHead(newHead.x, newHead.y);

      if (
        this.policeSnakeEnabled &&
        this.policeSnake.active &&
        !this.policeSnake.dying &&
        this.policeSnake.checkMutualBodyCollision(this.snake.getSegments())
      ) {
        log('🚔 Body collision with police!');
        updateStatus('🚔 Hit the police snake!');
        this.triggerGameOverSequence('police');
        return;
      }
      
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
        },
        currentSettings.enableWalls,
        (px, py, nx, ny) =>
          this.policeSnakeEnabled &&
          this.policeSnake.active &&
          !this.policeSnake.dying &&
          this.policeSnake.tryHitFromBullet(px, py, nx, ny)
      );
      
      // Generate trail particles
      // const currentSettings = this.settings.getAllSettings(); // Remove redeclaration
      this.particleManager.generateTrailParticles(
        this.snake.getSegments(),
        this.canvasManager.getGridSize(),
        currentSettings.template,
        this.currentSpeedIndex,
        this.snake.animationFrame
      );
      
      this.particleManager.limitParticles();
    }
  }
  
  updatePoliceSnake() {
    if (!this.policeSnake.active || this.policeSnake.dying || this.gameOver || this.isDying) return;

    const currentSettings = this.settings.getAllSettings();
    const newHead = this.policeSnake.computeNextMove(
      this.obstacleManager.getObstacles(),
      this.snake.getHead(),
      currentSettings.enableWalls
    );
    if (!newHead) return;

    this.policeSnake.addHead(newHead.x, newHead.y);

    if (this.policeSnake.checkMutualBodyCollision(this.snake.getSegments())) {
      log('🚔 ARRESTED! The Police Snake caught you!');
      updateStatus('🚔 ARRESTED!');
      this.triggerGameOverSequence('police');
      return;
    }
    
    // Check if police ate food (accidentally)
    const food = this.foodManager.getFood();
    if (this.policeSnake.checkFoodCollision(food)) {
      // Police ate the food - speed up to match player
      const playerSpeedMultiplier = SPEEDS[this.currentSpeedIndex].multiplier;
      this.policeSnake.matchPlayerSpeed(playerSpeedMultiplier);
      log('🚔 Police ate food! Speed increased!');
      updateStatus('🚔 Police getting faster!');
      
      // Generate new food
      const currentSettings = this.settings.getAllSettings();
      this.foodManager.generate(
        this.snake.getSegments(),
        this.obstacleManager.getObstacles(),
        this.bulletManager.getBullets(),
        this.canvasManager.getTileCount(),
        currentSettings.enableWalls
      );
      
      // Don't remove tail - police grows when eating
    } else {
      // Normal movement - remove tail
      this.policeSnake.removeTail();
    }
  }
  
  handleFoodEaten(food) {
    // Handle special foods
    if (food.type === 'toxic') {
      log('☠️ Toxic food eaten! GAME OVER!');
      updateStatus('☠️ Toxic! You died!');
      this.triggerGameOverSequence('obstacle');
      return;
    }

    playEatFruitFisss();

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
      this.canvasManager.getTileCount(),
      currentSettings.enableWalls
    );
  }
  
  draw(alpha = 1, dyingProgress = 0) {
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
    else if (this.foodEffectStartTime > 0 && this.foodEffectColor) {
      snakeColor = this.foodEffectColor;
      snakeTemplate = this.foodEffectTemplate;
    }
    
    this.canvasManager.clear();
    
    // Draw Walls if enabled
    if (currentSettings.enableWalls) {
        const wallColor = currentSettings.wallColor;
        // Draw 4 rectangles for border
        // Top
        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, ctx.canvas.width, gridSize);
        // Bottom
        ctx.fillRect(0, ctx.canvas.height - gridSize, ctx.canvas.width, gridSize);
        // Left
        ctx.fillRect(0, 0, gridSize, ctx.canvas.height);
        // Right
        ctx.fillRect(ctx.canvas.width - gridSize, 0, gridSize, ctx.canvas.height);
        
        // Add some texture/detail to walls
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        // Basic brick pattern
        const brickSize = gridSize * 2;
        
        ctx.beginPath();
        // Top & Bottom
        for (let i = 0; i < ctx.canvas.width; i += brickSize) {
             ctx.rect(i, 0, brickSize, gridSize);
             ctx.rect(i + brickSize/2, ctx.canvas.height - gridSize, brickSize, gridSize);
        }
        // Left & Right
        for (let i = 0; i < ctx.canvas.height; i += brickSize) {
             ctx.rect(0, i, gridSize, brickSize);
             ctx.rect(ctx.canvas.width - gridSize, i + brickSize/2, gridSize, brickSize);
        }
        ctx.stroke();
    }

    this.obstacleManager.draw(ctx, gridSize);
    this.bulletManager.draw(ctx, gridSize);
    this.particleManager.updateAndDrawExplosions(ctx);
    if (!this.awaitingFirstMove) {
      this.foodManager.draw(ctx, gridSize);
    }
    
    // Draw snake with interpolation or dying effect
    this.snake.draw(ctx, gridSize, snakeColor, snakeTemplate, alpha, dyingProgress);
    
    // Draw police snake (if active in hard mode)
    if (this.policeSnakeEnabled && (this.policeSnake.active || this.policeSnake.dying)) {
      this.policeSnake.draw(ctx, gridSize, alpha);
    }
    
    this.particleManager.updateAndDrawParticles(ctx);
  }
  
  triggerGameOverSequence(reason = 'default') {
      this.deathReason = reason;
      this.deathByPolice = reason === 'police';
      playGameOverCollisionSound(reason);
      this.isDying = true;
      this.gameRunning = false;
      this.dyingStartTime = performance.now();

      log('💥 CRASH! Game Over sequence initiated...');
      this.snake.triggerDeathAnimation();
  }

  showGameOverScreen() {
    this.gameOver = true;
    this.gameRunning = false;
    this.isDying = false;
    
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    
    if (this.deathByPolice) {
      log(`🚔 ARRESTED! Final score: ${this.score}`);
    } else {
      log(`Game Over! Final score: ${this.score}`);
    }
    
    if (this.score > 0) {
      const currentSettings = this.settings.getAllSettings();
      saveScore(this.score, currentSettings.playerName);
    }
    displayHighScores();
    
    // Show custom death screen for police
    if (this.deathByPolice) {
      this.showPoliceDeathScreen();
    } else {
      showGameOver(this.canvasManager.getCanvas(), this.score, this.settings.getAllSettings().playerName);
    }
  }
  
  showPoliceDeathScreen() {
    const canvas = this.canvasManager.getCanvas();
    const ctx = canvas.getContext('2d');
    const playerName = this.settings.getAllSettings().playerName;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerY = canvas.height / 2;
    
    // Flashing siren effect on background
    const sirenPhase = Date.now() / 200;
    const sirenColor = Math.sin(sirenPhase) > 0 ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 100, 255, 0.1)';
    ctx.fillStyle = sirenColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText('🚔 ARRESTED! 🚔', canvas.width / 2, centerY - 150);
    ctx.shadowBlur = 0;
    
    // Subtitle
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('☠️ TOXICATED BY VENOM ☠️', canvas.width / 2, centerY - 100);
    
    // Score
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Final Score: ${this.score}`, canvas.width / 2, centerY - 50);
    
    // Message
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('The Police Snake caught you!', canvas.width / 2, centerY + 80);
    ctx.fillText(`${playerName}, press SPACE or click PLAY to try again`, canvas.width / 2, centerY + 110);
    
    showPlayButton();
  }

  // Kept for compatibility if needed, but showGameOverScreen is the new internal one
  endGame() {
      this.triggerGameOverSequence('default');
  }
  
  shootBullet() {
    const velocity = this.snake.getVelocity();
    if (
      (velocity.x !== 0 || velocity.y !== 0) &&
      !this.gameOver &&
      !this.isDying &&
      !this.awaitingFirstMove
    ) {
      const success = this.bulletManager.shoot(this.snake.getSegments(), velocity.x, velocity.y);
      if (success) {
        log("Shot fired!");
        updateStatus("Shot fired!");
      }
    }
  }
  
  increaseSpeed() {
    const velocity = this.snake.getVelocity();
    if ((velocity.x !== 0 || velocity.y !== 0) || this.gameOver) {
      this.currentSpeedIndex = (this.currentSpeedIndex + 1) % SPEEDS.length;
      updateSpeed(SPEEDS, this.currentSpeedIndex);
      updateStatus(`Speed: ${SPEEDS[this.currentSpeedIndex].name}`);
    }
  }
  
  decreaseSpeed() {
    const velocity = this.snake.getVelocity();
    if ((velocity.x !== 0 || velocity.y !== 0) || this.gameOver) {
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
    if (this.awaitingFirstMove && (x !== 0 || y !== 0)) {
      this.awaitingFirstMove = false;
      playGameStartSound();
      if (this.policeSnakeEnabled) {
        this.policeSpawnTime = Date.now() + POLICE_SNAKE_CONFIG.spawnDelay;
      }
      const s = this.settings.getAllSettings();
      this.foodManager.generate(
        this.snake.getSegments(),
        this.obstacleManager.getObstacles(),
        this.bulletManager.getBullets(),
        this.canvasManager.getTileCount(),
        s.enableWalls
      );
      updateStatus('Go!');
    }
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
};
