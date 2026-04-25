// Police Snake Entity - Hard Mode Enemy
// A silly police robot snake that chases the player with a delayed reaction

export class PoliceSnake {
  constructor(tileCount) {
    this.tileCount = tileCount;
    this.segments = [{ x: 1, y: 1 }]; // Start at top-left
    this.prevSegments = [{ x: 1, y: 1 }];
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 1.1; // Base speed multiplier
    this.baseSpeed = 1.1;
    this.animationFrame = 0;
    this.sirenPhase = 0; // For siren color animation
    this.tongueExtended = false;
    this.tongueAnimFrame = 0;
    
    // Direction following with delay
    this.directionQueue = []; // Queue of {direction, timestamp}
    this.directionDelay = 1000; // Default 1 second delay (configurable)
    this.lastDirectionChange = 0;
    
    // Movement accumulator for sub-grid speed
    this.moveAccumulator = 0;
    
    // State
    this.active = false;
    this.biting = false;
    this.biteStartTime = 0;
    
    // Initial length
    this.initialLength = 5;
  }
  
  reset(tileCount) {
    this.tileCount = tileCount;
    this.segments = [{ x: Math.floor(Math.random() * 16), y: Math.floor(Math.random() * 16) }];
    this.prevSegments = [{ x: 1, y: 1 }];
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = this.baseSpeed;
    this.animationFrame = 0;
    this.sirenPhase = 0;
    this.directionQueue = [];
    this.moveAccumulator = 0;
    this.active = false;
    this.biting = false;
    this.biteStartTime = 0;
    
    // Build initial body
    for (let i = 1; i < this.initialLength; i++) {
      this.segments.push({ x: 1, y: 1 });
    }
    this.prevSegments = this.segments.map(s => ({ ...s }));
  }
  
  activate() {
    this.active = true;
    // Start moving right initially
    this.velocityX = 1;
    this.velocityY = 0;
  }
  
  setDirectionDelay(delayMs) {
    this.directionDelay = delayMs;
  }
  
  // Queue a direction change from player (will be applied after delay)
  queueDirectionChange(vx, vy) {
    this.directionQueue.push({
      vx,
      vy,
      timestamp: Date.now()
    });
  }
  
  // Process queued direction changes
  processDirectionQueue() {
    const now = Date.now();
    
    // Find directions that should be applied (delay has passed)
    while (this.directionQueue.length > 0) {
      const oldest = this.directionQueue[0];
      if (now - oldest.timestamp >= this.directionDelay) {
        // Apply this direction
        this.velocityX = oldest.vx;
        this.velocityY = oldest.vy;
        this.directionQueue.shift();
      } else {
        break; // Remaining directions not ready yet
      }
    }
  }
  
  getHead() {
    return this.segments[0];
  }
  
  getSegments() {
    return this.segments;
  }
  
  // Move the police snake (ignores walls - ghost mode)
  move() {
    if (!this.active || (this.velocityX === 0 && this.velocityY === 0)) return null;
    
    // Process any queued direction changes
    this.processDirectionQueue();
    
    // Store previous positions for interpolation
    this.prevSegments = this.segments.map(s => ({ ...s }));
    
    // Calculate new head position (wraps around - ignores walls)
    let headX = this.segments[0].x + this.velocityX;
    let headY = this.segments[0].y + this.velocityY;
    
    // Ghost mode: wrap around regardless of walls
    if (headX < 0) headX = this.tileCount - 1;
    if (headY < 0) headY = this.tileCount - 1;
    if (headX >= this.tileCount) headX = 0;
    if (headY >= this.tileCount) headY = 0;
    
    return { x: headX, y: headY };
  }
  
  addHead(x, y) {
    this.segments.unshift({ x, y });
  }
  
  removeTail() {
    this.segments.pop();
  }
  
  // Check if police caught the player (any segment)
  checkPlayerCollision(playerSegments) {
    const head = this.getHead();
    for (const segment of playerSegments) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    return false;
  }
  
  // Check if police ate food (accidentally)
  checkFoodCollision(food) {
    if (!food) return false;
    const head = this.getHead();
    return head.x === food.x && head.y === food.y;
  }
  
  // Speed up to match player speed
  matchPlayerSpeed(playerSpeedMultiplier) {
    if (this.speed < playerSpeedMultiplier) {
      this.speed = playerSpeedMultiplier;
    }
  }
  
  // Start bite animation
  startBite() {
    this.biting = true;
    this.biteStartTime = Date.now();
    this.tongueExtended = true;
  }
  
  // Draw the police snake
  draw(ctx, gridSize, alpha = 1) {
    if (!this.active) return;
    
    this.animationFrame++;
    this.sirenPhase += 0.15; // Siren animation speed
    
    for (let i = 0; i < this.segments.length; i++) {
      let x = this.segments[i].x;
      let y = this.segments[i].y;
      
      // Interpolation
      if (alpha < 1 && this.prevSegments[i]) {
        const prev = this.prevSegments[i];
        const curr = this.segments[i];
        
        if (Math.abs(curr.x - prev.x) <= 1 && Math.abs(curr.y - prev.y) <= 1) {
          x = prev.x + (curr.x - prev.x) * alpha;
          y = prev.y + (curr.y - prev.y) * alpha;
        }
      }
      
      if (i === 0) {
        this.drawHead(ctx, gridSize, x, y);
      } else {
        this.drawSegment(ctx, gridSize, i, x, y);
      }
    }
  }
  
  drawHead(ctx, gridSize, x, y) {
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 1;
    
    // Draw scary head base (dark gray/black)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner head (white with slight gradient)
    const headGradient = ctx.createRadialGradient(
      centerX - 2, centerY - 2, 2,
      centerX, centerY, radius
    );
    headGradient.addColorStop(0, '#ffffff');
    headGradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Siren lights on top (alternating red/blue)
    const sirenOffset = 6;
    const sirenRadius = 4;
    const sirenBlink = Math.sin(this.sirenPhase) > 0;
    
    // Left siren (blue when active)
    ctx.fillStyle = sirenBlink ? '#0066ff' : '#003388';
    ctx.shadowColor = sirenBlink ? '#0066ff' : 'transparent';
    ctx.shadowBlur = sirenBlink ? 15 : 0;
    ctx.beginPath();
    ctx.arc(centerX - sirenOffset, centerY - radius + 3, sirenRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right siren (red when not blue active)
    ctx.fillStyle = !sirenBlink ? '#ff0000' : '#880000';
    ctx.shadowColor = !sirenBlink ? '#ff0000' : 'transparent';
    ctx.shadowBlur = !sirenBlink ? 15 : 0;
    ctx.beginPath();
    ctx.arc(centerX + sirenOffset, centerY - radius + 3, sirenRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw angry/scary eyes
    const eyeOffsetX = 5;
    const eyeOffsetY = 2;
    
    // Eye whites (narrowed, angry)
    ctx.fillStyle = '#ffff00'; // Yellow menacing eyes
    ctx.beginPath();
    ctx.ellipse(centerX - eyeOffsetX, centerY + eyeOffsetY, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + eyeOffsetX, centerY + eyeOffsetY, 5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Red pupils (evil)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX + this.velocityX, centerY + eyeOffsetY + this.velocityY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + eyeOffsetX + this.velocityX, centerY + eyeOffsetY + this.velocityY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - eyeOffsetX - 5, centerY + eyeOffsetY - 5);
    ctx.lineTo(centerX - eyeOffsetX + 3, centerY + eyeOffsetY - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + eyeOffsetX + 5, centerY + eyeOffsetY - 5);
    ctx.lineTo(centerX + eyeOffsetX - 3, centerY + eyeOffsetY - 3);
    ctx.stroke();
    
    // Draw the long red tongue
    this.drawTongue(ctx, centerX, centerY, gridSize);
    
    // Police badge/star on forehead
    this.drawBadge(ctx, centerX, centerY - 2);
  }
  
  drawTongue(ctx, centerX, centerY, gridSize) {
    // Tongue animation
    this.tongueAnimFrame++;
    const tongueFlicker = this.tongueAnimFrame % 15 < 10;
    const tongueLength = this.biting ? 25 : (tongueFlicker ? 18 : 12);
    
    // Calculate tongue direction
    let offsetX = this.velocityX || 0;
    let offsetY = this.velocityY || 1; // Default down if not moving
    
    const tongueStartX = centerX + offsetX * (gridSize / 2 - 2);
    const tongueStartY = centerY + offsetY * (gridSize / 2 - 2);
    const tongueEndX = tongueStartX + offsetX * tongueLength;
    const tongueEndY = tongueStartY + offsetY * tongueLength;
    
    // Main tongue
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = this.biting ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tongueStartX, tongueStartY);
    ctx.lineTo(tongueEndX, tongueEndY);
    ctx.stroke();
    
    // Forked end
    const forkLength = this.biting ? 10 : 6;
    ctx.lineWidth = 2;
    
    if (offsetX !== 0) {
      // Horizontal movement - fork vertically
      ctx.beginPath();
      ctx.moveTo(tongueEndX, tongueEndY);
      ctx.lineTo(tongueEndX + offsetX * 3, tongueEndY - forkLength);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tongueEndX, tongueEndY);
      ctx.lineTo(tongueEndX + offsetX * 3, tongueEndY + forkLength);
      ctx.stroke();
    } else {
      // Vertical movement - fork horizontally
      ctx.beginPath();
      ctx.moveTo(tongueEndX, tongueEndY);
      ctx.lineTo(tongueEndX - forkLength, tongueEndY + offsetY * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tongueEndX, tongueEndY);
      ctx.lineTo(tongueEndX + forkLength, tongueEndY + offsetY * 3);
      ctx.stroke();
    }
    
    // Venom drip when biting
    if (this.biting) {
      ctx.fillStyle = '#00ff00'; // Green venom
      ctx.beginPath();
      const dripOffset = Math.sin(this.animationFrame * 0.3) * 3;
      ctx.arc(tongueEndX + dripOffset, tongueEndY + 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawBadge(ctx, x, y) {
    // Small police star badge
    const size = 5;
    ctx.fillStyle = '#ffd700'; // Gold
    ctx.beginPath();
    
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // Badge border
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  drawSegment(ctx, gridSize, index, x, y) {
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const size = gridSize - 2;
    
    // Alternating siren colors on body
    const sirenCycle = Math.sin(this.sirenPhase + index * 0.5);
    let bodyColor;
    
    if (sirenCycle > 0.3) {
      bodyColor = '#0066ff'; // Blue
    } else if (sirenCycle < -0.3) {
      bodyColor = '#ff0000'; // Red
    } else {
      bodyColor = '#ffffff'; // White
    }
    
    // Draw segment with glow
    if (bodyColor !== '#ffffff') {
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = 8;
    }
    
    // Outer ring (dark border)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 + 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - size / 6, centerY - size / 6, size / 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }
}


