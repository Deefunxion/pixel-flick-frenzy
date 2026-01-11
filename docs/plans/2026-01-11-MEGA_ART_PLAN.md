# MEGA ART PLAN: Hybrid Sprite System Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Zeno from procedural stick figure to hand-drawn sprite-based character while keeping procedural backgrounds.

**Architecture:** Hybrid rendering model - sprites for character (AssetLoader → Sprite → Animator), procedural for everything else. All changes are additive with procedural fallback.

**Tech Stack:** Canvas 2D API, PNG sprite sheets, TypeScript classes (AssetLoader, Sprite, Animator)

---

## Reference Image

The target art style is the **simplified stick figure** from `flipbook-01-the-coil.png`:
- Blue ballpoint pen aesthetic (Flipbook) / Off-white ink (Noir)
- Expressive angry face with furrowed brows
- Dynamic poses with personality
- Hand-drawn wobble/imperfection in lines
- ~40-50px character height at game scale

---

## Art Asset Specifications

### Sprite Sheet Format

**Frame Size:** 128x128 pixels (allows detail, scales down cleanly to ~50px in-game)
**Layout:** Horizontal strip, one row per animation
**Format:** PNG with transparent background

### Required Frames Per Theme

| Animation | Frames | FPS | Duration | Loop | Description |
|-----------|--------|-----|----------|------|-------------|
| **idle** | 4 | 8 | 0.5s | Yes | Subtle breathing/bounce, anticipation |
| **coil** | 6 | 12 | 0.5s | No | Deep crouch wind-up, power charging |
| **bolt** | 3 | 12 | 0.25s | Yes | Superman flight pose, slight variation |
| **impact** | 5 | 15 | 0.33s | No | Three-point superhero landing |
| **fail** | 4 | 10 | 0.4s | No | Tumble/fall animation |

**Total per theme:** 22 frames
**Total for both themes:** 44 frames

### Sprite Sheet Dimensions

Each theme needs one sprite sheet:
- `zeno-flipbook.png`: 2816 x 128 px (22 frames × 128px)
- `zeno-noir.png`: 2816 x 128 px (22 frames × 128px)

Alternative (grid layout):
- 6 columns × 4 rows = 768 x 512 px (easier to manage)

### Frame Descriptions

#### Idle Animation (4 frames)
1. **idle-0:** Standing straight, neutral face
2. **idle-1:** Slight knee bend, determined expression
3. **idle-2:** Standing straight, blink
4. **idle-3:** Slight lean forward, ready stance

#### Coil Animation (6 frames) - The Wind-Up
1. **coil-0:** Starting stance, weight shifting back
2. **coil-1:** Knee bending, arms pulling back
3. **coil-2:** Deep crouch, back leg extended (REFERENCE POSE)
4. **coil-3:** Maximum compression, energy swirls visible
5. **coil-4:** Explosive extension beginning
6. **coil-5:** Launch position, both feet leaving ground

#### Bolt Animation (3 frames) - Mid-Air Flight
1. **bolt-0:** Superman pose, arms forward, body horizontal
2. **bolt-1:** Slight variation, cape/limb flutter
3. **bolt-2:** Arms slightly different angle

#### Impact Animation (5 frames) - The Landing
1. **impact-0:** Feet touching down, body high
2. **impact-1:** Knees bending, absorbing force
3. **impact-2:** Three-point landing position
4. **impact-3:** Maximum crouch, ground cracks emanating
5. **impact-4:** Rising from landing, triumphant

#### Fail Animation (4 frames)
1. **fail-0:** Loss of control, arms flailing
2. **fail-1:** Tumbling rotation
3. **fail-2:** Upside down
4. **fail-3:** Splat position

---

## File Structure

```
src/game/engine/
├── assets.ts          (NEW - ~70 lines)
├── sprite.ts          (NEW - ~90 lines)
├── animator.ts        (NEW - ~160 lines)
├── spriteConfig.ts    (NEW - ~120 lines)
├── types.ts           (MODIFY - add Animator type)
├── render.ts          (MODIFY - integrate sprite rendering)
└── update.ts          (MODIFY - update animator each frame)

public/assets/sprites/
├── zeno-flipbook.png  (NEW - sprite sheet)
└── zeno-noir.png      (NEW - sprite sheet)
```

---

## Sprint 1: Foundation - Asset Loading & Sprite Class

**Goal:** Create core classes for loading images and drawing static sprites.

### Task 1.1: Create AssetLoader Class

**Files:**
- Create: `src/game/engine/assets.ts`

**Step 1: Write the AssetLoader implementation**

```typescript
// src/game/engine/assets.ts

/**
 * AssetLoader - Manages loading and caching of image assets
 * Used to preload sprite sheets before game starts
 */
export class AssetLoader {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Load a single image and cache it.
   * Returns cached image if already loaded.
   * Returns existing promise if currently loading.
   */
  public loadImage(path: string): Promise<HTMLImageElement> {
    // Return cached image immediately
    if (this.imageCache.has(path)) {
      return Promise.resolve(this.imageCache.get(path)!);
    }

    // Return existing loading promise to avoid duplicate loads
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Create new loading promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.imageCache.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(path);
        reject(new Error(`Failed to load image: ${path}`));
      };

      img.src = path;
    });

    this.loadingPromises.set(path, promise);
    return promise;
  }

  /**
   * Get a previously loaded image from cache.
   * Returns null if not loaded (use loadImage first).
   */
  public getImage(path: string): HTMLImageElement | null {
    return this.imageCache.get(path) || null;
  }

  /**
   * Preload multiple images in parallel.
   * Use this at game startup.
   */
  public async preloadAll(paths: string[]): Promise<void> {
    await Promise.all(paths.map(path => this.loadImage(path)));
  }

  /**
   * Check if an image is already loaded.
   */
  public isLoaded(path: string): boolean {
    return this.imageCache.has(path);
  }
}

// Singleton instance for global access
export const assetLoader = new AssetLoader();
```

**Step 2: Verify file created**

Run: `ls -la src/game/engine/assets.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add src/game/engine/assets.ts
git commit -m "feat(engine): add AssetLoader class for sprite sheet loading"
```

---

### Task 1.2: Create Sprite Class

**Files:**
- Create: `src/game/engine/sprite.ts`

**Step 1: Write the Sprite implementation**

```typescript
// src/game/engine/sprite.ts

/**
 * Sprite - Represents a single frame from a sprite sheet
 * Handles drawing a rectangular region of an image to the canvas
 */
export class Sprite {
  private image: HTMLImageElement;
  private sx: number;  // Source X on sprite sheet
  private sy: number;  // Source Y on sprite sheet
  private sw: number;  // Source width
  private sh: number;  // Source height

  constructor(
    image: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number
  ) {
    this.image = image;
    this.sx = sx;
    this.sy = sy;
    this.sw = sw;
    this.sh = sh;
  }

  /**
   * Draw the sprite to the canvas.
   * Position is centered (dx, dy is the center point).
   *
   * @param ctx - Canvas rendering context
   * @param dx - Destination X (center)
   * @param dy - Destination Y (center)
   * @param dw - Destination width (optional, defaults to source width)
   * @param dh - Destination height (optional, defaults to source height)
   * @param flipH - Flip horizontally (for facing left/right)
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number = this.sw,
    dh: number = this.sh,
    flipH: boolean = false
  ): void {
    ctx.save();

    if (flipH) {
      // Flip horizontally around the center point
      ctx.translate(dx, dy);
      ctx.scale(-1, 1);
      ctx.translate(-dx, -dy);
    }

    // Draw centered on (dx, dy)
    ctx.drawImage(
      this.image,
      this.sx, this.sy, this.sw, this.sh,  // Source rectangle
      dx - dw / 2, dy - dh / 2, dw, dh      // Destination rectangle (centered)
    );

    ctx.restore();
  }

  /**
   * Get the source dimensions of this sprite frame.
   */
  public getSize(): { width: number; height: number } {
    return { width: this.sw, height: this.sh };
  }
}
```

**Step 2: Verify file created**

Run: `ls -la src/game/engine/sprite.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add src/game/engine/sprite.ts
git commit -m "feat(engine): add Sprite class for drawing sprite sheet frames"
```

---

### Task 1.3: Create Sprite Configuration

**Files:**
- Create: `src/game/engine/spriteConfig.ts`

**Step 1: Write the configuration**

```typescript
// src/game/engine/spriteConfig.ts

/**
 * Sprite sheet configuration for Zeno character
 * Defines paths, frame sizes, and animation metadata
 */

// Frame size in the sprite sheet (pixels)
export const FRAME_WIDTH = 128;
export const FRAME_HEIGHT = 128;

// In-game display size (scales down from frame size)
export const ZENO_DISPLAY_WIDTH = 50;
export const ZENO_DISPLAY_HEIGHT = 50;

// Sprite sheet paths
export const SPRITE_SHEETS = {
  flipbook: '/assets/sprites/zeno-flipbook.png',
  noir: '/assets/sprites/zeno-noir.png',
} as const;

// Animation types
export type AnimationName = 'idle' | 'coil' | 'bolt' | 'impact' | 'fail';

// Animation configuration
export interface AnimationConfig {
  name: AnimationName;
  frames: number[];      // Frame indices in the sprite sheet
  frameRate: number;     // Frames per second
  loop: boolean;         // Whether to loop or stop on last frame
}

// Frame layout: horizontal strip, frames 0-21
// Row 0 (y=0): idle (0-3), coil (4-9)
// Row 1 (y=128): bolt (10-12), impact (13-17), fail (18-21)

export const ANIMATIONS: AnimationConfig[] = [
  {
    name: 'idle',
    frames: [0, 1, 2, 3],
    frameRate: 8,
    loop: true,
  },
  {
    name: 'coil',
    frames: [4, 5, 6, 7, 8, 9],
    frameRate: 12,
    loop: false,
  },
  {
    name: 'bolt',
    frames: [10, 11, 12],
    frameRate: 12,
    loop: true,
  },
  {
    name: 'impact',
    frames: [13, 14, 15, 16, 17],
    frameRate: 15,
    loop: false,
  },
  {
    name: 'fail',
    frames: [18, 19, 20, 21],
    frameRate: 10,
    loop: false,
  },
];

/**
 * Get the source rectangle for a frame index.
 * Assumes grid layout: 6 columns, frames arranged left-to-right, top-to-bottom.
 */
export function getFrameRect(frameIndex: number): { x: number; y: number; w: number; h: number } {
  const COLUMNS = 6;
  const col = frameIndex % COLUMNS;
  const row = Math.floor(frameIndex / COLUMNS);

  return {
    x: col * FRAME_WIDTH,
    y: row * FRAME_HEIGHT,
    w: FRAME_WIDTH,
    h: FRAME_HEIGHT,
  };
}

/**
 * Get animation config by name.
 */
export function getAnimationConfig(name: AnimationName): AnimationConfig | undefined {
  return ANIMATIONS.find(a => a.name === name);
}
```

**Step 2: Verify file created**

Run: `ls -la src/game/engine/spriteConfig.ts`
Expected: File exists

**Step 3: Commit**

```bash
git add src/game/engine/spriteConfig.ts
git commit -m "feat(engine): add sprite configuration for Zeno animations"
```

---

### Task 1.4: Create Placeholder Sprite Sheet

**Files:**
- Create: `public/assets/sprites/` directory
- Create: Placeholder image for testing

**Step 1: Create directory**

```bash
mkdir -p public/assets/sprites
```

**Step 2: Create a simple test image (or use placeholder)**

For testing, we can create a colored rectangle placeholder or wait for the actual art.
The system will gracefully fallback to procedural rendering if sprites aren't loaded.

**Step 3: Commit directory**

```bash
git add public/assets/sprites/.gitkeep
git commit -m "feat(assets): add sprites directory structure"
```

---

### Task 1.5: Test Static Sprite Loading (Manual Verification)

At this point, we have the foundation classes. Before moving on:

1. The AssetLoader can load any PNG
2. The Sprite class can draw a region of an image
3. The config defines our animation structure

**Verification Checklist:**
- [ ] `assets.ts` exports `AssetLoader` class and `assetLoader` singleton
- [ ] `sprite.ts` exports `Sprite` class with `draw()` method
- [ ] `spriteConfig.ts` exports all configuration constants
- [ ] No TypeScript errors: `npm run lint`

---

## Sprint 2: Animation System - The Animator Class

**Goal:** Implement frame-by-frame animation playback with state-driven switching.

### Task 2.1: Create Animator Class

**Files:**
- Create: `src/game/engine/animator.ts`

**Step 1: Write the Animator implementation**

```typescript
// src/game/engine/animator.ts

import { Sprite } from './sprite';
import {
  AnimationName,
  AnimationConfig,
  ANIMATIONS,
  SPRITE_SHEETS,
  FRAME_WIDTH,
  FRAME_HEIGHT,
  ZENO_DISPLAY_WIDTH,
  ZENO_DISPLAY_HEIGHT,
  getFrameRect,
} from './spriteConfig';
import { assetLoader } from './assets';

/**
 * Animator - Manages sprite animation playback for a character
 * Handles frame timing, animation switching, and rendering
 */
export class Animator {
  private sprites: Map<AnimationName, Sprite[]> = new Map();
  private animationConfigs: Map<AnimationName, AnimationConfig> = new Map();

  public currentAnimation: AnimationName = 'idle';
  private currentFrameIndex: number = 0;
  private frameTimer: number = 0;
  private isPlaying: boolean = true;
  private finished: boolean = false;

  // Theme for sprite sheet selection
  private theme: 'flipbook' | 'noir' = 'flipbook';
  private image: HTMLImageElement | null = null;

  constructor(theme: 'flipbook' | 'noir' = 'flipbook') {
    this.theme = theme;

    // Store animation configs for quick lookup
    for (const config of ANIMATIONS) {
      this.animationConfigs.set(config.name, config);
    }
  }

  /**
   * Initialize the animator with the sprite sheet.
   * Must be called after asset loading is complete.
   */
  public initialize(): boolean {
    const path = SPRITE_SHEETS[this.theme];
    const image = assetLoader.getImage(path);

    if (!image) {
      console.warn(`Sprite sheet not loaded: ${path}`);
      return false;
    }

    this.image = image;

    // Create Sprite objects for each frame of each animation
    for (const config of ANIMATIONS) {
      const sprites: Sprite[] = [];

      for (const frameIndex of config.frames) {
        const rect = getFrameRect(frameIndex);
        sprites.push(new Sprite(image, rect.x, rect.y, rect.w, rect.h));
      }

      this.sprites.set(config.name, sprites);
    }

    return true;
  }

  /**
   * Switch to a different theme's sprite sheet.
   */
  public setTheme(theme: 'flipbook' | 'noir'): void {
    if (this.theme === theme) return;

    this.theme = theme;
    this.sprites.clear();
    this.initialize();
  }

  /**
   * Play an animation by name.
   * If already playing the same animation, does nothing (unless force=true).
   */
  public play(name: AnimationName, force: boolean = false): void {
    if (this.currentAnimation === name && !force && !this.finished) {
      return;
    }

    if (!this.animationConfigs.has(name)) {
      console.warn(`Unknown animation: ${name}`);
      return;
    }

    this.currentAnimation = name;
    this.currentFrameIndex = 0;
    this.frameTimer = 0;
    this.finished = false;
    this.isPlaying = true;
  }

  /**
   * Update animation timing.
   * Call this every frame with deltaTime in seconds.
   */
  public update(deltaTime: number): void {
    if (!this.isPlaying || this.finished) return;

    const config = this.animationConfigs.get(this.currentAnimation);
    if (!config) return;

    const frameDuration = 1 / config.frameRate;
    this.frameTimer += deltaTime;

    // Advance frames based on elapsed time
    while (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrameIndex++;

      // Handle end of animation
      if (this.currentFrameIndex >= config.frames.length) {
        if (config.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = config.frames.length - 1;
          this.finished = true;
        }
      }
    }
  }

  /**
   * Draw the current animation frame.
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    flipH: boolean = false
  ): void {
    const sprites = this.sprites.get(this.currentAnimation);
    if (!sprites || sprites.length === 0) return;

    const sprite = sprites[this.currentFrameIndex];
    if (!sprite) return;

    sprite.draw(ctx, x, y, ZENO_DISPLAY_WIDTH, ZENO_DISPLAY_HEIGHT, flipH);
  }

  /**
   * Check if the current animation has finished (for non-looping animations).
   */
  public isFinished(): boolean {
    return this.finished;
  }

  /**
   * Get the current frame index (useful for syncing effects).
   */
  public getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  /**
   * Check if sprites are loaded and ready.
   */
  public isReady(): boolean {
    return this.image !== null && this.sprites.size > 0;
  }
}
```

**Step 2: Verify file created**

Run: `ls -la src/game/engine/animator.ts`
Expected: File exists

**Step 3: Run lint check**

Run: `npm run lint`
Expected: No errors in new files

**Step 4: Commit**

```bash
git add src/game/engine/animator.ts
git commit -m "feat(engine): add Animator class for frame-by-frame animation"
```

---

### Task 2.2: Add Animator to GameState

**Files:**
- Modify: `src/game/engine/types.ts`

**Step 1: Import Animator type**

Add at the top of `types.ts`:

```typescript
import type { Animator } from './animator';
```

**Step 2: Add zenoAnimator field to GameState**

Add to the GameState interface (after `particleSystem`):

```typescript
  // Sprite-based character animation
  zenoAnimator: Animator | null;
```

**Step 3: Verify changes**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add src/game/engine/types.ts
git commit -m "feat(types): add zenoAnimator to GameState interface"
```

---

### Task 2.3: Initialize Animator in State

**Files:**
- Modify: `src/game/engine/state.ts`

**Step 1: Find the createInitialState function and add**

```typescript
zenoAnimator: null,
```

to the initial state object (alongside other null/default values).

**Step 2: Commit**

```bash
git add src/game/engine/state.ts
git commit -m "feat(state): initialize zenoAnimator as null in initial state"
```

---

## Sprint 3: Full Integration - Render Pipeline

**Goal:** Connect the animation system to the rendering pipeline with state-driven animation switching.

### Task 3.1: Create Animation State Controller

**Files:**
- Create: `src/game/engine/animationController.ts`

**Step 1: Write the controller logic**

```typescript
// src/game/engine/animationController.ts

import type { GameState } from './types';
import type { AnimationName } from './spriteConfig';

/**
 * Determines which animation should play based on game state.
 * This centralizes the animation selection logic.
 */
export function getDesiredAnimation(state: GameState): AnimationName {
  // Priority order: failure > charging > flying > landing > idle

  if (state.failureAnimating) {
    return 'fail';
  }

  if (state.charging) {
    return 'coil';
  }

  if (state.flying || state.sliding) {
    return 'bolt';
  }

  if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
    return 'impact';
  }

  return 'idle';
}

/**
 * Update the animator based on current game state.
 * Call this in the update loop.
 */
export function updateAnimator(state: GameState, deltaTime: number): void {
  if (!state.zenoAnimator || !state.zenoAnimator.isReady()) return;

  // Determine desired animation
  const desiredAnim = getDesiredAnimation(state);

  // Switch animation if needed
  if (state.zenoAnimator.currentAnimation !== desiredAnim) {
    state.zenoAnimator.play(desiredAnim);
  }

  // Update animation timing
  state.zenoAnimator.update(deltaTime);
}
```

**Step 2: Commit**

```bash
git add src/game/engine/animationController.ts
git commit -m "feat(engine): add animation controller for state-driven animation"
```

---

### Task 3.2: Integrate Sprite Rendering into render.ts

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add imports at the top**

```typescript
import { ZENO_DISPLAY_WIDTH, ZENO_DISPLAY_HEIGHT } from './spriteConfig';
```

**Step 2: Create a helper function for sprite rendering**

Add this function before `renderFlipbookFrame`:

```typescript
/**
 * Draw Zeno using sprite animation if available, otherwise fall back to procedural.
 * Returns true if sprite was drawn, false if fallback is needed.
 */
function drawZenoSprite(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number
): boolean {
  if (!state.zenoAnimator || !state.zenoAnimator.isReady()) {
    return false;
  }

  // Determine if we need to flip based on velocity
  const flipH = state.vx < -0.5;

  state.zenoAnimator.draw(ctx, x, y, flipH);
  return true;
}
```

**Step 3: Modify player rendering in renderFlipbookFrame**

Find the player rendering section (around line 309-336) and wrap it:

```typescript
  // Player rendering - prefer sprites, fallback to procedural
  const spriteDrawn = drawZenoSprite(ctx, state, state.px, state.py);

  if (!spriteDrawn) {
    // Fallback to procedural rendering
    const playerColor = state.fellOff ? COLORS.danger : COLORS.player;

    if (state.failureAnimating && state.failureType && (state.failureType === 'tumble' || state.failureType === 'dive')) {
      drawFailingStickFigure(ctx, state.px, state.py, playerColor, nowMs, state.failureType, state.failureFrame);
    } else if (state.charging) {
      drawZenoCoil(ctx, state.px, state.py, playerColor, nowMs, state.chargePower, 'flipbook');
    } else if (state.flying && !state.failureAnimating) {
      drawZenoBolt(ctx, state.px, state.py, playerColor, nowMs, { vx: state.vx, vy: state.vy }, 'flipbook');
    } else if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
      drawZenoImpact(ctx, state.px, state.py, playerColor, nowMs, state.landingFrame, 'flipbook');
    } else {
      drawStickFigure(ctx, state.px, state.py, playerColor, nowMs, playerState, state.angle, { vx: state.vx, vy: state.vy }, state.chargePower);
    }
  }
```

**Step 4: Apply same change to renderNoirFrame**

Do the same modification in `renderNoirFrame` (around line 880-899).

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(render): integrate sprite rendering with procedural fallback"
```

---

### Task 3.3: Update Animation in Game Loop

**Files:**
- Modify: `src/game/engine/update.ts` or the main update function

**Step 1: Import the animation controller**

```typescript
import { updateAnimator } from './animationController';
```

**Step 2: Call updateAnimator in the update loop**

Add at the end of the update function:

```typescript
  // Update sprite animation
  updateAnimator(state, deltaTime);
```

Note: `deltaTime` should be in seconds. If using milliseconds, divide by 1000.

**Step 3: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(update): integrate animation updates into game loop"
```

---

### Task 3.4: Initialize Sprites on Game Load

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Import required modules**

```typescript
import { assetLoader } from '@/game/engine/assets';
import { Animator } from '@/game/engine/animator';
import { SPRITE_SHEETS } from '@/game/engine/spriteConfig';
```

**Step 2: Add sprite loading in useEffect**

In the main game initialization useEffect, add:

```typescript
// Preload sprite sheets
const loadSprites = async () => {
  try {
    await assetLoader.preloadAll(Object.values(SPRITE_SHEETS));

    // Create animator based on current theme
    const theme = currentTheme === 'noir' ? 'noir' : 'flipbook';
    const animator = new Animator(theme);

    if (animator.initialize()) {
      animator.play('idle');
      gameState.current.zenoAnimator = animator;
    }
  } catch (error) {
    console.warn('Sprite loading failed, using procedural fallback:', error);
  }
};

loadSprites();
```

**Step 3: Handle theme switching**

When theme changes, update the animator:

```typescript
if (gameState.current.zenoAnimator) {
  gameState.current.zenoAnimator.setTheme(newTheme === 'noir' ? 'noir' : 'flipbook');
}
```

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat(game): initialize sprite system on game load"
```

---

## Sprint 4: Polish & Testing

**Goal:** Ensure everything works smoothly, handle edge cases, and verify theme switching.

### Task 4.1: Add Loading State Handling

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Add loading state**

```typescript
const [spritesLoaded, setSpritesLoaded] = useState(false);
```

**Step 2: Update load function**

```typescript
loadSprites().then(() => setSpritesLoaded(true));
```

**Step 3: Optionally show loading indicator**

The game should still work without sprites (procedural fallback), but you could show a subtle loading indicator.

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat(game): add sprite loading state for better UX"
```

---

### Task 4.2: Test All Animation Transitions

**Manual Testing Checklist:**

- [ ] **Idle → Coil:** Click/tap to start charging
- [ ] **Coil animation:** Power bar fills, animation plays
- [ ] **Coil → Bolt:** Release to launch
- [ ] **Bolt animation:** Flying through air
- [ ] **Bolt → Impact:** Land on platform
- [ ] **Impact animation:** Three-point landing plays
- [ ] **Impact → Idle:** After landing, returns to idle
- [ ] **Any → Fail:** Fall off edge triggers fail animation
- [ ] **Theme switch:** Flipbook ↔ Noir switches sprite sheets

---

### Task 4.3: Performance Verification

**Step 1: Check FPS in DevTools**

- Open game in browser
- Open DevTools Performance tab
- Record 10 seconds of gameplay
- Verify consistent 60fps

**Step 2: Check memory usage**

- Open DevTools Memory tab
- Take heap snapshot before and after loading sprites
- Verify sprite sheets add < 5MB memory

---

### Task 4.4: Final Commit and Tag

```bash
git add -A
git commit -m "feat: complete hybrid sprite system implementation

- Added AssetLoader for sprite sheet management
- Added Sprite class for frame rendering
- Added Animator for animation playback
- Added animation controller for state-driven switching
- Integrated into render pipeline with procedural fallback
- Supports Flipbook and Noir themes
- Fully backwards compatible"

git tag v2.0.0-sprites
```

---

## Post-Implementation: Adding New Art

Once the system is in place, adding new art is simple:

### Creating a Sprite Sheet

1. **Open your art tool** (Photoshop, Aseprite, Procreate, etc.)

2. **Create canvas:** 768 x 512 pixels (6 columns × 4 rows of 128x128 frames)

3. **Draw frames in order:**
   - Row 0: idle-0, idle-1, idle-2, idle-3, coil-0, coil-1
   - Row 1: coil-2, coil-3, coil-4, coil-5, bolt-0, bolt-1
   - Row 2: bolt-2, impact-0, impact-1, impact-2, impact-3, impact-4
   - Row 3: fail-0, fail-1, fail-2, fail-3, (empty), (empty)

4. **Export as PNG** with transparency

5. **Save to:** `public/assets/sprites/zeno-flipbook.png` or `zeno-noir.png`

6. **Refresh game** - new sprites load automatically!

### Style Guide for Stick Figure

Reference: The "Coil" pose in `flipbook-01-the-coil.png`

- **Line weight:** 3-4px for main body, 2px for details
- **Head:** Circle, ~15px diameter
- **Face:** Angry/determined expression (furrowed brows, gritted teeth)
- **Body:** Simple lines, dynamic poses
- **Colors:**
  - Flipbook: Blue (#1a4a7a) on cream
  - Noir: Off-white (#e8e4e0) on dark

---

## Appendix: Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `src/game/engine/assets.ts` | Image loading and caching |
| `src/game/engine/sprite.ts` | Single sprite frame drawing |
| `src/game/engine/animator.ts` | Animation playback |
| `src/game/engine/spriteConfig.ts` | Frame layout and timing |
| `src/game/engine/animationController.ts` | State → animation mapping |
| `public/assets/sprites/*.png` | Sprite sheet images |

### Animation Mapping

| Game State | Animation |
|------------|-----------|
| `failureAnimating` | `fail` |
| `charging` | `coil` |
| `flying` or `sliding` | `bolt` |
| `landingFrame > 0` | `impact` |
| default | `idle` |

### Commands

```bash
npm run dev      # Start development server
npm run lint     # Check for errors
npm run build    # Production build
```

---

**Plan complete and saved.**
