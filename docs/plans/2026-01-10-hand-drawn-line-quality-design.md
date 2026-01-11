# Hand-Drawn Line Quality Visual Redesign

**Date:** 2026-01-10
**Status:** Approved
**Scope:** Canvas rendering only - flipbook theme line quality enhancement

## Objective

Enhance the hand-drawn aesthetic of the flipbook theme to match the reference image (flipbook-01-the-coil). The goal is to make all rendered lines feel like they were drawn by a human illustrator in 2005 - wobbly, imperfect, with visible brush-like texture.

## Key Visual Rules (from requirements)

- Hand-drawn look - like concept art or storyboard sketch, not digital perfection
- Brush-like textures - visible strokes, slightly uneven lines, not vector-clean
- Imperfect edges - no razor-sharp lines, allow for sketchy, human-like looseness
- No AI gloss or plastic look - avoid smooth, shiny, generated-art finish

## Approach: Hybrid Wobble + Selective Multi-Pass

### 1. Enhanced Wobble System

**Current state:**
- `getWobble()` uses seeded random with intensity ~1.5px
- Updates every 100ms
- Lines use `quadraticCurveTo` for smooth curves

**Changes:**

#### Wobble Constants
```typescript
// Before
const wobbleIntensity = 1.5;
const wobbleFrameMs = 100;

// After
const WOBBLE_INTENSITY = {
  hero: 2.5,      // Player, ground, flag
  standard: 2.0,  // Clouds, UI boxes, trajectories
  fine: 1.0,      // Small details, eyes, dashes
};
const WOBBLE_FRAME_MS = 150; // Slower = more deliberate feel
```

#### Function Changes

**`getWobble(x, y, nowMs, intensity)`**
- Accept intensity tier parameter instead of hardcoded value
- Use WOBBLE_FRAME_MS constant

**`drawHandLine()`**
- Break longer lines into 3-4 segments with independent wobble per segment
- Add subtle stroke width variation along the line (pressure simulation)

**`drawHandCircle()`**
- Increase radius variation from ±1.5px to ±2.5px
- Add more segments (24→32) for smoother wobble distribution

### 2. Multi-Pass Drawing for Key Elements

Apply multi-pass "sketched then inked" technique to hero elements only.

**Elements getting multi-pass:**
1. Stick figure (player) - all limbs and body
2. Ground line and cliff edge
3. Checkered flag pole

**Multi-pass technique:**
```typescript
function drawSketchyLine(ctx, x1, y1, x2, y2, color, nowMs) {
  // Pass 1: Guideline (pencil underdrawing)
  const guideColor = adjustAlpha('#9a9590', 0.3); // pencilGray
  drawHandLine(ctx, x1-0.5, y1-0.5, x2-0.5, y2-0.5, guideColor, 1.0, nowMs);

  // Pass 2: Main ink stroke
  drawHandLine(ctx, x1, y1, x2, y2, color, 2.5, nowMs);
}
```

**New functions to add:**
- `drawSketchyLine()` - 2-pass line drawing
- `drawSketchyCircle()` - 2-pass circle drawing

### 3. Files to Modify

| File | Changes |
|------|---------|
| `src/game/engine/sketchy.ts` | Add WOBBLE_INTENSITY constants, modify getWobble(), add drawSketchyLine/Circle, update drawHandLine segment logic |
| `src/game/engine/render.ts` | Use drawSketchy* for player and ground in renderFlipbookFrame() |

### 4. Implementation Steps

1. **Update wobble constants in sketchy.ts**
   - Add WOBBLE_INTENSITY object
   - Change WOBBLE_FRAME_MS to 150

2. **Modify getWobble() function**
   - Accept intensity parameter
   - Use new frame timing

3. **Add multi-pass drawing functions**
   - `drawSketchyLine()`
   - `drawSketchyCircle()`

4. **Update drawHandLine() for segments**
   - Break lines > 20px into 3-4 segments
   - Independent wobble per segment

5. **Update drawHandCircle() wobble**
   - Increase radius variation
   - More segments for distribution

6. **Apply to render.ts**
   - Player stick figure: use multi-pass for all body parts
   - Ground/cliff: use multi-pass
   - Flag pole: use multi-pass

7. **Visual testing**
   - All game states: idle, charging, flying, landing
   - Both themes work (flipbook enhanced, noir unchanged)

## Risk Assessment

- **Low risk:** Changes isolated to rendering, no game logic affected
- **Performance:** Multi-pass adds ~20% more draw calls for key elements only
- **Reversible:** Can easily revert wobble constants if too extreme

## Success Criteria

- Lines visibly wobble like hand-drawn strokes
- Player figure looks sketched, not digitally perfect
- Ground has "inked over pencil" quality
- Overall feel matches "drawn by human illustrator in 2005"
- No performance regression on target devices
