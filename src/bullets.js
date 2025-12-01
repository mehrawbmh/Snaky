// Bullet Management

export class BulletManager {
  constructor() {
    this.bullets = [];
    this.bulletColor = '#ffff00';
    this.bulletSize = 3;
    this.bulletSpeed = 1;
    this.animationFrame = 0;
  }
  
  setBulletSettings(color, size, speed) {
    this.bulletColor = color;
    this.bulletSize = size;
    this.bulletSpeed = speed;
  }
  
  shoot(snake, velocityX, velocityY) {
    if (!snake || snake.length === 0) return false;
    
    const head = snake[0];
    this.bullets.push({
      x: head.x,
      y: head.y,
      vx: velocityX * this.bulletSpeed,
      vy: velocityY * this.bulletSpeed,
      age: 0,
      maxAge: 40
    });
    
    return true;
  }
  
  update(obstacles, tileCount, onObstacleHit) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.age++;
      
      // Wrap around
      if (bullet.x < 0) bullet.x = tileCount - 1;
      if (bullet.y < 0) bullet.y = tileCount - 1;
      if (bullet.x >= tileCount) bullet.x = 0;
      if (bullet.y >= tileCount) bullet.y = 0;
      
      if (bullet.age > bullet.maxAge) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      // Check collision with obstacles
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const obstacle = obstacles[j];
        if (Math.abs(bullet.x - obstacle.x) < 0.5 && Math.abs(bullet.y - obstacle.y) < 0.5) {
          obstacle.health--;
          
          if (onObstacleHit) {
            onObstacleHit(obstacle, j);
          }
          
          this.bullets.splice(i, 1);
          break;
        }
      }
    }
  }
  
  draw(ctx, gridSize) {
    this.animationFrame++;
    
    ctx.fillStyle = this.bulletColor;
    
    if (this.animationFrame % 2 === 0) {
      ctx.shadowColor = this.bulletColor;
      ctx.shadowBlur = 8;
    }
    
    for (let bullet of this.bullets) {
      ctx.beginPath();
      ctx.arc(
        bullet.x * gridSize + gridSize/2,
        bullet.y * gridSize + gridSize/2,
        this.bulletSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    if (ctx.shadowBlur > 0) {
      ctx.shadowBlur = 0;
    }
  }
  
  reset() {
    this.bullets = [];
  }
  
  getBullets() {
    return this.bullets;
  }
}

