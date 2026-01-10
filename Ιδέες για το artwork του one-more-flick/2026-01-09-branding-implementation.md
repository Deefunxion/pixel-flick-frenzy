# One More Flick — Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the branding & visual design spec from `docs/plans/2026-01-09-branding-design.md` — adding refined colors, four animation systems (Ghost Trail, Squash & Stretch, Anticipation Poses, Scribble Energy), and preparing for asset integration.

**Architecture:** Theme colors extend existing `themes.ts` with utility colors (pencil gray, erased pink, ink bleed, warm white). Animation systems are implemented in `sketchy.ts` and integrated via `render.ts`. The stick figure (`drawStickFigure`) is enhanced with squash/stretch transforms and anticipation poses.

**Tech Stack:** TypeScript, Canvas 2D API, existing sketchy rendering utilities

---

## Phase 1: Color System Refinements

### Task 1.1: Add Flipbook Utility Colors

**Files:**
- Modify: `src/game/themes.ts:37-66`

**Step 1: Read current flipbook theme**

Verify the current FLIPBOOK_THEME structure before making changes.

**Step 2: Add utility colors to Theme interface**

```typescript
// Add to Theme interface after existing properties
pencilGray: string;     // Ghost trails, sketchy shadows
erasedPink: string;     // Subtle erased areas
inkBleed: string;       // Ink spread effects (noir)
warmWhite: string;      // Key moments emphasis (noir)
```

**Step 3: Update FLIPBOOK_THEME with utility colors**

```typescript
pencilGray: '#9a9590',    // Ghost trails, sketchy shadows
erasedPink: '#f0e8e6',    // Subtle erased areas
inkBleed: '#3a3a40',      // Not used in flipbook, placeholder
warmWhite: '#fff8f0',     // Not used in flipbook, placeholder
```

**Step 4: Verify TypeScript compilation**

Run: `npm run build`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/game/themes.ts
git commit -m "feat(themes): add utility colors to Theme interface and flipbook theme"
```

---

### Task 1.2: Add Noir Utility Colors

**Files:**
- Modify: `src/game/themes.ts:69-97`

**Step 1: Update NOIR_THEME with utility colors**

```typescript
pencilGray: '#6a6660',    // Ghost trails (darker for noir)
erasedPink: '#2a2a2e',    // Not prominent in noir
inkBleed: '#3a3a40',      // Subtle ink spread effects
warmWhite: '#fff8f0',     // Key moments, emphasis
```

**Step 2: Refine existing noir colors per spec**

Update `background` from `#1a1a1e` to `#121216` (deeper black per spec).

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/themes.ts
git commit -m "feat(themes): add utility colors to noir theme and deepen background"
```

---

## Phase 2: Ghost Trail Animation System

### Task 2.1: Create Ghost Trail Data Structure

**Files:**
- Modify: `src/game/engine/types.ts`

**Step 1: Add ghost trail types to GameState**

```typescript
// Add to GameState interface
ghostTrail: GhostFrame[];  // Echo figures during flight

// Add new type
interface GhostFrame {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  timestamp: number;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (may have usage warnings)

**Step 3: Commit**

```bash
git add src/game/engine/types.ts
git commit -m "feat(types): add GhostFrame type for ghost trail animation"
```

---

### Task 2.2: Initialize Ghost Trail in State

**Files:**
- Modify: `src/game/engine/state.ts`

**Step 1: Add ghostTrail to initial state**

Find the initial state creation and add:
```typescript
ghostTrail: [],
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/game/engine/state.ts
git commit -m "feat(state): initialize ghostTrail in game state"
```

---

### Task 2.3: Record Ghost Frames During Flight

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Record ghost frame during flight phase**

In the flight update section, add logic to record ghost frames every ~50ms:
```typescript
// Record ghost frame for trail (every 50ms during flight)
if (state.flying && nowMs - (state.ghostTrail[state.ghostTrail.length - 1]?.timestamp ?? 0) > 50) {
  state.ghostTrail.push({
    x: state.px,
    y: state.py,
    vx: state.vx,
    vy: state.vy,
    angle: Math.atan2(-state.vy, state.vx),
    timestamp: nowMs,
  });
  // Keep max 20 ghost frames
  if (state.ghostTrail.length > 20) {
    state.ghostTrail.shift();
  }
}
```

**Step 2: Clear ghost trail on launch**

When launching (transition to flying), clear the ghost trail:
```typescript
state.ghostTrail = [];
```

**Step 3: Verify build and test**

Run: `npm run build && npm run dev`
Expected: Build succeeds, game runs

**Step 4: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(update): record ghost frames during flight for trail animation"
```

---

### Task 2.4: Render Ghost Trail Figures

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawGhostFigure function to sketchy.ts**

```typescript
// Draw a ghost/echo stick figure (faded, thinner strokes)
export function drawGhostFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  opacity: number,
  nowMs: number,
  angle: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Thinner strokes for ghosts
  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  const scale = 0.4; // Slightly smaller than main figure
  const headRadius = 6 * scale;

  // Simple tumbling pose based on angle
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Head
  ctx.beginPath();
  ctx.arc(0, -10, headRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // Arms (spread out)
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.lineTo(0, -3);
  ctx.lineTo(8, -2);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(0, 5);
  ctx.lineTo(5, 12);
  ctx.stroke();

  ctx.restore();
}
```

**Step 2: Render ghost trail in render.ts (flipbook)**

In `renderFlipbookFrame`, after drawing the best trail and before the current trail, add:

```typescript
// Ghost trail - fading echo figures during flight
if (state.flying && state.ghostTrail.length > 0) {
  const trailLen = state.ghostTrail.length;
  for (let i = 0; i < trailLen; i++) {
    const ghost = state.ghostTrail[i];
    // Progressive fade: older = fainter
    const opacity = (0.6 - (trailLen - i - 1) * 0.15) * (1 - i / trailLen);
    if (opacity > 0.05) {
      drawGhostFigure(
        ctx,
        ghost.x,
        ghost.y,
        COLORS.pencilGray,
        opacity,
        nowMs,
        ghost.angle,
        'flipbook',
      );
    }
  }
}
```

**Step 3: Render ghost trail in render.ts (noir)**

In `renderNoirFrame`, add similar ghost trail rendering with noir styling:

```typescript
// Ghost trail - sharper, fewer figures
if (state.flying && state.ghostTrail.length > 0) {
  const trailLen = state.ghostTrail.length;
  for (let i = Math.max(0, trailLen - 6); i < trailLen; i++) {
    const ghost = state.ghostTrail[i];
    const opacity = 0.5 - (trailLen - i - 1) * 0.15;
    if (opacity > 0.1) {
      drawGhostFigure(
        ctx,
        ghost.x,
        ghost.y,
        COLORS.accent3,
        opacity,
        nowMs,
        ghost.angle,
        'noir',
      );
    }
  }
}
```

**Step 4: Add import for drawGhostFigure**

Add to imports in render.ts:
```typescript
import { ..., drawGhostFigure } from './sketchy';
```

**Step 5: Verify build and test visually**

Run: `npm run dev`
Expected: Ghost figures appear trailing behind Zeno during flight

**Step 6: Commit**

```bash
git add src/game/engine/sketchy.ts src/game/engine/render.ts
git commit -m "feat(render): implement ghost trail animation during flight"
```

---

## Phase 3: Squash & Stretch Animation System

### Task 3.1: Add Squash/Stretch Transform to Stick Figure

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Extend drawStickFigure with squash/stretch parameters**

Add parameters to `drawStickFigure`:
```typescript
export function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  state: 'idle' | 'charging' | 'flying' | 'landing' = 'idle',
  angle: number = 0,
  velocity: { vx: number; vy: number } = { vx: 0, vy: 0 },
  chargePower: number = 0,  // NEW: 0-1 charge amount for squash
) {
```

**Step 2: Calculate squash/stretch factors**

Add at the start of the function:
```typescript
// Squash & Stretch calculations
let scaleX = 1;
let scaleY = 1;

if (state === 'charging') {
  // Charging SQUASH: compress vertically, expand horizontally
  const squashAmount = chargePower * 0.3; // Max 30% squash
  scaleX = 1 + squashAmount * 0.43; // ~130% width at full charge
  scaleY = 1 - squashAmount; // ~70% height at full charge
} else if (state === 'flying') {
  // Flying STRETCH: elongate in velocity direction
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
  const stretchAmount = Math.min(0.3, speed * 0.02);
  scaleX = 1 - stretchAmount * 0.3;
  scaleY = 1 + stretchAmount;
} else if (state === 'landing') {
  // Landing SQUASH: impact compression
  scaleX = 1.3;
  scaleY = 0.7;
}
```

**Step 3: Apply transform to drawing**

Wrap the drawing code with scale transform:
```typescript
ctx.save();
ctx.translate(x, y);
ctx.scale(scaleX, scaleY);
ctx.translate(-x, -y);
// ... existing drawing code ...
ctx.restore();
```

**Step 4: Update call sites to pass chargePower**

In render.ts, update the drawStickFigure calls to include `state.chargePower`:
```typescript
drawStickFigure(
  ctx,
  state.px,
  state.py,
  playerColor,
  nowMs,
  playerState,
  state.angle,
  { vx: state.vx, vy: state.vy },
  state.chargePower,  // NEW
);
```

**Step 5: Verify build and test visually**

Run: `npm run dev`
Expected: Zeno squashes when charging, stretches during flight, squashes on landing

**Step 6: Commit**

```bash
git add src/game/engine/sketchy.ts src/game/engine/render.ts
git commit -m "feat(sketchy): implement squash & stretch animation for stick figure"
```

---

## Phase 4: Anticipation Poses

### Task 4.1: Enhance Charging Wind-Up Pose

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Improve charging pose with anticipation**

In `drawStickFigure`, enhance the charging state:
```typescript
} else if (state === 'charging') {
  // Charging wind-up with anticipation
  // Lean BACK first (opposite to launch direction)
  bodyLean = -8 - chargePower * 12; // Lean back more at higher charge

  // Arms pull behind body
  armAngleL = -0.6 - chargePower * 0.6;
  armAngleR = -0.4 - chargePower * 0.5;

  // One leg steps back to brace
  legSpread = 10 * scale + chargePower * 6;

  // Lower center of gravity
  y += 3 + chargePower * 8;
}
```

**Step 2: Add release snap pose (brief flying state)**

Add a "just launched" check for the first ~100ms of flight:
```typescript
} else if (state === 'flying') {
  const justLaunched = velocity.vy < -3 && Math.abs(velocity.vx) > 4;

  if (justLaunched && velocity.vy < -2) {
    // Release snap: everything whips forward
    armAngleL = -1.5; // Arms thrust forward
    armAngleR = -1.3;
    legSpread = 3 * scale; // Legs together, trailing
    bodyLean = velocity.vx * 1.5;
  } else {
    // ... existing flying logic
  }
}
```

**Step 3: Verify build and test**

Run: `npm run dev`
Expected: Zeno leans back when charging, snaps forward on release

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add anticipation wind-up pose for charging"
```

---

### Task 4.2: Enhance Landing Recovery Poses

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add landing recovery animation phases**

Track landing frame progression for recovery animation:
```typescript
} else if (state === 'landing') {
  // Impact squash with recovery sequence
  // Frame 0-3: Maximum squash
  // Frame 4-8: Recovery wobble
  // Frame 9+: Settle to proud stance

  // For now, enhanced single-frame squash
  y += 10;
  armAngleL = 1.0; // Arms out for balance
  armAngleR = 1.0;
  legSpread = 18 * scale; // Wide stance

  // Windmill effect (arms reaching out)
  const wobble = Math.sin(nowMs * 0.02) * 0.3;
  armAngleL += wobble;
  armAngleR -= wobble;
}
```

**Step 2: Verify build and test**

Run: `npm run dev`
Expected: Landing has exaggerated squash with arm windmill

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): enhance landing recovery pose with arm windmill"
```

---

## Phase 5: Scribble Energy Effects

### Task 5.1: Create Scribble Energy Drawing Functions

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawScribbleEnergy function**

```typescript
// Draw scribble energy lines radiating from a point
export function drawScribbleEnergy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number, // 0-1
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (intensity < 0.1) return;

  const lineCount = Math.floor(4 + intensity * 8);
  const maxLen = 8 + intensity * 15;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  for (let i = 0; i < lineCount; i++) {
    // Deterministic but animated positions
    const seed = i * 137.5 + nowMs * 0.01;
    const angle = (i / lineCount) * Math.PI * 2 + Math.sin(seed) * 0.5;
    const len = maxLen * (0.5 + seededRandom(seed) * 0.5);
    const startDist = 8 + seededRandom(seed + 1) * 5;

    const startX = x + Math.cos(angle) * startDist;
    const startY = y + Math.sin(angle) * startDist;
    const endX = x + Math.cos(angle) * (startDist + len);
    const endY = y + Math.sin(angle) * (startDist + len);

    // Wobbly line
    ctx.globalAlpha = 0.4 + intensity * 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Add mid-point wobble
    const midX = (startX + endX) / 2 + (seededRandom(seed + 2) - 0.5) * 4;
    const midY = (startY + endY) / 2 + (seededRandom(seed + 3) - 0.5) * 4;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Add drawLaunchBurst function**

```typescript
// Draw explosion of scribbles at launch
export function drawLaunchBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number, // frames since launch
  color: string,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (frame > 12) return;

  const progress = frame / 12;
  const alpha = 1 - progress;
  const spread = 10 + progress * 25;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha * 0.7;

  // Radiating star pattern
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 - Math.PI / 2;
    const innerR = 5 + progress * 8;
    const outerR = innerR + spread * (0.5 + seededRandom(i * 7) * 0.5);

    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
    ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add scribble energy and launch burst drawing functions"
```

---

### Task 5.2: Integrate Scribble Energy into Rendering

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/types.ts`

**Step 1: Add launchFrame to GameState**

In types.ts, add:
```typescript
launchFrame: number;  // Frames since last launch (for burst effect)
```

**Step 2: Initialize launchFrame in state.ts**

Add to initial state:
```typescript
launchFrame: 0,
```

**Step 3: Update launchFrame in update.ts**

When transitioning to flying:
```typescript
state.launchFrame = 0;
```

Increment during flight:
```typescript
if (state.flying) {
  state.launchFrame++;
}
```

**Step 4: Render scribble energy during charging (flipbook)**

In `renderFlipbookFrame`, after drawing the player:
```typescript
// Scribble energy during charging
if (state.charging && state.chargePower > 0.1) {
  drawScribbleEnergy(
    ctx,
    state.px,
    state.py,
    state.chargePower,
    COLORS.accent1,
    nowMs,
    'flipbook',
  );
}

// Launch burst effect
if (state.flying && state.launchFrame < 12) {
  drawLaunchBurst(ctx, state.px - 20, state.py, state.launchFrame, COLORS.accent3, 'flipbook');
}
```

**Step 5: Render scribble energy for noir**

In `renderNoirFrame`, add similar but with noir colors:
```typescript
// Scribble energy during charging
if (state.charging && state.chargePower > 0.2) {
  drawScribbleEnergy(ctx, state.px, state.py, state.chargePower * 0.7, COLORS.accent1, nowMs, 'noir');
}

// Launch burst (more subtle for noir)
if (state.flying && state.launchFrame < 8) {
  drawLaunchBurst(ctx, state.px - 15, state.py, state.launchFrame, COLORS.accent3, 'noir');
}
```

**Step 6: Add imports**

In render.ts:
```typescript
import { ..., drawScribbleEnergy, drawLaunchBurst } from './sketchy';
```

**Step 7: Verify build and test visually**

Run: `npm run dev`
Expected: Energy lines radiate during charge, burst on launch

**Step 8: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/render.ts
git commit -m "feat(render): integrate scribble energy effects for charging and launch"
```

---

### Task 5.3: Add Speed Lines During Flight

**Files:**
- Modify: `src/game/engine/sketchy.ts`
- Modify: `src/game/engine/render.ts`

**Step 1: Add drawSpeedLines function**

```typescript
// Draw horizontal speed lines during high-velocity flight
export function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  velocity: { vx: number; vy: number },
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
  if (speed < 4) return;

  const lineCount = Math.min(6, Math.floor(speed / 2));
  const lineLen = 10 + speed * 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  for (let i = 0; i < lineCount; i++) {
    const seed = i * 47 + nowMs * 0.02;
    const offsetY = (seededRandom(seed) - 0.5) * 30;
    const alpha = 0.3 + seededRandom(seed + 1) * 0.3;
    const len = lineLen * (0.6 + seededRandom(seed + 2) * 0.4);

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x - len, y + offsetY);
    ctx.lineTo(x - len * 0.3, y + offsetY + (seededRandom(seed + 3) - 0.5) * 3);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Render speed lines in flipbook**

In `renderFlipbookFrame`, during flight:
```typescript
// Speed lines during high-velocity flight
if (state.flying && !state.reduceFx) {
  drawSpeedLines(ctx, state.px, state.py, { vx: state.vx, vy: state.vy }, COLORS.accent3, nowMs, 'flipbook');
}
```

**Step 3: Render speed lines in noir**

In `renderNoirFrame`:
```typescript
// Speed lines (sharper for noir)
if (state.flying && !state.reduceFx) {
  drawSpeedLines(ctx, state.px, state.py, { vx: state.vx, vy: state.vy }, COLORS.accent3, nowMs, 'noir');
}
```

**Step 4: Add import**

```typescript
import { ..., drawSpeedLines } from './sketchy';
```

**Step 5: Verify build and test**

Run: `npm run dev`
Expected: Speed lines trail behind Zeno during fast flight

**Step 6: Commit**

```bash
git add src/game/engine/sketchy.ts src/game/engine/render.ts
git commit -m "feat(render): add speed lines during high-velocity flight"
```

---

## Phase 6: Asset Preparation (Design Tasks)

> **Note:** These tasks involve creating visual assets outside of code. Track completion manually.

### Task 6.1: Create Zeno "Lean" Pose Master Illustration

**Deliverable:** Vector illustration of Zeno in "The Lean" pose
- 15-20° forward tilt
- Arms hanging loose
- Feet at cliff edge, toes may overhang
- Minimal face: two dots for eyes, neutral/smug expression
- Same pen stroke style as in-game

**Output:** `public/assets/brand/zeno-lean.svg`

---

### Task 6.2: Create Custom "one more flick." Lettering

**Deliverable:** Custom hand-drawn wordmark
- All lowercase
- Period at end
- Ballpoint pen feel (~2-3px stroke)
- Slight wobble, rounded corners
- Letter-by-letter details per spec

**Output:** `public/assets/brand/wordmark.svg`

---

### Task 6.3: Create App Icons

**Deliverable:** Zeno "Lean" pose icon in all required sizes
- 16×16 (favicon)
- 32×32 (favicon @2x)
- 180×180 (Apple touch icon)
- 192×192 (Android)
- 512×512 (PWA)

**Variants:** Flipbook (blue on cream) and Noir (white on black)

**Output:** `public/assets/icons/`

---

### Task 6.4: Create UI Icon Set

**Deliverable:** 6 icons in hand-drawn Zeno style
- Sound On
- Sound Off
- Leaderboard (trophy)
- Stats (bar chart)
- Theme Toggle (half-circle)
- Close (X)

**Output:** `public/assets/icons/ui/`

---

## Phase 7: Integration & Polish

### Task 7.1: Test All Animation Systems Together

**Files:** None (manual testing)

**Step 1: Test flipbook theme**

1. Launch game in flipbook theme
2. Verify: Ghost trail during flight (3-4 fading figures)
3. Verify: Squash when charging, stretch when flying
4. Verify: Scribble energy during charge
5. Verify: Launch burst on release
6. Verify: Speed lines during fast flight

**Step 2: Test noir theme**

1. Switch to noir theme
2. Verify: Ghost trail (2-3 sharper figures)
3. Verify: Same squash/stretch behavior
4. Verify: Scribble energy (more subtle)
5. Verify: Noir-styled launch burst

**Step 3: Test with reduceFx enabled**

1. Enable reduce motion settings
2. Verify: Animations disabled/reduced appropriately

**Step 4: Document any issues found**

Create issues or fix inline.

---

### Task 7.2: Performance Check

**Files:** None (manual testing)

**Step 1: Profile with Chrome DevTools**

Run game and check:
- Frame rate stays at 60fps
- No memory leaks from ghost trail
- Canvas operations optimized

**Step 2: Fix any performance issues**

If ghost trail causes slowdown, reduce max frames or skip rendering every other ghost.

---

## Summary Checklist

- [ ] Phase 1: Color System Refinements
  - [ ] Task 1.1: Add Flipbook Utility Colors
  - [ ] Task 1.2: Add Noir Utility Colors
- [ ] Phase 2: Ghost Trail Animation
  - [ ] Task 2.1: Create Ghost Trail Data Structure
  - [ ] Task 2.2: Initialize Ghost Trail in State
  - [ ] Task 2.3: Record Ghost Frames During Flight
  - [ ] Task 2.4: Render Ghost Trail Figures
- [ ] Phase 3: Squash & Stretch Animation
  - [ ] Task 3.1: Add Squash/Stretch Transform
- [ ] Phase 4: Anticipation Poses
  - [ ] Task 4.1: Enhance Charging Wind-Up
  - [ ] Task 4.2: Enhance Landing Recovery
- [ ] Phase 5: Scribble Energy Effects
  - [ ] Task 5.1: Create Drawing Functions
  - [ ] Task 5.2: Integrate into Rendering
  - [ ] Task 5.3: Add Speed Lines
- [ ] Phase 6: Asset Preparation (Design)
  - [ ] Task 6.1: Zeno Lean Pose
  - [ ] Task 6.2: Wordmark Lettering
  - [ ] Task 6.3: App Icons
  - [ ] Task 6.4: UI Icon Set
- [ ] Phase 7: Integration & Polish
  - [ ] Task 7.1: Test All Animations
  - [ ] Task 7.2: Performance Check

---

*Plan created: 2026-01-09*
*Based on: docs/plans/2026-01-09-branding-design.md*
