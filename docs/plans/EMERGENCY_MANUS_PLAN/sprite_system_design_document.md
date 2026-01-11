# Sprite System Design Document

## 1. Overview

This document outlines the design of a lightweight, efficient sprite animation system for the One-More-Flick game engine. The system will enable the rendering of pre-drawn, frame-by-frame animations for the main character (Zeno) and other key visual effects, replacing the current procedural drawing methods for these elements.

**Core Principles:**
- **Simplicity:** The system should be easy to understand, implement, and use.
- **Performance:** It must be fast enough for real-time games, with minimal memory overhead.
- **Extensibility:** It should be easy to add new sprites and animations.
- **Decoupling:** The sprite system should be independent of the game logic.

## 2. System Architecture

The sprite system consists of four main components:

1.  **AssetLoader:** A utility class responsible for loading and caching image assets (sprite sheets).
2.  **Sprite:** A class representing a single, static frame from a sprite sheet.
3.  **Animator:** A class that manages a collection of animations and controls the playback of sprite sequences.
4.  **SpriteConfig:** A configuration file that defines the layout and metadata of the sprite sheets.

### 2.1. Component Diagram

```mermaid
graph TD
    A[Game.tsx] --> B(AssetLoader)
    B --> C{Sprite Sheets (PNG)}
    A --> D(SpriteConfig)
    A --> E(Animator)
    E --> F(Sprite)
    F --> C

    subgraph Initialization
        A
        B
        C
        D
    end

    subgraph Game Loop
        G[update.ts] --> E
        H[render.ts] --> E
    end
```

### 2.2. Data Flow

1.  **Initialization:**
    - `Game.tsx` creates an `AssetLoader` instance.
    - The `AssetLoader` loads the sprite sheet PNGs defined in `SpriteConfig`.
    - `Game.tsx` uses `SpriteConfig` to create `Sprite` objects for each frame.
    - `Sprite` objects are grouped into animations (e.g., 'idle', 'coil').
    - An `Animator` instance is created with these animations and added to the `GameState`.

2.  **Game Loop (Update):**
    - `update.ts` calls `animator.update(deltaTime)` to advance the current animation frame based on elapsed time.

3.  **Game Loop (Render):**
    - `render.ts` calls `animator.draw(ctx, x, y)` to render the current sprite frame at the character's position.
    - Game logic in `render.ts` (or `update.ts`) can call `animator.play('animationName')` to switch between animations based on the character's state (e.g., charging, flying).

## 3. Class & Interface Definitions

### 3.1. `AssetLoader`

**File:** `src/game/engine/assets.ts`

**Purpose:** Manages the loading and caching of all game assets, primarily images.

```typescript
export class AssetLoader {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private promises: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Loads a single image and caches it.
   * If the image is already being loaded, it returns the existing promise.
   */
  public loadImage(path: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(path)) {
      return Promise.resolve(this.imageCache.get(path)!);
    }

    if (this.promises.has(path)) {
      return this.promises.get(path)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        this.promises.delete(path);
        resolve(img);
      };
      img.onerror = () => {
        this.promises.delete(path);
        reject(new Error(`Failed to load image at ${path}`));
      };
      img.src = path;
    });

    this.promises.set(path, promise);
    return promise;
  }

  /**
   * Retrieves a loaded image from the cache.
   * Throws an error if the image is not preloaded.
   */
  public getImage(path: string): HTMLImageElement {
    if (!this.imageCache.has(path)) {
      throw new Error(`Image not preloaded: ${path}`);
    }
    return this.imageCache.get(path)!;
  }

  /**
   * Preloads an array of image paths.
   */
  public async preloadAll(paths: string[]): Promise<void> {
    await Promise.all(paths.map(path => this.loadImage(path)));
  }
}
```

### 3.2. `Sprite`

**File:** `src/game/engine/sprite.ts`

**Purpose:** Represents a single drawable frame from a larger sprite sheet.

```typescript
export class Sprite {
  private image: HTMLImageElement;
  private sx: number; // Source X on the sprite sheet
  private sy: number; // Source Y on the sprite sheet
  private sWidth: number; // Source width
  private sHeight: number; // Source height

  constructor(
    image: HTMLImageElement,
    sx: number,
    sy: number,
    sWidth: number,
    sHeight: number
  ) {
    this.image = image;
    this.sx = sx;
    this.sy = sy;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
  }

  /**
   * Draws the sprite to the canvas context.
   * @param ctx The canvas rendering context.
   * @param dx Destination X on the canvas.
   * @param dy Destination Y on the canvas.
   * @param dWidth Destination width.
   * @param dHeight Destination height.
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dWidth: number = this.sWidth,
    dHeight: number = this.sHeight
  ): void {
    ctx.drawImage(
      this.image,
      this.sx,
      this.sy,
      this.sWidth,
      this.sHeight,
      dx - dWidth / 2, // Draw from center
      dy - dHeight / 2, // Draw from center
      dWidth,
      dHeight
    );
  }
}
```

### 3.3. `Animator`

**File:** `src/game/engine/animator.ts`

**Purpose:** Manages the state and playback of multiple animations.

```typescript
import { Sprite } from './sprite';

export type AnimationName = string;

export interface Animation {
  frames: Sprite[];
  frameRate: number; // Frames per second
  loop: boolean;
}

export class Animator {
  private animations: Map<AnimationName, Animation>;
  public currentAnimation: AnimationName | null = null;
  private currentFrameIndex: number = 0;
  private timer: number = 0;

  constructor(animations: Map<AnimationName, Animation>) {
    this.animations = animations;
  }

  public play(name: AnimationName): void {
    if (this.currentAnimation === name) return;

    if (!this.animations.has(name)) {
      console.warn(`Animation not found: ${name}`);
      return;
    }

    this.currentAnimation = name;
    this.currentFrameIndex = 0;
    this.timer = 0;
  }

  public update(deltaTime: number): void {
    if (!this.currentAnimation) return;

    const anim = this.animations.get(this.currentAnimation)!;
    this.timer += deltaTime;

    const frameDuration = 1 / anim.frameRate;
    if (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= anim.frames.length) {
        if (anim.loop) {
          this.currentFrameIndex = 0;
        } else {
          // Stay on the last frame for one-shot animations
          this.currentFrameIndex = anim.frames.length - 1;
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    if (!this.currentAnimation) return;

    const anim = this.animations.get(this.currentAnimation)!;
    const frame = anim.frames[this.currentFrameIndex];
    frame.draw(ctx, x, y, width, height);
  }
}
```

### 3.4. `SpriteConfig`

**File:** `src/game/engine/spriteConfig.ts`

**Purpose:** Centralized configuration for all sprite sheet assets and their layouts.

```typescript
// Defines the structure for a single frame within a sprite sheet
export interface FrameData {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Defines the layout for a full sprite sheet
export interface SpriteSheetData {
  path: string;
  frameSize: { w: number; h: number };
  animations: {
    [name: string]: {
      frames: number[]; // Array of frame indices
      frameRate: number;
      loop: boolean;
    };
  };
}

// Example configuration for Zeno
export const ZENO_FLIPBOOK_CONFIG: SpriteSheetData = {
  path: '/assets/sprites/zeno-flipbook.png',
  frameSize: { w: 128, h: 128 },
  animations: {
    idle: {
      frames: [0, 1, 2, 3], // e.g., frames 0-3 on the sheet
      frameRate: 8,
      loop: true,
    },
    coil: {
      frames: [4, 5, 6, 7, 8], // e.g., frames 4-8
      frameRate: 12,
      loop: false,
    },
    bolt: {
      frames: [9, 10],
      frameRate: 10,
      loop: true,
    },
    impact: {
      frames: [11, 12, 13, 14],
      frameRate: 15,
      loop: false,
    },
  },
};

// Similar config for ZENO_NOIR_CONFIG...
```

## 4. Implementation Details

### 4.1. Sprite Sheet Format

- All sprite sheets will be PNG files with transparent backgrounds.
- Frames will be arranged in a regular grid (e.g., 128x128 pixels per frame).
- The `SpriteConfig` will map animation names to sequences of frame indices in this grid.

### 4.2. Integration with Game State

- The `GameState` will hold an instance of the `Animator`.
- The `update` function will be responsible for calling `animator.update()`.
- The `render` function will be responsible for calling `animator.draw()`.
- Game logic (e.g., in `update.ts`) will trigger animation changes by calling `animator.play('animationName')` based on the character's state (`isCharging`, `isFlying`, etc.).

### 4.3. Folder Structure

- **Code:** All new `.ts` files will reside in `src/game/engine/`.
- **Assets:** All new `.png` sprite sheets will reside in `public/assets/sprites/`.

## 5. Backwards Compatibility

The system is designed to be **additive**. The existing procedural drawing functions (`drawStickFigure`, `drawZenoCoil`, etc.) will remain in the codebase. The main `render` function will check if an `Animator` object exists in the game state. If it does, it uses the new sprite system; if not, it falls back to the old procedural methods. This allows for incremental implementation and testing.

```typescript
// In render.ts
if (state.zenoAnimator) {
  state.zenoAnimator.draw(ctx, state.px, state.py, ZENO_WIDTH, ZENO_HEIGHT);
} else {
  // Fallback to old procedural drawing
  drawStickFigure(ctx, ...);
}
```

This ensures the game remains fully functional even before the sprite system is completely integrated.
