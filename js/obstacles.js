// Obstacle Management
import { OBSTACLE_COLOR_PALETTE } from './config.js';
import { lightenColor, darkenColor } from './utils.js';

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
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(
        obstacle.x * gridSize + 1,
        obstacle.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );
      
      ctx.fillStyle = lightenColor(obstacle.color, 0.3);
      ctx.fillRect(
        obstacle.x * gridSize + 2,
        obstacle.y * gridSize + 2,
        gridSize - 6,
        gridSize - 6
      );
      
      ctx.strokeStyle = darkenColor(obstacle.color, 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(obstacle.x * gridSize + 5, obstacle.y * gridSize + 5);
      ctx.lineTo(obstacle.x * gridSize + 10, obstacle.y * gridSize + 8);
      ctx.lineTo(obstacle.x * gridSize + 12, obstacle.y * gridSize + 12);
      ctx.stroke();
      
      if (obstacle.health > 1) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obstacle.health,
          obstacle.x * gridSize + gridSize/2,
          obstacle.y * gridSize + gridSize/2 + 4);
      }
    }
  }
}

