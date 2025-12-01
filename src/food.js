// Food Management
import { CONFIG, FOOD_TYPES } from './config.js';

export class FoodManager {
  constructor() {
    this.currentFood = null;
  }
  
  generate(snake, obstacles, bullets, tileCount) {
    let validPosition = false;
    let newFood;
    
    // Select random food type based on probability
    const totalProbability = FOOD_TYPES.reduce((sum, type) => sum + type.probability, 0);
    let random = Math.random() * totalProbability;
    let selectedType = FOOD_TYPES[0];
    
    for (let type of FOOD_TYPES) {
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
        name: selectedType.name,
        emoji: selectedType.emoji,
        effect: selectedType.effect, // Visual effect data
        spawnTime: Date.now()
      };
      
      validPosition = true;
      
      if (snake && snake.length > 0) {
        for (let segment of snake) {
          if (segment.x === newFood.x && segment.y === newFood.y) {
            validPosition = false;
            break;
          }
        }
      }
      
      for (let obstacle of obstacles) {
        if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
          validPosition = false;
          break;
        }
      }
      
      for (let bullet of bullets) {
        if (bullet.x === newFood.x && bullet.y === newFood.y) {
          validPosition = false;
          break;
        }
      }
    }
    
    this.currentFood = newFood;
    return newFood;
  }
  
  getFood() {
    return this.currentFood;
  }
  
  isExpired() {
    if (!this.currentFood || !this.currentFood.spawnTime) return false;
    return Date.now() - this.currentFood.spawnTime > CONFIG.FOOD_LIFETIME;
  }
  
  draw(ctx, gridSize) {
    if (!this.currentFood) return;
    
    const food = this.currentFood;
    const centerX = food.x * gridSize + gridSize/2;
    const centerY = food.y * gridSize + gridSize/2;
    
    // Draw timer circle (outer glow)
    if (food.spawnTime) {
      const timeElapsed = Date.now() - food.spawnTime;
      const timeRemaining = CONFIG.FOOD_LIFETIME - timeElapsed;
      const timerProgress = Math.max(0, timeRemaining / CONFIG.FOOD_LIFETIME);
      
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, gridSize/2 + 2, 0, Math.PI * 2);
      ctx.stroke();
      
      if (timerProgress > 0) {
        let timerColor = timerProgress > 0.6 ? '#00FF00' : timerProgress > 0.3 ? '#FFA500' : '#FF0000';
        ctx.strokeStyle = timerColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = timerColor;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, gridSize/2 + 2, -Math.PI/2, -Math.PI/2 + (timerProgress * Math.PI * 2));
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    // Draw food emoji with better rendering
    this.drawFoodEmoji(ctx, food.type, centerX, centerY, gridSize);
  }
  
  drawFoodEmoji(ctx, type, centerX, centerY, gridSize) {
    // Get emoji from the current food object (it's stored when generated)
    const emoji = this.currentFood.emoji || '🍎';
    
    // Set font size based on grid size - make it fill the cell nicely
    const fontSize = Math.floor(gridSize * 0.9);
    ctx.font = `${fontSize}px Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add a slight glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 6;
    
    // Draw the emoji
    ctx.fillText(emoji, centerX, centerY);
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
  
}

