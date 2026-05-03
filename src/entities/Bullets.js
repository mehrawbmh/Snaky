// Bullet Management

export class BulletManager {
  constructor() {
    this.bullets = [];
    this.bulletColor = '#035c0cff';
    this.bulletSize = 3;
    this.bulletSpeed = 1;
    this.animationFrame = 0;
  }
  
  setBulletSettings(color, size, speed) {
    this.bulletColor = color;
    this.bulletSize = size;
    this.bulletSpeed = speed + 0.5;
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
  
  update(obstacles, tileCount, onObstacleHit, wallsEnabled = false, onPoliceHit = null) {
    const between = (a, b, c) => (a >= b && a <= c) || (a <= b && a >= c);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      const prevBulletX = bullet.x;
      const prevBulletY = bullet.y;
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.age++;

      if (bullet.x <= 0 || bullet.y <= 0 || bullet.x >= tileCount || bullet.y >= tileCount) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (bullet.age >= bullet.maxAge) {
        this.bullets.splice(i, 1);
        continue;
      }

      let removed = false;

      for (let j = obstacles.length - 1; j >= 0; j--) {
        const obstacle = obstacles[j];

        if (between(obstacle.x, prevBulletX, bullet.x) && between(obstacle.y, prevBulletY, bullet.y)) {
          obstacle.health--;

          if (onObstacleHit) {
            onObstacleHit(obstacle, j);
          }

          this.bullets.splice(i, 1);
          removed = true;
          break;
        }
      }

      if (removed) continue;

      if (onPoliceHit && onPoliceHit(prevBulletX, prevBulletY, bullet.x, bullet.y)) {
        this.bullets.splice(i, 1);
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

