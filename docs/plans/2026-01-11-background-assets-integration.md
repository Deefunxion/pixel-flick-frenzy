# Background Assets Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace procedural background rendering with art assets for the flipbook theme, including animated void parallax, wind-responsive clouds, and flag flutter animation.

**Architecture:** Create a `BackgroundRenderer` class that manages loading, state, and drawing of all background layers. Integrate with existing `renderFlipbookFrame()` to replace procedural calls with asset-based rendering. Wind state from `GameState.wind` drives cloud movement, void parallax speed, and flag animation.

**Tech Stack:** TypeScript, Canvas 2D API, existing AssetLoader class

---

## Task 1: Copy Assets to Public Directory

**Files:**
- Create: `public/assets/background/` directory structure
- Source: `docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/`

**Step 1: Create directory structure**

```bash
mkdir -p public/assets/background/{clouds,terrain,void,wind,flag}
```

**Step 2: Copy all assets**

```bash
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/paper-background.png public/assets/background/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/clouds/*.png public/assets/background/clouds/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/terrain/*.png public/assets/background/terrain/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/void/*.png public/assets/background/void/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/wind/*.png public/assets/background/wind/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_background_assets/flag/*.png public/assets/background/flag/
```

**Step 3: Verify copy**

```bash
find public/assets/background -type f -name "*.png" | wc -l
# Expected: 21 files
```

**Step 4: Commit**

```bash
git add public/assets/background/
git commit -m "assets: add background art assets for flipbook theme"
```

---

## Task 2: Define Background Asset Paths and Types

**Files:**
- Create: `src/game/engine/backgroundAssets.ts`

**Step 1: Create asset paths configuration**

```typescript
// src/game/engine/backgroundAssets.ts

/**
 * Background asset paths and configuration
 * All assets are 2x resolution (canvas is 480x240, assets are 960x480 base)
 */

export const BACKGROUND_ASSETS = {
  paper: '/assets/background/paper-background.png',

  clouds: {
    large: '/assets/background/clouds/cloud-large.png',
    medium: '/assets/background/clouds/cloud-medium.png',
    small: '/assets/background/clouds/cloud-small.png',
  },

  terrain: {
    ground: '/assets/background/terrain/terrain-ground.png',
    cliffEdge: '/assets/background/terrain/cliff-edge.png',
  },

  void: {
    layer1: '/assets/background/void/void-layer-1.png',
    layer2: '/assets/background/void/void-layer-2.png',
    layer3: '/assets/background/void/void-layer-3.png',
    gradient: '/assets/background/void/void-gradient.png',
  },

  flag: {
    frame1: '/assets/background/flag/flag-frame-01.png',
    frame2: '/assets/background/flag/flag-frame-02.png',
    frame3: '/assets/background/flag/flag-frame-03.png',
    frame4: '/assets/background/flag/flag-frame-04.png',
  },

  wind: {
    swoosh1: '/assets/background/wind/wind-swoosh-1.png',
    swoosh2: '/assets/background/wind/wind-swoosh-2.png',
    swoosh3: '/assets/background/wind/wind-swoosh-3.png',
    particlePaper: '/assets/background/wind/particle-paper-scrap.png',
    particleLeaf: '/assets/background/wind/particle-leaf.png',
    particleDust1: '/assets/background/wind/particle-dust-1.png',
    particleDust2: '/assets/background/wind/particle-dust-2.png',
  },
} as const;

/** Get flat array of all asset paths for preloading */
export function getAllBackgroundAssetPaths(): string[] {
  const paths: string[] = [];

  paths.push(BACKGROUND_ASSETS.paper);
  paths.push(...Object.values(BACKGROUND_ASSETS.clouds));
  paths.push(...Object.values(BACKGROUND_ASSETS.terrain));
  paths.push(...Object.values(BACKGROUND_ASSETS.void));
  paths.push(...Object.values(BACKGROUND_ASSETS.flag));
  paths.push(...Object.values(BACKGROUND_ASSETS.wind));

  return paths;
}

/** Asset dimensions at 2x scale */
export const ASSET_DIMENSIONS = {
  paper: { width: 960, height: 480 },
  cloudLarge: { width: 280, height: 140 },
  cloudMedium: { width: 200, height: 100 },
  cloudSmall: { width: 140, height: 70 },
  terrainGround: { width: 960, height: 100 },
  cliffEdge: { width: 200, height: 300 },
  voidLayer: { width: 1920, height: 200 },
  flag: { width: 80, height: 120 },
  swoosh: { width: 300, height: 60 },
} as const;

/** Canvas scale factor (assets are 2x) */
export const ASSET_SCALE = 0.5;
```

**Step 2: Commit**

```bash
git add src/game/engine/backgroundAssets.ts
git commit -m "feat(background): add asset paths and dimensions config"
```

---

## Task 3: Create Background State Interface

**Files:**
- Create: `src/game/engine/backgroundState.ts`

**Step 1: Define background animation state**

```typescript
// src/game/engine/backgroundState.ts

/**
 * State for animated background elements
 * Updated each frame based on wind and time
 */

export interface CloudState {
  x: number;        // Current x position
  y: number;        // Fixed y position
  baseX: number;    // Starting x position (for drift calculation)
  size: 'large' | 'medium' | 'small';
  stretchX: number; // Wind stretch factor (1.0 = normal)
}

export interface VoidLayerState {
  offsetX: number;  // Parallax scroll offset (loops at image width)
  speed: number;    // Base scroll speed multiplier
}

export interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  asset: 'paper' | 'leaf' | 'dust1' | 'dust2';
  rotation: number;
  rotationSpeed: number;
}

export interface WindSwoosh {
  x: number;
  y: number;
  opacity: number;
  fadeState: 'in' | 'visible' | 'out';
  asset: 'swoosh1' | 'swoosh2' | 'swoosh3';
  lifetime: number;
}

export interface BackgroundState {
  // Clouds drift with wind
  clouds: CloudState[];

  // Void parallax layers
  voidLayers: [VoidLayerState, VoidLayerState, VoidLayerState];

  // Wind particles
  windParticles: WindParticle[];

  // Wind swoosh effects
  windSwooshes: WindSwoosh[];

  // Flag animation
  flagFrame: number;          // Current frame 0-3
  flagFrameTimer: number;     // Ms since last frame change

  // Timing
  lastUpdateTime: number;
}

/** Create initial background state */
export function createBackgroundState(): BackgroundState {
  return {
    clouds: [
      { x: 120, y: 55, baseX: 120, size: 'medium', stretchX: 1.0 },
      { x: 280, y: 70, baseX: 280, size: 'large', stretchX: 1.0 },
      { x: 400, y: 50, baseX: 400, size: 'small', stretchX: 1.0 },
    ],
    voidLayers: [
      { offsetX: 0, speed: 1.0 },    // Layer 1: fastest
      { offsetX: 0, speed: 0.6 },    // Layer 2: medium
      { offsetX: 0, speed: 0.3 },    // Layer 3: slowest
    ],
    windParticles: [],
    windSwooshes: [],
    flagFrame: 0,
    flagFrameTimer: 0,
    lastUpdateTime: 0,
  };
}
```

**Step 2: Commit**

```bash
git add src/game/engine/backgroundState.ts
git commit -m "feat(background): add background animation state types"
```

---

## Task 4: Create Background Renderer Class

**Files:**
- Create: `src/game/engine/backgroundRenderer.ts`

**Step 1: Create BackgroundRenderer class skeleton**

```typescript
// src/game/engine/backgroundRenderer.ts

import { assetLoader } from './assets';
import { BACKGROUND_ASSETS, getAllBackgroundAssetPaths, ASSET_SCALE, ASSET_DIMENSIONS } from './backgroundAssets';
import { BackgroundState, createBackgroundState, CloudState, WindParticle, WindSwoosh } from './backgroundState';
import { W, H, CLIFF_EDGE } from '../constants';

/**
 * BackgroundRenderer - Handles all background layer rendering
 * Manages asset loading, animation state, and drawing
 */
export class BackgroundRenderer {
  private state: BackgroundState;
  private ready: boolean = false;

  constructor() {
    this.state = createBackgroundState();
  }

  /** Preload all background assets */
  public async preload(): Promise<void> {
    const paths = getAllBackgroundAssetPaths();
    await assetLoader.preloadAll(paths);
    this.ready = true;
  }

  /** Check if assets are loaded */
  public isReady(): boolean {
    return this.ready;
  }

  /** Update animation state based on wind and delta time */
  public update(wind: number, nowMs: number): void {
    if (!this.ready) return;

    const deltaMs = this.state.lastUpdateTime > 0
      ? nowMs - this.state.lastUpdateTime
      : 16;
    this.state.lastUpdateTime = nowMs;

    this.updateClouds(wind, deltaMs);
    this.updateVoidParallax(wind, deltaMs);
    this.updateFlag(wind, deltaMs);
    this.updateWindParticles(wind, deltaMs, nowMs);
    this.updateWindSwooshes(wind, deltaMs, nowMs);
  }

  /** Render all background layers in order */
  public render(ctx: CanvasRenderingContext2D, nowMs: number): void {
    if (!this.ready) return;

    this.drawPaperBackground(ctx);
    this.drawVoidLayers(ctx);
    this.drawClouds(ctx);
    this.drawTerrain(ctx);
    this.drawWindSwooshes(ctx);
    this.drawWindParticles(ctx);
  }

  /** Draw the flag at a specific x position */
  public drawFlag(ctx: CanvasRenderingContext2D, x: number, groundY: number): void {
    if (!this.ready) return;

    const frameKey = `frame${this.state.flagFrame + 1}` as keyof typeof BACKGROUND_ASSETS.flag;
    const img = assetLoader.getImage(BACKGROUND_ASSETS.flag[frameKey]);
    if (!img) return;

    const w = ASSET_DIMENSIONS.flag.width * ASSET_SCALE;
    const h = ASSET_DIMENSIONS.flag.height * ASSET_SCALE;

    // Position flag so pole base is at ground level
    ctx.drawImage(img, x - w * 0.3, groundY - h, w, h);
  }

  // --- Private update methods ---

  private updateClouds(wind: number, deltaMs: number): void {
    const driftSpeed = wind * 0.02 * deltaMs;
    const stretchTarget = 1 + Math.abs(wind) * 0.3;

    for (const cloud of this.state.clouds) {
      // Drift position
      cloud.x += driftSpeed;

      // Wrap around screen
      const cloudWidth = cloud.size === 'large' ? 140 : cloud.size === 'medium' ? 100 : 70;
      if (wind > 0 && cloud.x > W + cloudWidth) {
        cloud.x = -cloudWidth;
      } else if (wind < 0 && cloud.x < -cloudWidth) {
        cloud.x = W + cloudWidth;
      }

      // Smooth stretch toward target
      cloud.stretchX += (stretchTarget - cloud.stretchX) * 0.05;
    }
  }

  private updateVoidParallax(wind: number, deltaMs: number): void {
    const baseSpeed = Math.abs(wind) * 0.5 + 0.2; // Always some movement

    for (let i = 0; i < 3; i++) {
      const layer = this.state.voidLayers[i];
      const direction = wind >= 0 ? 1 : -1;
      layer.offsetX += direction * baseSpeed * layer.speed * deltaMs * 0.05;

      // Loop at image width (1920 / 2 = 960 at display scale)
      const loopWidth = ASSET_DIMENSIONS.voidLayer.width * ASSET_SCALE;
      if (layer.offsetX > loopWidth) layer.offsetX -= loopWidth;
      if (layer.offsetX < 0) layer.offsetX += loopWidth;
    }
  }

  private updateFlag(wind: number, deltaMs: number): void {
    // Faster flutter with stronger wind
    const baseInterval = 150;
    const interval = baseInterval / (1 + Math.abs(wind) * 2);

    this.state.flagFrameTimer += deltaMs;
    if (this.state.flagFrameTimer >= interval) {
      this.state.flagFrameTimer = 0;
      this.state.flagFrame = (this.state.flagFrame + 1) % 4;
    }
  }

  private updateWindParticles(wind: number, deltaMs: number, nowMs: number): void {
    const windStrength = Math.abs(wind);

    // Spawn new particles based on wind strength
    const spawnRate = windStrength * 0.01; // Particles per ms
    if (Math.random() < spawnRate * deltaMs && this.state.windParticles.length < 20) {
      this.spawnWindParticle(wind, nowMs);
    }

    // Update existing particles
    const deltaS = deltaMs / 1000;
    this.state.windParticles = this.state.windParticles.filter(p => {
      p.x += p.vx * deltaS * 60;
      p.y += p.vy * deltaS * 60;
      p.rotation += p.rotationSpeed * deltaS;
      p.life -= deltaMs;

      // Remove if dead or off screen
      return p.life > 0 && p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
    });
  }

  private spawnWindParticle(wind: number, nowMs: number): void {
    const assets: WindParticle['asset'][] = ['paper', 'leaf', 'dust1', 'dust2'];
    const asset = assets[Math.floor(Math.random() * assets.length)];

    const startX = wind > 0 ? -20 : W + 20;
    const startY = Math.random() * H * 0.7;

    this.state.windParticles.push({
      x: startX,
      y: startY,
      vx: wind * 50 + (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 10,
      life: 3000 + Math.random() * 2000,
      maxLife: 5000,
      asset,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
    });
  }

  private updateWindSwooshes(wind: number, deltaMs: number, nowMs: number): void {
    const windStrength = Math.abs(wind);

    // Spawn swooshes occasionally in strong wind
    const spawnChance = windStrength * 0.0005 * deltaMs;
    if (Math.random() < spawnChance && this.state.windSwooshes.length < 3) {
      this.spawnWindSwoosh(wind);
    }

    // Update existing swooshes
    this.state.windSwooshes = this.state.windSwooshes.filter(s => {
      s.lifetime += deltaMs;

      if (s.fadeState === 'in') {
        s.opacity = Math.min(0.6, s.lifetime / 300);
        if (s.lifetime >= 300) s.fadeState = 'visible';
      } else if (s.fadeState === 'visible') {
        if (s.lifetime >= 1100) s.fadeState = 'out';
      } else if (s.fadeState === 'out') {
        s.opacity = Math.max(0, 0.6 - (s.lifetime - 1100) / 300);
      }

      return s.lifetime < 1400;
    });
  }

  private spawnWindSwoosh(wind: number): void {
    const assets: WindSwoosh['asset'][] = ['swoosh1', 'swoosh2', 'swoosh3'];

    this.state.windSwooshes.push({
      x: Math.random() * W * 0.6 + W * 0.2,
      y: Math.random() * H * 0.4 + 20,
      opacity: 0,
      fadeState: 'in',
      asset: assets[Math.floor(Math.random() * assets.length)],
      lifetime: 0,
    });
  }

  // --- Private draw methods ---

  private drawPaperBackground(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.paper);
    if (!img) return;

    // Draw at canvas size (asset is 2x, scale down)
    ctx.drawImage(img, 0, 0, W, H);
  }

  private drawVoidLayers(ctx: CanvasRenderingContext2D): void {
    const groundY = H - 20;
    const voidY = groundY; // Void starts at ground level
    const voidHeight = ASSET_DIMENSIONS.voidLayer.height * ASSET_SCALE;

    // Draw gradient first (optional depth effect)
    const gradientImg = assetLoader.getImage(BACKGROUND_ASSETS.void.gradient);
    if (gradientImg) {
      ctx.drawImage(gradientImg, 0, voidY, W, voidHeight);
    }

    // Draw layers back to front (3, 2, 1)
    const layerKeys = ['layer3', 'layer2', 'layer1'] as const;
    const layerIndices = [2, 1, 0];

    for (let i = 0; i < 3; i++) {
      const img = assetLoader.getImage(BACKGROUND_ASSETS.void[layerKeys[i]]);
      if (!img) continue;

      const layer = this.state.voidLayers[layerIndices[i]];
      const displayWidth = ASSET_DIMENSIONS.voidLayer.width * ASSET_SCALE;

      // Draw twice for seamless loop
      const x1 = -layer.offsetX;
      const x2 = x1 + displayWidth;

      ctx.drawImage(img, x1, voidY, displayWidth, voidHeight);
      ctx.drawImage(img, x2, voidY, displayWidth, voidHeight);
    }
  }

  private drawClouds(ctx: CanvasRenderingContext2D): void {
    for (const cloud of this.state.clouds) {
      const assetKey = cloud.size === 'large' ? 'large'
        : cloud.size === 'medium' ? 'medium' : 'small';
      const img = assetLoader.getImage(BACKGROUND_ASSETS.clouds[assetKey]);
      if (!img) continue;

      const dimKey = cloud.size === 'large' ? 'cloudLarge'
        : cloud.size === 'medium' ? 'cloudMedium' : 'cloudSmall';
      const baseW = ASSET_DIMENSIONS[dimKey].width * ASSET_SCALE;
      const baseH = ASSET_DIMENSIONS[dimKey].height * ASSET_SCALE;

      // Apply wind stretch
      const w = baseW * cloud.stretchX;
      const h = baseH / Math.sqrt(cloud.stretchX); // Compress height slightly when stretched

      ctx.drawImage(img, cloud.x - w / 2, cloud.y - h / 2, w, h);
    }
  }

  private drawTerrain(ctx: CanvasRenderingContext2D): void {
    const groundY = H - 20;

    // Draw terrain ground strip
    const groundImg = assetLoader.getImage(BACKGROUND_ASSETS.terrain.ground);
    if (groundImg) {
      const w = ASSET_DIMENSIONS.terrainGround.width * ASSET_SCALE;
      const h = ASSET_DIMENSIONS.terrainGround.height * ASSET_SCALE;
      ctx.drawImage(groundImg, 0, groundY - h + 20, w, h);
    }

    // Draw cliff edge detail
    const cliffImg = assetLoader.getImage(BACKGROUND_ASSETS.terrain.cliffEdge);
    if (cliffImg) {
      const w = ASSET_DIMENSIONS.cliffEdge.width * ASSET_SCALE;
      const h = ASSET_DIMENSIONS.cliffEdge.height * ASSET_SCALE;
      // Position cliff edge at CLIFF_EDGE x coordinate
      ctx.drawImage(cliffImg, CLIFF_EDGE - w * 0.3, groundY - h * 0.3, w, h);
    }
  }

  private drawWindSwooshes(ctx: CanvasRenderingContext2D): void {
    for (const swoosh of this.state.windSwooshes) {
      const assetKey = swoosh.asset;
      const img = assetLoader.getImage(BACKGROUND_ASSETS.wind[assetKey]);
      if (!img) continue;

      const w = ASSET_DIMENSIONS.swoosh.width * ASSET_SCALE;
      const h = ASSET_DIMENSIONS.swoosh.height * ASSET_SCALE;

      ctx.globalAlpha = swoosh.opacity;
      ctx.drawImage(img, swoosh.x - w / 2, swoosh.y - h / 2, w, h);
      ctx.globalAlpha = 1;
    }
  }

  private drawWindParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.state.windParticles) {
      const assetMap = {
        paper: BACKGROUND_ASSETS.wind.particlePaper,
        leaf: BACKGROUND_ASSETS.wind.particleLeaf,
        dust1: BACKGROUND_ASSETS.wind.particleDust1,
        dust2: BACKGROUND_ASSETS.wind.particleDust2,
      };

      const img = assetLoader.getImage(assetMap[particle.asset]);
      if (!img) continue;

      const size = particle.asset === 'paper' ? 16 : particle.asset === 'leaf' ? 12 : 8;
      const alpha = Math.min(1, particle.life / 500);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

/** Singleton instance */
export const backgroundRenderer = new BackgroundRenderer();
```

**Step 2: Commit**

```bash
git add src/game/engine/backgroundRenderer.ts
git commit -m "feat(background): add BackgroundRenderer class with parallax and wind effects"
```

---

## Task 5: Integrate Background Renderer with Game Initialization

**Files:**
- Modify: `src/game/engine/state.ts`
- Modify: `src/components/Game.tsx` (or wherever game loop is initialized)

**Step 1: Find and read current game initialization**

```bash
grep -r "createInitialState\|assetLoader.preload" src/ --include="*.ts" --include="*.tsx"
```

**Step 2: Add background preloading to game startup**

In the file that calls `assetLoader.preloadAll()` (likely Game.tsx or similar), add:

```typescript
import { backgroundRenderer } from '@/game/engine/backgroundRenderer';

// In the initialization/useEffect:
async function initGame() {
  // Existing sprite preloading...

  // Add background preloading
  await backgroundRenderer.preload();

  // ... rest of init
}
```

**Step 3: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat(background): preload background assets on game init"
```

---

## Task 6: Integrate Background Renderer with Render Loop

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Import background renderer**

At the top of `render.ts`, add:

```typescript
import { backgroundRenderer } from './backgroundRenderer';
```

**Step 2: Replace procedural background calls in renderFlipbookFrame**

In `renderFlipbookFrame()`, replace lines ~96-119 with:

```typescript
function renderFlipbookFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Update and render background layers
  backgroundRenderer.update(state.wind, nowMs);
  backgroundRenderer.render(ctx, nowMs);

  // Ground level reference (for positioning game elements)
  const groundY = H - 20;

  // Remove these procedural calls (they're now handled by backgroundRenderer):
  // - ctx.fillStyle = COLORS.background / ctx.fillRect (paper)
  // - drawPaperTexture
  // - drawRuledLines
  // - drawSpiralHoles
  // - drawGround
  // - drawSkyCloud calls

  // Keep the rest of the function for game elements...
```

**Step 3: Replace flag rendering**

Find the flag rendering section (~line 122-125) and replace:

```typescript
// Best marker - use asset-based flag
if (state.best > 0 && state.best <= CLIFF_EDGE) {
  const flagX = Math.floor(state.best);
  backgroundRenderer.drawFlag(ctx, flagX, groundY);
}
```

**Step 4: Keep target star and other game elements**

The Zeno target star, wind indicator box, particles, player, and UI elements should remain as procedural drawing.

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(background): integrate BackgroundRenderer with flipbook render loop"
```

---

## Task 7: Test and Adjust Positioning

**Files:**
- Modify: `src/game/engine/backgroundRenderer.ts` (if adjustments needed)

**Step 1: Run development server**

```bash
npm run dev
```

**Step 2: Visual inspection checklist**

- [ ] Paper background displays correctly (fills canvas)
- [ ] Ruled lines and binder holes visible
- [ ] Terrain strip aligns with groundY (H - 20 = 220)
- [ ] Cliff edge positioned at CLIFF_EDGE (x=420)
- [ ] Void layers visible below terrain
- [ ] Void parallax scrolls with wind
- [ ] Clouds drift with wind direction
- [ ] Clouds stretch slightly in strong wind
- [ ] Flag animates (flutter)
- [ ] Flag speed increases with wind
- [ ] Wind particles spawn and drift
- [ ] Wind swooshes appear occasionally

**Step 3: Adjust constants as needed**

Common adjustments:
- Terrain Y position: Change `groundY - h + 20` offset in `drawTerrain()`
- Cliff edge X position: Adjust `CLIFF_EDGE - w * 0.3` offset
- Void Y position: Adjust `voidY` calculation
- Cloud Y positions: Modify initial `clouds` array in `createBackgroundState()`

**Step 4: Commit adjustments**

```bash
git add src/game/engine/backgroundRenderer.ts
git commit -m "fix(background): adjust asset positioning after visual testing"
```

---

## Task 8: Clean Up Unused Procedural Functions

**Files:**
- Modify: `src/game/engine/sketchy.ts`
- Modify: `src/game/engine/render.ts`

**Step 1: Identify unused imports in render.ts**

After integration, these imports from sketchy.ts are likely unused for flipbook theme:
- `drawPaperTexture`
- `drawRuledLines`
- `drawSpiralHoles`
- `drawGround`
- `drawSkyCloud`
- `drawEnhancedFlag` / `drawCheckeredFlag`

**Step 2: Remove unused imports**

```typescript
// Remove from imports if no longer used:
import {
  drawStickFigure,
  drawFailingStickFigure,
  // drawRuledLines,        // REMOVE
  // drawPaperTexture,      // REMOVE
  // drawSpiralHoles,       // REMOVE
  drawHandLine,
  drawHandCircle,
  // ... keep the rest
} from './sketchy';
```

**Step 3: Keep sketchy.ts functions**

Don't delete the functions from `sketchy.ts` - they're still used by the Noir theme and may be useful as fallback.

**Step 4: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "refactor(render): remove unused procedural background imports for flipbook"
```

---

## Task 9: Final Integration Test

**Step 1: Build check**

```bash
npm run build
```

Expected: No TypeScript errors, build succeeds.

**Step 2: Lint check**

```bash
npm run lint
```

Expected: No new lint errors.

**Step 3: Manual gameplay test**

- Play several rounds
- Verify background doesn't interfere with gameplay
- Check performance (no stuttering from asset rendering)
- Test with different wind values
- Verify flag position matches best throw marker

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(background): complete background assets integration for flipbook theme"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Copy assets to public directory | `public/assets/background/*` |
| 2 | Define asset paths and types | `backgroundAssets.ts` |
| 3 | Create background state interface | `backgroundState.ts` |
| 4 | Create BackgroundRenderer class | `backgroundRenderer.ts` |
| 5 | Integrate with game initialization | `Game.tsx` |
| 6 | Integrate with render loop | `render.ts` |
| 7 | Test and adjust positioning | `backgroundRenderer.ts` |
| 8 | Clean up unused imports | `render.ts` |
| 9 | Final build and test | - |

**Total: 9 tasks, ~15-20 commits**
