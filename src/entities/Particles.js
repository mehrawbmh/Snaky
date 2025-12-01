// Particle Effects Management
import { CONFIG, TEMPLATES } from '../config/Config.js';

export class ParticleManager {
  constructor() {
    this.particles = [];
    this.explosions = [];
  }
  
  createFireParticle(x, y, color) {
    this.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 1,
      life: 30,
      maxLife: 30,
      color: color
    });
  }
  
  createExplosion(x, y, color) {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      
      this.explosions.push({
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
  
  updateAndDrawParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
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
  
  updateAndDrawExplosions(ctx) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const p = this.explosions[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      if (p.life <= 0) {
        this.explosions.splice(i, 1);
        continue;
      }
      
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
  
  generateTrailParticles(snake, gridSize, template, currentSpeedIndex, animationFrame) {
    if (animationFrame % 2 === 0 && currentSpeedIndex > 0 && snake.length > 1 && 
        (template === TEMPLATES.FIRE || currentSpeedIndex >= 4)) {
      
      const tail = snake[snake.length - 1];
      const segmentBeforeTail = snake[snake.length - 2];
      
      const dx = tail.x - segmentBeforeTail.x;
      const dy = tail.y - segmentBeforeTail.y;
      
      const px = (tail.x - dx) * gridSize + gridSize/2;
      const py = (tail.y - dy) * gridSize + gridSize/2;
      
      const baseCount = (template === TEMPLATES.FIRE) ? 2 : 1;
      const particleCount = Math.min(3, baseCount + Math.floor(currentSpeedIndex / 3));
      
      for (let i = 0; i < particleCount; i++) {
        let colors;
        if (template === TEMPLATES.FIRE) {
          colors = ['#ffff00', '#ffa500', '#ff4500', '#ff0000'];
        } else if (template === TEMPLATES.OCEAN) {
          colors = ['#00ffff', '#00aaff', '#0066ff', '#0033cc'];
        } else if (template === TEMPLATES.RAINBOW) {
          colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0000ff', '#8800ff', '#ff00ff'];
        } else {
          colors = ['#ffff00', '#ffa500', '#ff4500'];
        }
        
        this.createFireParticle(px, py, colors[Math.floor(Math.random() * colors.length)]);
      }
    }
  }
  
  limitParticles() {
    if (this.particles.length > CONFIG.MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - CONFIG.MAX_PARTICLES);
    }
    
    if (this.explosions.length > CONFIG.MAX_EXPLOSIONS) {
      this.explosions.splice(0, this.explosions.length - CONFIG.MAX_EXPLOSIONS);
    }
  }
  
  reset() {
    this.particles = [];
    this.explosions = [];
  }
}

