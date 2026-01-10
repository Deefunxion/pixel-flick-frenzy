# Targeted Scale-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scale up character size and visual effects to match the polished mockup aesthetic while maintaining the existing procedural rendering system.

**Architecture:** Modify existing pose functions in `sketchy.ts` by adjusting scale constants, line widths, and particle counts. No structural changes - purely parameter tuning to achieve bolder, more visible artwork.

**Tech Stack:** TypeScript, Canvas 2D API, existing sketchy.ts utilities

**Reference Mockups:** `dist/assets/game-screenshots-polished/`

---

## Current vs Target Values

| Parameter | Current | Target | Reason |
|-----------|---------|--------|--------|
| Character scale | 0.5 | 0.85 | 70% larger character |
| Line width (flipbook) | 2.5px | 4px | Bolder strokes |
| Line width (noir) | 2px | 3px | Thicker noir lines |
| Spiral count | 2-3 | 3-5 | More energy rings |
| Spiral radius | 20-35px | 35-60px | Larger energy field |
| Dust puff count | 4 | 10 | Denser dust clouds |
| Dust puff size | 3-6px | 6-12px | Bigger clouds |
| Crack count | 6 | 10 | More ground cracks |
| Crack length | 25-40px | 45-70px | Longer, bolder cracks |
| Ghost trail scale | 0.4 | 0.65 | More visible ghosts |

---

## Phase 1: Character Scale & Line Width

### Task 1.1: Scale Up drawZenoCoil

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawZenoCoil function, ~line 1395)

**Step 1: Update scale and lineWidth constants**

Find in drawZenoCoil:
```typescript
const scale = 0.5;
const lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

Replace with:
```typescript
const scale = 0.85;
const lineWidth = themeKind === 'flipbook' ? 4 : 3;
```

**Step 2: Update headRadius reference (already uses scale, will auto-adjust)**

No change needed - `const headRadius = 8 * scale;` will automatically become 6.8px

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawZenoCoil (0.5→0.85, lineWidth 2.5→4)"
```

---

### Task 1.2: Scale Up drawZenoBolt

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawZenoBolt function, ~line 1547)

**Step 1: Update scale and lineWidth constants**

Find in drawZenoBolt:
```typescript
const scale = 0.5;
const lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

Replace with:
```typescript
const scale = 0.85;
const lineWidth = themeKind === 'flipbook' ? 4 : 3;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawZenoBolt (0.5→0.85, lineWidth 2.5→4)"
```

---

### Task 1.3: Scale Up drawZenoImpact

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawZenoImpact function, ~line 1811)

**Step 1: Update scale and lineWidth constants**

Find in drawZenoImpact:
```typescript
const scale = 0.5;
const lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

Replace with:
```typescript
const scale = 0.85;
const lineWidth = themeKind === 'flipbook' ? 4 : 3;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawZenoImpact (0.5→0.85, lineWidth 2.5→4)"
```

---

### Task 1.4: Scale Up Original drawStickFigure (for idle state)

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawStickFigure function, ~line 225)

**Step 1: Update scale and lineWidth**

Find in drawStickFigure:
```typescript
const scale = 0.5;
const headRadius = 8 * scale;
```

And:
```typescript
ctx.lineWidth = 2.5;
```

Replace scale:
```typescript
const scale = 0.85;
const headRadius = 8 * scale;
```

Replace lineWidth (appears twice in function):
```typescript
ctx.lineWidth = 4;
```

And:
```typescript
ctx.lineWidth = 2.5 * landingEmphasis;
```
Replace with:
```typescript
ctx.lineWidth = 4 * landingEmphasis;
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 3: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up drawStickFigure idle pose (0.5→0.85, lineWidth 2.5→4)"
```

---

## Phase 2: Energy Effects Scale-Up

### Task 2.1: Boost Energy Spirals

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawEnergySpirals function, ~line 1294)

**Step 1: Update spiral parameters**

Find:
```typescript
const spiralCount = 2 + Math.floor(intensity);
const baseRadius = 20 + intensity * 15;
```

Replace with:
```typescript
const spiralCount = 3 + Math.floor(intensity * 2);
const baseRadius = 35 + intensity * 25;
```

**Step 2: Update line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 3 : 2;
```

**Step 3: Increase opacity**

Find:
```typescript
ctx.globalAlpha = 0.3 + intensity * 0.4;
```

Replace with:
```typescript
ctx.globalAlpha = 0.4 + intensity * 0.5;
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 5: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): boost energy spirals (larger, more visible)"
```

---

### Task 2.2: Boost Spring Lines

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawSpringLines function, ~line 1344)

**Step 1: Update zig-zag parameters**

Find:
```typescript
const zigCount = 4 + Math.floor(intensity * 4);
const amplitude = 3 + intensity * 4;
```

Replace with:
```typescript
const zigCount = 6 + Math.floor(intensity * 5);
const amplitude = 5 + intensity * 7;
```

**Step 2: Update line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): boost spring lines (thicker, more amplitude)"
```

---

### Task 2.3: Enhance Speed Lines

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawSpeedLines function, ~line 1203)

**Step 1: Update line count and length**

Find:
```typescript
const lineCount = Math.min(8, Math.floor(speed / 1.5));
const lineLen = 12 + speed * 2.5;
```

Replace with:
```typescript
const lineCount = Math.min(12, Math.floor(speed / 1.2));
const lineLen = 18 + speed * 3.5;
```

**Step 2: Update spread**

Find:
```typescript
const offsetY = (seededRandom(seed) - 0.5) * 35;
```

Replace with:
```typescript
const offsetY = (seededRandom(seed) - 0.5) * 50;
```

**Step 3: Update line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

**Step 4: Update whoosh line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 1 : 0.75;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
```

**Step 5: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 6: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): enhance speed lines (longer, wider spread)"
```

---

## Phase 3: Impact Effects Scale-Up

### Task 3.1: Boost Ground Cracks

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawGroundCracks function, ~line 1706)

**Step 1: Update crack count and length**

Find:
```typescript
const crackCount = 6;
const maxLen = 25 + (1 - progress) * 15;
```

Replace with:
```typescript
const crackCount = 10;
const maxLen = 45 + (1 - progress) * 25;
```

**Step 2: Update line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 3 : 2.5;
```

**Step 3: Increase opacity**

Find:
```typescript
ctx.globalAlpha = alpha * 0.7;
```

Replace with:
```typescript
ctx.globalAlpha = alpha * 0.9;
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 5: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): boost ground cracks (more, longer, bolder)"
```

---

### Task 3.2: Boost Dust Puffs

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawDustPuffs function, ~line 1759)

**Step 1: Update puff count and spread**

Find:
```typescript
const puffCount = 4;
const spread = 8 + progress * 20;
const rise = progress * 8;
```

Replace with:
```typescript
const puffCount = 10;
const spread = 15 + progress * 35;
const rise = progress * 15;
```

**Step 2: Update puff size**

Find:
```typescript
const puffSize = 3 + (1 - progress) * 3 + seededRandom(i * 19) * 2;
```

Replace with:
```typescript
const puffSize = 6 + (1 - progress) * 6 + seededRandom(i * 19) * 4;
```

**Step 3: Update line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

**Step 4: Increase opacity**

Find:
```typescript
ctx.globalAlpha = alpha * 0.5;
```

Replace with:
```typescript
ctx.globalAlpha = alpha * 0.7;
```

**Step 5: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 6: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): boost dust puffs (more, larger, more visible)"
```

---

## Phase 4: Ghost Trail Enhancement

### Task 4.1: Scale Up Ghost Figures

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawGhostFigure function, ~line 1103)

**Step 1: Update scale**

Find:
```typescript
const scale = 0.4; // Slightly smaller than main figure
```

Replace with:
```typescript
const scale = 0.65; // Closer to main figure size
```

**Step 2: Update line width**

Find:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
```

Replace with:
```typescript
ctx.lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): scale up ghost trail figures (0.4→0.65)"
```

---

### Task 4.2: Increase Ghost Trail Opacity in render.ts

**Files:**
- Modify: `src/game/engine/render.ts` (flipbook ghost trail, ~line 269)
- Modify: `src/game/engine/render.ts` (noir ghost trail, ~line 795)

**Step 1: Update flipbook ghost opacity**

Find in renderFlipbookFrame:
```typescript
const opacity = (0.6 - (trailLen - i - 1) * 0.15) * (1 - i / trailLen);
```

Replace with:
```typescript
const opacity = (0.8 - (trailLen - i - 1) * 0.12) * (1 - i / trailLen);
```

**Step 2: Update noir ghost opacity**

Find in renderNoirFrame:
```typescript
const opacity = 0.5 - (trailLen - i - 1) * 0.15;
```

Replace with:
```typescript
const opacity = 0.7 - (trailLen - i - 1) * 0.12;
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 4: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): increase ghost trail opacity for better visibility"
```

---

## Phase 5: Final Polish

### Task 5.1: Update Impact Burst

**Files:**
- Modify: `src/game/engine/sketchy.ts` (drawImpactBurst function, ~line 1007)

**Step 1: Update flipbook puff count and size**

Find in flipbook section:
```typescript
const puffCount = 5;
```

Replace with:
```typescript
const puffCount = 8;
```

Find:
```typescript
ctx.arc(puffX, puffY, 2 + progress * 2, 0, Math.PI * 2);
```

Replace with:
```typescript
ctx.arc(puffX, puffY, 4 + progress * 4, 0, Math.PI * 2);
```

**Step 2: Update radial lines**

Find:
```typescript
ctx.lineWidth = 1.5;
```

Replace with:
```typescript
ctx.lineWidth = 2.5;
```

Find:
```typescript
const outerR = 10 + progress * 8;
```

Replace with:
```typescript
const outerR = 18 + progress * 12;
```

**Step 3: Update noir section**

Find in noir section:
```typescript
const dropCount = 4;
```

Replace with:
```typescript
const dropCount = 6;
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | head -10`
Expected: Build success

**Step 5: Commit**

```bash
git add src/game/engine/sketchy.ts
git commit -m "feat(sketchy): boost impact burst effects"
```

---

### Task 5.2: Full Build & Visual Test

**Files:** None (testing only)

**Step 1: Full build**

Run: `npm run build`
Expected: Build success with no TypeScript errors

**Step 2: Start dev server**

Run: `npm run dev`
Expected: Server starts on localhost

**Step 3: Visual testing checklist**

- [ ] Flipbook theme - The Coil: Character larger, energy spirals visible
- [ ] Flipbook theme - The Bolt: Speed lines prominent, ghost trail visible
- [ ] Flipbook theme - The Impact: Dust cloud massive, cracks bold
- [ ] Noir theme - All poses render correctly with thicker lines
- [ ] No visual glitches or overflow issues

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete targeted scale-up for bolder artwork"
```

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1.1-1.4 | Character scale (0.5→0.85), line width (2.5→4) |
| 2 | 2.1-2.3 | Energy effects (spirals, springs, speed lines) |
| 3 | 3.1-3.2 | Impact effects (cracks, dust) |
| 4 | 4.1-4.2 | Ghost trail visibility |
| 5 | 5.1-5.2 | Final polish & testing |

**Total Tasks:** 11 commits, ~30-45 minutes execution time

**Risk Level:** LOW - Parameter changes only, no structural modifications
