# Calligraphic Flow Size System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a collectible sizing system that communicates sequence order through size progression, inspired by Chinese brush calligraphy stroke pressure - where each "stroke" (trajectory segment) starts large and gradually shrinks like ink fading from a brush.

**Architecture:**
- Stroke boundaries detected via portals (primary) or X-position resets (fallback)
- Size interpolation uses eased curve (progress²) simulating ink flow
- Stars mark stroke start/end (bookends), coins fill the middle
- Visual reinforcement: glow on stroke starts, connecting lines for tutorial levels 1-10

**Tech Stack:** TypeScript, Canvas 2D rendering

---

## Task 1: Reduce Zeno Display Size

**Files:**
- Modify: `src/game/engine/spriteConfig.ts:19-20`

**Step 1: Update Zeno display constants**

Change the display size from 40×40 to 35×35:

```typescript
// In-game display size (scales down from frame size)
export const ZENO_DISPLAY_WIDTH = 35;
export const ZENO_DISPLAY_HEIGHT = 35;
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/game/engine/spriteConfig.ts
git commit -m "feat: reduce Zeno display size to 35x35 for multi-trajectory levels"
```

---

## Task 2: Create Calligraphic Scale Calculator Module

**Files:**
- Create: `src/game/engine/arcade/calligraphicScale.ts`
- Create: `src/game/engine/arcade/__tests__/calligraphicScale.test.ts`

**Step 1: Write failing tests**

```typescript
// src/game/engine/arcade/__tests__/calligraphicScale.test.ts
import {
  detectStrokeBoundaries,
  calculateDoodleScale,
  assignDoodleSprite,
  type StrokeBoundary,
} from '../calligraphicScale';
import type { DoodlePlacement, PortalPair } from '../types';

describe('calligraphicScale', () => {
  describe('detectStrokeBoundaries', () => {
    it('returns single stroke when no portals and no X-resets', () => {
      const doodles: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
        { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 2 },
        { x: 300, y: 100, size: 'large', sprite: 'coin', sequence: 3 },
      ];
      const result = detectStrokeBoundaries(doodles, []);
      expect(result).toEqual([{ startIndex: 0, endIndex: 2 }]);
    });

    it('splits stroke at portal exit position', () => {
      const doodles: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
        { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 2 },
        { x: 300, y: 100, size: 'large', sprite: 'coin', sequence: 3 },
        { x: 120, y: 100, size: 'large', sprite: 'coin', sequence: 4 }, // After portal
        { x: 220, y: 100, size: 'large', sprite: 'coin', sequence: 5 },
      ];
      const portals: PortalPair[] = [
        { entry: { x: 350, y: 100 }, exit: { x: 80, y: 100 } },
      ];
      const result = detectStrokeBoundaries(doodles, portals);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ startIndex: 0, endIndex: 2 });
      expect(result[1]).toEqual({ startIndex: 3, endIndex: 4 });
    });

    it('splits stroke at X-position reset (fallback)', () => {
      const doodles: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
        { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 2 },
        { x: 80, y: 100, size: 'large', sprite: 'coin', sequence: 3 }, // X reset
        { x: 180, y: 100, size: 'large', sprite: 'coin', sequence: 4 },
      ];
      const result = detectStrokeBoundaries(doodles, []);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ startIndex: 0, endIndex: 1 });
      expect(result[1]).toEqual({ startIndex: 2, endIndex: 3 });
    });
  });

  describe('calculateDoodleScale', () => {
    it('returns 1.8 for single doodle stroke', () => {
      expect(calculateDoodleScale(0, 1)).toBe(1.8);
    });

    it('returns 1.8 and 1.0 for two doodle stroke', () => {
      expect(calculateDoodleScale(0, 2)).toBe(1.8);
      expect(calculateDoodleScale(1, 2)).toBe(1.0);
    });

    it('uses eased interpolation for larger strokes', () => {
      // 5 doodles: positions 0, 1, 2, 3, 4
      const scales = [0, 1, 2, 3, 4].map(i => calculateDoodleScale(i, 5));

      // First should be 1.8
      expect(scales[0]).toBe(1.8);

      // Last should be 0.7
      expect(scales[4]).toBeCloseTo(0.7, 1);

      // Middle values should decrease (eased)
      expect(scales[1]).toBeGreaterThan(scales[2]);
      expect(scales[2]).toBeGreaterThan(scales[3]);
      expect(scales[3]).toBeGreaterThan(scales[4]);
    });

    it('enforces minimum step of 0.1 for large strokes', () => {
      // 15 doodles - should have at least 0.1 difference
      const scales: number[] = [];
      for (let i = 0; i < 15; i++) {
        scales.push(calculateDoodleScale(i, 15));
      }

      for (let i = 1; i < scales.length; i++) {
        const diff = scales[i - 1] - scales[i];
        // Allow small tolerance for floating point
        expect(diff).toBeGreaterThanOrEqual(0.095);
      }
    });
  });

  describe('assignDoodleSprite', () => {
    it('returns star for stroke start', () => {
      expect(assignDoodleSprite(0, 5)).toBe('star');
    });

    it('returns star for stroke end', () => {
      expect(assignDoodleSprite(4, 5)).toBe('star');
    });

    it('returns coin for middle positions', () => {
      expect(assignDoodleSprite(1, 5)).toBe('coin');
      expect(assignDoodleSprite(2, 5)).toBe('coin');
      expect(assignDoodleSprite(3, 5)).toBe('coin');
    });

    it('returns star for single doodle stroke', () => {
      expect(assignDoodleSprite(0, 1)).toBe('star');
    });

    it('returns star for both positions in two doodle stroke', () => {
      expect(assignDoodleSprite(0, 2)).toBe('star');
      expect(assignDoodleSprite(1, 2)).toBe('star');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=calligraphicScale --watch=false`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/game/engine/arcade/calligraphicScale.ts
import type { DoodlePlacement, PortalPair } from './types';

/**
 * Calligraphic Flow Size System
 *
 * Communicates sequence order through size progression, inspired by
 * Chinese brush calligraphy where each stroke starts with pressure
 * (large) and ends with lift (small) as ink fades.
 */

export interface StrokeBoundary {
  startIndex: number;  // First doodle index in stroke
  endIndex: number;    // Last doodle index in stroke
}

// Scale range: asymmetric for eye-catching stroke starts
const SCALE_MAX = 1.8;  // Stroke start (lots of ink)
const SCALE_MIN = 0.7;  // Stroke end (ink fading)
const SCALE_RANGE = SCALE_MAX - SCALE_MIN;  // 1.1
const MIN_SCALE_STEP = 0.1;  // Minimum difference between consecutive doodles

/**
 * Detect stroke boundaries based on portals and X-position resets.
 *
 * Primary: Portal positions define stroke breaks
 * Fallback: X-position going backwards indicates new stroke
 */
export function detectStrokeBoundaries(
  doodles: DoodlePlacement[],
  portals: PortalPair[]
): StrokeBoundary[] {
  if (doodles.length === 0) return [];
  if (doodles.length === 1) return [{ startIndex: 0, endIndex: 0 }];

  const boundaries: StrokeBoundary[] = [];
  let strokeStart = 0;

  for (let i = 1; i < doodles.length; i++) {
    const prevDoodle = doodles[i - 1];
    const currDoodle = doodles[i];

    let isNewStroke = false;

    // Primary: Check if there's a portal that would cause this transition
    // A portal teleports from right side back to left side
    if (portals.length > 0) {
      for (const portal of portals) {
        // If previous doodle is near portal entry (right side)
        // and current doodle is near portal exit (left side)
        const nearEntry = Math.abs(prevDoodle.x - portal.entry.x) < 80;
        const nearExit = Math.abs(currDoodle.x - portal.exit.x) < 80;

        if (nearEntry && nearExit && currDoodle.x < prevDoodle.x) {
          isNewStroke = true;
          break;
        }
      }
    }

    // Fallback: X-position reset (next doodle is significantly to the left)
    if (!isNewStroke && currDoodle.x < prevDoodle.x - 30) {
      isNewStroke = true;
    }

    if (isNewStroke) {
      boundaries.push({ startIndex: strokeStart, endIndex: i - 1 });
      strokeStart = i;
    }
  }

  // Add final stroke
  boundaries.push({ startIndex: strokeStart, endIndex: doodles.length - 1 });

  return boundaries;
}

/**
 * Calculate scale for a doodle based on its position within a stroke.
 * Uses eased interpolation (progress²) to simulate ink flow.
 *
 * @param positionInStroke - 0-indexed position within the stroke
 * @param strokeLength - Total doodles in this stroke
 * @returns Scale value between 0.7 and 1.8
 */
export function calculateDoodleScale(
  positionInStroke: number,
  strokeLength: number
): number {
  // Edge case: single doodle
  if (strokeLength === 1) return SCALE_MAX;

  // Edge case: two doodles (softer range)
  if (strokeLength === 2) {
    return positionInStroke === 0 ? SCALE_MAX : 1.0;
  }

  // Calculate progress (0 to 1)
  const progress = positionInStroke / (strokeLength - 1);

  // Ease-in (progress²): ink "holds" longer at start, fades faster at end
  const eased = progress * progress;

  // Calculate base scale
  let scale = SCALE_MAX - (eased * SCALE_RANGE);

  // Enforce minimum step for large strokes
  if (strokeLength > 10 && positionInStroke > 0) {
    const prevScale = calculateDoodleScaleRaw(positionInStroke - 1, strokeLength);
    const minAllowed = prevScale - MIN_SCALE_STEP;
    scale = Math.max(scale, SCALE_MIN);
    scale = Math.min(scale, minAllowed);
  }

  // Clamp to valid range
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale));
}

// Helper for minimum step calculation (no recursion guard)
function calculateDoodleScaleRaw(positionInStroke: number, strokeLength: number): number {
  const progress = positionInStroke / (strokeLength - 1);
  const eased = progress * progress;
  return Math.max(SCALE_MIN, SCALE_MAX - (eased * SCALE_RANGE));
}

/**
 * Determine sprite type based on position in stroke.
 * Stars mark stroke start and end (bookends), coins fill middle.
 */
export function assignDoodleSprite(
  positionInStroke: number,
  strokeLength: number
): 'star' | 'coin' {
  const isStart = positionInStroke === 0;
  const isEnd = positionInStroke === strokeLength - 1;

  return (isStart || isEnd) ? 'star' : 'coin';
}

/**
 * Apply calligraphic flow to doodle placements.
 * Modifies scale and sprite based on stroke position.
 */
export function applyCalligraphicFlow(
  doodles: DoodlePlacement[],
  portals: PortalPair[]
): DoodlePlacement[] {
  if (doodles.length === 0) return [];

  const strokes = detectStrokeBoundaries(doodles, portals);

  return doodles.map((doodle, globalIndex) => {
    // Find which stroke this doodle belongs to
    const stroke = strokes.find(
      s => globalIndex >= s.startIndex && globalIndex <= s.endIndex
    );

    if (!stroke) return doodle;

    const positionInStroke = globalIndex - stroke.startIndex;
    const strokeLength = stroke.endIndex - stroke.startIndex + 1;

    return {
      ...doodle,
      scale: calculateDoodleScale(positionInStroke, strokeLength),
      sprite: assignDoodleSprite(positionInStroke, strokeLength),
    };
  });
}

/**
 * Check if a doodle is a stroke start (for glow effect).
 */
export function isStrokeStart(
  doodleIndex: number,
  doodles: DoodlePlacement[],
  portals: PortalPair[]
): boolean {
  const strokes = detectStrokeBoundaries(doodles, portals);
  return strokes.some(s => s.startIndex === doodleIndex);
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=calligraphicScale --watch=false`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/game/engine/arcade/calligraphicScale.ts src/game/engine/arcade/__tests__/calligraphicScale.test.ts
git commit -m "feat: add calligraphic scale calculator with stroke detection"
```

---

## Task 3: Integrate Calligraphic Flow into Level Generator

**Files:**
- Modify: `src/game/engine/arcade/generator/level-generator.ts:246-274`

**Step 1: Import the calligraphic module**

Add at top of file:

```typescript
import { applyCalligraphicFlow } from '../calligraphicScale';
```

**Step 2: Apply calligraphic flow after doodle creation**

Replace the doodles creation block (lines ~246-274) with:

```typescript
    // Create doodles with potential motion for levels 21+
    let doodles: DoodlePlacement[] = positions.map((pos, i) => {
      const doodle: DoodlePlacement = {
        x: pos.x,
        y: pos.y,
        size: 'large',  // Base size, scale will override visual
        sprite: 'coin', // Will be overridden by calligraphic flow
        sequence: i + 1,
      };

      // Add motion for moving doodles (levels 21+)
      if (worldConfig.mechanics.movingDoodles && rng.next() > 0.6) {
        if (rng.next() > 0.5) {
          doodle.motion = {
            type: 'linear',
            axis: rng.pick(['x', 'y'] as const),
            range: rng.nextInt(20, 40),
            speed: rng.nextFloat(0.3, 0.6),
          };
        } else {
          doodle.motion = {
            type: 'circular',
            radius: rng.nextInt(15, 30),
            speed: rng.nextFloat(0.2, 0.4),
          };
        }
      }

      return doodle;
    });

    // Generate portals first (needed for calligraphic stroke detection)
    let portal: PortalPair | null = null;
    let portalsArray: PortalPair[] = [];

    const props = shouldUseProps(levelId);
    if (props.portals) {
      const portalResult = this.generatePortals(
        rng.derive('portals'),
        worldConfig.mechanics.timedPortals,
        worldConfig.mechanics.multiPortals
      );
      portal = portalResult.portal;
      if (portalResult.portals) {
        portalsArray = portalResult.portals;
      } else if (portal) {
        portalsArray = [portal];
      }
    }

    // Apply calligraphic flow sizing (scale + sprite based on stroke position)
    doodles = applyCalligraphicFlow(doodles, portalsArray);
```

**Step 3: Update level creation to use pre-generated portal**

Update the level creation and remove duplicate portal generation:

```typescript
    // Create level
    const level: ArcadeLevel = {
      id: levelId,
      landingTarget: getLandingTarget(levelId),
      doodles,
      springs: [],
      portal,
      portals: portalsArray.length > 1 ? portalsArray : undefined,
      hazards: [],
      windZones: [],
      gravityWells: [],
      frictionZones: [],
    };

    // Add springs if needed
    if (props.springs) {
      level.springs = this.generateSprings(
        positions,
        rng,
        worldConfig.mechanics.timedSprings,
        worldConfig.mechanics.breakableSprings
      );
    }

    // Portal already added above
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/game/engine/arcade/generator/level-generator.ts
git commit -m "feat: integrate calligraphic flow sizing into level generator"
```

---

## Task 4: Add Stroke Start Glow Effect

**Files:**
- Modify: `src/game/engine/arcade/doodlesRender.ts`
- Modify: `src/game/engine/arcade/doodles.ts`

**Step 1: Add isStrokeStart flag to Doodle interface**

In `doodles.ts`, update the interface:

```typescript
export interface Doodle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  hitRadius: number;
  displaySize: number;
  sprite: string;
  sequence: number;
  collected: boolean;
  collectedAt: number;
  scale: number;
  rotation: number;
  motionState: MovingDoodleState | null;
  isStrokeStart: boolean;  // NEW: for glow effect
}
```

**Step 2: Update createDoodleFromPlacement**

```typescript
export function createDoodleFromPlacement(
  placement: DoodlePlacement,
  isStrokeStart: boolean = false
): Doodle {
  const config = SIZE_CONFIG[placement.size];
  const scale = placement.scale ?? 1.0;
  const motion = placement.motion ?? { type: 'static' as const };

  const motionState = motion.type !== 'static'
    ? createMovingDoodleState(placement.x, placement.y, motion)
    : null;

  return {
    x: placement.x,
    y: placement.y,
    baseX: placement.x,
    baseY: placement.y,
    hitRadius: config.hitRadius * scale,
    displaySize: config.displaySize * scale,
    sprite: placement.sprite,
    sequence: placement.sequence,
    collected: false,
    collectedAt: 0,
    scale,
    rotation: placement.rotation ?? 0,
    motionState,
    isStrokeStart,
  };
}
```

**Step 3: Update createDoodlesFromLevel to detect stroke starts**

```typescript
import { detectStrokeBoundaries } from './calligraphicScale';
import type { PortalPair } from './types';

export function createDoodlesFromLevel(
  placements: DoodlePlacement[],
  portals: PortalPair[] = []
): Doodle[] {
  const strokes = detectStrokeBoundaries(placements, portals);
  const strokeStartIndices = new Set(strokes.map(s => s.startIndex));

  return placements.map((placement, index) =>
    createDoodleFromPlacement(placement, strokeStartIndices.has(index))
  );
}
```

**Step 4: Add stroke start glow in doodlesRender.ts**

Add new function after `renderCenterGlow`:

```typescript
/**
 * Render a prominent glow for stroke start doodles
 * Helps players identify where each stroke begins
 */
function renderStrokeStartGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  displaySize: number,
  timeMs: number
): void {
  ctx.save();

  // Strong pulsing effect
  const pulse = 0.7 + Math.sin(timeMs * 0.005) * 0.3;
  const radius = displaySize * 0.8;

  // Outer golden glow
  const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glowGradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * pulse})`);
  glowGradient.addColorStop(0.4, `rgba(255, 180, 0, ${0.3 * pulse})`);
  glowGradient.addColorStop(0.7, `rgba(255, 150, 0, ${0.15 * pulse})`);
  glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();

  ctx.restore();
}
```

**Step 5: Call stroke start glow in renderActiveDoodle**

Update `renderActiveDoodle` to add the glow:

```typescript
function renderActiveDoodle(
  ctx: CanvasRenderingContext2D,
  doodle: Doodle,
  timeMs: number
): void {
  const { x, y, displaySize, sprite, sequence, rotation, isStrokeStart } = doodle;

  // Gentle bob animation
  const bobOffset = Math.sin(timeMs * 0.003 + sequence) * 3;

  // Stroke start glow (rendered behind doodle)
  if (isStrokeStart) {
    renderStrokeStartGlow(ctx, x, y + bobOffset, displaySize, timeMs);
  }

  ctx.save();
  // ... rest of existing code
```

**Step 6: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/game/engine/arcade/doodles.ts src/game/engine/arcade/doodlesRender.ts
git commit -m "feat: add stroke start glow effect for calligraphic flow"
```

---

## Task 5: Add Connecting Lines for Tutorial Levels

**Files:**
- Modify: `src/game/engine/arcade/doodlesRender.ts`

**Step 1: Add renderConnectingLines function**

```typescript
/**
 * Render connecting lines between doodles for tutorial levels (1-10)
 * Helps new players understand the collection sequence
 */
export function renderConnectingLines(
  ctx: CanvasRenderingContext2D,
  doodles: Doodle[],
  levelId: number
): void {
  // Only show for levels 1-10
  if (levelId > 10) return;
  if (doodles.length < 2) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();

  // Sort by sequence to draw in order
  const sorted = [...doodles]
    .filter(d => !d.collected)
    .sort((a, b) => a.sequence - b.sequence);

  for (let i = 0; i < sorted.length; i++) {
    const doodle = sorted[i];
    if (i === 0) {
      ctx.moveTo(doodle.x, doodle.y);
    } else {
      ctx.lineTo(doodle.x, doodle.y);
    }
  }

  ctx.stroke();
  ctx.restore();
}
```

**Step 2: Update renderDoodles signature and call**

```typescript
export function renderDoodles(
  ctx: CanvasRenderingContext2D,
  doodles: Doodle[],
  timeMs: number,
  levelId: number = 1
): void {
  // Render connecting lines first (behind doodles)
  renderConnectingLines(ctx, doodles, levelId);

  doodles.forEach(doodle => {
    if (doodle.collected) {
      renderCollectedDoodle(ctx, doodle, timeMs);
    } else {
      renderActiveDoodle(ctx, doodle, timeMs);
    }
  });
}
```

**Step 3: Update call site in render.ts**

Find where `renderDoodles` is called and add levelId parameter. Search for the call site:

Run: `grep -rn "renderDoodles" src/`

Update the call to pass levelId from arcadeState.

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/game/engine/arcade/doodlesRender.ts
git commit -m "feat: add connecting lines for tutorial levels 1-10"
```

---

## Task 6: Update Game.tsx createDoodlesFromLevel Calls

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Find all createDoodlesFromLevel calls**

Search for calls and update to pass portals:

```typescript
// Where levels are loaded, ensure portals are passed
state.arcadeDoodles = createDoodlesFromLevel(
  level.doodles,
  level.portals ?? (level.portal ? [level.portal] : [])
);
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Manual test**

Run: `npm run dev`
- Open level editor (Ctrl+E)
- Generate a level with portals
- Verify stroke starts have glow
- Verify stars at stroke boundaries
- Verify sizes decrease within each stroke

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: pass portals to createDoodlesFromLevel for stroke detection"
```

---

## Task 7: Update renderDoodles Call Sites

**Files:**
- Modify: `src/game/engine/render/flipbookFrame.ts` (or wherever renderDoodles is called)

**Step 1: Find renderDoodles call site**

Run: `grep -rn "renderDoodles" src/game/engine/render/`

**Step 2: Update to pass levelId**

Pass `state.arcadeState?.currentLevelId ?? 1` as the levelId parameter.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/engine/render/
git commit -m "feat: pass levelId to renderDoodles for tutorial line visibility"
```

---

## Task 8: Final Integration Test

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Manual testing checklist**

- [ ] Level 1-10: Connecting lines visible
- [ ] Level 11+: No connecting lines
- [ ] Stroke starts have golden glow
- [ ] Stars at stroke start/end, coins in middle
- [ ] Size decreases from 1.8 to 0.7 within each stroke
- [ ] Portal-based levels: strokes split correctly at portals
- [ ] Zeno appears smaller (35×35)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete calligraphic flow size system implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Reduce Zeno size | spriteConfig.ts |
| 2 | Create scale calculator | calligraphicScale.ts + tests |
| 3 | Integrate into generator | level-generator.ts |
| 4 | Add stroke start glow | doodles.ts, doodlesRender.ts |
| 5 | Add tutorial connecting lines | doodlesRender.ts |
| 6 | Update Game.tsx calls | Game.tsx |
| 7 | Update render call sites | flipbookFrame.ts |
| 8 | Final integration test | - |

**Total estimated tasks:** 8 discrete implementation tasks with TDD approach.
