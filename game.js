// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = 20;

// Game variables
let snake = [];
let food = {};
let obstacles = [];
let bullets = [];
let explosions = [];
let velocityX = 0;
let velocityY = 0;
let score = 0;
let gameLoopId;
let currentSpeedIndex = 0;
let speeds = [
  { multiplier: 1, delay: 150, name: "1x" },
  { multiplier: 1.5, delay: 100, name: "1.5x" },
  { multiplier: 2, delay: 75, name: "2x" },
  { multiplier: 3, delay: 50, name: "3x" },
  { multiplier: 4, delay: 37, name: "4x" },
  { multiplier: 10, delay: 15, name: "10x" }
];
let gameOver = false;
let animationFrame = 0;
let lastFrameTime = 0;
let gameRunning = false;
let gameStarted = false;

// Food types with different effects
const foodTypes = [
  { type: 'apple', name: 'Apple', points: 1, probability: 40 },
  { type: 'grapes', name: 'Grapes', points: 2, probability: 25 },
  { type: 'orange', name: 'Orange', points: 3, probability: 20 },
  { type: 'beer', name: 'Beer', points: 5, probability: 10 },
  { type: 'toxic', name: 'Toxic', points: 0, probability: 5 }
];

// Drunk state variables
let isDrunk = false;
let drunkEndTime = 0;
let drunkMoveCounter = 0;

// Settings variables
let playerName = "Player";
let snakeColor = '#0000ff';
let template = 'classic';
let obstacleColorMode = 'random';
let singleObstacleColor = '#8B0000';
let bulletColor = '#ffff00';
let bulletSize = 3;
let bulletSpeed = 1;
let showScoreboard = true;
let showLogging = false;

// Particle system for fire effect
const particles = [];

// Obstacle colors for random mode
const obstacleColorPalette = [
  '#8B0000', // Dark red
  '#006400', // Dark green
  '#000080', // Navy
  '#800080', // Purple
  '#8B4513', // Saddle brown
  '#2F4F4F', // Dark slate gray
  '#4B0082'  // Indigo
];

// Scoreboard - using in-memory storage with fallback
let highScores = [];

// Log message
let logMessage = "";

// Try to use localStorage if available, otherwise use memory
function saveScoreLocal(scoreVal) {
  const now = new Date();
  const scoreEntry = {
    score: scoreVal,
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
    // Sort by score descending
    storedScores.sort((a, b) => b.score - a.score);
    // Keep only top 10
    storedScores = storedScores.slice(0, 10);
    
    // Save back
    localStorage.setItem('snakeHighScores', JSON.stringify(storedScores));
    return storedScores;
  } catch (e) {
    // If localStorage is not available, use in-memory storage
    highScores.push(scoreEntry);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    return highScores;
  }
}

function loadScores() {
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

// Settings Modal Functions
function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    // Load current settings into modal
    document.getElementById('playerNameInput').value = playerName;
    document.getElementById('snakeColorInput').value = snakeColor;
    document.getElementById('snakeColorDisplay').textContent = snakeColor;
    document.getElementById('templateSelect').value = template;
    document.getElementById('obstacleColorMode').value = obstacleColorMode;
    document.getElementById('singleObstacleColor').value = singleObstacleColor;
    document.getElementById('bulletColorInput').value = bulletColor;
    document.getElementById('bulletColorDisplay').textContent = bulletColor;
    document.getElementById('bulletSizeInput').value = bulletSize;
    document.getElementById('bulletSpeedInput').value = bulletSpeed;
    document.getElementById('showScoreboardToggle').checked = showScoreboard;
    document.getElementById('showLoggingToggle').checked = showLogging;
    
    // Show/hide obstacle color picker
    updateObstacleColorPicker();
    
    modal.style.display = 'flex';
    
    // Focus on player name input if game hasn't started yet
    if (!gameStarted) {
      setTimeout(() => {
        document.getElementById('playerNameInput').focus();
      }, 100);
    }
  }
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function applySettings() {
  // Read all settings from modal
  const nameInput = document.getElementById('playerNameInput');
  if (nameInput && nameInput.value.trim() !== '') {
    playerName = nameInput.value.trim();
  }
  
  snakeColor = document.getElementById('snakeColorInput').value;
  template = document.getElementById('templateSelect').value;
  obstacleColorMode = document.getElementById('obstacleColorMode').value;
  singleObstacleColor = document.getElementById('singleObstacleColor').value;
  bulletColor = document.getElementById('bulletColorInput').value;
  bulletSize = parseInt(document.getElementById('bulletSizeInput').value);
  bulletSpeed = parseInt(document.getElementById('bulletSpeedInput').value);
  showScoreboard = document.getElementById('showScoreboardToggle').checked;
  showLogging = document.getElementById('showLoggingToggle').checked;
  
  // Update scoreboard visibility
  const scoreboard = document.getElementById('scoreboard');
  if (scoreboard) {
    if (showScoreboard) {
      scoreboard.classList.remove('hidden');
    } else {
      scoreboard.classList.add('hidden');
    }
  }
  
  // Update logging visibility
  const logDisplay = document.getElementById('logDisplay');
  if (logDisplay) {
    if (showLogging) {
      logDisplay.classList.remove('hidden');
    } else {
      logDisplay.classList.add('hidden');
    }
  }
  
  // Close modal
  closeSettings();
  
  // Show play button instead of starting immediately
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.classList.remove('hidden');
  }
  
  // If game is running, apply settings without restarting
  if (gameStarted && gameRunning) {
    log("Settings updated! Press PLAY to restart with new settings.");
  } else {
    log("Settings saved! Press the PLAY button to start.");
  }
}

function startGame() {
  // Hide play button
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.classList.add('hidden');
  }
  
  // Start or restart the game
  gameStarted = true;
  initGame();
}

function updateObstacleColorPicker() {
  const mode = document.getElementById('obstacleColorMode').value;
  const picker = document.getElementById('singleObstacleColorPicker');
  if (picker) {
    if (mode === 'single') {
      picker.style.display = 'block';
    } else {
      picker.style.display = 'none';
    }
  }
}

// Logging function
function log(message) {
  if (!showLogging) return;
  
  logMessage = message;
  const logDisplay = document.getElementById('logDisplay');
  if (logDisplay) {
    logDisplay.textContent = message;
  }
}

// Initialize game
function initGame() {
  // Hide play button
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.classList.add('hidden');
  }
  
  // Stop any existing game loop
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  
  // Reset game state
  snake = [{x: 10, y: 10}];
  velocityX = 0;
  velocityY = 0;
  score = 0;
  currentSpeedIndex = 0;
  gameOver = false;
  gameRunning = true;
  animationFrame = 0;
  lastFrameTime = 0;
  bullets = [];
  explosions = [];
  particles.length = 0;
  isDrunk = false;
  drunkEndTime = 0;
  drunkMoveCounter = 0;
  
  // Generate obstacles (5 random square obstacles)
  obstacles = [];
  for (let i = 0; i < 5; i++) {
    let obstacle;
    let validPosition = false;
    
    while (!validPosition) {
      // Choose color based on obstacleColorMode
      let color;
      if (obstacleColorMode === 'random') {
        color = obstacleColorPalette[Math.floor(Math.random() * obstacleColorPalette.length)];
      } else {
        color = singleObstacleColor;
      }
      
      obstacle = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        color: color,
        health: 1  // Number of hits needed to destroy
      };
      
      // Make sure obstacle is not on snake or food or other obstacles
      validPosition = true;
      
      if (snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y)) {
        validPosition = false;
      }
      
      if (obstacles.some(o => o.x === obstacle.x && o.y === obstacle.y)) {
        validPosition = false;
      }
    }
    
    obstacles.push(obstacle);
  }
  
  // Generate food
  generateFood();
  
  // Update displays
  updateScore();
  updateSpeedDisplay();
  updateStatus("Ready");
  
  // Start game loop with requestAnimationFrame
  gameLoopId = requestAnimationFrame(gameLoop);
}

function generateFood() {
  let validPosition = false;
  let newFood;
  
  // Select random food type based on probability
  const totalProbability = foodTypes.reduce((sum, type) => sum + type.probability, 0);
  let random = Math.random() * totalProbability;
  let selectedType = foodTypes[0];
  
  for (let type of foodTypes) {
    random -= type.probability;
    if (random <= 0) {
      selectedType = type;
      break;
    }
  }
  
  while (!validPosition) {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
      type: selectedType.type,
      points: selectedType.points,
      name: selectedType.name
    };
    
    validPosition = true;
    
    // Check if position overlaps with snake
    if (snake && snake.length > 0) {
      for (let segment of snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          validPosition = false;
          break;
        }
      }
    }
    
    // Check if position overlaps with obstacles
    for (let obstacle of obstacles) {
      if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
        validPosition = false;
        break;
      }
    }
    
    // Check if position overlaps with bullets
    for (let bullet of bullets) {
      if (bullet.x === newFood.x && bullet.y === newFood.y) {
        validPosition = false;
        break;
      }
    }
  }
  
  food = newFood;
}

// Create a bullet when Enter is pressed
function shootBullet() {
  // Only shoot if snake is moving and game is not over
  if ((velocityX !== 0 || velocityY !== 0) && !gameOver && snake && snake.length > 0) {
    // Create bullet at snake's head, moving in snake's direction
    bullets.push({
      x: snake[0].x,
      y: snake[0].y,
      vx: velocityX * bulletSpeed,
      vy: velocityY * bulletSpeed,
      age: 0,
      maxAge: 40  // Bullet disappears after this many frames
    });
    
    log("Shot fired!");
    updateStatus("Shot fired!");
  }
}

// Create explosion effect
function createExplosion(x, y, color) {
  const particleCount = 12;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    
    explosions.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20,
      maxLife: 20,
      color: color
    });
  }
}

// Update and draw explosions
function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    
    if (p.life <= 0) {
      explosions.splice(i, 1);
      continue;
    }
    
    // Draw explosion particle
    const alpha = p.life / p.maxLife;
    const radius = (p.life / p.maxLife) * 4;
    
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    gradient.addColorStop(0, p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Update bullets and check collisions
function updateBullets() {
  if (!bullets || !obstacles) return;
  
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // Move bullet
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.age++;
    
    // Wrap around screen
    if (bullet.x < 0) bullet.x = tileCount - 1;
    if (bullet.y < 0) bullet.y = tileCount - 1;
    if (bullet.x >= tileCount) bullet.x = 0;
    if (bullet.y >= tileCount) bullet.y = 0;
    
    // Check if bullet is too old
    if (bullet.age > bullet.maxAge) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Check collision with obstacles
    for (let j = obstacles.length - 1; j >= 0; j--) {
      const obstacle = obstacles[j];
      if (Math.abs(bullet.x - obstacle.x) < 0.5 && Math.abs(bullet.y - obstacle.y) < 0.5) {
        // Hit! Reduce obstacle health
        obstacle.health--;
        
        // Create explosion
        createExplosion(
          obstacle.x * gridSize + gridSize/2,
          obstacle.y * gridSize + gridSize/2,
          obstacle.color
        );
        
        // Remove obstacle if health is zero
        if (obstacle.health <= 0) {
          obstacles.splice(j, 1);
          score += 5;  // Bonus points for destroying obstacle
          updateScore();
          log("Obstacle destroyed! +5 points");
          updateStatus("Obstacle destroyed!");
        }
        
        // Remove bullet
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

// Update score display
function updateScore() {
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = score;
  }
}

// Update speed display
function updateSpeedDisplay() {
  const speedElement = document.getElementById('speed');
  if (speedElement) {
    speedElement.textContent = speeds[currentSpeedIndex].name;
  }
}

// Update status message
function updateStatus(message) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
  log(message);
}

// Create particle effect for fire
function createFireParticle(x, y, color) {
  particles.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 2,
    vy: -Math.random() * 2 - 1,
    life: 30,
    maxLife: 30,
    color: color
  });
}

// Update and draw particles
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Draw particle with fade
    const alpha = p.life / p.maxLife;
    const radius = p.life / 10;
    
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2);
    gradient.addColorStop(0, p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.arc(p.x, p.y, radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Increase speed
function increaseSpeed() {
  currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
  applySpeedChange();
}

// Decrease speed
function decreaseSpeed() {
  currentSpeedIndex = (currentSpeedIndex - 1 + speeds.length) % speeds.length;
  applySpeedChange();
}

// Apply speed change
function applySpeedChange() {
  updateSpeedDisplay();
  updateStatus(`Speed: ${speeds[currentSpeedIndex].name}`);
  // Speed changes will be handled automatically by the game loop timing
}

// Get color based on template, position, and animation frame
function getSegmentColor(index, totalLength) {
  animationFrame++;
  
  switch(template) {
    case 'classic':
      // Classic gradient from head to tail
      const intensity = 1 - (index / totalLength) * 0.5;
      return darkenColor(snakeColor, 1 - intensity);
      
    case 'rainbow':
      // Rainbow pattern that shifts along the snake
      const hue = (index * 30 + animationFrame) % 360;
      return `hsl(${hue}, 80%, 60%)`;
      
    case 'fire':
      // Fire-like gradient from red to yellow
      const fireHue = 20 - (index / totalLength) * 20;
      return `hsl(${fireHue}, 100%, ${70 - (index / totalLength) * 30}%)`;
      
    case 'ocean':
      // Ocean blue gradient
      const oceanHue = 200 + (index / totalLength) * 40;
      const oceanLightness = 40 + (index / totalLength) * 30;
      return `hsl(${oceanHue}, 80%, ${oceanLightness}%)`;
      
    case 'neon':
      // Pulsing neon effect
      const pulse = Math.sin(animationFrame / 10 + index) * 0.5 + 0.5;
      const neonLightness = 60 + pulse * 30;
      return `hsl(${getHueFromColor(snakeColor)}, 100%, ${neonLightness}%)`;
      
    case 'metal':
      // Metallic gradient with shine
      const metalFactor = 0.3 + (index / totalLength) * 0.7;
      const baseColor = darkenColor(snakeColor, 1 - metalFactor);
      // Add shine effect at certain positions
      if (index % 3 === Math.floor(animationFrame / 15) % 3) {
        return lightenColor(baseColor, 0.4);
      }
      return baseColor;
      
    default:
      return snakeColor;
  }
}

// Extract hue from hex color
function getHueFromColor(hexColor) {
  if (!hexColor) return 240; // Default to blue
  
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return 240;
  
  try {
    const r = parseInt(hexColor.substr(0, 2), 16) / 255;
    const g = parseInt(hexColor.substr(2, 2), 16) / 255;
    const b = parseInt(hexColor.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    
    if (max !== min) {
      if (max === r) {
        hue = (g - b) / (max - min) * 60;
      } else if (max === g) {
        hue = (2 + (b - r) / (max - min)) * 60;
      } else {
        hue = (4 + (r - g) / (max - min)) * 60;
      }
      
      if (hue < 0) hue += 360;
    }
    
    return hue;
  } catch (e) {
    return 240;
  }
}

// Helper function to darken a hex color
function darkenColor(hexColor, factor) {
  if (!hexColor) return '#0000ff';
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return '#0000ff';
  
  try {
    // Parse r, g, b values
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Darken each component
    const darkR = Math.floor(r * (1 - factor));
    const darkG = Math.floor(g * (1 - factor));
    const darkB = Math.floor(b * (1 - factor));
    
    // Convert back to hex
    return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return '#0000ff';
  }
}

// Helper function to lighten a hex color
function lightenColor(hexColor, factor) {
  if (!hexColor) return '#0000ff';
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return '#0000ff';
  
  try {
    // Parse r, g, b values
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Lighten each component
    const lightR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const lightG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const lightB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    // Convert back to hex
    return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return '#0000ff';
  }
}

// Handle different food effects
function handleFoodEaten(food) {
  switch(food.type) {
    case 'apple':
      score += food.points;
      updateScore();
      log(`Apple eaten! +${food.points} point`);
      updateStatus(`Apple eaten! +${food.points}`);
      generateFood();
      break;
      
    case 'grapes':
      score += food.points;
      updateScore();
      log(`Grapes eaten! +${food.points} points`);
      updateStatus(`Grapes eaten! +${food.points}`);
      generateFood();
      break;
      
    case 'orange':
      score += food.points;
      updateScore();
      log(`Orange eaten! +${food.points} points`);
      updateStatus(`Orange eaten! +${food.points}`);
      generateFood();
      break;
      
    case 'beer':
      score += food.points;
      updateScore();
      isDrunk = true;
      drunkEndTime = Date.now() + 3000; // Drunk for 3 seconds
      drunkMoveCounter = 0;
      log(`Beer! Snake is drunk! +${food.points} points`);
      updateStatus('🍺 DRUNK! Snake moves randomly!');
      generateFood();
      break;
      
    case 'toxic':
      log('Toxic food eaten! GAME OVER!');
      updateStatus('☠️ Toxic! You died!');
      endGame();
      return; // Don't remove tail, just end game
  }
}

// Main game loop with requestAnimationFrame
function gameLoop(currentTime) {
  if (!gameRunning) return;
  
  // Continue animation loop
  gameLoopId = requestAnimationFrame(gameLoop);
  
  // Calculate delta time
  if (lastFrameTime === 0) {
    lastFrameTime = currentTime;
    draw(); // Draw initial frame
    return;
  }
  
  const deltaTime = currentTime - lastFrameTime;
  const targetDelay = speeds[currentSpeedIndex].delay;
  
  // Only update game logic at the target speed
  if (deltaTime < targetDelay) {
    return;
  }
  
  lastFrameTime = currentTime;
  
  // Stop if game over
  if (gameOver || !snake || snake.length === 0) return;
  
  // Only move snake if there's velocity (player has pressed a direction key)
  if (velocityX !== 0 || velocityY !== 0) {
    // Check if drunk effect should end
    if (isDrunk && Date.now() > drunkEndTime) {
      isDrunk = false;
      updateStatus('Sober again!');
      log('Drunk effect ended');
    }
    
    // Determine actual movement direction
    let moveX = velocityX;
    let moveY = velocityY;
    
    // If drunk, occasionally move in random direction
    if (isDrunk) {
      drunkMoveCounter++;
      // Every 2 moves, pick a random direction
      if (drunkMoveCounter % 2 === 0) {
        const directions = [
          {x: 0, y: -1}, // up
          {x: 0, y: 1},  // down
          {x: -1, y: 0}, // left
          {x: 1, y: 0}   // right
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        moveX = randomDir.x;
        moveY = randomDir.y;
      }
    }
    
    // Move snake
    let headX = snake[0].x + moveX;
    let headY = snake[0].y + moveY;
    
    // Wrap around when hitting walls
    if (headX < 0) headX = tileCount - 1;
    if (headY < 0) headY = tileCount - 1;
    if (headX >= tileCount) headX = 0;
    if (headY >= tileCount) headY = 0;
    
    // Check collision with self
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === headX && snake[i].y === headY) {
        endGame();
        return;
      }
    }
    
    // Check collision with obstacles
    for (let obstacle of obstacles) {
      if (obstacle.x === headX && obstacle.y === headY) {
        endGame();
        return;
      }
    }
    
    // Add new head
    snake.unshift({x: headX, y: headY});
    
    // Check if food eaten
    if (food && headX === food.x && headY === food.y) {
      handleFoodEaten(food);
    } else {
      // Remove tail
      snake.pop();
    }
    
    // Update bullets and check collisions
    updateBullets();
    
    // Limit particle generation to reduce lag - only create particles occasionally
    if (animationFrame % 2 === 0 && currentSpeedIndex > 0 && snake.length > 1 && (template === 'fire' || currentSpeedIndex >= 4)) {
      const tail = snake[snake.length - 1];
      const segmentBeforeTail = snake[snake.length - 2];
      
      // Determine direction of tail movement
      const dx = tail.x - segmentBeforeTail.x;
      const dy = tail.y - segmentBeforeTail.y;
      
      // Position particles behind the tail
      const px = (tail.x - dx) * gridSize + gridSize/2;
      const py = (tail.y - dy) * gridSize + gridSize/2;
      
      // Reduced particle count for better performance
      const baseCount = (template === 'fire') ? 2 : 1;
      const particleCount = Math.min(3, baseCount + Math.floor(currentSpeedIndex / 3));
      
      for (let i = 0; i < particleCount; i++) {
        // Different colors based on template
        let colors;
        if (template === 'fire') {
          colors = ['#ffff00', '#ffa500', '#ff4500', '#ff0000'];
        } else if (template === 'ocean') {
          colors = ['#00ffff', '#00aaff', '#0066ff', '#0033cc'];
        } else if (template === 'rainbow') {
          colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0000ff', '#8800ff', '#ff00ff'];
        } else {
          colors = ['#ffff00', '#ffa500', '#ff4500'];
        }
        
        createFireParticle(px, py, colors[Math.floor(Math.random() * colors.length)]);
      }
    }
    
    // Limit total number of particles for performance
    if (particles.length > 100) {
      particles.splice(0, particles.length - 100);
    }
    
    // Limit total number of explosions for performance
    if (explosions.length > 50) {
      explosions.splice(0, explosions.length - 50);
    }
  }
  
  // Always draw everything (even when not moving)
  draw();
}

// Draw different food types
function drawFood(food) {
  const centerX = food.x * gridSize + gridSize/2;
  const centerY = food.y * gridSize + gridSize/2;
  
  switch(food.type) {
    case 'apple':
      // Apple body
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(centerX, centerY, gridSize/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Apple shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - 3, centerY - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Apple stem
      ctx.fillStyle = '#3a5a25';
      ctx.fillRect(centerX - 1, centerY - gridSize/2 + 1, 2, 4);
      break;
      
    case 'grapes':
      // Draw multiple small circles for grapes
      ctx.fillStyle = '#8B008B'; // Dark purple
      const grapePositions = [
        {x: 0, y: -3},
        {x: -3, y: 0},
        {x: 3, y: 0},
        {x: -2, y: 3},
        {x: 2, y: 3}
      ];
      
      grapePositions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(centerX + pos.x, centerY + pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shine to each grape
        ctx.fillStyle = 'rgba(200, 150, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX + pos.x - 1, centerY + pos.y - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B008B';
      });
      
      // Stem
      ctx.fillStyle = '#3a5a25';
      ctx.fillRect(centerX - 1, centerY - gridSize/2 + 1, 2, 3);
      break;
      
    case 'orange':
      // Orange body
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.arc(centerX, centerY, gridSize/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Orange texture (small dots)
      ctx.fillStyle = '#FF8C00';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * 4;
        const y = centerY + Math.sin(angle) * 4;
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Orange shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX - 3, centerY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Leaf
      ctx.fillStyle = '#228B22';
      ctx.fillRect(centerX - 1, centerY - gridSize/2 + 2, 2, 3);
      break;
      
    case 'beer':
      // Beer mug body
      ctx.fillStyle = '#FFD700'; // Gold color
      ctx.fillRect(centerX - 5, centerY - 4, 10, 10);
      
      // Beer foam
      ctx.fillStyle = '#FFFACD'; // Light yellow
      ctx.fillRect(centerX - 5, centerY - 6, 10, 3);
      
      // Mug handle
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX + 6, centerY, 3, -Math.PI/2, Math.PI/2);
      ctx.stroke();
      
      // Mug shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(centerX - 3, centerY - 2, 3, 5);
      break;
      
    case 'toxic':
      // Toxic skull symbol
      ctx.fillStyle = '#00FF00'; // Bright green
      
      // Skull
      ctx.beginPath();
      ctx.arc(centerX, centerY - 1, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes (X marks)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      // Left eye X
      ctx.beginPath();
      ctx.moveTo(centerX - 4, centerY - 3);
      ctx.lineTo(centerX - 2, centerY - 1);
      ctx.moveTo(centerX - 2, centerY - 3);
      ctx.lineTo(centerX - 4, centerY - 1);
      ctx.stroke();
      
      // Right eye X
      ctx.beginPath();
      ctx.moveTo(centerX + 2, centerY - 3);
      ctx.lineTo(centerX + 4, centerY - 1);
      ctx.moveTo(centerX + 4, centerY - 3);
      ctx.lineTo(centerX + 2, centerY - 1);
      ctx.stroke();
      
      // Warning triangle background
      ctx.fillStyle = '#FFFF00'; // Yellow
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 8);
      ctx.lineTo(centerX - 7, centerY + 5);
      ctx.lineTo(centerX + 7, centerY + 5);
      ctx.closePath();
      ctx.fill();
      
      // Black border for triangle
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Redraw skull on top
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Redraw eyes
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      // Left eye X
      ctx.beginPath();
      ctx.moveTo(centerX - 3, centerY - 2);
      ctx.lineTo(centerX - 1, centerY);
      ctx.moveTo(centerX - 1, centerY - 2);
      ctx.lineTo(centerX - 3, centerY);
      ctx.stroke();
      
      // Right eye X
      ctx.beginPath();
      ctx.moveTo(centerX + 1, centerY - 2);
      ctx.lineTo(centerX + 3, centerY);
      ctx.moveTo(centerX + 3, centerY - 2);
      ctx.lineTo(centerX + 1, centerY);
      ctx.stroke();
      break;
  }
}

// Draw function
function draw() {
  // Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw obstacles as squares with random colors
  for (let obstacle of obstacles) {
    // Main square
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(
      obstacle.x * gridSize + 1,
      obstacle.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2
    );
    
    // Add some texture/shading
    ctx.fillStyle = lightenColor(obstacle.color, 0.3);
    ctx.fillRect(
      obstacle.x * gridSize + 2,
      obstacle.y * gridSize + 2,
      gridSize - 6,
      gridSize - 6
    );
    
    // Add crack texture
    ctx.strokeStyle = darkenColor(obstacle.color, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obstacle.x * gridSize + 5, obstacle.y * gridSize + 5);
    ctx.lineTo(obstacle.x * gridSize + 10, obstacle.y * gridSize + 8);
    ctx.lineTo(obstacle.x * gridSize + 12, obstacle.y * gridSize + 12);
    ctx.stroke();
    
    // Health indicator (if more than 1 hit needed)
    if (obstacle.health > 1) {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(obstacle.health, 
        obstacle.x * gridSize + gridSize/2, 
        obstacle.y * gridSize + gridSize/2 + 4);
    }
  }
  
  // Draw bullets
  ctx.fillStyle = bulletColor;
  // Only apply glow effect every other frame for performance
  if (animationFrame % 2 === 0) {
    ctx.shadowColor = bulletColor;
    ctx.shadowBlur = 8;
  }
  
  for (let bullet of bullets) {
    ctx.beginPath();
    ctx.arc(
      bullet.x * gridSize + gridSize/2,
      bullet.y * gridSize + gridSize/2,
      bulletSize,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  // Reset shadow
  if (ctx.shadowBlur > 0) {
    ctx.shadowBlur = 0;
  }
  
  // Draw explosions
  updateExplosions();
  
  // Draw food
  if (food) {
    drawFood(food);
  }
  
  // Draw snake
  if (snake && snake.length > 0) {
    for (let i = 0; i < snake.length; i++) {
      if (i === 0) {
        // Draw snake head
        const centerX = snake[i].x * gridSize + gridSize/2;
        const centerY = snake[i].y * gridSize + gridSize/2;
        
        // Head with eyes
        ctx.fillStyle = snakeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, gridSize/2 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'white';
        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        if (velocityX === 1) { // Moving right
          leftEyeX = centerX + 5;
          leftEyeY = centerY - 3;
          rightEyeX = centerX + 5;
          rightEyeY = centerY + 3;
        } else if (velocityX === -1) { // Moving left
          leftEyeX = centerX - 5;
          leftEyeY = centerY - 3;
          rightEyeX = centerX - 5;
          rightEyeY = centerY + 3;
        } else if (velocityY === -1) { // Moving up
          leftEyeX = centerX - 3;
          leftEyeY = centerY - 5;
          rightEyeX = centerX + 3;
          rightEyeY = centerY - 5;
        } else if (velocityY === 1) { // Moving down
          leftEyeX = centerX - 3;
          leftEyeY = centerY + 5;
          rightEyeX = centerX + 3;
          rightEyeY = centerY + 5;
        } else { // Initial state - facing right
          leftEyeX = centerX + 5;
          leftEyeY = centerY - 3;
          rightEyeX = centerX + 5;
          rightEyeY = centerY + 3;
        }
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(leftEyeX + 1, leftEyeY + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX + 1, rightEyeY + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw snake body segments with template-based coloring
        const segmentColor = getSegmentColor(i, snake.length);
        ctx.fillStyle = segmentColor;
        
        // Special effects for different templates - only apply every other frame for performance
        if (animationFrame % 2 === 0) {
          if (template === 'neon' || template === 'rainbow') {
            // Add glow effect
            ctx.shadowColor = segmentColor;
            ctx.shadowBlur = 10;
          } else if (template === 'metal') {
            // Add metallic shine
            ctx.shadowColor = lightenColor(segmentColor, 0.5);
            ctx.shadowBlur = 4;
          }
        }
        
        // Make body slightly smaller than grid to see the trail
        const sizeReduction = i === snake.length - 1 ? 6 : 2;
        ctx.fillRect(
          snake[i].x * gridSize + sizeReduction/2, 
          snake[i].y * gridSize + sizeReduction/2, 
          gridSize - sizeReduction, 
          gridSize - sizeReduction
        );
        
        // Reset shadow
        if (ctx.shadowBlur > 0) {
          ctx.shadowBlur = 0;
        }
      }
    }
  }
  
  // Draw fire particles
  updateParticles();
}

// End game function
function endGame() {
  gameOver = true;
  gameRunning = false;
  
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  
  log(`Game Over! Final score: ${score}`);
  
  // Save score 
  if (score > 0) {
    saveScoreLocal(score);
  }
  displayHighScores();
  
  // Show game over screen
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
  
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText(`${playerName}, press PLAY to restart`, canvas.width / 2, canvas.height / 2 + 50);
  
  // Show play button for restart
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.classList.remove('hidden');
  }
}

// Display high scores
function displayHighScores() {
  const scoreList = document.getElementById('scoreList');
  if (!scoreList) return;
  
  scoreList.innerHTML = '';
  
  // Try to load from localStorage first, fall back to memory
  let scoresToDisplay = [];
  try {
    const saved = localStorage.getItem('snakeHighScores');
    if (saved) {
      scoresToDisplay = JSON.parse(saved);
    } else {
      scoresToDisplay = highScores;
    }
  } catch (e) {
    scoresToDisplay = highScores;
  }
  
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

// Helper to check if an element is an input field
function isInputElement(element) {
  if (!element) return false;
  const tagName = element.tagName;
  const type = element.type;
  return (
    tagName === 'INPUT' && (type === 'text' || type === 'number') ||
    tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
}

// Handle key presses
document.addEventListener('keydown', function(e) {
  // Check if user is typing in an input field - if so, don't intercept keys
  const activeElement = document.activeElement;
  
  // If user is typing in input field, don't intercept ANY game keys
  if (isInputElement(activeElement)) {
    // Don't intercept keys when typing in input fields
    return;
  }
  
  // Handle shooting with Enter key
  if (e.code === 'Enter') {
    e.preventDefault();
    shootBullet();
    return;
  }
  
  // Handle speed controls with space and shift+space
  if (e.code === 'Space') {
    e.preventDefault();
    
    // Check if Shift is pressed for decreasing speed
    if (e.shiftKey) {
      // Only decrease speed if snake is moving
      if (velocityX !== 0 || velocityY !== 0 || gameOver) {
        decreaseSpeed();
      }
    } else {
      // Increase speed
      if (velocityX !== 0 || velocityY !== 0 || gameOver) {
        increaseSpeed();
      }
    }
    return;
  }
  
  // Prevent default behavior for movement keys (only when not typing)
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
    e.preventDefault();
  }
  
  // Movement controls - only change direction if not going opposite
  const keyPressed = e.code;
  
  // Arrow keys
  if (keyPressed === 'ArrowUp' && velocityY !== 1) {
    velocityX = 0;
    velocityY = -1;
  } else if (keyPressed === 'ArrowDown' && velocityY !== -1) {
    velocityX = 0;
    velocityY = 1;
  } else if (keyPressed === 'ArrowLeft' && velocityX !== 1) {
    velocityX = -1;
    velocityY = 0;
  } else if (keyPressed === 'ArrowRight' && velocityX !== -1) {
    velocityX = 1;
    velocityY = 0;
  }
  // WASD keys
  else if (keyPressed === 'KeyW' && velocityY !== 1) {
    velocityX = 0;
    velocityY = -1;
  } else if (keyPressed === 'KeyS' && velocityY !== -1) {
    velocityX = 0;
    velocityY = 1;
  } else if (keyPressed === 'KeyA' && velocityX !== 1) {
    velocityX = -1;
    velocityY = 0;
  } else if (keyPressed === 'KeyD' && velocityX !== -1) {
    velocityX = 1;
    velocityY = 0;
  }
  
  // Start game on first valid key press
  if ((velocityX === 0 && velocityY === 0) && 
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(keyPressed)) {
    updateStatus("Game started");
  }
});

// Event listeners for settings modal
document.getElementById('snakeColorInput').addEventListener('input', function() {
  document.getElementById('snakeColorDisplay').textContent = this.value;
});

document.getElementById('bulletColorInput').addEventListener('input', function() {
  document.getElementById('bulletColorDisplay').textContent = this.value;
});

document.getElementById('obstacleColorMode').addEventListener('change', function() {
  updateObstacleColorPicker();
});

// Initialize the game when page loads
window.onload = function() {
  displayHighScores();
  
  // Show settings modal on first load
  openSettings();
};
