// Obstacle Management
import { OBSTACLE_COLOR_PALETTE } from '../config/Config.js';
import { lightenColor, darkenColor } from '../utils/Utils.js';

export class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.obstacleColorMode = 'random';
    this.singleObstacleColor = '#8B0000';
  }
  
  setColorMode(mode, color) {
    this.obstacleColorMode = mode;
    if (color) {
      this.singleObstacleColor = color;
    }
  }
  
  generate(count, snake, tileCount) {
    this.obstacles = [];
    
    for (let i = 0; i < count; i++) {
      let obstacle;
      let validPosition = false;
      
      while (!validPosition) {
        let color;
        if (this.obstacleColorMode === 'random') {
          color = OBSTACLE_COLOR_PALETTE[Math.floor(Math.random() * OBSTACLE_COLOR_PALETTE.length)];
        } else {
          color = this.singleObstacleColor;
        }
        
        obstacle = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
          color: color,
          health: 1
        };
        
        validPosition = true;
        
        if (snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y)) {
          validPosition = false;
        }
        
        if (this.obstacles.some(o => o.x === obstacle.x && o.y === obstacle.y)) {
          validPosition = false;
        }
      }
      
      this.obstacles.push(obstacle);
    }
  }
  
  checkCollision(x, y) {
    return this.obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
  }
  
  getObstacles() {
    return this.obstacles;
  }
  
  draw(ctx, gridSize) {
    for (let obstacle of this.obstacles) {
      const x = obstacle.x * gridSize;
      const y = obstacle.y * gridSize;
      
      // Main block
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
      
      // 3D Bevel effect
      ctx.fillStyle = lightenColor(obstacle.color, 0.2);
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 1);
      ctx.lineTo(x + gridSize - 1, y + 1);
      ctx.lineTo(x + gridSize - 5, y + 5);
      ctx.lineTo(x + 5, y + 5);
      ctx.fill();
      
      ctx.fillStyle = darkenColor(obstacle.color, 0.2);
      ctx.beginPath();
      ctx.moveTo(x + gridSize - 1, y + 1);
      ctx.lineTo(x + gridSize - 1, y + gridSize - 1);
      ctx.lineTo(x + gridSize - 5, y + gridSize - 5);
      ctx.lineTo(x + gridSize - 5, y + 5);
      ctx.fill();

      // Crate cross pattern
      ctx.strokeStyle = darkenColor(obstacle.color, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 5);
      ctx.lineTo(x + gridSize - 5, y + gridSize - 5);
      ctx.moveTo(x + gridSize - 5, y + 5);
      ctx.lineTo(x + 5, y + gridSize - 5);
      ctx.stroke();
      
      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

      if (obstacle.health > 1) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.fillText(obstacle.health, x + gridSize/2, y + gridSize/2);
        ctx.shadowBlur = 0;
      }
    }
  }
}

