# Architectural Changes Required for Hybrid Model

## Executive Summary

Το Hybrid Model απαιτεί **4 νέα components** και **modifications σε 2 existing files**. Το total effort είναι **~400 lines of new code** και **~50 lines of modifications**. Όλες οι αλλαγές είναι **additive** - δεν χρειάζεται να σβήσουμε ή να rewrite existing code.

---

## New Components

### 1. Asset Loader (`src/game/engine/assets.ts`)

**Purpose:** Load και cache sprite sheet images.

**Functionality:**
- Load PNG files από `/public/assets/sprites/`
- Return `HTMLImageElement` objects
- Cache loaded images για performance
- Handle loading errors gracefully

**Interface:**
```typescript
export class AssetLoader {
  private cache: Map<string, HTMLImageElement>;
  
  async loadImage(path: string): Promise<HTMLImageElement>;
  getImage(path: string): HTMLImageElement | null;
  preloadAll(paths: string[]): Promise<void>;
}
```

**Estimated Lines:** ~60

---

### 2. Sprite Class (`src/game/engine/sprite.ts`)

**Purpose:** Represent ένα single sprite από ένα sprite sheet.

**Functionality:**
- Store reference στο sprite sheet image
- Store frame position (x, y, width, height) μέσα στο sheet
- Draw το sprite στο canvas με `ctx.drawImage()`
- Support για flipping (horizontal/vertical)

**Interface:**
```typescript
export class Sprite {
  constructor(
    image: HTMLImageElement,
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number
  );
  
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale?: number,
    flipH?: boolean
  ): void;
}
```

**Estimated Lines:** ~80

---

### 3. Animator Class (`src/game/engine/animator.ts`)

**Purpose:** Manage frame-by-frame animations.

**Functionality:**
- Store multiple animations (e.g., "coil", "bolt", "impact", "idle")
- Κάθε animation είναι array of `Sprite` objects
- Track current animation και current frame
- Auto-advance frames based on elapsed time
- Support για looping ή one-shot animations

**Interface:**
```typescript
export type AnimationName = 'coil' | 'bolt' | 'impact' | 'idle';

export class Animator {
  private animations: Map<AnimationName, Sprite[]>;
  private currentAnimation: AnimationName;
  private currentFrame: number;
  private elapsedTime: number;
  private frameRate: number; // frames per second
  
  constructor(animations: Map<AnimationName, Sprite[]>, frameRate: number);
  
  play(animationName: AnimationName, loop: boolean): void;
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  getCurrentFrame(): Sprite;
}
```

**Estimated Lines:** ~150

---

### 4. Sprite Configuration (`src/game/engine/spriteConfig.ts`)

**Purpose:** Define sprite sheet metadata (frame positions).

**Functionality:**
- Export constants που ορίζουν που βρίσκεται κάθε frame στο sprite sheet
- Χρησιμοποιείται από τον Animator για να φτιάξει Sprite objects

**Example:**
```typescript
export const ZENO_SPRITE_SHEET = '/assets/sprites/zeno-flipbook.png';

export const ZENO_FRAMES = {
  coil: [
    { x: 0, y: 0, w: 64, h: 64 },
    { x: 64, y: 0, w: 64, h: 64 },
    { x: 128, y: 0, w: 64, h: 64 },
  ],
  bolt: [
    { x: 0, y: 64, w: 64, h: 64 },
    { x: 64, y: 64, w: 64, h: 64 },
  ],
  impact: [
    { x: 0, y: 128, w: 64, h: 64 },
    { x: 64, y: 128, w: 64, h: 64 },
    { x: 128, y: 128, w: 64, h: 64 },
  ],
  idle: [
    { x: 0, y: 192, w: 64, h: 64 },
  ],
};
```

**Estimated Lines:** ~100

---

## Modified Components

### 5. GameState (`src/game/engine/types.ts`)

**Changes:** Προσθήκη animator instance στο state.

```typescript
export interface GameState {
  // ... existing fields ...
  
  // NEW: Sprite-based character rendering
  zenoAnimator: Animator | null;
}
```

**Estimated Lines:** +5

---

### 6. Render Pipeline (`src/game/engine/render.ts`)

**Changes:** Replace procedural `drawZeno*()` calls με sprite rendering.

**Before:**
```typescript
if (state.charging) {
  drawZenoCoil(ctx, state.px, state.py, playerColor, nowMs, state.chargePower, 'flipbook');
} else if (state.flying) {
  drawZenoBolt(ctx, state.px, state.py, playerColor, nowMs, { vx: state.vx, vy: state.vy }, 'flipbook');
}
```

**After:**
```typescript
if (state.zenoAnimator) {
  // Update animation based on game state
  if (state.charging && state.zenoAnimator.currentAnimation !== 'coil') {
    state.zenoAnimator.play('coil', true);
  } else if (state.flying && state.zenoAnimator.currentAnimation !== 'bolt') {
    state.zenoAnimator.play('bolt', false);
  } else if (state.landingFrame > 0 && state.zenoAnimator.currentAnimation !== 'impact') {
    state.zenoAnimator.play('impact', false);
  }
  
  // Draw sprite
  state.zenoAnimator.draw(ctx, state.px, state.py);
} else {
  // Fallback to procedural rendering
  if (state.charging) {
    drawZenoCoil(ctx, state.px, state.py, playerColor, nowMs, state.chargePower, 'flipbook');
  }
  // ... etc
}
```

**Estimated Lines:** +40 (modifications)

---

## Integration Points

### Initialization (in `Game.tsx` or `state.ts`)

```typescript
// Load sprite sheet
const assetLoader = new AssetLoader();
await assetLoader.preloadAll([ZENO_SPRITE_SHEET]);

// Create sprites
const zenoImage = assetLoader.getImage(ZENO_SPRITE_SHEET);
const animations = new Map<AnimationName, Sprite[]>();

animations.set('coil', ZENO_FRAMES.coil.map(f => 
  new Sprite(zenoImage, f.x, f.y, f.w, f.h)
));
animations.set('bolt', ZENO_FRAMES.bolt.map(f => 
  new Sprite(zenoImage, f.x, f.y, f.w, f.h)
));
// ... etc

// Create animator
const zenoAnimator = new Animator(animations, 12); // 12 FPS
zenoAnimator.play('idle', true);

// Add to state
state.zenoAnimator = zenoAnimator;
```

---

## Update Loop Integration (in `update.ts`)

```typescript
export function updateGame(state: GameState, deltaTime: number) {
  // ... existing physics and logic ...
  
  // Update animator
  if (state.zenoAnimator) {
    state.zenoAnimator.update(deltaTime);
  }
}
```

---

## File Structure

```
src/game/engine/
├── assets.ts          (NEW - ~60 lines)
├── sprite.ts          (NEW - ~80 lines)
├── animator.ts        (NEW - ~150 lines)
├── spriteConfig.ts    (NEW - ~100 lines)
├── types.ts           (MODIFIED - +5 lines)
├── render.ts          (MODIFIED - +40 lines)
└── update.ts          (MODIFIED - +10 lines)

public/assets/sprites/
├── zeno-flipbook.png  (NEW - sprite sheet image)
└── zeno-noir.png      (NEW - sprite sheet image)
```

---

## Backwards Compatibility

Το Hybrid Model διατηρεί **100% backwards compatibility**:

- Αν `state.zenoAnimator` είναι `null`, το game χρησιμοποιεί τα existing procedural functions
- Όλα τα procedural drawing functions (`drawZenoCoil`, `drawZenoBolt`, etc.) παραμένουν στο codebase
- Το procedural rendering για platforms, clouds, UI, etc. **δεν αλλάζει καθόλου**

---

## Performance Impact

**Minimal.** Sprite rendering με `ctx.drawImage()` είναι **faster** από procedural drawing με paths και strokes.

**Memory:** Ένα 512x512 sprite sheet = ~1MB uncompressed in memory. Negligible για modern devices.

---

## Testing Strategy

1. **Unit Tests:** Test `Sprite.draw()` και `Animator.update()` σε isolation
2. **Integration Test:** Load sprite sheet, create animator, verify rendering
3. **Visual Test:** Side-by-side comparison με procedural rendering
4. **Performance Test:** Measure FPS με sprite vs procedural rendering

---

## Estimated Total Effort

| Task | Lines of Code | Estimated Time |
|------|---------------|----------------|
| Asset Loader | 60 | 1 hour |
| Sprite Class | 80 | 1.5 hours |
| Animator Class | 150 | 3 hours |
| Sprite Config | 100 | 1 hour |
| Render Integration | 40 | 1 hour |
| Update Integration | 10 | 30 min |
| Testing | - | 2 hours |
| **Total** | **~440** | **~10 hours** |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sprite sheet format mismatch | Low | Medium | Use standard PNG, test early |
| Animation timing issues | Medium | Low | Adjustable frameRate parameter |
| Memory leaks from images | Low | Medium | Proper cleanup in AssetLoader |
| Rendering artifacts | Low | Low | Use integer positions, test on multiple devices |

---

## Conclusion

Το Hybrid Model είναι **architecturally sound** και **low-risk**. Όλες οι αλλαγές είναι additive και modular. Το existing procedural rendering παραμένει ως fallback. Το total effort είναι **~10 hours of development time** για ένα experienced developer (ή ~20 hours με AI assistance).

Αυτό είναι **achievable** και **pragmatic**.
