# Special FX Assets Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate sprite-based special effects assets into the game, replacing the removed procedural effects.

**Architecture:** Create an `FXAnimator` class (similar to `Animator`) that manages sprite sheet animations for effects. Each effect type has its own configuration with frame count, size, frame rate, and trigger conditions. Effects are rendered in `render.ts` at appropriate moments based on game state.

**Tech Stack:** TypeScript, Canvas API, existing AssetLoader system

---

## Asset Inventory

### Available FX Sprite Sheets (per theme):

| Asset | Dimensions | Frame Size | Frames | Trigger |
|-------|------------|------------|--------|---------|
| fx-charge-swirl | 512x64 | 64x64 | 8 | charging |
| fx-charge-dust | 256x32 | 32x32 | 8 | charging |
| fx-launch-burst | 512x64 | 64x64 | 8 | launch |
| fx-launch-sparks | 384x48 | 48x48 | 8 | launch |
| fx-speed-lines | 512x64 | 128x64 | 4 | flying (high speed) |
| fx-motion-trail | 200x50 | 50x50 | 4 | flying |
| fx-whoosh | 256x64 | 64x64 | 4 | flying (very high speed) |
| fx-impact-burst | 640x80 | 80x80 | 8 | landing |
| fx-landing-dust | 640x64 | 80x64 | 8 | landing |
| fx-ground-cracks | 480x60 | 80x60 | 6 | landing |
| fx-impact-debris | 384x48 | 48x48 | 8 | landing |
| fx-fall-swirl | 256x64 | 64x64 | 4 | falling off cliff |
| fx-panic-marks | 128x32 | 32x32 | 4 | falling off cliff |
| fx-star-sparkle | 128x32 | 32x32 | 4 | UI (record marker) |
| particle-dust | 8x8 | 8x8 | 1 | particle system |
| particle-spark | 8x8 | 8x8 | 1 | particle system |
| particle-debris | 6x6 | 6x6 | 1 | particle system |
| particle-smoke | 16x16 | 16x16 | 1 | particle system |

---

## Task 1: Create FX Config File

**Files:**
- Create: `src/game/engine/fxConfig.ts`

**Step 1: Create the FX configuration with all effect definitions**

```typescript
// src/game/engine/fxConfig.ts

/**
 * Special Effects sprite sheet configuration
 * Defines paths, frame sizes, and animation metadata for all FX
 */

export type FXName =
  | 'chargeSwirl'
  | 'chargeDust'
  | 'launchBurst'
  | 'launchSparks'
  | 'speedLines'
  | 'motionTrail'
  | 'whoosh'
  | 'impactBurst'
  | 'landingDust'
  | 'groundCracks'
  | 'impactDebris'
  | 'fallSwirl'
  | 'panicMarks'
  | 'starSparkle';

export interface FXConfig {
  name: FXName;
  path: {
    flipbook: string;
    noir: string;
  };
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
  loop: boolean;
  // Display size (can differ from frame size for scaling)
  displayWidth: number;
  displayHeight: number;
  // Anchor point (0-1, where 0.5 = center)
  anchorX: number;
  anchorY: number;
}

const FX_BASE_PATH = '/assets/specialfx_assets';

export const FX_CONFIGS: FXConfig[] = [
  // === CHARGING EFFECTS ===
  {
    name: 'chargeSwirl',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-charge-swirl-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-charge-swirl-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 8,
    frameRate: 12,
    loop: true,
    displayWidth: 64,
    displayHeight: 64,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'chargeDust',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-charge-dust-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-charge-dust-noir.png`,
    },
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 8,
    frameRate: 10,
    loop: true,
    displayWidth: 32,
    displayHeight: 32,
    anchorX: 0.5,
    anchorY: 1.0, // Bottom-anchored (dust rises from ground)
  },

  // === LAUNCH EFFECTS ===
  {
    name: 'launchBurst',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-launch-burst-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-launch-burst-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 8,
    frameRate: 15,
    loop: false,
    displayWidth: 64,
    displayHeight: 64,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'launchSparks',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-launch-sparks-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-launch-sparks-noir.png`,
    },
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 8,
    frameRate: 20,
    loop: false,
    displayWidth: 48,
    displayHeight: 48,
    anchorX: 0.5,
    anchorY: 0.5,
  },

  // === FLIGHT EFFECTS ===
  {
    name: 'speedLines',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-speed-lines-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-speed-lines-noir.png`,
    },
    frameWidth: 128,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 16,
    loop: true,
    displayWidth: 128,
    displayHeight: 64,
    anchorX: 0.7, // Offset right so lines trail behind
    anchorY: 0.5,
  },
  {
    name: 'motionTrail',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-motion-trail-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-motion-trail-noir.png`,
    },
    frameWidth: 50,
    frameHeight: 50,
    frameCount: 4,
    frameRate: 8, // Slower - these are opacity levels, not animation
    loop: false,
    displayWidth: 50,
    displayHeight: 50,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'whoosh',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-whoosh-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-whoosh-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 12,
    loop: true,
    displayWidth: 64,
    displayHeight: 64,
    anchorX: 0.5,
    anchorY: 0.5,
  },

  // === LANDING EFFECTS ===
  {
    name: 'impactBurst',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-impact-burst-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-impact-burst-noir.png`,
    },
    frameWidth: 80,
    frameHeight: 80,
    frameCount: 8,
    frameRate: 15,
    loop: false,
    displayWidth: 80,
    displayHeight: 80,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'landingDust',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-landing-dust-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-landing-dust-noir.png`,
    },
    frameWidth: 80,
    frameHeight: 64,
    frameCount: 8,
    frameRate: 12,
    loop: false,
    displayWidth: 80,
    displayHeight: 64,
    anchorX: 0.5,
    anchorY: 1.0, // Bottom-anchored
  },
  {
    name: 'groundCracks',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-ground-cracks-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-ground-cracks-noir.png`,
    },
    frameWidth: 80,
    frameHeight: 60,
    frameCount: 6,
    frameRate: 10,
    loop: false,
    displayWidth: 80,
    displayHeight: 60,
    anchorX: 0.5,
    anchorY: 0.0, // Top-anchored (cracks spread down from impact)
  },
  {
    name: 'impactDebris',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-impact-debris-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-impact-debris-noir.png`,
    },
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 8,
    frameRate: 15,
    loop: false,
    displayWidth: 48,
    displayHeight: 48,
    anchorX: 0.5,
    anchorY: 1.0, // Bottom-anchored
  },

  // === FAILURE EFFECTS ===
  {
    name: 'fallSwirl',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-fall-swirl-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-fall-swirl-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 8,
    loop: true,
    displayWidth: 64,
    displayHeight: 64,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'panicMarks',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-panic-marks-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-panic-marks-noir.png`,
    },
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameRate: 6,
    loop: true,
    displayWidth: 32,
    displayHeight: 32,
    anchorX: 0.5,
    anchorY: 1.0, // Appears above head
  },

  // === UI EFFECTS ===
  {
    name: 'starSparkle',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-star-sparkle-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-star-sparkle-noir.png`,
    },
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameRate: 6,
    loop: true,
    displayWidth: 32,
    displayHeight: 32,
    anchorX: 0.5,
    anchorY: 0.5,
  },
];

/**
 * Get FX config by name
 */
export function getFXConfig(name: FXName): FXConfig | undefined {
  return FX_CONFIGS.find(c => c.name === name);
}

/**
 * Get all FX asset paths for preloading
 */
export function getAllFXPaths(theme: 'flipbook' | 'noir'): string[] {
  return FX_CONFIGS.map(c => c.path[theme]);
}
```

**Step 2: Verify file was created correctly**

Run: `cat src/game/engine/fxConfig.ts | head -50`
Expected: See the file contents starting with the type definitions

**Step 3: Commit**

```bash
git add src/game/engine/fxConfig.ts
git commit -m "feat(fx): add FX config with all effect definitions"
```

---

## Task 2: Create FXAnimator Class

**Files:**
- Create: `src/game/engine/fxAnimator.ts`

**Step 1: Create the FXAnimator class**

```typescript
// src/game/engine/fxAnimator.ts

import { assetLoader } from './assets';
import { FXConfig, FXName, getFXConfig, FX_CONFIGS } from './fxConfig';

/**
 * Active effect instance - tracks a currently playing effect
 */
interface ActiveFX {
  config: FXConfig;
  x: number;
  y: number;
  frameIndex: number;
  frameTimer: number;
  finished: boolean;
  // Optional: follow a target (like Zeno)
  followTarget?: { x: number; y: number } | null;
  // Optional: offset from position/target
  offsetX: number;
  offsetY: number;
}

/**
 * FXAnimator - Manages sprite-based special effects
 * Can play multiple effects simultaneously, each with their own position and timing
 */
export class FXAnimator {
  private theme: 'flipbook' | 'noir' = 'flipbook';
  private images: Map<FXName, HTMLImageElement> = new Map();
  private activeEffects: ActiveFX[] = [];
  private ready: boolean = false;

  constructor(theme: 'flipbook' | 'noir' = 'flipbook') {
    this.theme = theme;
  }

  /**
   * Initialize by loading all FX sprite sheets for current theme
   */
  public initialize(): boolean {
    this.images.clear();

    for (const config of FX_CONFIGS) {
      const path = config.path[this.theme];
      const image = assetLoader.getImage(path);

      if (image) {
        this.images.set(config.name, image);
      } else {
        console.warn(`FX sprite sheet not loaded: ${path}`);
      }
    }

    this.ready = this.images.size > 0;
    return this.ready;
  }

  /**
   * Switch theme and reinitialize
   */
  public setTheme(theme: 'flipbook' | 'noir'): void {
    if (this.theme === theme) return;
    this.theme = theme;
    this.initialize();
  }

  /**
   * Play an effect at a specific position
   * Returns the effect instance for tracking (optional)
   */
  public play(
    name: FXName,
    x: number,
    y: number,
    options?: {
      followTarget?: { x: number; y: number } | null;
      offsetX?: number;
      offsetY?: number;
    }
  ): ActiveFX | null {
    const config = getFXConfig(name);
    if (!config) {
      console.warn(`Unknown FX: ${name}`);
      return null;
    }

    if (!this.images.has(name)) {
      console.warn(`FX image not loaded: ${name}`);
      return null;
    }

    const effect: ActiveFX = {
      config,
      x,
      y,
      frameIndex: 0,
      frameTimer: 0,
      finished: false,
      followTarget: options?.followTarget ?? null,
      offsetX: options?.offsetX ?? 0,
      offsetY: options?.offsetY ?? 0,
    };

    this.activeEffects.push(effect);
    return effect;
  }

  /**
   * Play a looping effect that follows a target
   * Returns the effect for manual stopping
   */
  public playLooping(
    name: FXName,
    target: { x: number; y: number },
    offsetX: number = 0,
    offsetY: number = 0
  ): ActiveFX | null {
    return this.play(name, target.x, target.y, {
      followTarget: target,
      offsetX,
      offsetY,
    });
  }

  /**
   * Stop a specific effect
   */
  public stop(effect: ActiveFX): void {
    effect.finished = true;
  }

  /**
   * Stop all effects of a specific type
   */
  public stopAll(name: FXName): void {
    for (const effect of this.activeEffects) {
      if (effect.config.name === name) {
        effect.finished = true;
      }
    }
  }

  /**
   * Stop all active effects
   */
  public stopAllEffects(): void {
    for (const effect of this.activeEffects) {
      effect.finished = true;
    }
  }

  /**
   * Update all active effects
   * Call every frame with deltaTime in seconds
   */
  public update(deltaTime: number): void {
    for (const effect of this.activeEffects) {
      if (effect.finished) continue;

      const frameDuration = 1 / effect.config.frameRate;
      effect.frameTimer += deltaTime;

      while (effect.frameTimer >= frameDuration) {
        effect.frameTimer -= frameDuration;
        effect.frameIndex++;

        if (effect.frameIndex >= effect.config.frameCount) {
          if (effect.config.loop) {
            effect.frameIndex = 0;
          } else {
            effect.frameIndex = effect.config.frameCount - 1;
            effect.finished = true;
          }
        }
      }

      // Update position if following a target
      if (effect.followTarget) {
        effect.x = effect.followTarget.x;
        effect.y = effect.followTarget.y;
      }
    }

    // Remove finished non-looping effects
    this.activeEffects = this.activeEffects.filter(e => !e.finished || e.config.loop);
  }

  /**
   * Render all active effects
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const effect of this.activeEffects) {
      if (effect.finished) continue;

      const image = this.images.get(effect.config.name);
      if (!image) continue;

      const { config, frameIndex, x, y, offsetX, offsetY } = effect;

      // Source rectangle (frame from sprite sheet)
      const sx = frameIndex * config.frameWidth;
      const sy = 0;

      // Destination position (anchored)
      const dx = x + offsetX - config.displayWidth * config.anchorX;
      const dy = y + offsetY - config.displayHeight * config.anchorY;

      ctx.drawImage(
        image,
        sx, sy, config.frameWidth, config.frameHeight,
        dx, dy, config.displayWidth, config.displayHeight
      );
    }
  }

  /**
   * Check if any effect of a type is currently active
   */
  public isPlaying(name: FXName): boolean {
    return this.activeEffects.some(e => e.config.name === name && !e.finished);
  }

  /**
   * Check if FX system is ready
   */
  public isReady(): boolean {
    return this.ready;
  }

  /**
   * Get count of active effects (for debugging)
   */
  public getActiveCount(): number {
    return this.activeEffects.filter(e => !e.finished).length;
  }
}
```

**Step 2: Verify file syntax**

Run: `cd /home/deefunxion/projects/pixel-flick-frenzy && npx tsc --noEmit src/game/engine/fxAnimator.ts 2>&1 | head -20`
Expected: No errors (or only import-related warnings)

**Step 3: Commit**

```bash
git add src/game/engine/fxAnimator.ts
git commit -m "feat(fx): add FXAnimator class for sprite-based effects"
```

---

## Task 3: Add FX Animator to Game State

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`

**Step 1: Add fxAnimator to GameState type**

In `src/game/engine/types.ts`, add import and property:

```typescript
// Add to imports at top
import type { FXAnimator } from './fxAnimator';

// Add to GameState interface (after zenoAnimator)
  // Sprite-based special effects
  fxAnimator: FXAnimator | null;
```

**Step 2: Initialize fxAnimator in state.ts**

In `src/game/engine/state.ts`, find `createInitialState()` and add:

```typescript
  // Add to the returned state object
  fxAnimator: null,
```

**Step 3: Verify no type errors**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds or only unrelated warnings

**Step 4: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat(fx): add fxAnimator to game state"
```

---

## Task 4: Integrate FX Loading in Game.tsx

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Import FX modules**

Add to imports:

```typescript
import { FXAnimator } from '@/game/engine/fxAnimator';
import { getAllFXPaths } from '@/game/engine/fxConfig';
```

**Step 2: Add FX paths to preloading**

Find the asset preloading section and add FX paths:

```typescript
// In the useEffect where assets are preloaded, add:
const fxPaths = getAllFXPaths(currentTheme);
await assetLoader.preloadAll([...existingPaths, ...fxPaths]);
```

**Step 3: Initialize FXAnimator after loading**

After the animator initialization:

```typescript
// Initialize FX animator
const fxAnimator = new FXAnimator(currentTheme);
fxAnimator.initialize();
state.fxAnimator = fxAnimator;
```

**Step 4: Update FX animator on theme change**

In theme change handler:

```typescript
if (state.fxAnimator) {
  state.fxAnimator.setTheme(newTheme);
}
```

**Step 5: Update FX animator in game loop**

In the game loop, add:

```typescript
// Update FX animations
if (state.fxAnimator) {
  state.fxAnimator.update(1 / 60);
}
```

**Step 6: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat(fx): integrate FX loading and updating in Game.tsx"
```

---

## Task 5: Add FX Rendering to render.ts

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add FX rendering in flipbook renderer**

Find the TODO comment `// TODO: Replace with sprite-based trail effects` and replace with:

```typescript
  // Render sprite-based FX effects
  if (state.fxAnimator && state.fxAnimator.isReady()) {
    state.fxAnimator.render(ctx);
  }
```

**Step 2: Add same rendering in noir renderer**

Find the same TODO in noir section and add the same code.

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(fx): add FX rendering to both theme renderers"
```

---

## Task 6: Trigger Charging Effects

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Import FX types**

```typescript
import type { FXName } from './fxConfig';
```

**Step 2: Trigger charge effects when charging starts**

Find where `state.charging = true` is set and add:

```typescript
// Start charging FX
if (state.fxAnimator && !state.fxAnimator.isPlaying('chargeSwirl')) {
  const zenoPos = { x: state.px, y: state.py };
  state.fxAnimator.playLooping('chargeSwirl', zenoPos, 0, -10);
  state.fxAnimator.playLooping('chargeDust', zenoPos, 0, 20);
}
```

**Step 3: Stop charge effects when charging ends**

When charging ends (launch or cancel):

```typescript
// Stop charging FX
if (state.fxAnimator) {
  state.fxAnimator.stopAll('chargeSwirl');
  state.fxAnimator.stopAll('chargeDust');
}
```

**Step 4: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(fx): trigger charging effects (swirl + dust)"
```

---

## Task 7: Trigger Launch Effects

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Trigger launch effects at launch moment**

Find where the launch happens (`state.flying = true`) and add:

```typescript
// Play launch FX
if (state.fxAnimator) {
  state.fxAnimator.play('launchBurst', state.px, state.py);
  state.fxAnimator.play('launchSparks', state.px - 20, state.py);
}
```

**Step 2: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(fx): trigger launch effects (burst + sparks)"
```

---

## Task 8: Trigger Flight Effects

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Add speed lines during high-speed flight**

In the flying update section, add:

```typescript
// Speed lines at high velocity
if (state.flying && state.fxAnimator) {
  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

  if (speed > 6 && !state.fxAnimator.isPlaying('speedLines')) {
    const zenoPos = { x: state.px, y: state.py };
    state.fxAnimator.playLooping('speedLines', zenoPos, -30, 0);
  } else if (speed <= 6) {
    state.fxAnimator.stopAll('speedLines');
  }

  // Whoosh marks at very high speed
  if (speed > 8 && !state.fxAnimator.isPlaying('whoosh')) {
    const zenoPos = { x: state.px, y: state.py };
    state.fxAnimator.playLooping('whoosh', zenoPos, 0, 0);
  } else if (speed <= 8) {
    state.fxAnimator.stopAll('whoosh');
  }
}
```

**Step 2: Stop flight effects when landing/stopping**

When flight ends:

```typescript
if (state.fxAnimator) {
  state.fxAnimator.stopAll('speedLines');
  state.fxAnimator.stopAll('whoosh');
}
```

**Step 3: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(fx): trigger flight effects (speed lines + whoosh)"
```

---

## Task 9: Trigger Landing Effects

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Trigger landing effects on ground impact**

Find where landing is detected (`state.py >= H - 20`) and add:

```typescript
// Play landing FX
if (state.fxAnimator) {
  const groundY = H - 20;
  state.fxAnimator.play('impactBurst', state.px, groundY);
  state.fxAnimator.play('landingDust', state.px, groundY);
  state.fxAnimator.play('groundCracks', state.px, groundY);
  state.fxAnimator.play('impactDebris', state.px, groundY - 10);
}
```

**Step 2: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(fx): trigger landing effects (impact, dust, cracks, debris)"
```

---

## Task 10: Trigger Failure Effects

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Trigger fall effects when falling off cliff**

Find where `state.fellOff = true` is set and add:

```typescript
// Play failure FX
if (state.fxAnimator) {
  const zenoPos = { x: state.px, y: state.py };
  state.fxAnimator.playLooping('fallSwirl', zenoPos, 0, 0);
  state.fxAnimator.playLooping('panicMarks', zenoPos, 0, -30);
}
```

**Step 2: Stop failure effects on reset**

In reset function:

```typescript
if (state.fxAnimator) {
  state.fxAnimator.stopAllEffects();
}
```

**Step 3: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(fx): trigger failure effects (fall swirl + panic marks)"
```

---

## Task 11: Add Star Sparkle to Record Marker

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Replace procedural star with sparkle effect**

Find the Zeno target marker section and modify to use starSparkle:

```typescript
// Zeno target marker - animated star sparkle
if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
  const targetX = Math.floor(state.zenoTarget);

  // Vertical dashed line to ground
  ctx.strokeStyle = COLORS.highlight;
  ctx.lineWidth = LINE_WEIGHTS.secondary;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(targetX, groundY);
  ctx.lineTo(targetX, groundY - 35);
  ctx.stroke();
  ctx.setLineDash([]);

  // Play star sparkle if not already playing
  if (state.fxAnimator && !state.fxAnimator.isPlaying('starSparkle')) {
    state.fxAnimator.playLooping('starSparkle', { x: targetX, y: groundY - 35 }, 0, 0);
  }
}
```

**Step 2: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(fx): add star sparkle effect to record marker"
```

---

## Task 12: Final Testing & Cleanup

**Files:**
- All modified files

**Step 1: Run build to check for errors**

Run: `npm run build`
Expected: Build succeeds

**Step 2: Run dev server and test each effect**

Run: `npm run dev`

Test checklist:
- [ ] Charging: swirl + dust appear around Zeno
- [ ] Launch: burst + sparks at launch point
- [ ] Flight: speed lines at high speed, whoosh at very high speed
- [ ] Landing: impact burst + dust + cracks + debris
- [ ] Failure: swirl + panic marks when falling off
- [ ] Star sparkle: animated at target marker

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(fx): complete special FX integration

- Add fxConfig.ts with all effect definitions
- Add FXAnimator class for sprite-based effects
- Integrate FX loading in Game.tsx
- Add FX rendering to both theme renderers
- Trigger effects: charging, launch, flight, landing, failure
- Add star sparkle to record marker"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | FX Config | `fxConfig.ts` (create) |
| 2 | FXAnimator Class | `fxAnimator.ts` (create) |
| 3 | Game State | `types.ts`, `state.ts` (modify) |
| 4 | Game.tsx Integration | `Game.tsx` (modify) |
| 5 | Render Integration | `render.ts` (modify) |
| 6 | Charging Effects | `update.ts` (modify) |
| 7 | Launch Effects | `update.ts` (modify) |
| 8 | Flight Effects | `update.ts` (modify) |
| 9 | Landing Effects | `update.ts` (modify) |
| 10 | Failure Effects | `update.ts` (modify) |
| 11 | Star Sparkle | `render.ts` (modify) |
| 12 | Testing | All files |

**Total estimated tasks:** 12 tasks, ~45-60 minutes
