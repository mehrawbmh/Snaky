// Bullet Management

export class BulletManager {
    constructor() {
        this.bullets = [];
        this.bulletColor = '#0e3d02';
        this.bulletSize = 3;
        this.bulletSpeed = 1;
        this.animationFrame = 0;
    }

    setBulletSettings(color, size, speed) {
        this.bulletColor = color;
        this.bulletSize = size;
        this.bulletSpeed = speed + 0.5; //to be a little faster than snake itself!
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

    update(obstacles, tileCount, onObstacleHit, wallsEnabled = false) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            const prevBulletX = bullet.x;
            const prevBulletY = bullet.y;

            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.age++;


            if (bullet.x <= 0 || bullet.y <= 0 || bullet.x >= tileCount || bullet.y >= tileCount) {
                this.bullets.splice(i, 1);
                continue
                // continue;
            }

            if (bullet.age >= bullet.maxAge) {
                this.bullets.splice(i, 1);
                continue;
            }


            // Use rounded coordinates for better grid collision detection
            const bulletGridX = Math.round(bullet.x);
            const bulletGridY = Math.round(bullet.y);

            for (let j = obstacles.length - 1; j >= 0; j--) {
                const obstacle = obstacles[j];
                const between = (a,b,c) => {
                    return ((a >= b) && (a <=c)) || ((a >= c) && (a <=b))
                }
                if (between(obstacle.x, prevBulletX, bullet.x) && between(obstacle.y, prevBulletY, bullet.y)) {
                    obstacle.health--;

                    if (onObstacleHit) {
                        onObstacleHit(obstacle, j);
                    }

                    // DO NOT remove bullet and let it go till the end of row and column!
                    // this.bullets.splice(i, 1);
                    // break;
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
                bullet.x * gridSize + gridSize / 2,
                bullet.y * gridSize + gridSize / 2,
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

