// Snake Management
import { TEMPLATES } from '../config/Config.js';
import { darkenColor, lightenColor, getHueFromColor } from '../utils/Utils.js';

export class Snake {
  constructor() {
    this.segments = [{x: 10, y: 10}];
    this.velocityX = 0;
    this.velocityY = 0;
    this.animationFrame = 0;
  }
  
  reset() {
    this.segments = [{x: 10, y: 10}];
    this.velocityX = 0;
    this.velocityY = 0;
    this.animationFrame = 0;
  }
  
  setVelocity(vx, vy) {
    this.velocityX = vx;
    this.velocityY = vy;
  }
  
  getVelocity() {
    return { x: this.velocityX, y: this.velocityY };
  }
  
  getHead() {
    return this.segments[0];
  }
  
  getSegments() {
    return this.segments;
  }
  
  move(moveX, moveY, tileCount) {
    let headX = this.segments[0].x + moveX;
    let headY = this.segments[0].y + moveY;
    
    // Wrap around
    if (headX < 0) headX = tileCount - 1;
    if (headY < 0) headY = tileCount - 1;
    if (headX >= tileCount) headX = 0;
    if (headY >= tileCount) headY = 0;
    
    return { x: headX, y: headY };
  }
  
  addHead(x, y) {
    this.segments.unshift({x, y});
  }
  
  removeTail() {
    this.segments.pop();
  }
  
  checkSelfCollision(headX, headY) {
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].x === headX && this.segments[i].y === headY) {
        return true;
      }
    }
    return false;
  }
  
  draw(ctx, gridSize, snakeColor, template) {
    this.animationFrame++;
    
    for (let i = 0; i < this.segments.length; i++) {
      if (i === 0) {
        this.drawHead(ctx, gridSize, snakeColor);
      } else {
        this.drawSegment(ctx, gridSize, i, snakeColor, template);
      }
    }
  }
  
  drawHead(ctx, gridSize, snakeColor) {
    const head = this.segments[0];
    const centerX = head.x * gridSize + gridSize/2;
    const centerY = head.y * gridSize + gridSize/2;
    
    ctx.fillStyle = snakeColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridSize/2 - 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes based on direction
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    
    if (this.velocityX === 1) {
      leftEyeX = centerX + 5; leftEyeY = centerY - 3;
      rightEyeX = centerX + 5; rightEyeY = centerY + 3;
    } else if (this.velocityX === -1) {
      leftEyeX = centerX - 5; leftEyeY = centerY - 3;
      rightEyeX = centerX - 5; rightEyeY = centerY + 3;
    } else if (this.velocityY === -1) {
      leftEyeX = centerX - 3; leftEyeY = centerY - 5;
      rightEyeX = centerX + 3; rightEyeY = centerY - 5;
    } else if (this.velocityY === 1) {
      leftEyeX = centerX - 3; leftEyeY = centerY + 5;
      rightEyeX = centerX + 3; rightEyeY = centerY + 5;
    } else {
      leftEyeX = centerX + 5; leftEyeY = centerY - 3;
      rightEyeX = centerX + 5; rightEyeY = centerY + 3;
    }
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(leftEyeX + 1, leftEyeY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + 1, rightEyeY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawSegment(ctx, gridSize, index, snakeColor, template) {
    const segment = this.segments[index];
    const segmentColor = this.getSegmentColor(index, snakeColor, template);
    
    ctx.fillStyle = segmentColor;
    
    if (this.animationFrame % 2 === 0) {
      if (template === TEMPLATES.NEON || template === TEMPLATES.RAINBOW) {
        ctx.shadowColor = segmentColor;
        ctx.shadowBlur = 10;
      } else if (template === TEMPLATES.METAL) {
        ctx.shadowColor = lightenColor(segmentColor, 0.5);
        ctx.shadowBlur = 4;
      }
    }
    
    const sizeReduction = index === this.segments.length - 1 ? 6 : 2;
    ctx.fillRect(
      segment.x * gridSize + sizeReduction/2,
      segment.y * gridSize + sizeReduction/2,
      gridSize - sizeReduction,
      gridSize - sizeReduction
    );
    
    if (ctx.shadowBlur > 0) {
      ctx.shadowBlur = 0;
    }
  }
  
  getSegmentColor(index, snakeColor, template) {
    const totalLength = this.segments.length;
    
    switch(template) {
      case TEMPLATES.CLASSIC:
        const intensity = 1 - (index / totalLength) * 0.5;
        return darkenColor(snakeColor, 1 - intensity);
        
      case TEMPLATES.RAINBOW:
        const hue = (index * 30 + this.animationFrame) % 360;
        return `hsl(${hue}, 80%, 60%)`;
        
      case TEMPLATES.FIRE:
        const fireHue = 20 - (index / totalLength) * 20;
        return `hsl(${fireHue}, 100%, ${70 - (index / totalLength) * 30}%)`;
        
      case TEMPLATES.OCEAN:
        const oceanHue = 200 + (index / totalLength) * 40;
        const oceanLightness = 40 + (index / totalLength) * 30;
        return `hsl(${oceanHue}, 80%, ${oceanLightness}%)`;
        
      case TEMPLATES.NEON:
        const pulse = Math.sin(this.animationFrame / 10 + index) * 0.5 + 0.5;
        const neonLightness = 60 + pulse * 30;
        return `hsl(${getHueFromColor(snakeColor)}, 100%, ${neonLightness}%)`;
        
      case TEMPLATES.METAL:
        const metalFactor = 0.3 + (index / totalLength) * 0.7;
        const baseColor = darkenColor(snakeColor, 1 - metalFactor);
        if (index % 3 === Math.floor(this.animationFrame / 15) % 3) {
          return lightenColor(baseColor, 0.4);
        }
        return baseColor;
        
      default:
        return snakeColor;
    }
  }
}

