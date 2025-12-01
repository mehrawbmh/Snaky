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
    
    // Draw timer circle
    if (food.spawnTime) {
      const timeElapsed = Date.now() - food.spawnTime;
      const timeRemaining = CONFIG.FOOD_LIFETIME - timeElapsed;
      const timerProgress = Math.max(0, timeRemaining / CONFIG.FOOD_LIFETIME);
      
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, gridSize/2, 0, Math.PI * 2);
      ctx.stroke();
      
      if (timerProgress > 0) {
        let timerColor = timerProgress > 0.6 ? '#00FF00' : timerProgress > 0.3 ? '#FFA500' : '#FF0000';
        ctx.strokeStyle = timerColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, gridSize/2, -Math.PI/2, -Math.PI/2 + (timerProgress * Math.PI * 2));
        ctx.stroke();
      }
    }
    
    // Draw food based on type
    switch(food.type) {
      case 'apple':
        this.drawApple(ctx, centerX, centerY, gridSize);
        break;
      case 'grapes':
        this.drawGrapes(ctx, centerX, centerY, gridSize);
        break;
      case 'orange':
        this.drawOrange(ctx, centerX, centerY, gridSize);
        break;
      case 'beer':
        this.drawBeer(ctx, centerX, centerY, gridSize);
        break;
      case 'toxic':
        this.drawToxic(ctx, centerX, centerY, gridSize);
        break;
    }
  }
  
  drawApple(ctx, centerX, centerY, gridSize) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#3a5a25';
    ctx.fillRect(centerX - 1, centerY - gridSize/2 + 1, 2, 4);
  }
  
  drawGrapes(ctx, centerX, centerY, gridSize) {
    ctx.fillStyle = '#8B008B';
    const grapePositions = [
      {x: 0, y: -3}, {x: -3, y: 0}, {x: 3, y: 0}, {x: -2, y: 3}, {x: 2, y: 3}
    ];
    
    grapePositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(centerX + pos.x, centerY + pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(200, 150, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(centerX + pos.x - 1, centerY + pos.y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B008B';
    });
    
    ctx.fillStyle = '#3a5a25';
    ctx.fillRect(centerX - 1, centerY - gridSize/2 + 1, 2, 3);
  }
  
  drawOrange(ctx, centerX, centerY, gridSize) {
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF8C00';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 4;
      const y = centerY + Math.sin(angle) * 4;
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(centerX - 1, centerY - gridSize/2 + 2, 2, 3);
  }
  
  drawBeer(ctx, centerX, centerY, gridSize) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(centerX - 5, centerY - 4, 10, 10);
    
    ctx.fillStyle = '#FFFACD';
    ctx.fillRect(centerX - 5, centerY - 6, 10, 3);
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX + 6, centerY, 3, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(centerX - 3, centerY - 2, 3, 5);
  }
  
  drawToxic(ctx, centerX, centerY, gridSize) {
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX - 7, centerY + 5);
    ctx.lineTo(centerX + 7, centerY + 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    
    // Eyes
    ctx.beginPath();
    ctx.moveTo(centerX - 3, centerY - 2);
    ctx.lineTo(centerX - 1, centerY);
    ctx.moveTo(centerX - 1, centerY - 2);
    ctx.lineTo(centerX - 3, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 1, centerY - 2);
    ctx.lineTo(centerX + 3, centerY);
    ctx.moveTo(centerX + 3, centerY - 2);
    ctx.lineTo(centerX + 1, centerY);
    ctx.stroke();
  }
}

