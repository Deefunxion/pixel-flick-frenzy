# Visual Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the game's visual style to match the polished mockups - replacing flat ground with cloud platforms, scaling up the character 3x, and creating a hand-drawn notebook aesthetic.

**Architecture:** This is a rendering overhaul affecting `sketchy.ts` (drawing functions) and `render.ts` (composition). We replace the ground line with cloud platforms, scale the character from ~30px to ~90px height, add a prominent trajectory arc, and enhance all visual effects. No game logic changes - purely visual.

**Tech Stack:** TypeScript, Canvas 2D API, existing sketchy.ts utilities

**Reference Mockups:** `public/assets/game-screenshots-polished/`

---

## Current vs Target Analysis

| Element | Current | Target (Mockup) |
|---------|---------|-----------------|
| Ground | Flat line at y=220 | Cloud platforms (3-4 fluffy clouds) |
| Character height | ~30px | ~90px (3x scale) |
| Character scale | 0.85 | 2.5 |
| Line width | 4px | 6-8px |
| Trajectory | Faint dots | Bold dashed arc |
| Flag target | Small 18x14 | Large checkered flag with star |
| Clouds | Tiny decorative (10px) | Large platforms (60-80px) |
| Dust effects | 10 particles | 20+ particles, larger |

---

## Phase 1: Cloud Platform System

### Task 1.1: Create drawCloudPlatform Function

**Files:**
- Modify: `src/game/engine/sketchy.ts` (add new function after drawCloud ~line 702)

**Step 1: Add the new function**

Add after the existing `drawCloud` function:

```typescript
// Draw a large cloud platform (for ground replacement)
export function drawCloudPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  lineWidth: number = 3,
  nowMs: number = 0,
  filled: boolean = false,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const wobble = getWobble(x, y, nowMs, 0.5);

  // Cloud platform made of overlapping bumps
  const bumpCount = Math.floor(width / 25);
  const bumpWidth = width / bumpCount;

  ctx.beginPath();

  // Start from bottom left
  ctx.moveTo(x - width / 2, y + height / 2 + wobble.dy);

  // Draw top bumps (the fluffy part)
  for (let i = 0; i <= bumpCount; i++) {
    const bumpX = x - width / 2 + i * bumpWidth;
    const bumpY = y - height / 2;
    const bumpHeight = height * (0.6 + Math.sin(i * 1.7) * 0.2);
    const wobbleOffset = getWobble(bumpX, bumpY, nowMs, 0.3);

    if (i === 0) {
      ctx.lineTo(bumpX + wobbleOffset.dx, bumpY + wobbleOffset.dy);
    } else {
      // Quadratic curve for fluffy bump
      const cpX = bumpX - bumpWidth / 2;
      const cpY = bumpY - bumpHeight + wobbleOffset.dy;
      ctx.quadraticCurveTo(cpX, cpY, bumpX + wobbleOffset.dx, bumpY + wobbleOffset.dy);
    }
  }

  // Close bottom
  ctx.lineTo(x + width / 2, y + height / 2 + wobble.dy);
  ctx.lineTo(x - width / 2, y + height / 2 + wobble.dy);

  if (filled) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.stroke();

  // Add internal scribble lines for depth
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = lineWidth * 0.5;
  for (let i = 1; i < bumpCount; i++) {
    const lineX = x - width / 2 + i * bumpWidth;
    const lineWobble = getWobble(lineX, y, nowMs, 0.2);
    ctx.beginPath();
    ctx.moveTo(lineX + lineWobble.dx, y - height * 0.3);
    ctx.quadraticCurveTo(
      lineX + lineWobble.dx + 5,
      y,
      lineX + lineWobble.dx,
      y + height * 0.3
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
```

**Step 2: Export the function**

Find the exports section and add `drawCloudPlatform` to the exports.

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawCloudPlatform for ground replacement"
```

---

### Task 1.2: Replace Ground Line with Cloud Platforms in Flipbook

**Files:**
- Modify: `src/game/engine/render.ts` (renderFlipbookFrame function, ~line 74-90)

**Step 1: Import drawCloudPlatform**

Find the imports from './sketchy' and add `drawCloudPlatform`:

```typescript
import {
  // ... existing imports
  drawCloudPlatform,
} from './sketchy';
```

**Step 2: Replace ground rendering**

Find in renderFlipbookFrame (around line 74-90):
```typescript
  // Ground line - hand-drawn style with layered pencil effect
  const groundY = H - 20;
  drawLayeredHandLine(ctx, 40, groundY, CLIFF_EDGE + 5, groundY, COLORS.player, nowMs, 2);

  // Hatching under the ground for depth
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const hatchY = groundY + 4 + i * 3;
    const endX = CLIFF_EDGE - i * 15;
    if (endX > 50) {
      ctx.beginPath();
      ctx.moveTo(45, hatchY);
      ctx.lineTo(endX, hatchY);
      ctx.stroke();
    }
  }
```

Replace with:
```typescript
  // Ground level reference (for positioning)
  const groundY = H - 20;

  // Cloud platforms instead of ground line
  // Starting platform (where player launches from)
  drawCloudPlatform(ctx, 60, groundY - 15, 100, 35, COLORS.player, 3, nowMs, true);

  // Middle floating cloud (decorative)
  drawCloudPlatform(ctx, 200, groundY - 40, 70, 25, COLORS.accent3, 2.5, nowMs, false);

  // Landing platform (near target area)
  drawCloudPlatform(ctx, 380, groundY - 15, 90, 35, COLORS.player, 3, nowMs, true);
```

**Step 3: Update cliff edge rendering**

Find the cliff edge drawing code (around line 93-125) and comment it out or remove it - we don't need a cliff edge with cloud platforms.

**Step 4: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): replace ground line with cloud platforms (flipbook)"
```

---

### Task 1.3: Update Noir Theme with Platform Rendering

**Files:**
- Modify: `src/game/engine/render.ts` (renderNoirFrame function, ~line 650-700)

**Step 1: Find and replace noir ground rendering**

Find the ground rendering in renderNoirFrame and replace with noir-styled platforms (angular, dramatic):

```typescript
  // Ground level reference
  const groundY = H - 20;

  // Noir platforms - more angular, dramatic
  // Starting platform
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, groundY);
  ctx.lineTo(30, groundY - 20);
  ctx.lineTo(90, groundY - 20);
  ctx.lineTo(110, groundY);
  ctx.stroke();

  // Middle platform
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(170, groundY - 30);
  ctx.lineTo(190, groundY - 45);
  ctx.lineTo(230, groundY - 45);
  ctx.lineTo(250, groundY - 30);
  ctx.stroke();

  // Landing platform
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(340, groundY);
  ctx.lineTo(360, groundY - 20);
  ctx.lineTo(420, groundY - 20);
  ctx.lineTo(440, groundY);
  ctx.stroke();
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): add dramatic platforms for noir theme"
```

---

## Phase 2: Character Scale Overhaul

### Task 2.1: Create Scale Constants

**Files:**
- Modify: `src/game/engine/sketchy.ts` (near top, after LINE_WEIGHTS ~line 15)

**Step 1: Add character scale constants**

Find the LINE_WEIGHTS export and add after it:

```typescript
// Character scale - controls overall character size
export const CHARACTER_SCALE = {
  normal: 2.5,    // 3x larger than original 0.85
  ghost: 1.8,     // Ghost trail figures
  mini: 1.2,      // Small UI previews
};

// Line widths for scaled characters
export const SCALED_LINE_WEIGHTS = {
  body: 6,        // Main body strokes
  limbs: 5,       // Arms, legs
  details: 4,     // Fingers, face
  effects: 3,     // Energy spirals, etc.
};
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add CHARACTER_SCALE and SCALED_LINE_WEIGHTS constants"
```

---

### Task 2.2: Scale Up drawZenoCoil (The Coil)

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawZenoCoil function, ~line 1395)

**Step 1: Update scale and line width**

Find in drawZenoCoil:
```typescript
const scale = 0.85;
const lineWidth = themeKind === 'flipbook' ? 4 : 3;
```

Replace with:
```typescript
const scale = CHARACTER_SCALE.normal;
const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.limbs;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawZenoCoil to CHARACTER_SCALE.normal (2.5x)"
```

---

### Task 2.3: Scale Up drawZenoBolt (The Bolt)

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawZenoBolt function, ~line 1548)

**Step 1: Update scale and line width**

Find in drawZenoBolt:
```typescript
const scale = 0.85;
const lineWidth = themeKind === 'flipbook' ? 4 : 3;
```

Replace with:
```typescript
const scale = CHARACTER_SCALE.normal;
const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.limbs;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawZenoBolt to CHARACTER_SCALE.normal (2.5x)"
```

---

### Task 2.4: Scale Up drawZenoImpact (The Impact)

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawZenoImpact function, ~line 1812)

**Step 1: Update scale and line width**

Find in drawZenoImpact:
```typescript
const scale = 0.85;
const lineWidth = themeKind === 'flipbook' ? 4 : 3;
```

Replace with:
```typescript
const scale = CHARACTER_SCALE.normal;
const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.limbs;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawZenoImpact to CHARACTER_SCALE.normal (2.5x)"
```

---

### Task 2.5: Scale Up drawStickFigure (Idle)

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawStickFigure function, ~line 225)

**Step 1: Update scale and line width**

Find in drawStickFigure:
```typescript
const scale = 0.85;
```
and
```typescript
ctx.lineWidth = 4;
```

Replace scale with:
```typescript
const scale = CHARACTER_SCALE.normal;
```

Replace all `ctx.lineWidth = 4` with:
```typescript
ctx.lineWidth = SCALED_LINE_WEIGHTS.body;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawStickFigure to CHARACTER_SCALE.normal (2.5x)"
```

---

### Task 2.6: Scale Up Ghost Figures

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawGhostFigure function, ~line 1103)

**Step 1: Update scale and line width**

Find in drawGhostFigure:
```typescript
const scale = 0.65;
```
and
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

Replace with:
```typescript
const scale = CHARACTER_SCALE.ghost;
```
and
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.limbs : SCALED_LINE_WEIGHTS.details;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawGhostFigure to CHARACTER_SCALE.ghost (1.8x)"
```

---

## Phase 3: Enhanced Flag Target

### Task 3.1: Create drawEnhancedFlag Function

**Files:**
- Modify: `src/game/engine/sketchy.ts` (add after drawCheckeredFlag ~line 600)

**Step 1: Add enhanced flag function**

```typescript
// Draw enhanced checkered flag with star (matches mockup)
export function drawEnhancedFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flagWidth: number,
  flagHeight: number,
  poleHeight: number,
  flagColor: string,
  starColor: string,
  lineWidth: number = 3,
  nowMs: number = 0,
) {
  const wobble = getWobble(x, y, nowMs, 0.3);

  // Flag pole
  ctx.strokeStyle = flagColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + wobble.dx, y);
  ctx.lineTo(x + wobble.dx, y - poleHeight);
  ctx.stroke();

  // Checkered flag
  const flagTop = y - poleHeight;
  const cellsX = 4;
  const cellsY = 3;
  const cellW = flagWidth / cellsX;
  const cellH = flagHeight / cellsY;

  // Wave effect
  const wave = Math.sin(nowMs / 200) * 3;

  for (let row = 0; row < cellsY; row++) {
    for (let col = 0; col < cellsX; col++) {
      const isBlack = (row + col) % 2 === 0;
      const cellX = x + col * cellW + wave * (col / cellsX);
      const cellY = flagTop + row * cellH;

      if (isBlack) {
        ctx.fillStyle = flagColor;
        ctx.fillRect(cellX, cellY, cellW + 1, cellH + 1);
      }
    }
  }

  // Flag outline
  ctx.strokeStyle = flagColor;
  ctx.lineWidth = lineWidth * 0.8;
  ctx.strokeRect(x + wave * 0.3, flagTop, flagWidth + wave, flagHeight);

  // Star above flag
  const starY = flagTop - 15;
  const starSize = 10;
  ctx.fillStyle = starColor;
  ctx.strokeStyle = starColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 144 - 90) * Math.PI / 180;
    const px = x + flagWidth / 2 + Math.cos(angle) * starSize + wave * 0.5;
    const py = starY + Math.sin(angle) * starSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
```

**Step 2: Export the function**

Add `drawEnhancedFlag` to the exports.

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawEnhancedFlag with checkered pattern and star"
```

---

### Task 3.2: Use Enhanced Flag in Render

**Files:**
- Modify: `src/game/engine/render.ts` (flag rendering in both themes)

**Step 1: Import drawEnhancedFlag**

Add to imports:
```typescript
import {
  // ... existing
  drawEnhancedFlag,
} from './sketchy';
```

**Step 2: Update flipbook flag rendering**

Find the best marker / checkered flag section (~line 127-130):
```typescript
  // Best marker - checkered flag
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    drawCheckeredFlag(ctx, flagX, groundY, 18, 14, COLORS.accent2, 1.5, nowMs);
  }
```

Replace with:
```typescript
  // Best marker - enhanced checkered flag with star
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    drawEnhancedFlag(ctx, flagX, groundY, 28, 20, 50, COLORS.accent2, COLORS.highlight, 2.5, nowMs);
  }
```

**Step 3: Update Zeno target to use star more prominently**

Find the Zeno target marker section (~line 133-178) and increase the star size:
Change `const r = 8;` to `const r = 12;`

**Step 4: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): use enhanced flag with larger star for targets"
```

---

## Phase 4: Trajectory Arc Enhancement

### Task 4.1: Add Trajectory Preview During Charging

**Files:**
- Modify: `src/game/engine/render.ts` (charging UI section ~line 404-465)

**Step 1: Add trajectory preview arc**

Find the charging UI section and add after the angle indicator (around line 456):

```typescript
    // Trajectory preview arc (dashed curve showing predicted path)
    if (state.chargePower > 0.2) {
      const power = MIN_POWER + state.chargePower * (MAX_POWER - MIN_POWER);
      const angleRad = (state.angle * Math.PI) / 180;
      const vx = Math.cos(angleRad) * power;
      const vy = -Math.sin(angleRad) * power;

      // Generate preview points
      const previewPoints: { x: number; y: number }[] = [];
      let px = state.px;
      let py = state.py;
      let pvx = vx;
      let pvy = vy;

      for (let i = 0; i < 40; i++) {
        previewPoints.push({ x: px, y: py });
        px += pvx;
        pvy += BASE_GRAV;
        py += pvy;
        if (py > groundY || px > W) break;
      }

      // Draw dashed preview arc
      ctx.strokeStyle = COLORS.accent3;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.5 + state.chargePower * 0.3;
      ctx.beginPath();
      for (let i = 0; i < previewPoints.length; i++) {
        const p = previewPoints[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
```

**Step 2: Import BASE_GRAV if not already imported**

Add to imports at top:
```typescript
import { CLIFF_EDGE, H, MAX_ANGLE, MIN_ANGLE, OPTIMAL_ANGLE, W, BASE_GRAV, MIN_POWER, MAX_POWER } from '@/game/constants';
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): add trajectory preview arc during charging"
```

---

### Task 4.2: Make Best Trail Arc More Prominent

**Files:**
- Modify: `src/game/engine/render.ts` (best trail rendering ~line 265-269)

**Step 1: Enhance best trail rendering**

Find:
```typescript
  // Ghost trail (best attempt) - dashed curve
  if (state.bestTrail.length > 4) {
    const ghostPoints = state.bestTrail.filter((_, i) => i % 3 === 0);
    drawDashedCurve(ctx, ghostPoints, COLORS.accent3, 1.5, 6, 8);
  }
```

Replace with:
```typescript
  // Ghost trail (best attempt) - prominent dashed arc
  if (state.bestTrail.length > 4) {
    const ghostPoints = state.bestTrail.filter((_, i) => i % 2 === 0);
    // Draw thicker, more visible arc
    drawDashedCurve(ctx, ghostPoints, COLORS.accent3, 3, 8, 6);
    // Add glow effect
    ctx.globalAlpha = 0.3;
    drawDashedCurve(ctx, ghostPoints, COLORS.player, 5, 8, 6);
    ctx.globalAlpha = 1;
  }
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): make best trail arc more prominent with glow"
```

---

## Phase 5: Effects Scale-Up

### Task 5.1: Scale Energy Spirals to Match Character

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawEnergySpirals ~line 1294)

**Step 1: Update parameters for larger character**

Find:
```typescript
const spiralCount = 3 + Math.floor(intensity * 2);
const baseRadius = 35 + intensity * 25;
```

Replace with:
```typescript
const spiralCount = 4 + Math.floor(intensity * 3);
const baseRadius = 60 + intensity * 40;
```

Also find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 3 : 2;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.effects : SCALED_LINE_WEIGHTS.details;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale energy spirals to match larger character"
```

---

### Task 5.2: Scale Dust Puffs for Dramatic Impact

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawDustPuffs ~line 1760)

**Step 1: Update parameters**

Find:
```typescript
const puffCount = 10;
const spread = 15 + progress * 35;
const rise = progress * 15;
```

Replace with:
```typescript
const puffCount = 20;
const spread = 30 + progress * 60;
const rise = progress * 25;
```

Find:
```typescript
const puffSize = 6 + (1 - progress) * 6 + seededRandom(i * 19) * 4;
```

Replace with:
```typescript
const puffSize = 12 + (1 - progress) * 10 + seededRandom(i * 19) * 8;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale dust puffs for dramatic impact (20 puffs, 2x larger)"
```

---

### Task 5.3: Scale Ground Cracks for Impact

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawGroundCracks ~line 1707)

**Step 1: Update parameters**

Find:
```typescript
const crackCount = 10;
const maxLen = 45 + (1 - progress) * 25;
```

Replace with:
```typescript
const crackCount = 14;
const maxLen = 70 + (1 - progress) * 40;
```

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 3 : 2.5;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.effects : SCALED_LINE_WEIGHTS.details;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale ground cracks (14 cracks, 70px max length)"
```

---

### Task 5.4: Scale Speed Lines

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawSpeedLines ~line 1203)

**Step 1: Update parameters**

Find:
```typescript
const lineCount = Math.min(12, Math.floor(speed / 1.2));
const lineLen = 18 + speed * 3.5;
```

Replace with:
```typescript
const lineCount = Math.min(16, Math.floor(speed / 1.0));
const lineLen = 30 + speed * 5;
```

Find:
```typescript
const offsetY = (seededRandom(seed) - 0.5) * 50;
```

Replace with:
```typescript
const offsetY = (seededRandom(seed) - 0.5) * 80;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale speed lines (16 lines, 30px+ length)"
```

---

## Phase 6: Player Position Adjustment

### Task 6.1: Adjust Player Y Position for Cloud Platforms

**Files:**
- Modify: `src/game/engine/render.ts` (player rendering section)

**Step 1: Create platform height offset**

Since the character is now much larger (~90px) and stands on cloud platforms, we need to adjust the player's Y position. Find where the player is drawn and ensure they're positioned correctly on the cloud platform.

In renderFlipbookFrame, find where drawZenoCoil/drawZenoBolt/drawZenoImpact are called (~line 352-361) and note that `state.py` is used directly. The game logic should handle this, but we may need to add an offset.

Add a constant at the top of renderFlipbookFrame:
```typescript
  // Platform surface offset (character feet touch platform top)
  const platformSurfaceY = groundY - 15; // Top of the cloud platform
```

**Step 2: Verify the character positioning visually**

Run: `npm run dev`
Test the game and verify the character stands on the cloud platform correctly.

**Step 3: Commit if changes needed**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): adjust player position for cloud platforms"
```

---

## Phase 7: Final Polish & Testing

### Task 7.1: Full Build Verification

**Files:** None (testing only)

**Step 1: Run full build**

Run: `npm run build`
Expected: Build success with no TypeScript errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No new lint errors in modified files

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build/lint issues from visual redesign"
```

---

### Task 7.2: Visual Testing

**Files:** None (testing only)

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Visual testing checklist**

Test each of these scenarios:

- [ ] **Flipbook - Idle:** Character on starting cloud platform, ~90px tall
- [ ] **Flipbook - Charging:** Energy spirals visible, trajectory preview arc appears
- [ ] **Flipbook - Flying:** Superman pose, ghost trail visible, speed lines prominent
- [ ] **Flipbook - Landing:** Impact on cloud platform, massive dust cloud, ground cracks
- [ ] **Flipbook - Target:** Enhanced flag with star, Zeno target visible
- [ ] **Noir - All poses:** Same checks with noir styling
- [ ] **No visual overflow:** Character doesn't clip outside canvas
- [ ] **Effects performance:** 60fps maintained during effects

**Step 3: Document any issues**

If issues found, create follow-up tasks.

---

### Task 7.3: Final Commit

**Files:** All modified files

**Step 1: Stage all changes**

```bash
git add -A
```

**Step 2: Create summary commit**

```bash
git commit -m "feat: complete visual redesign (cloud platforms, 3x character scale, enhanced effects)

- Replace ground line with cloud platforms
- Scale character from 0.85 to 2.5 (3x larger)
- Add trajectory preview arc during charging
- Enhanced flag target with checkered pattern and star
- Scale all effects (spirals, dust, cracks, speed lines)
- Adjust positioning for new platform system"
```

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1.1-1.3 | Cloud platform system |
| 2 | 2.1-2.6 | Character scale overhaul (0.85→2.5) |
| 3 | 3.1-3.2 | Enhanced flag target |
| 4 | 4.1-4.2 | Trajectory arc enhancement |
| 5 | 5.1-5.4 | Effects scale-up |
| 6 | 6.1 | Player position adjustment |
| 7 | 7.1-7.3 | Testing and polish |

**Total Tasks:** 18 tasks across 7 phases

**Risk Level:** MEDIUM - Significant visual changes, but no game logic modifications

**Key Changes:**
- Character scale: 0.85 → 2.5 (3x increase)
- Ground: Line → Cloud platforms
- Effects: All scaled 2-3x larger
- New: Trajectory preview, enhanced flag
