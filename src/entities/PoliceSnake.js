// Police Snake — respects obstacles / walls; body/sirens static; tongue matches player snake flicker

export class PoliceSnake {
  constructor(tileCount) {
    this.tileCount = tileCount;
    this.segments = [{ x: 3, y: 3 }];
    this.prevSegments = [{ x: 3, y: 3 }];
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 1.1;
    this.baseSpeed = 1.1;

    this.sameDirectionSince = 0;
    this.sameDirectionMs = 1000;

    this.moveAccumulator = 0;

    this.active = false;
    this.initialLength = 5;

    this.dying = false;
    this.dyingStartTime = 0;
    this.deathAnimMs = 1000;
    this.lastDeathCell = null;
    this.wasDefeated = false;
    this.animationFrame = 0;
  }

  /** Stacked body at (hx, hy); used before activate and as init placeholder */
  setInitialBodyAt(hx, hy) {
    this.segments = [{ x: hx, y: hy }];
    for (let i = 1; i < this.initialLength; i++) {
      this.segments.push({ x: hx, y: hy });
    }
    this.prevSegments = this.segments.map((s) => ({ ...s }));
  }

  reset(tileCount) {
    this.tileCount = tileCount;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = this.baseSpeed;
    this.sameDirectionSince = performance.now();
    this.moveAccumulator = 0;
    this.active = false;
    this.dying = false;
    this.dyingStartTime = 0;
    this.lastDeathCell = null;
    this.wasDefeated = false;
    this.animationFrame = 0;

    // Real spawn position is set in placeSpawnAwayFrom() when police activates
    this.setInitialBodyAt(1, 1);
  }

  /**
   * Before police appears: head cell must be at least `minAxis` away from snake head on both axes.
   * Deterministic row-major scan (not random). Relaxes min axis only if no cell fits.
   */
  placeSpawnAwayFrom(snakeSegments, obstacles, tileCount, wallsEnabled, minAxis = 4) {
    this.tileCount = tileCount;
    const head = snakeSegments[0];
    if (!head) {
      this.setInitialBodyAt(1, 1);
      return;
    }

    const cellFree = (x, y) => {
      if (this.isWallBorder(x, y, wallsEnabled)) return false;
      if (this.isObstacleAt(x, y, obstacles)) return false;
      if (snakeSegments.some((s) => s.x === x && s.y === y)) return false;
      return true;
    };

    for (let d = minAxis; d >= 0; d--) {
      for (let y = 1; y <= tileCount - 2; y++) {
        for (let x = 1; x <= tileCount - 2; x++) {
          if (Math.abs(x - head.x) < d || Math.abs(y - head.y) < d) continue;
          if (cellFree(x, y)) {
            this.setInitialBodyAt(x, y);
            return;
          }
        }
      }
    }

    this.setInitialBodyAt(1, 1);
  }

  activate() {
    this.active = true;
    this.dying = false;
    this.velocityX = 1;
    this.velocityY = 0;
    this.sameDirectionSince = performance.now();
  }

  setDirectionDelay(delayMs) {
    this.sameDirectionMs = delayMs;
  }

  setInitialLength(n) {
    this.initialLength = n;
  }

  isWallBorder(x, y, wallsEnabled) {
    if (!wallsEnabled) return false;
    return x <= 0 || y <= 0 || x >= this.tileCount - 1 || y >= this.tileCount - 1;
  }

  wrapCoord(x, y, wallsEnabled) {
    if (wallsEnabled) return { x, y };
    let nx = x;
    let ny = y;
    if (nx < 0) nx = this.tileCount - 1;
    if (ny < 0) ny = this.tileCount - 1;
    if (nx >= this.tileCount) nx = 0;
    if (ny >= this.tileCount) ny = 0;
    return { x: nx, y: ny };
  }

  isObstacleAt(x, y, obstacles) {
    return obstacles.some((o) => o.x === x && o.y === y);
  }

  /** Next head cell from (x,y) with velocity; applies wrap when walls off */
  projectedHead(x, y, vx, vy, wallsEnabled) {
    const rawX = x + vx;
    const rawY = y + vy;
    return this.wrapCoord(rawX, rawY, wallsEnabled);
  }

  wouldCollideWithSelf(nx, ny, excludeTailVacate) {
    const last = this.segments.length - 1;
    for (let i = 0; i < this.segments.length; i++) {
      if (excludeTailVacate && i === last) continue;
      const s = this.segments[i];
      if (s.x === nx && s.y === ny) return true;
    }
    return false;
  }

  isBlocked(nx, ny, obstacles, wallsEnabled) {
    if (this.isWallBorder(nx, ny, wallsEnabled)) return true;
    if (this.isObstacleAt(nx, ny, obstacles)) return true;
    if (this.wouldCollideWithSelf(nx, ny, true)) return true;
    return false;
  }

  /** Prefer moving toward player head on X/Y; skip 180 reversal and blocked cells */
  pickVelocityTowardPlayer(head, playerHead, obstacles, wallsEnabled, currentVx, currentVy) {
    const dx = playerHead.x - head.x;
    const dy = playerHead.y - head.y;

    const horiz =
      dx !== 0
        ? { vx: dx > 0 ? 1 : -1, vy: 0 }
        : null;
    const vert =
      dy !== 0
        ? { vx: 0, vy: dy > 0 ? 1 : -1 }
        : null;

    const ordered = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (horiz) ordered.push(horiz);
      if (vert) ordered.push(vert);
    } else {
      if (vert) ordered.push(vert);
      if (horiz) ordered.push(horiz);
    }

    const extras = [
      { vx: 1, vy: 0 },
      { vx: -1, vy: 0 },
      { vx: 0, vy: 1 },
      { vx: 0, vy: -1 },
    ];

    const candidates = [];
    const seen = new Set();
    const push = (c) => {
      const k = `${c.vx},${c.vy}`;
      if (seen.has(k)) return;
      seen.add(k);
      candidates.push(c);
    };

    for (const c of ordered) push(c);
    for (const c of extras) push(c);

    const nxHead = (vx, vy) => this.projectedHead(head.x, head.y, vx, vy, wallsEnabled);

    for (const c of candidates) {
      if (c.vx === -currentVx && c.vy === -currentVy && this.segments.length > 1) continue;
      const p = nxHead(c.vx, c.vy);
      if (!this.isBlocked(p.x, p.y, obstacles, wallsEnabled)) {
        return { vx: c.vx, vy: c.vy };
      }
    }

    // Dead end (e.g. 3 obstacles around): only escape may be 180° (tail cell vacates)
    if (this.segments.length > 1 && (currentVx !== 0 || currentVy !== 0)) {
      const rvx = -currentVx;
      const rvy = -currentVy;
      const pr = nxHead(rvx, rvy);
      if (!this.isBlocked(pr.x, pr.y, obstacles, wallsEnabled)) {
        return { vx: rvx, vy: rvy };
      }
    }

    return { vx: currentVx, vy: currentVy };
  }

  applyVelocityIfChanged(nvx, nvy) {
    if (nvx !== this.velocityX || nvy !== this.velocityY) {
      this.velocityX = nvx;
      this.velocityY = nvy;
      this.sameDirectionSince = performance.now();
    }
  }

  /**
   * Plan next head position: obstacle reroute toward player; every sameDirectionMs re-aim at player.
   */
  computeNextMove(obstacles, playerHead, wallsEnabled) {
    if (!this.active || this.dying) return null;

    const head = this.segments[0];
    const now = performance.now();

    if (now - this.sameDirectionSince >= this.sameDirectionMs) {
      const toward = this.pickVelocityTowardPlayer(head, playerHead, obstacles, wallsEnabled, this.velocityX, this.velocityY);
      this.applyVelocityIfChanged(toward.vx, toward.vy);
    }

    let vx = this.velocityX;
    let vy = this.velocityY;
    let dest = this.projectedHead(head.x, head.y, vx, vy, wallsEnabled);

    if (this.isBlocked(dest.x, dest.y, obstacles, wallsEnabled)) {
      const steer = this.pickVelocityTowardPlayer(head, playerHead, obstacles, wallsEnabled, vx, vy);
      this.applyVelocityIfChanged(steer.vx, steer.vy);
      vx = this.velocityX;
      vy = this.velocityY;
      dest = this.projectedHead(head.x, head.y, vx, vy, wallsEnabled);
    }

    if (this.isBlocked(dest.x, dest.y, obstacles, wallsEnabled)) {
      const dirs = [
        { vx: 1, vy: 0 },
        { vx: -1, vy: 0 },
        { vx: 0, vy: 1 },
        { vx: 0, vy: -1 },
      ];
      for (const d of dirs) {
        if (d.vx === -this.velocityX && d.vy === -this.velocityY && this.segments.length > 1) continue;
        const p = this.projectedHead(head.x, head.y, d.vx, d.vy, wallsEnabled);
        if (!this.isBlocked(p.x, p.y, obstacles, wallsEnabled)) {
          this.applyVelocityIfChanged(d.vx, d.vy);
          dest = p;
          break;
        }
      }
    }

    if (this.isBlocked(dest.x, dest.y, obstacles, wallsEnabled)) {
      const rvx = -this.velocityX;
      const rvy = -this.velocityY;
      if (this.segments.length > 1 && (rvx !== 0 || rvy !== 0)) {
        const pr = this.projectedHead(head.x, head.y, rvx, rvy, wallsEnabled);
        if (!this.isBlocked(pr.x, pr.y, obstacles, wallsEnabled)) {
          this.applyVelocityIfChanged(rvx, rvy);
          dest = pr;
        }
      }
    }

    if (this.isBlocked(dest.x, dest.y, obstacles, wallsEnabled)) {
      return null;
    }

    this.prevSegments = this.segments.map((s) => ({ ...s }));
    return dest;
  }

  addHead(x, y) {
    this.segments.unshift({ x, y });
  }

  removeTail() {
    this.segments.pop();
  }

  /** Any police segment overlaps any player segment */
  checkMutualBodyCollision(playerSegments) {
    for (const ps of playerSegments) {
      for (const seg of this.segments) {
        if (ps.x === seg.x && ps.y === seg.y) return true;
      }
    }
    return false;
  }

  checkFoodCollision(food) {
    if (!food) return false;
    const h = this.getHead();
    return h.x === food.x && h.y === food.y;
  }

  matchPlayerSpeed(playerSpeedMultiplier) {
    if (this.speed < playerSpeedMultiplier) {
      this.speed = playerSpeedMultiplier;
    }
  }

  getHead() {
    return this.segments[0];
  }

  getSegments() {
    return this.segments;
  }

  /** Path crosses any segment: shorten tail by one. Returns true if bullet should be removed. */
  tryHitFromBullet(prevX, prevY, nextX, nextY) {
    if (!this.active || this.dying) return false;
    const between = (a, b, c) => (a >= b && a <= c) || (a <= b && a >= c);
    const hit = this.segments.some(
      (s) => between(s.x, prevX, nextX) && between(s.y, prevY, nextY)
    );
    if (!hit) return false;

    if (this.segments.length <= 1) {
      const h = this.segments[0];
      this.lastDeathCell = { x: h.x, y: h.y };
      this.segments = [];
      this.beginDeathSequence();
    } else {
      this.segments.pop();
    }
    return true;
  }

  beginDeathSequence() {
    this.dying = true;
    this.dyingStartTime = performance.now();
  }

  updateDeathState() {
    if (!this.dying) return;
    const t = performance.now() - this.dyingStartTime;
    if (t >= this.deathAnimMs) {
      this.active = false;
      this.dying = false;
      this.velocityX = 0;
      this.velocityY = 0;
      this.segments = [];
      this.lastDeathCell = null;
      this.wasDefeated = true;
    }
  }

  getDeathProgress() {
    if (!this.dying) return 0;
    return Math.min(1, (performance.now() - this.dyingStartTime) / this.deathAnimMs);
  }

  draw(ctx, gridSize, alpha = 1) {
    if (this.dying && this.segments.length === 0 && this.lastDeathCell) {
      const prog = this.getDeathProgress();
      const x = this.lastDeathCell.x;
      const y = this.lastDeathCell.y;
      const cx = x * gridSize + gridSize / 2;
      const cy = y * gridSize + gridSize / 2;
      ctx.globalAlpha = 1 - prog;
      const r = gridSize * (0.35 + prog * 0.9);
      ctx.fillStyle = `rgba(200, 60, 60, ${0.55 * (1 - prog)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    if (!this.active && !this.dying) return;

    this.animationFrame++;

    for (let i = 0; i < this.segments.length; i++) {
      let x = this.segments[i].x;
      let y = this.segments[i].y;

      if (alpha < 1 && this.prevSegments[i]) {
        const prev = this.prevSegments[i];
        const curr = this.segments[i];
        if (curr && Math.abs(curr.x - prev.x) <= 1 && Math.abs(curr.y - prev.y) <= 1) {
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

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fill();

    const headGradient = ctx.createRadialGradient(
      centerX - 2,
      centerY - 2,
      2,
      centerX,
      centerY,
      radius
    );
    headGradient.addColorStop(0, '#ffffff');
    headGradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    const sirenOffset = 6;
    const sirenRadius = 4;
    ctx.fillStyle = '#0066ff';
    ctx.beginPath();
    ctx.arc(centerX - sirenOffset, centerY - radius + 3, sirenRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(centerX + sirenOffset, centerY - radius + 3, sirenRadius, 0, Math.PI * 2);
    ctx.fill();

    const eyeOffsetX = 5;
    const eyeOffsetY = 2;

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.ellipse(centerX - eyeOffsetX, centerY + eyeOffsetY, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + eyeOffsetX, centerY + eyeOffsetY, 5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX + this.velocityX, centerY + eyeOffsetY + this.velocityY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + eyeOffsetX + this.velocityX, centerY + eyeOffsetY + this.velocityY, 2, 0, Math.PI * 2);
    ctx.fill();

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

    this.drawTongue(ctx, centerX, centerY, gridSize);
    this.drawBadge(ctx, centerX, centerY - 2);
  }

  /** Same tongue size / flicker as player snake (`Snake.drawHead`) */
  drawTongue(ctx, centerX, centerY, gridSize) {
    let offsetX = 0;
    let offsetY = -1;
    if (this.velocityX !== 0 || this.velocityY !== 0) {
      offsetX = this.velocityX;
      offsetY = this.velocityY;
    }

    if (this.animationFrame % 20 < 10) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + offsetX * (gridSize / 2), centerY + offsetY * (gridSize / 2));
      ctx.lineTo(centerX + offsetX * (gridSize / 2 + 5), centerY + offsetY * (gridSize / 2 + 5));

      if (offsetX !== 0) {
        ctx.lineTo(centerX + offsetX * (gridSize / 2 + 8), centerY + offsetY * (gridSize / 2 + 8) - 2);
        ctx.moveTo(centerX + offsetX * (gridSize / 2 + 5), centerY + offsetY * (gridSize / 2 + 5));
        ctx.lineTo(centerX + offsetX * (gridSize / 2 + 8), centerY + offsetY * (gridSize / 2 + 8) + 2);
      } else {
        ctx.lineTo(centerX + offsetX * (gridSize / 2 + 8) - 2, centerY + offsetY * (gridSize / 2 + 8));
        ctx.moveTo(centerX + offsetX * (gridSize / 2 + 5), centerY + offsetY * (gridSize / 2 + 5));
        ctx.lineTo(centerX + offsetX * (gridSize / 2 + 8) + 2, centerY + offsetY * (gridSize / 2 + 8));
      }
      ctx.stroke();
    }
  }

  drawBadge(ctx, x, y) {
    const size = 5;
    ctx.fillStyle = '#ffd700';
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

    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** Body: static red / blue / white by segment index (no time-based animation) */
  drawSegment(ctx, gridSize, index, x, y) {
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const size = gridSize - 2;

    const mod = ((index % 3) + 3) % 3;
    let bodyColor;
    if (mod === 0) bodyColor = '#0066ff';
    else if (mod === 1) bodyColor = '#cc0000';
    else bodyColor = '#f0f0f0';

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 + 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(centerX - size / 6, centerY - size / 6, size / 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
