# Visual Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the game from procedural rendering to a rich, hand-drawn aesthetic with cross-hatched textures, a proper particle system, and polished UI.

**Architecture:** Extend existing `sketchy.ts` with cross-hatching primitives and enhanced cloud rendering. Create a new `particles.ts` module with a `ParticleSystem` class that manages particle lifecycle. All effects use the existing wobble/hand-drawn system for visual consistency.

**Tech Stack:** Canvas API, TypeScript, existing sketchy.ts utilities

**Current Status:**
- Sprint 3 (Zeno Poses) is ALREADY COMPLETE - `drawZenoCoil`, `drawZenoBolt`, `drawZenoImpact` are implemented and integrated
- Many inline effects exist (`drawDustPuffs`, `drawGroundCracks`, etc.) but no centralized particle system
- Cross-hatching and enhanced clouds are NOT implemented

---

## Sprint 1: The Living World - Cross-Hatching & Enhanced Clouds

**Goal:** Make the world feel hand-drawn and textured, not procedural.

---

### Task 1.1: Create Cross-Hatching Function

**Files:**
- Modify: `src/game/engine/sketchy.ts` (add at end)
- Test: Manual visual testing in browser

**Step 1: Write the cross-hatch function**

Add to `src/game/engine/sketchy.ts`:

```typescript
// Draw cross-hatching texture within a rectangular area
export function drawCrossHatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  nowMs: number,
  density: number = 5,
  angle1: number = 45,
  angle2: number = -45,
) {
  const lineSpacing = Math.max(3, 20 / density);

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.3;

  // First set of parallel lines at angle1
  const rad1 = (angle1 * Math.PI) / 180;
  const cos1 = Math.cos(rad1);
  const sin1 = Math.sin(rad1);

  // Calculate number of lines needed to cover the area
  const diagonal = Math.sqrt(width * width + height * height);
  const lineCount = Math.ceil(diagonal / lineSpacing);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // Draw first set of lines
  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * lineSpacing;
    const startX = x + width / 2 + offset * cos1 - diagonal * sin1;
    const startY = y + height / 2 + offset * sin1 + diagonal * cos1;
    const endX = x + width / 2 + offset * cos1 + diagonal * sin1;
    const endY = y + height / 2 + offset * sin1 - diagonal * cos1;

    // Add wobble for hand-drawn feel
    const wobble1 = getWobble(startX, startY, nowMs, 0.5);
    const wobble2 = getWobble(endX, endY, nowMs, 0.5);

    ctx.moveTo(startX + wobble1.dx, startY + wobble1.dy);
    ctx.lineTo(endX + wobble2.dx, endY + wobble2.dy);
  }
  ctx.stroke();

  // Draw second set of lines at angle2
  ctx.beginPath();
  const rad2 = (angle2 * Math.PI) / 180;
  const cos2 = Math.cos(rad2);
  const sin2 = Math.sin(rad2);

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * lineSpacing;
    const startX = x + width / 2 + offset * cos2 - diagonal * sin2;
    const startY = y + height / 2 + offset * sin2 + diagonal * cos2;
    const endX = x + width / 2 + offset * cos2 + diagonal * sin2;
    const endY = y + height / 2 + offset * sin2 - diagonal * cos2;

    const wobble1 = getWobble(startX + 50, startY + 50, nowMs, 0.5);
    const wobble2 = getWobble(endX + 50, endY + 50, nowMs, 0.5);

    ctx.moveTo(startX + wobble1.dx, startY + wobble1.dy);
    ctx.lineTo(endX + wobble2.dx, endY + wobble2.dy);
  }
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;
}

// Helper: need to export getWobble or make it accessible
function getWobbleForHatch(x: number, y: number, nowMs: number, intensity: number): { dx: number; dy: number } {
  const frame = Math.floor(nowMs / 100);
  const seed1 = Math.sin(x * 12.9898 + y * 78.233 + frame) * 43758.5453;
  const seed2 = Math.sin(y * 12.9898 + x * 78.233 + frame + 100) * 43758.5453;
  const dx = ((seed1 - Math.floor(seed1)) - 0.5) * intensity;
  const dy = ((seed2 - Math.floor(seed2)) - 0.5) * intensity;
  return { dx, dy };
}
```

**Step 2: Verify the function compiles**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawCrossHatch function for textured fills

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Create Decorative Curl Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add the decorative curl function**

Add to `src/game/engine/sketchy.ts`:

```typescript
// Draw a decorative spiral curl (for cloud edges, UI embellishments)
export function drawDecorativeCurl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number = 1.5,
  nowMs: number = 0,
  direction: 1 | -1 = 1, // 1 = clockwise, -1 = counter-clockwise
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const wobble = getWobble(x, y, nowMs, 0.5);

  ctx.beginPath();

  // Draw spiral from outside in
  const turns = 1.2;
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2 * direction;
    const r = size * (1 - t * 0.8); // Spiral inward
    const px = x + Math.cos(angle) * r + wobble.dx * (1 - t);
    const py = y + Math.sin(angle) * r + wobble.dy * (1 - t);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}
```

**Step 2: Verify the function compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawDecorativeCurl for spiral embellishments

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Create Enhanced Cloud Platform Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add the detailed cloud function**

Add to `src/game/engine/sketchy.ts`:

```typescript
// Draw an enhanced cloud platform with cross-hatching and decorative curls
export function drawDetailedCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  nowMs: number,
  filled: boolean = true,
) {
  const wobble = getWobble(x, y, nowMs, 0.5);

  // Cloud made of overlapping circles for fluffy outline
  const circleCount = Math.floor(width / 15) + 2;
  const circleSpacing = width / (circleCount - 1);

  // Store circle positions for cross-hatch clipping
  const circles: { cx: number; cy: number; r: number }[] = [];

  // Generate circle positions with varying heights
  for (let i = 0; i < circleCount; i++) {
    const cx = x - width / 2 + i * circleSpacing + wobble.dx;
    const heightVariation = Math.sin(i * 1.5) * (height * 0.3);
    const cy = y + heightVariation + wobble.dy;
    const r = height * 0.5 + Math.sin(i * 2.1) * (height * 0.15);
    circles.push({ cx, cy, r });
  }

  // If filled, draw cross-hatching first (will be clipped)
  if (filled) {
    ctx.save();

    // Create clipping path from all circles
    ctx.beginPath();
    for (const c of circles) {
      ctx.moveTo(c.cx + c.r, c.cy);
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    }
    ctx.clip();

    // Draw cross-hatching inside cloud
    drawCrossHatch(
      ctx,
      x - width / 2 - 10,
      y - height,
      width + 20,
      height * 2,
      color,
      nowMs,
      3, // density
      30, // angle1
      -30, // angle2
    );

    ctx.restore();
  }

  // Draw cloud outlines (overlapping circles)
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WEIGHTS.primary;

  for (const c of circles) {
    drawHandCircle(ctx, c.cx, c.cy, c.r, color, LINE_WEIGHTS.primary, nowMs, false);
  }

  // Add decorative curls at edges
  const leftmostCircle = circles[0];
  const rightmostCircle = circles[circles.length - 1];

  // Left curl
  drawDecorativeCurl(
    ctx,
    leftmostCircle.cx - leftmostCircle.r * 0.7,
    leftmostCircle.cy + leftmostCircle.r * 0.3,
    8,
    color,
    1.5,
    nowMs,
    -1, // counter-clockwise
  );

  // Right curl
  drawDecorativeCurl(
    ctx,
    rightmostCircle.cx + rightmostCircle.r * 0.7,
    rightmostCircle.cy + rightmostCircle.r * 0.3,
    8,
    color,
    1.5,
    nowMs,
    1, // clockwise
  );

  // Top curls (decorative wisps)
  const topCircle = circles[Math.floor(circles.length / 2)];
  drawDecorativeCurl(
    ctx,
    topCircle.cx - 5,
    topCircle.cy - topCircle.r * 0.8,
    6,
    color,
    1,
    nowMs,
    1,
  );
}
```

**Step 2: Verify the function compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawDetailedCloud with cross-hatching and curls

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.4: Integrate Enhanced Clouds into Flipbook Renderer

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Update imports in render.ts**

Add to imports:

```typescript
import {
  // ... existing imports ...
  drawDetailedCloud,
  drawDecorativeCurl,
  drawCrossHatch,
} from './sketchy';
```

**Step 2: Replace cloud platform calls in renderFlipbookFrame**

Find the cloud platform section (~lines 79-92) and replace:

```typescript
  // Cloud platforms - enhanced with cross-hatching
  // Starting platform (where player launches from)
  drawDetailedCloud(ctx, 70, groundY - 5, 120, 35, COLORS.player, nowMs, true);

  // Middle floating cloud (decorative)
  drawDetailedCloud(ctx, 220, groundY - 50, 80, 25, COLORS.accent3, nowMs, false);

  // Landing platform (near target area)
  drawDetailedCloud(ctx, 380, groundY - 5, 100, 35, COLORS.player, nowMs, true);
```

**Step 3: Test visually**

Run: `npm run dev`
Expected: Cloud platforms now have cross-hatching texture and decorative curls at edges

**Step 4: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): integrate enhanced clouds with cross-hatching

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Sprint 2: Particle System Architecture

**Goal:** Create a proper particle system to manage energy swirls, dust clouds, debris, and impact effects.

---

### Task 2.1: Create Particle Types and Interfaces

**Files:**
- Create: `src/game/engine/particles.ts`

**Step 1: Create the particles.ts file with types**

```typescript
// Particle system for visual effects
// Types: swirl (charging energy), dust (landing), debris (impact), crack (ground impact)

export type ParticleType = 'swirl' | 'dust' | 'debris' | 'crack' | 'spark';

export interface Particle {
  id: number;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;      // Current life (counts down)
  maxLife: number;   // Initial life for calculating alpha
  size: number;
  rotation: number;  // For debris
  rotationSpeed: number;
  color: string;
  gravity: number;   // Per-particle gravity
}

export interface ParticleEmitOptions {
  x: number;
  y: number;
  count?: number;
  spread?: number;      // Angle spread in radians
  baseAngle?: number;   // Direction to emit
  speed?: number;
  speedVariance?: number;
  life?: number;
  lifeVariance?: number;
  size?: number;
  sizeVariance?: number;
  color?: string;
  gravity?: number;
}
```

**Step 2: Verify the file compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/particles.ts
git commit -m "feat(particles): add particle type definitions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.2: Implement ParticleSystem Class Core

**Files:**
- Modify: `src/game/engine/particles.ts`

**Step 1: Add the ParticleSystem class**

Add to `src/game/engine/particles.ts`:

```typescript
export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;
  private maxParticles = 150;

  emit(type: ParticleType, options: ParticleEmitOptions): void {
    const count = options.count ?? 5;
    const spread = options.spread ?? Math.PI * 0.5;
    const baseAngle = options.baseAngle ?? -Math.PI / 2; // Default: upward
    const baseSpeed = options.speed ?? 2;
    const speedVar = options.speedVariance ?? 1;
    const baseLife = options.life ?? 30;
    const lifeVar = options.lifeVariance ?? 10;
    const baseSize = options.size ?? 3;
    const sizeVar = options.sizeVariance ?? 1;
    const gravity = options.gravity ?? 0.1;
    const color = options.color ?? '#1a4a7a';

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        // Remove oldest particle
        this.particles.shift();
      }

      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = baseSpeed + (Math.random() - 0.5) * speedVar * 2;
      const life = baseLife + (Math.random() - 0.5) * lifeVar * 2;
      const size = baseSize + (Math.random() - 0.5) * sizeVar * 2;

      this.particles.push({
        id: this.nextId++,
        type,
        x: options.x + (Math.random() - 0.5) * 10,
        y: options.y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Math.max(1, size),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        color,
        gravity: type === 'swirl' ? 0 : gravity, // Swirls don't fall
      });
    }
  }

  update(deltaTime: number = 1): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Apply gravity
      p.vy += p.gravity * deltaTime;

      // Update rotation for debris
      p.rotation += p.rotationSpeed * deltaTime;

      // Decrease life
      p.life -= deltaTime;

      // Apply type-specific behaviors
      if (p.type === 'swirl') {
        // Swirls orbit and expand slightly
        const orbitSpeed = 0.1;
        const tempX = p.vx;
        p.vx = p.vx * Math.cos(orbitSpeed) - p.vy * Math.sin(orbitSpeed);
        p.vy = tempX * Math.sin(orbitSpeed) + p.vy * Math.cos(orbitSpeed);
      } else if (p.type === 'dust') {
        // Dust expands and slows
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.size *= 1.02;
      }

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }

  get count(): number {
    return this.particles.length;
  }
}
```

**Step 2: Verify the class compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/particles.ts
git commit -m "feat(particles): implement ParticleSystem class with emit/update

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.3: Add Particle Rendering Function

**Files:**
- Modify: `src/game/engine/particles.ts`

**Step 1: Add render function**

Add to `src/game/engine/particles.ts`:

```typescript
import { drawHandCircle, drawHandLine, LINE_WEIGHTS } from './sketchy';

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
): void {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;

    switch (p.type) {
      case 'swirl':
        // Energy swirl - small spiral arc
        ctx.strokeStyle = p.color;
        ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          const angle = p.rotation + t * Math.PI;
          const r = p.size * (1 - t * 0.5);
          const px = p.x + Math.cos(angle) * r;
          const py = p.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;

      case 'dust':
        // Dust cloud - wobbly circle
        drawHandCircle(ctx, p.x, p.y, p.size, p.color, 1, nowMs, false);
        break;

      case 'debris':
        // Debris - small rotated line or triangle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size, 0);
        ctx.stroke();
        ctx.restore();
        break;

      case 'crack':
        // Crack - stays in place, fades out
        ctx.strokeStyle = p.color;
        ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.rotation) * p.size, p.y + Math.sin(p.rotation) * p.size);
        ctx.stroke();
        break;

      case 'spark':
        // Spark - tiny bright dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Verify the function compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/particles.ts
git commit -m "feat(particles): add renderParticles function with per-type rendering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.4: Add Convenience Emit Methods

**Files:**
- Modify: `src/game/engine/particles.ts`

**Step 1: Add preset emission methods to ParticleSystem**

Add these methods to the `ParticleSystem` class:

```typescript
  // Emit energy swirls during charging
  emitChargingSwirls(x: number, y: number, intensity: number, color: string): void {
    if (intensity < 0.2) return;

    const count = Math.floor(intensity * 4);
    this.emit('swirl', {
      x,
      y: y - 15, // Center on character
      count,
      spread: Math.PI * 2,
      speed: 1 + intensity * 2,
      speedVariance: 0.5,
      life: 20 + intensity * 15,
      size: 5 + intensity * 5,
      color,
      gravity: 0,
    });
  }

  // Emit dust on landing impact
  emitLandingDust(x: number, y: number, color: string): void {
    this.emit('dust', {
      x,
      y,
      count: 12,
      spread: Math.PI,
      baseAngle: -Math.PI / 2, // Upward burst
      speed: 2,
      speedVariance: 1.5,
      life: 25,
      lifeVariance: 8,
      size: 4,
      sizeVariance: 2,
      color,
      gravity: 0.02,
    });
  }

  // Emit debris from impact
  emitImpactDebris(x: number, y: number, color: string): void {
    this.emit('debris', {
      x,
      y,
      count: 8,
      spread: Math.PI * 0.8,
      baseAngle: -Math.PI / 2,
      speed: 3,
      speedVariance: 2,
      life: 35,
      lifeVariance: 10,
      size: 4,
      sizeVariance: 2,
      color,
      gravity: 0.15,
    });
  }

  // Emit ground cracks
  emitGroundCracks(x: number, y: number, color: string): void {
    const crackCount = 6;
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI + Math.PI * 0.1;
      this.emit('crack', {
        x,
        y,
        count: 1,
        spread: 0,
        baseAngle: angle,
        speed: 0,
        life: 40,
        size: 15 + Math.random() * 10,
        color,
        gravity: 0,
      });
    }
  }

  // Emit launch sparks
  emitLaunchSparks(x: number, y: number, color: string): void {
    this.emit('spark', {
      x,
      y,
      count: 10,
      spread: Math.PI * 0.6,
      baseAngle: Math.PI, // Backward
      speed: 4,
      speedVariance: 2,
      life: 15,
      lifeVariance: 5,
      size: 2,
      sizeVariance: 1,
      color,
      gravity: 0.08,
    });
  }
```

**Step 2: Verify the methods compile**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/particles.ts
git commit -m "feat(particles): add convenience emit methods for game events

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.5: Integrate ParticleSystem into Game State

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`

**Step 1: Add particleSystem to GameState type**

In `src/game/engine/types.ts`, add to the GameState interface:

```typescript
import type { ParticleSystem } from './particles';

// In GameState interface, add:
  particleSystem: ParticleSystem;
```

**Step 2: Initialize particleSystem in createInitialState**

In `src/game/engine/state.ts`, add:

```typescript
import { ParticleSystem } from './particles';

// In createInitialState function, add to the returned object:
  particleSystem: new ParticleSystem(),
```

**Step 3: Verify compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat(state): integrate ParticleSystem into game state

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.6: Emit Particles on Game Events

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Add particle emissions on game events**

In `src/game/engine/update.ts`, find the appropriate event handlers and add particle emissions:

**On charging (every few frames):**
```typescript
// In charging logic, add:
if (state.charging && state.frameCount % 4 === 0) {
  state.particleSystem.emitChargingSwirls(
    state.px,
    state.py,
    state.chargePower,
    theme.accent1,
  );
}
```

**On launch:**
```typescript
// When launching, add:
state.particleSystem.emitLaunchSparks(state.px, state.py, theme.accent3);
```

**On landing:**
```typescript
// When landing, add:
if (state.landingFrame === 1) {
  state.particleSystem.emitLandingDust(state.px, state.py, theme.accent3);
  state.particleSystem.emitImpactDebris(state.px, state.py, theme.accent3);
  state.particleSystem.emitGroundCracks(state.px, state.py, theme.accent3);
}
```

**Step 2: Update particles each frame**

At the end of updateFrame, add:
```typescript
state.particleSystem.update(1);
```

**Step 3: Verify compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(update): emit particles on charging, launch, and landing

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.7: Render Particles in Frame

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Import renderParticles**

Add to imports:
```typescript
import { renderParticles } from './particles';
```

**Step 2: Render particles in flipbook renderer**

In `renderFlipbookFrame`, after particles loop (~line 297), add:

```typescript
  // Render particle system particles
  renderParticles(ctx, state.particleSystem.getParticles(), nowMs, 'flipbook');
```

**Step 3: Render particles in noir renderer**

In `renderNoirFrame`, after particles loop (~line 889), add:

```typescript
  // Render particle system particles
  renderParticles(ctx, state.particleSystem.getParticles(), nowMs, 'noir');
```

**Step 4: Test visually**

Run: `npm run dev`
Expected: Particles appear during charging, on launch, and on landing

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): integrate particle system rendering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Sprint 4: The Final Polish

**Goal:** Polish UI elements and add decorative details.

---

### Task 4.1: Style Trajectory Arc with Hand-Drawn Feel

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Create enhanced trajectory drawing function**

Add to `src/game/engine/sketchy.ts`:

```typescript
// Draw a styled trajectory arc with varying thickness and wobble
export function drawStyledTrajectory(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw with varying line width (thicker at start, thinner at end)
  for (let i = 0; i < points.length - 1; i++) {
    const t = i / points.length;
    const width = themeKind === 'flipbook'
      ? 3 - t * 2 // 3px to 1px
      : 2 - t * 1.5; // 2px to 0.5px

    // Skip every other segment for dashed effect
    if (i % 2 === 1) continue;

    const p1 = points[i];
    const p2 = points[i + 1];

    // Add wobble
    const w1 = getWobble(p1.x, p1.y, nowMs, 0.8);
    const w2 = getWobble(p2.x, p2.y, nowMs, 0.8);

    ctx.lineWidth = Math.max(0.5, width);
    ctx.beginPath();
    ctx.moveTo(p1.x + w1.dx, p1.y + w1.dy);
    ctx.lineTo(p2.x + w2.dx, p2.y + w2.dy);
    ctx.stroke();
  }

  // Add endpoint marker
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, themeKind === 'flipbook' ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

**Step 2: Verify compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawStyledTrajectory with varying width and wobble

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4.2: Integrate Styled Trajectory into Renderers

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Import the new function**

Add to imports:
```typescript
import {
  // ... existing imports ...
  drawStyledTrajectory,
} from './sketchy';
```

**Step 2: Replace trajectory preview in flipbook renderer**

In `renderFlipbookFrame`, find the trajectory preview section (~lines 438-472) and replace the drawing code:

```typescript
      // Draw styled preview arc
      drawStyledTrajectory(ctx, previewPoints, COLORS.accent3, nowMs, 'flipbook');
```

**Step 3: Replace trajectory preview in noir renderer**

In `renderNoirFrame`, find the trajectory preview section (~lines 981-1016) and replace:

```typescript
      // Draw styled preview arc (noir style)
      drawStyledTrajectory(ctx, previewPoints, COLORS.player, nowMs, 'noir');
```

**Step 4: Test visually**

Run: `npm run dev`
Expected: Trajectory preview now has hand-drawn wobble and varying thickness

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): use styled trajectory for preview arcs

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4.3: Add Decorative UI Curls

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add decorative curls to wind indicator box**

In `renderFlipbookFrame`, after the wind indicator box drawing (~line 165), add:

```typescript
  // Decorative curls on wind indicator corners
  drawDecorativeCurl(ctx, windBoxX - 3, windBoxY + 3, 5, COLORS.accent3, 1, nowMs, -1);
  drawDecorativeCurl(ctx, windBoxX + windBoxW + 3, windBoxY + windBoxH - 3, 5, COLORS.accent3, 1, nowMs, 1);
```

**Step 2: Add decorative curls to power bar**

In the charging UI section (~line 378), add after the bar:

```typescript
  // Decorative curl on power bar
  drawDecorativeCurl(ctx, barX - 5, barY + barH / 2, 4, COLORS.accent3, 1, nowMs, -1);
```

**Step 3: Test visually**

Run: `npm run dev`
Expected: Small decorative curls appear at UI element corners

**Step 4: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): add decorative curls to UI elements

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

### Sprint 1: The Living World
- [x] Task 1.1: Create drawCrossHatch function
- [x] Task 1.2: Create drawDecorativeCurl function
- [x] Task 1.3: Create drawDetailedCloud function
- [x] Task 1.4: Integrate enhanced clouds into renderers

### Sprint 2: Particle System
- [x] Task 2.1: Create particle types and interfaces
- [x] Task 2.2: Implement ParticleSystem class core
- [x] Task 2.3: Add particle rendering function
- [x] Task 2.4: Add convenience emit methods
- [x] Task 2.5: Integrate into game state
- [x] Task 2.6: Emit particles on game events
- [x] Task 2.7: Render particles in frame

### Sprint 3: Character Poses
- ALREADY COMPLETE: `drawZenoCoil`, `drawZenoBolt`, `drawZenoImpact` implemented in sketchy.ts

### Sprint 4: Final Polish
- [x] Task 4.1: Style trajectory arc
- [x] Task 4.2: Integrate styled trajectory
- [x] Task 4.3: Add decorative UI curls

---

**Total Tasks:** 13 (excluding already-complete Sprint 3)
