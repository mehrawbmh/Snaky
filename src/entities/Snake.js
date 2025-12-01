// Snake Management
import { TEMPLATES } from '../config/Config.js';
import { darkenColor, lightenColor, getHueFromColor } from '../utils/Utils.js';

export class Snake {
  constructor() {
    this.segments = [{x: 10, y: 10}];
    this.prevSegments = [{x: 10, y: 10}]; // For interpolation
    this.velocityX = 0;
    this.velocityY = 0;
    this.animationFrame = 0;
  }
  
  reset() {
    this.segments = [{x: 10, y: 10}];
    this.prevSegments = [{x: 10, y: 10}];
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
  
  move(moveX, moveY, tileCount, wallsEnabled = false) {
    // Store current segments as previous for interpolation
    // Deep copy not strictly needed if we replace the array, but careful with references
    // Actually, since we unshift/pop, the objects themselves (x,y) don't change often, but their position in array does.
    // We need a snapshot of the positions.
    this.prevSegments = this.segments.map(s => ({...s}));

    let headX = this.segments[0].x + moveX;
    let headY = this.segments[0].y + moveY;
    
    // Wrap around or Walls
    if (!wallsEnabled) {
        if (headX < 0) headX = tileCount - 1;
        if (headY < 0) headY = tileCount - 1;
        if (headX >= tileCount) headX = 0;
        if (headY >= tileCount) headY = 0;
    } 
    // If wallsEnabled, we let coordinates go out of bounds. 
    // The Game loop will check collision.
    
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

  triggerDeathAnimation() {
      // Can setup specific death animation state here if needed
      // e.g., this.deathStartTime = Date.now();
  }
  
  draw(ctx, gridSize, snakeColor, template, alpha = 1, dyingProgress = 0) {
    this.animationFrame++;
    
    for (let i = 0; i < this.segments.length; i++) {
        let x = this.segments[i].x;
        let y = this.segments[i].y;

        // Interpolation (Task 1)
        // Interpolate between prevSegments[i] and segments[i]
        if (alpha < 1 && this.prevSegments[i]) {
            const prev = this.prevSegments[i];
            const curr = this.segments[i];
            
            // Handle wrap-around for interpolation (don't interpolate if distance > 1)
            if (Math.abs(curr.x - prev.x) <= 1 && Math.abs(curr.y - prev.y) <= 1) {
                x = prev.x + (curr.x - prev.x) * alpha;
                y = prev.y + (curr.y - prev.y) * alpha;
            }
        }

      if (i === 0) {
        this.drawHead(ctx, gridSize, snakeColor, x, y, dyingProgress);
      } else {
        this.drawSegment(ctx, gridSize, i, snakeColor, template, x, y, dyingProgress);
      }
    }
  }
  
  drawHead(ctx, gridSize, snakeColor, x, y, dyingProgress) {
    // Shake effect if dying
    if (dyingProgress > 0) {
        x += (Math.random() - 0.5) * 0.5;
        y += (Math.random() - 0.5) * 0.5;
    }

    const centerX = x * gridSize + gridSize/2;
    const centerY = y * gridSize + gridSize/2;
    
    ctx.fillStyle = snakeColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, gridSize/2 - 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw head detailing (Gradient for 3D effect)
    const gradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 2, centerX, centerY, gridSize/2);
    gradient.addColorStop(0, lightenColor(snakeColor, 0.3));
    gradient.addColorStop(1, snakeColor);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw eyes based on direction
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    let pupilX, pupilY; // Offset for pupils to look forward
    
    // Default offsets if no movement
    let offsetX = 0, offsetY = -1; 
    
    if (this.velocityX !== 0 || this.velocityY !== 0) {
        offsetX = this.velocityX;
        offsetY = this.velocityY;
    }

    const eyeOffset = 4;
    const eyeSep = 5;
    
    // Calculate eye positions based on direction
    if (offsetX === 1) { // Right
      leftEyeX = centerX + eyeOffset; leftEyeY = centerY - eyeSep;
      rightEyeX = centerX + eyeOffset; rightEyeY = centerY + eyeSep;
      pupilX = 2; pupilY = 0;
    } else if (offsetX === -1) { // Left
      leftEyeX = centerX - eyeOffset; leftEyeY = centerY - eyeSep;
      rightEyeX = centerX - eyeOffset; rightEyeY = centerY + eyeSep;
      pupilX = -2; pupilY = 0;
    } else if (offsetY === -1) { // Up
      leftEyeX = centerX - eyeSep; leftEyeY = centerY - eyeOffset;
      rightEyeX = centerX + eyeSep; rightEyeY = centerY - eyeOffset;
      pupilX = 0; pupilY = -2;
    } else if (offsetY === 1) { // Down
      leftEyeX = centerX - eyeSep; leftEyeY = centerY + eyeOffset;
      rightEyeX = centerX + eyeSep; rightEyeY = centerY + eyeOffset;
      pupilX = 0; pupilY = 2;
    }

    // Task 6: Dizzy Eyes for Game Over
    if (dyingProgress > 0) {
         ctx.strokeStyle = 'white';
         ctx.lineWidth = 2;
         
         // Left X
         ctx.beginPath();
         ctx.moveTo(leftEyeX - 3, leftEyeY - 3);
         ctx.lineTo(leftEyeX + 3, leftEyeY + 3);
         ctx.moveTo(leftEyeX + 3, leftEyeY - 3);
         ctx.lineTo(leftEyeX - 3, leftEyeY + 3);
         ctx.stroke();

         // Right X
         ctx.beginPath();
         ctx.moveTo(rightEyeX - 3, rightEyeY - 3);
         ctx.lineTo(rightEyeX + 3, rightEyeY + 3);
         ctx.moveTo(rightEyeX + 3, rightEyeY - 3);
         ctx.lineTo(rightEyeX - 3, rightEyeY + 3);
         ctx.stroke();
         return;
    }

    // Normal Eyes (Sclera)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(leftEyeX, leftEyeY, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, rightEyeY, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilX * 0.5, leftEyeY + pupilY * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilX * 0.5, rightEyeY + pupilY * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Tongue (flickering)
    if (this.animationFrame % 20 < 10) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX + offsetX * (gridSize/2), centerY + offsetY * (gridSize/2));
        ctx.lineTo(centerX + offsetX * (gridSize/2 + 5), centerY + offsetY * (gridSize/2 + 5));
        
        // Forked tongue
        if (offsetX !== 0) {
            ctx.lineTo(centerX + offsetX * (gridSize/2 + 8), centerY + offsetY * (gridSize/2 + 8) - 2);
            ctx.moveTo(centerX + offsetX * (gridSize/2 + 5), centerY + offsetY * (gridSize/2 + 5));
            ctx.lineTo(centerX + offsetX * (gridSize/2 + 8), centerY + offsetY * (gridSize/2 + 8) + 2);
        } else {
            ctx.lineTo(centerX + offsetX * (gridSize/2 + 8) - 2, centerY + offsetY * (gridSize/2 + 8));
            ctx.moveTo(centerX + offsetX * (gridSize/2 + 5), centerY + offsetY * (gridSize/2 + 5));
            ctx.lineTo(centerX + offsetX * (gridSize/2 + 8) + 2, centerY + offsetY * (gridSize/2 + 8));
        }
        ctx.stroke();
    }
  }
  
  drawSegment(ctx, gridSize, index, snakeColor, template, x, y, dyingProgress) {
    // Fade out during death
    if (dyingProgress > 0) {
        ctx.globalAlpha = 1 - dyingProgress;
    }

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
    
    const size = gridSize - 2; // Slight gap for segmented look, or 0 for smooth
    const cx = x * gridSize + gridSize/2;
    const cy = y * gridSize + gridSize/2;
    
    ctx.beginPath();
    ctx.arc(cx, cy, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a highlight for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(cx - size/6, cy - size/6, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    if (ctx.shadowBlur > 0) {
      ctx.shadowBlur = 0;
    }

    if (dyingProgress > 0) {
        ctx.globalAlpha = 1;
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
