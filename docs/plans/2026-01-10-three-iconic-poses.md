# Three Iconic Poses Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Art Direction 2.0 into the game - enhanced superhero poses (The Coil, The Bolt, The Impact) with pen-on-notebook aesthetic.

**Architecture:** Add new pose-specific drawing functions to `sketchy.ts`, then route to them from `render.ts` based on game state. Each pose has dedicated energy effects (spirals, speed lines, ground cracks).

**Tech Stack:** TypeScript, Canvas 2D API, existing sketchy.ts drawing utilities

**Design Document:** `docs/plans/2026-01-10-three-iconic-poses-design.md`

**Visual Progress:** `docs/plans/2026-01-10-three-iconic-poses.canvas` - **UPDATE AFTER EACH PHASE COMPLETION**

---

## Phase 1: The Coil (Charging Pose)

### Task 1.1: Energy Spirals Function

**Files:**
- Modify: `src/game/engine/sketchy.ts` (add at end of file)

**Step 1: Add drawEnergySpirals function**

Add this function after `drawLaunchBurst`:

```typescript
// Draw orbiting energy spiral rings for charging pose
export function drawEnergySpirals(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number, // 0-1 charge level
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (intensity < 0.1) return;

  const spiralCount = 2 + Math.floor(intensity);
  const baseRadius = 20 + intensity * 15;
  const rotationSpeed = 0.002 + intensity * 0.003;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
  ctx.lineCap = 'round';

  for (let s = 0; s < spiralCount; s++) {
    const angleOffset = (s / spiralCount) * Math.PI * 2;
    const rotation = nowMs * rotationSpeed + angleOffset;
    const tiltAngle = (s * 0.4) + 0.3; // Different tilt for each spiral

    ctx.globalAlpha = 0.3 + intensity * 0.4;
    ctx.beginPath();

    // Draw elliptical orbit
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const orbX = Math.cos(t + rotation) * baseRadius;
      const orbY = Math.sin(t + rotation) * baseRadius * 0.4 * Math.cos(tiltAngle);

      const px = x + orbX;
      const py = y - 15 + orbY; // Center on figure

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Verify no syntax errors**

Run: `npm run build 2>&1 | head -20`
Expected: No errors in sketchy.ts

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawEnergySpirals for charging pose"
```

---

### Task 1.2: Spring Tension Lines Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawSpringLines function**

Add after `drawEnergySpirals`:

```typescript
// Draw zig-zag spring tension lines along extended leg
export function drawSpringLines(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  intensity: number,
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (intensity < 0.2) return;

  const zigCount = 4 + Math.floor(intensity * 4);
  const amplitude = 3 + intensity * 4;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.4 + intensity * 0.3;

  ctx.beginPath();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len; // Normal vector
  const ny = dx / len;

  for (let i = 0; i <= zigCount; i++) {
    const t = i / zigCount;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    const side = (i % 2 === 0) ? 1 : -1;
    const wobble = Math.sin(nowMs * 0.01 + i) * 0.5;

    const px = baseX + nx * amplitude * side + wobble;
    const py = baseY + ny * amplitude * side + wobble;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
  ctx.globalAlpha = 1;
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawSpringLines for leg tension effect"
```

---

### Task 1.3: Enhanced Coil Pose Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawZenoCoil function**

Add after `drawSpringLines`:

```typescript
// Draw Zeno in "The Coil" charging pose - compressed spring ready to explode
export function drawZenoCoil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  chargePower: number, // 0-1
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const scale = 0.5;
  const lineWidth = themeKind === 'flipbook' ? 2.5 : 2;

  // Squash effect - compress vertically, expand horizontally
  const squashAmount = chargePower * 0.3;
  const scaleX = 1 + squashAmount * 0.43;
  const scaleY = 1 - squashAmount;

  // Lower center of gravity as charge builds
  const yOffset = 3 + chargePower * 10;
  const baseY = y + yOffset;

  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-x, -baseY);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Body geometry - deep crouch
  const headRadius = 8 * scale;
  const crouchDepth = 8 + chargePower * 12; // How low the crouch goes

  // Head position - lower and more forward
  const headX = x - chargePower * 3;
  const headY = baseY - 30 * scale + crouchDepth * 0.3;

  // Draw head
  drawHandCircle(ctx, headX, headY, headRadius, color, lineWidth, nowMs, false);

  // Determined expression - focused eyes, slight frown
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35, headY - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + headRadius * 0.35, headY - 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // Determined mouth - slight line
  ctx.beginPath();
  ctx.moveTo(headX - 3, headY + 3);
  ctx.lineTo(headX + 2, headY + 3);
  ctx.stroke();

  // Torso - twisted, coiled
  const torsoTopY = headY + headRadius + 2;
  const torsoBottomY = baseY - 5 * scale;
  const torsoTwist = chargePower * 4;

  ctx.beginPath();
  ctx.moveTo(headX, torsoTopY);
  ctx.quadraticCurveTo(x - torsoTwist, (torsoTopY + torsoBottomY) / 2, x, torsoBottomY);
  ctx.stroke();

  // Arms - one pulled back (fist), other forward
  const shoulderY = torsoTopY + 6 * scale;
  const armLen = 16 * scale;

  // Back arm (pulled behind, fist clenched)
  const backArmAngle = -0.8 - chargePower * 0.7;
  const backArmX = x + Math.cos(backArmAngle + Math.PI) * armLen;
  const backArmY = shoulderY + Math.sin(backArmAngle + Math.PI) * armLen;

  ctx.beginPath();
  ctx.moveTo(x - 2, shoulderY);
  ctx.lineTo(backArmX, backArmY);
  ctx.stroke();

  // Fist on back arm
  ctx.beginPath();
  ctx.arc(backArmX, backArmY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Front arm (forward for balance)
  const frontArmAngle = -0.3 + chargePower * 0.2;
  const frontArmX = x + Math.cos(frontArmAngle) * armLen * 0.8;
  const frontArmY = shoulderY + Math.sin(frontArmAngle) * armLen * 0.8;

  ctx.beginPath();
  ctx.moveTo(x + 2, shoulderY);
  ctx.lineTo(frontArmX, frontArmY);
  ctx.stroke();

  // Legs - front bent 90°, back extended FAR behind
  const hipY = torsoBottomY;
  const legLen = 18 * scale;

  // Front leg - bent, foot at edge
  const frontKneeX = x + 5;
  const frontKneeY = hipY + 8;
  const frontFootX = x + 3;
  const frontFootY = baseY;

  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(frontKneeX, frontKneeY);
  ctx.lineTo(frontFootX, frontFootY);
  ctx.stroke();

  // Back leg - extended far behind (sprinter starting blocks)
  const backLegExtension = 15 + chargePower * 20;
  const backFootX = x - backLegExtension;
  const backFootY = baseY + 2;
  const backKneeX = x - backLegExtension * 0.5;
  const backKneeY = hipY + 4;

  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(backKneeX, backKneeY);
  ctx.lineTo(backFootX, backFootY);
  ctx.stroke();

  ctx.restore();

  // Energy effects (drawn without transform)
  // Spring tension on back leg
  drawSpringLines(ctx, x - 5, hipY + 3, backFootX + 5, backFootY - 2, chargePower, color, nowMs, themeKind);

  // Orbiting energy spirals
  drawEnergySpirals(ctx, x, baseY - 15, chargePower, color, nowMs, themeKind);

  // Ground dust at back foot
  if (chargePower > 0.3) {
    const dustIntensity = (chargePower - 0.3) / 0.7;
    ctx.globalAlpha = dustIntensity * 0.4;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let i = 0; i < 3; i++) {
      const dustX = backFootX - 5 + i * 4;
      const dustY = backFootY + 2;
      const dustSize = 2 + dustIntensity * 2;
      drawHandCircle(ctx, dustX, dustY, dustSize, color, 1, nowMs + i * 100, false);
    }
    ctx.globalAlpha = 1;
  }
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawZenoCoil - The Coil charging pose"
```

---

### Task 1.4: Update Canvas - Phase 1 Complete

**Files:**
- Modify: `docs/plans/2026-01-10-three-iconic-poses.canvas`

**Step 1: Update Phase 1 tasks to completed**

Change all Phase 1 task checkboxes from `[ ]` to `[x]` and add checkmarks to headers.

**Step 2: Commit**

```bash
git add docs/plans/2026-01-10-three-iconic-poses.canvas
git commit -m "docs: mark Phase 1 (The Coil) complete in canvas"
```

---

## Phase 2: The Bolt (Flight Pose)

### Task 2.1: Enhanced Speed Lines

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Enhance existing drawSpeedLines with whoosh marks**

Find `drawSpeedLines` function and replace it:

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

  const lineCount = Math.min(8, Math.floor(speed / 1.5));
  const lineLen = 12 + speed * 2.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  // Main speed lines
  for (let i = 0; i < lineCount; i++) {
    const seed = i * 47 + nowMs * 0.02;
    const offsetY = (seededRandom(seed) - 0.5) * 35;
    const alpha = 0.25 + seededRandom(seed + 1) * 0.35;
    const len = lineLen * (0.5 + seededRandom(seed + 2) * 0.5);

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x - len, y + offsetY);
    ctx.lineTo(x - len * 0.2, y + offsetY + (seededRandom(seed + 3) - 0.5) * 3);
    ctx.stroke();
  }

  // Whoosh marks at high speed (curved streaks)
  if (speed > 6) {
    const whooshCount = Math.min(4, Math.floor((speed - 6) / 2));
    ctx.lineWidth = themeKind === 'flipbook' ? 1 : 0.75;

    for (let i = 0; i < whooshCount; i++) {
      const seed = i * 73 + nowMs * 0.015;
      const offsetY = (seededRandom(seed) - 0.5) * 40;
      const curveHeight = (seededRandom(seed + 1) - 0.5) * 8;

      ctx.globalAlpha = 0.2 + seededRandom(seed + 2) * 0.2;
      ctx.beginPath();
      ctx.moveTo(x - 25, y + offsetY);
      ctx.quadraticCurveTo(x - 15, y + offsetY + curveHeight, x - 5, y + offsetY);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): enhance drawSpeedLines with whoosh marks"
```

---

### Task 2.2: The Bolt Pose Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawZenoBolt function**

Add after `drawZenoCoil`:

```typescript
// Draw Zeno in "The Bolt" flight pose - dynamic mid-air motion
export function drawZenoBolt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  velocity: { vx: number; vy: number },
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const scale = 0.5;
  const lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);

  // Determine flight phase
  const rising = velocity.vy < -2;
  const falling = velocity.vy > 2;
  // const midFlight = !rising && !falling;

  // Stretch effect based on speed
  const stretchAmount = Math.min(0.3, speed * 0.02);
  const scaleX = 1 - stretchAmount * 0.3;
  const scaleY = 1 + stretchAmount;

  // Body angle follows velocity
  const bodyAngle = Math.atan2(velocity.vy, velocity.vx) * 0.3;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bodyAngle);
  ctx.scale(scaleX, scaleY);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const headRadius = 7 * scale;

  if (rising) {
    // SUPERMAN POSE - stretched, one arm forward

    // Head
    drawHandCircle(ctx, 0, -8, headRadius, color, lineWidth, nowMs, false);

    // Focused eyes
    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -9, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body - stretched horizontal
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 12);
    ctx.stroke();

    // Forward arm (pointing ahead)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18 * scale, -5);
    ctx.stroke();

    // Back arm (along body)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12 * scale, 8);
    ctx.stroke();

    // Legs together, trailing
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-3, 25 * scale);
    ctx.moveTo(0, 12);
    ctx.lineTo(3, 25 * scale);
    ctx.stroke();

  } else if (falling) {
    // PREPARING TO LAND - arms spreading, legs separating

    // Head
    drawHandCircle(ctx, 0, -10, headRadius, color, lineWidth, nowMs, false);

    // Eyes looking down
    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -8, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -8, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 8);
    ctx.stroke();

    // Arms spreading out for balance
    const armWobble = Math.sin(nowMs * 0.015) * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-15 * scale, 2 + armWobble * 5);
    ctx.moveTo(0, -2);
    ctx.lineTo(15 * scale, 2 - armWobble * 5);
    ctx.stroke();

    // Legs bending, preparing
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-8 * scale, 18 * scale);
    ctx.moveTo(0, 8);
    ctx.lineTo(8 * scale, 18 * scale);
    ctx.stroke();

  } else {
    // MID-FLIGHT - running stride through air
    const stride = Math.sin(nowMs * 0.02) * 0.5;

    // Head
    drawHandCircle(ctx, 0, -10, headRadius, color, lineWidth, nowMs, false);

    // Confident expression
    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -10, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -10, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Slight smirk
    ctx.beginPath();
    ctx.arc(0, -7, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Body - forward lean
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(3, 8);
    ctx.stroke();

    // Arms pumping
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(12 * scale + stride * 8, -6 + stride * 5);
    ctx.moveTo(2, -2);
    ctx.lineTo(-8 * scale - stride * 8, 2 - stride * 5);
    ctx.stroke();

    // Legs in stride
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(8 * scale + stride * 10, 20 * scale);
    ctx.moveTo(3, 8);
    ctx.lineTo(-5 * scale - stride * 10, 18 * scale);
    ctx.stroke();
  }

  ctx.restore();

  // Speed lines (drawn without rotation)
  drawSpeedLines(ctx, x, y, velocity, color, nowMs, themeKind);
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawZenoBolt - The Bolt flight pose"
```

---

### Task 2.3: Update Canvas - Phase 2 Complete

**Files:**
- Modify: `docs/plans/2026-01-10-three-iconic-poses.canvas`

**Step 1: Update Phase 2 tasks to completed**

**Step 2: Commit**

```bash
git add docs/plans/2026-01-10-three-iconic-poses.canvas
git commit -m "docs: mark Phase 2 (The Bolt) complete in canvas"
```

---

## Phase 3: The Impact (Landing Pose)

### Task 3.1: Ground Cracks Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawGroundCracks function**

Add after `drawZenoBolt`:

```typescript
// Draw radiating crack lines for superhero landing impact
export function drawGroundCracks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  color: string,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (frame > 15) return;

  const progress = frame / 15;
  const alpha = 1 - progress * 0.8;
  const crackCount = 6;
  const maxLen = 25 + (1 - progress) * 15;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha * 0.7;

  for (let i = 0; i < crackCount; i++) {
    const baseAngle = (i / crackCount) * Math.PI + Math.PI * 0.1;
    const angleVariation = (seededRandom(i * 17) - 0.5) * 0.3;
    const angle = baseAngle + angleVariation;
    const len = maxLen * (0.6 + seededRandom(i * 23) * 0.4);

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Main crack line with slight wobble
    const midX = x + Math.cos(angle) * len * 0.5;
    const midY = y + Math.sin(angle) * len * 0.5;
    const wobble = (seededRandom(i * 31) - 0.5) * 4;

    ctx.lineTo(midX + wobble, midY + wobble * 0.5);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();

    // Branch cracks
    if (seededRandom(i * 41) > 0.5) {
      const branchAngle = angle + (seededRandom(i * 47) - 0.5) * 0.8;
      const branchLen = len * 0.4;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + Math.cos(branchAngle) * branchLen, midY + Math.sin(branchAngle) * branchLen);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawGroundCracks for landing impact"
```

---

### Task 3.2: Dust Puffs Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawDustPuffs function**

Add after `drawGroundCracks`:

```typescript
// Draw scribble dust clouds for landing impact
export function drawDustPuffs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (frame > 12) return;

  const progress = frame / 12;
  const alpha = 1 - progress;
  const puffCount = 4;
  const spread = 8 + progress * 20;
  const rise = progress * 8;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.globalAlpha = alpha * 0.5;

  for (let i = 0; i < puffCount; i++) {
    const angle = (i / puffCount) * Math.PI + Math.PI * 0.2;
    const dist = spread * (0.7 + seededRandom(i * 13) * 0.3);
    const puffX = x + Math.cos(angle) * dist;
    const puffY = y - rise + Math.sin(angle) * dist * 0.3;
    const puffSize = 3 + (1 - progress) * 3 + seededRandom(i * 19) * 2;

    // Draw wobbly cloud shape
    drawHandCircle(ctx, puffX, puffY, puffSize, color, 1, nowMs + i * 50, false);

    // Add smaller satellite puffs
    if (seededRandom(i * 29) > 0.4) {
      const satAngle = angle + (seededRandom(i * 37) - 0.5) * 1;
      const satDist = puffSize * 1.2;
      drawHandCircle(
        ctx,
        puffX + Math.cos(satAngle) * satDist,
        puffY + Math.sin(satAngle) * satDist,
        puffSize * 0.5,
        color,
        1,
        nowMs + i * 70,
        false
      );
    }
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawDustPuffs for landing clouds"
```

---

### Task 3.3: The Impact Pose Function

**Files:**
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add drawZenoImpact function**

Add after `drawDustPuffs`:

```typescript
// Draw Zeno in "The Impact" pose - three-point superhero landing
export function drawZenoImpact(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  landingFrame: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const scale = 0.5;
  const lineWidth = themeKind === 'flipbook' ? 2.5 : 2;

  // Impact squash - maximum at frame 0, recovers over time
  const impactProgress = Math.min(1, landingFrame / 10);
  const squashAmount = 0.3 * (1 - impactProgress);
  const scaleX = 1 + squashAmount * 0.5;
  const scaleY = 1 - squashAmount;

  // Lower position during squash
  const yOffset = squashAmount * 8;

  ctx.save();
  ctx.translate(x, y + yOffset);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-x, -(y + yOffset));

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const headRadius = 7 * scale;
  const baseY = y + yOffset;

  // THREE-POINT LANDING POSE
  // Head - looking up triumphantly
  const headX = x - 2;
  const headY = baseY - 22 * scale;

  drawHandCircle(ctx, headX, headY, headRadius, color, lineWidth, nowMs, false);

  // Triumphant expression - confident smirk
  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35, headY - 1, 1.5, 0, Math.PI * 2);
  ctx.arc(headX + headRadius * 0.35, headY - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Confident smirk
  ctx.beginPath();
  ctx.arc(headX + 1, headY + 2, 3, 0.2, Math.PI - 0.4);
  ctx.stroke();

  // Torso - low, leaning forward
  const torsoTopY = headY + headRadius + 2;
  const torsoBottomY = baseY - 8 * scale;

  ctx.beginPath();
  ctx.moveTo(headX, torsoTopY);
  ctx.lineTo(x + 3, torsoBottomY);
  ctx.stroke();

  // Left arm - PLANTED on ground, fingers splayed
  const plantedHandX = x - 15 * scale;
  const plantedHandY = baseY;

  ctx.beginPath();
  ctx.moveTo(x, torsoTopY + 5);
  ctx.lineTo(plantedHandX, plantedHandY);
  ctx.stroke();

  // Splayed fingers
  for (let i = 0; i < 4; i++) {
    const fingerAngle = Math.PI * 0.8 + (i / 3) * Math.PI * 0.4;
    const fingerLen = 4;
    ctx.beginPath();
    ctx.moveTo(plantedHandX, plantedHandY);
    ctx.lineTo(
      plantedHandX + Math.cos(fingerAngle) * fingerLen,
      plantedHandY + Math.sin(fingerAngle) * fingerLen
    );
    ctx.stroke();
  }

  // Right arm - UP and back for dramatic balance
  const upArmAngle = -Math.PI * 0.3;
  const upArmLen = 18 * scale;

  ctx.beginPath();
  ctx.moveTo(x + 5, torsoTopY + 5);
  ctx.lineTo(
    x + 5 + Math.cos(upArmAngle) * upArmLen,
    torsoTopY + 5 + Math.sin(upArmAngle) * upArmLen
  );
  ctx.stroke();

  // Left knee - DOWN, touching ground
  const leftKneeX = x - 5;
  const leftKneeY = baseY - 4;

  ctx.beginPath();
  ctx.moveTo(x, torsoBottomY);
  ctx.lineTo(leftKneeX, leftKneeY);
  ctx.lineTo(leftKneeX - 3, baseY); // Foot
  ctx.stroke();

  // Right leg - extended to side for stability
  const rightFootX = x + 18 * scale;
  const rightFootY = baseY;

  ctx.beginPath();
  ctx.moveTo(x + 5, torsoBottomY);
  ctx.lineTo(x + 10, baseY - 6);
  ctx.lineTo(rightFootX, rightFootY);
  ctx.stroke();

  ctx.restore();

  // Ground effects (drawn without transform)
  // Cracks from impact point (hand + knee)
  drawGroundCracks(ctx, plantedHandX + 3, baseY + 2, landingFrame, color, themeKind);
  drawGroundCracks(ctx, leftKneeX, baseY + 1, landingFrame, color, themeKind);

  // Dust puffs
  drawDustPuffs(ctx, x, baseY, landingFrame, color, nowMs, themeKind);

  // Impact burst (existing function)
  drawImpactBurst(ctx, x, baseY, color, landingFrame, themeKind);
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): add drawZenoImpact - The Impact landing pose"
```

---

### Task 3.4: Update Canvas - Phase 3 Complete

**Files:**
- Modify: `docs/plans/2026-01-10-three-iconic-poses.canvas`

**Step 1: Update Phase 3 tasks to completed**

**Step 2: Commit**

```bash
git add docs/plans/2026-01-10-three-iconic-poses.canvas
git commit -m "docs: mark Phase 3 (The Impact) complete in canvas"
```

---

## Phase 4: Integration

### Task 4.1: Update render.ts Imports

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add imports for new functions**

Find the imports from `sketchy.ts` and add the new functions:

```typescript
import {
  // ... existing imports ...
  drawZenoCoil,
  drawZenoBolt,
  drawZenoImpact,
} from './sketchy';
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): import new pose functions"
```

---

### Task 4.2: Route to Pose Functions

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Find player drawing code and update**

Locate where `drawStickFigure` is called for the player and replace with routing logic:

```typescript
// Replace the drawStickFigure call for player with:
if (state.charging) {
  drawZenoCoil(ctx, px, py, theme.player, nowMs, state.chargePower, theme.kind);
} else if (state.flying && !state.failureAnimating) {
  drawZenoBolt(ctx, px, py, theme.player, nowMs, { vx: state.vx, vy: state.vy }, theme.kind);
} else if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
  drawZenoImpact(ctx, px, py, theme.player, nowMs, state.landingFrame, theme.kind);
} else if (state.failureAnimating) {
  // Keep existing failure animation
  drawFailingStickFigure(ctx, px, py, theme.player, nowMs, state.failureType || 'tumble', state.failureFrame);
} else {
  // Idle state
  drawStickFigure(ctx, px, py, theme.player, nowMs, 'idle', 0, { vx: 0, vy: 0 }, 0);
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Test in browser**

Run: `npm run dev`
- Test charging: Should see The Coil pose with spirals
- Test flying: Should see The Bolt pose with speed lines
- Test landing: Should see The Impact pose with ground cracks

**Step 4: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): route player drawing to new pose functions"
```

---

### Task 4.3: Update Canvas - Phase 4 Complete

**Files:**
- Modify: `docs/plans/2026-01-10-three-iconic-poses.canvas`

**Step 1: Update Phase 4 tasks to completed**

**Step 2: Commit**

```bash
git add docs/plans/2026-01-10-three-iconic-poses.canvas
git commit -m "docs: mark Phase 4 (Integration) complete in canvas"
```

---

## Phase 5: Polish & Testing

### Task 5.1: Test Both Themes

**Files:** None (manual testing)

**Step 1: Test Flipbook theme**

Run: `npm run dev`
- Switch to Flipbook theme
- Verify all three poses render correctly
- Verify energy effects have correct blue ink color
- Verify line weights are thick enough

**Step 2: Test Noir theme**

- Switch to Noir theme
- Verify all poses render with off-white color
- Verify effects are thinner/sharper
- Verify vignette doesn't obscure effects

**Step 3: Document any issues found**

---

### Task 5.2: Test Reduced Motion

**Files:**
- Modify: `src/game/engine/sketchy.ts` (if needed)

**Step 1: Test with reduceFx enabled**

- Enable reduce motion in game settings
- Verify poses still work
- Spirals and effects should be simplified or removed

**Step 2: Add reduceFx checks if missing**

Add `reduceFx` parameter to new functions if not already handled.

**Step 3: Commit any fixes**

```bash
git add src/game/engine/sketchy.ts
git commit -m "fix(sketchy): respect reduceFx setting in new poses"
```

---

### Task 5.3: Performance Check

**Files:** None (browser testing)

**Step 1: Check frame rate**

- Open browser DevTools Performance tab
- Play through multiple throws
- Verify 60fps is maintained

**Step 2: Check for memory leaks**

- Play 20+ throws in a row
- Monitor memory in DevTools
- Ensure no continuous growth

---

### Task 5.4: Final Canvas Update

**Files:**
- Modify: `docs/plans/2026-01-10-three-iconic-poses.canvas`

**Step 1: Mark all tasks complete**

**Step 2: Final commit**

```bash
git add docs/plans/2026-01-10-three-iconic-poses.canvas
git commit -m "docs: mark all phases complete - Three Iconic Poses implemented"
```

---

## Summary

| Phase | Focus | Tasks |
|-------|-------|-------|
| 1 | The Coil | Energy spirals, spring lines, pose function |
| 2 | The Bolt | Enhanced speed lines, flight pose function |
| 3 | The Impact | Ground cracks, dust puffs, landing pose |
| 4 | Integration | Import, route in render.ts |
| 5 | Polish | Theme testing, reduceFx, performance |

**Total Commits:** ~15 small, focused commits

**Canvas Updates:** After each phase completion
