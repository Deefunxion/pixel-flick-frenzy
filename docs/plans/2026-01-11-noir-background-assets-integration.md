# Noir Background Assets Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace procedural noir background rendering with art assets, adding animated void parallax, wind-responsive clouds, and flag flutter animation matching the flipbook theme's asset-based approach.

**Architecture:** Extend the existing `BackgroundRenderer` to support both flipbook and noir themes by adding noir-specific asset paths and a theme parameter. The renderer will use the same animation logic (parallax void, wind clouds, flag flutter) but load different assets based on the active theme.

**Tech Stack:** TypeScript, Canvas 2D API, existing BackgroundRenderer class, AssetLoader

---

## Asset Inventory (Verified)

All 20 noir assets are present at:
`docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/`

| Asset | Dimensions | Status |
|-------|------------|--------|
| `noir-background.png` | 960×480 | Ready |
| `noir-cloud-large.png` | 280×140 | Ready |
| `noir-cloud-medium.png` | 200×100 | Ready |
| `noir-cloud-small.png` | 140×70 | Ready |
| `noir-terrain-ground.png` | 960×120 | Ready |
| `noir-cliff-edge.png` | 240×400 | Ready |
| `noir-flag-frame-01-04.png` | 80×120 each | Ready |
| `noir-void-layer-1-3.png` | 1920×200 each | Ready |
| `noir-void-gradient.png` | 960×200 | Ready |
| `noir-wind-swoosh-1-3.png` | 300×60 each | Ready |
| `noir-particle-dust-1-3.png` | 16×16, 12×12, 8×8 | Ready |

---

## Task 1: Copy Noir Assets to Public Directory

**Files:**
- Create: `public/assets/background/noir/` directory structure
- Source: `docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/`

**Step 1: Create directory structure**

```bash
mkdir -p public/assets/background/noir/{clouds,terrain,void,wind,flag}
```

**Step 2: Copy all noir assets**

```bash
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/noir-background.png public/assets/background/noir/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/clouds/*.png public/assets/background/noir/clouds/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/terrain/*.png public/assets/background/noir/terrain/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/void/*.png public/assets/background/noir/void/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/wind/*.png public/assets/background/noir/wind/
cp docs/plans/EMERGENCY_MANUS_PLAN/ZENO-Artwork/Zeno_noir_background_assets/flag/*.png public/assets/background/noir/flag/
```

**Step 3: Verify copy**

```bash
find public/assets/background/noir -type f -name "*.png" | wc -l
# Expected: 20 files
```

**Step 4: Commit**

```bash
git add public/assets/background/noir/
git commit -m "assets: add noir theme background art assets"
```

---

## Task 2: Add Noir Asset Paths to backgroundAssets.ts

**Files:**
- Modify: `src/game/engine/backgroundAssets.ts`

**Step 1: Add NOIR_BACKGROUND_ASSETS constant**

Add after the existing `BACKGROUND_ASSETS` constant (around line 45):

```typescript
/** Noir theme background asset paths */
export const NOIR_BACKGROUND_ASSETS = {
  background: '/assets/background/noir/noir-background.png',

  clouds: {
    large: '/assets/background/noir/clouds/noir-cloud-large.png',
    medium: '/assets/background/noir/clouds/noir-cloud-medium.png',
    small: '/assets/background/noir/clouds/noir-cloud-small.png',
  },

  terrain: {
    ground: '/assets/background/noir/terrain/noir-terrain-ground.png',
    cliffEdge: '/assets/background/noir/terrain/noir-cliff-edge.png',
  },

  void: {
    layer1: '/assets/background/noir/void/noir-void-layer-1.png',
    layer2: '/assets/background/noir/void/noir-void-layer-2.png',
    layer3: '/assets/background/noir/void/noir-void-layer-3.png',
    gradient: '/assets/background/noir/void/noir-void-gradient.png',
  },

  flag: {
    frame1: '/assets/background/noir/flag/noir-flag-frame-01.png',
    frame2: '/assets/background/noir/flag/noir-flag-frame-02.png',
    frame3: '/assets/background/noir/flag/noir-flag-frame-03.png',
    frame4: '/assets/background/noir/flag/noir-flag-frame-04.png',
  },

  wind: {
    swoosh1: '/assets/background/noir/wind/noir-wind-swoosh-1.png',
    swoosh2: '/assets/background/noir/wind/noir-wind-swoosh-2.png',
    swoosh3: '/assets/background/noir/wind/noir-wind-swoosh-3.png',
    particleDust1: '/assets/background/noir/wind/noir-particle-dust-1.png',
    particleDust2: '/assets/background/noir/wind/noir-particle-dust-2.png',
    particleDust3: '/assets/background/noir/wind/noir-particle-dust-3.png',
  },
} as const;
```

**Step 2: Add function to get all noir asset paths**

Add after `getAllBackgroundAssetPaths()`:

```typescript
/** Get flat array of all noir background asset paths for preloading */
export function getAllNoirBackgroundAssetPaths(): string[] {
  const paths: string[] = [];

  paths.push(NOIR_BACKGROUND_ASSETS.background);
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.clouds));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.terrain));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.void));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.flag));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.wind));

  return paths;
}
```

**Step 3: Add noir-specific dimensions**

Add to `ASSET_DIMENSIONS`:

```typescript
export const NOIR_ASSET_DIMENSIONS = {
  background: { width: 960, height: 480 },
  cloudLarge: { width: 280, height: 140 },
  cloudMedium: { width: 200, height: 100 },
  cloudSmall: { width: 140, height: 70 },
  terrainGround: { width: 960, height: 120 },
  cliffEdge: { width: 240, height: 400 },
  voidLayer: { width: 1920, height: 200 },
  voidGradient: { width: 960, height: 200 },
  flag: { width: 80, height: 120 },
  swoosh: { width: 300, height: 60 },
  particleDust1: { width: 16, height: 16 },
  particleDust2: { width: 12, height: 12 },
  particleDust3: { width: 8, height: 8 },
} as const;
```

**Step 4: Commit**

```bash
git add src/game/engine/backgroundAssets.ts
git commit -m "feat(background): add noir theme asset paths and dimensions"
```

---

## Task 3: Create NoirBackgroundRenderer Class

**Files:**
- Create: `src/game/engine/noirBackgroundRenderer.ts`

**Step 1: Create the noir background renderer**

```typescript
// src/game/engine/noirBackgroundRenderer.ts

import { assetLoader } from './assets';
import { NOIR_BACKGROUND_ASSETS, getAllNoirBackgroundAssetPaths, ASSET_SCALE, NOIR_ASSET_DIMENSIONS } from './backgroundAssets';
import { BackgroundState, createBackgroundState, WindParticle, WindSwoosh } from './backgroundState';
import { W, H, CLIFF_EDGE } from '../constants';

/**
 * NoirBackgroundRenderer - Handles noir theme background rendering
 * Similar to BackgroundRenderer but with noir-specific assets and styling
 */
export class NoirBackgroundRenderer {
  private state: BackgroundState;
  private ready: boolean = false;

  constructor() {
    this.state = createBackgroundState();
  }

  /** Preload all noir background assets */
  public async preload(): Promise<void> {
    const paths = getAllNoirBackgroundAssetPaths();
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
    this.updateWindParticles(wind, deltaMs);
    this.updateWindSwooshes(wind, deltaMs);
  }

  /** Render all background layers in order */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.ready) return;

    this.drawBackground(ctx);
    this.drawVoidLayers(ctx);
    this.drawClouds(ctx);
    this.drawTerrain(ctx);
    this.drawWindSwooshes(ctx);
    this.drawWindParticles(ctx);
  }

  /** Draw the flag at a specific x position */
  public drawFlag(ctx: CanvasRenderingContext2D, x: number, groundY: number): void {
    if (!this.ready) return;

    const frameKey = `frame${this.state.flagFrame + 1}` as keyof typeof NOIR_BACKGROUND_ASSETS.flag;
    const img = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.flag[frameKey]);
    if (!img) return;

    const w = NOIR_ASSET_DIMENSIONS.flag.width * ASSET_SCALE;
    const h = NOIR_ASSET_DIMENSIONS.flag.height * ASSET_SCALE;

    // Position flag so pole base is at ground level
    ctx.drawImage(img, x - w * 0.3, groundY - h, w, h);
  }

  // --- Private update methods ---

  private updateClouds(wind: number, deltaMs: number): void {
    const driftSpeed = wind * 0.015 * deltaMs; // Slightly slower for noir atmosphere
    const stretchTarget = 1 + Math.abs(wind) * 0.2;

    for (const cloud of this.state.clouds) {
      cloud.x += driftSpeed;

      const cloudWidth = cloud.size === 'large' ? 140 : cloud.size === 'medium' ? 100 : 70;
      if (wind > 0 && cloud.x > W + cloudWidth) {
        cloud.x = -cloudWidth;
      } else if (wind < 0 && cloud.x < -cloudWidth) {
        cloud.x = W + cloudWidth;
      }

      cloud.stretchX += (stretchTarget - cloud.stretchX) * 0.03;
    }
  }

  private updateVoidParallax(wind: number, deltaMs: number): void {
    // Noir void is more subtle - slower movement
    const baseSpeed = Math.abs(wind) * 0.3 + 0.1;

    for (let i = 0; i < 3; i++) {
      const layer = this.state.voidLayers[i];
      const direction = wind >= 0 ? 1 : -1;
      layer.offsetX += direction * baseSpeed * layer.speed * deltaMs * 0.03;

      const loopWidth = NOIR_ASSET_DIMENSIONS.voidLayer.width * ASSET_SCALE;
      if (layer.offsetX > loopWidth) layer.offsetX -= loopWidth;
      if (layer.offsetX < 0) layer.offsetX += loopWidth;
    }
  }

  private updateFlag(wind: number, deltaMs: number): void {
    const baseInterval = 180; // Slightly slower flutter for noir
    const interval = baseInterval / (1 + Math.abs(wind) * 1.5);

    this.state.flagFrameTimer += deltaMs;
    if (this.state.flagFrameTimer >= interval) {
      this.state.flagFrameTimer = 0;
      this.state.flagFrame = (this.state.flagFrame + 1) % 4;
    }
  }

  private updateWindParticles(wind: number, deltaMs: number): void {
    const windStrength = Math.abs(wind);

    // Fewer particles for noir (more subtle)
    const spawnRate = windStrength * 0.005;
    if (Math.random() < spawnRate * deltaMs && this.state.windParticles.length < 12) {
      this.spawnWindParticle(wind);
    }

    const deltaS = deltaMs / 1000;
    this.state.windParticles = this.state.windParticles.filter(p => {
      p.x += p.vx * deltaS * 60;
      p.y += p.vy * deltaS * 60;
      p.rotation += p.rotationSpeed * deltaS;
      p.life -= deltaMs;

      return p.life > 0 && p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
    });
  }

  private spawnWindParticle(wind: number): void {
    // Noir only uses dust particles (no paper/leaf)
    const assets: WindParticle['asset'][] = ['dust1', 'dust2'];
    const asset = assets[Math.floor(Math.random() * assets.length)];

    const startX = wind > 0 ? -20 : W + 20;
    const startY = Math.random() * H * 0.6;

    this.state.windParticles.push({
      x: startX,
      y: startY,
      vx: wind * 40 + (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 8,
      life: 2500 + Math.random() * 1500,
      maxLife: 4000,
      asset,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
    });
  }

  private updateWindSwooshes(wind: number, deltaMs: number): void {
    const windStrength = Math.abs(wind);

    // Rarer swooshes for noir
    const spawnChance = windStrength * 0.0003 * deltaMs;
    if (Math.random() < spawnChance && this.state.windSwooshes.length < 2) {
      this.spawnWindSwoosh();
    }

    this.state.windSwooshes = this.state.windSwooshes.filter(s => {
      s.lifetime += deltaMs;

      if (s.fadeState === 'in') {
        s.opacity = Math.min(0.4, s.lifetime / 400); // Lower max opacity for noir
        if (s.lifetime >= 400) s.fadeState = 'visible';
      } else if (s.fadeState === 'visible') {
        if (s.lifetime >= 1200) s.fadeState = 'out';
      } else if (s.fadeState === 'out') {
        s.opacity = Math.max(0, 0.4 - (s.lifetime - 1200) / 400);
      }

      return s.lifetime < 1600;
    });
  }

  private spawnWindSwoosh(): void {
    const assets: WindSwoosh['asset'][] = ['swoosh1', 'swoosh2', 'swoosh3'];

    this.state.windSwooshes.push({
      x: Math.random() * W * 0.5 + W * 0.25,
      y: Math.random() * H * 0.3 + 30,
      opacity: 0,
      fadeState: 'in',
      asset: assets[Math.floor(Math.random() * assets.length)],
      lifetime: 0,
    });
  }

  // --- Private draw methods ---

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.background);
    if (!img) return;

    ctx.drawImage(img, 0, 0, W, H);
  }

  private drawVoidLayers(ctx: CanvasRenderingContext2D): void {
    const groundY = H - 20;
    const voidY = groundY;
    const voidHeight = NOIR_ASSET_DIMENSIONS.voidLayer.height * ASSET_SCALE;

    // Draw gradient first
    const gradientImg = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.void.gradient);
    if (gradientImg) {
      const gradW = NOIR_ASSET_DIMENSIONS.voidGradient.width * ASSET_SCALE;
      const gradH = NOIR_ASSET_DIMENSIONS.voidGradient.height * ASSET_SCALE;
      ctx.drawImage(gradientImg, 0, voidY, gradW, gradH);
    }

    // Draw layers back to front (3, 2, 1)
    const layerKeys = ['layer3', 'layer2', 'layer1'] as const;
    const layerIndices = [2, 1, 0];

    for (let i = 0; i < 3; i++) {
      const img = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.void[layerKeys[i]]);
      if (!img) continue;

      const layer = this.state.voidLayers[layerIndices[i]];
      const displayWidth = NOIR_ASSET_DIMENSIONS.voidLayer.width * ASSET_SCALE;

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
      const img = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.clouds[assetKey]);
      if (!img) continue;

      const dimKey = cloud.size === 'large' ? 'cloudLarge'
        : cloud.size === 'medium' ? 'cloudMedium' : 'cloudSmall';
      const baseW = NOIR_ASSET_DIMENSIONS[dimKey].width * ASSET_SCALE;
      const baseH = NOIR_ASSET_DIMENSIONS[dimKey].height * ASSET_SCALE;

      const w = baseW * cloud.stretchX;
      const h = baseH / Math.sqrt(cloud.stretchX);

      ctx.drawImage(img, cloud.x - w / 2, cloud.y - h / 2, w, h);
    }
  }

  private drawTerrain(ctx: CanvasRenderingContext2D): void {
    const groundY = H - 20;

    // Draw terrain ground strip
    const groundImg = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.terrain.ground);
    if (groundImg) {
      const w = NOIR_ASSET_DIMENSIONS.terrainGround.width * ASSET_SCALE;
      const h = NOIR_ASSET_DIMENSIONS.terrainGround.height * ASSET_SCALE;
      ctx.drawImage(groundImg, 0, groundY - h + 25, w, h);
    }

    // Draw cliff edge detail
    const cliffImg = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.terrain.cliffEdge);
    if (cliffImg) {
      const w = NOIR_ASSET_DIMENSIONS.cliffEdge.width * ASSET_SCALE;
      const h = NOIR_ASSET_DIMENSIONS.cliffEdge.height * ASSET_SCALE;
      ctx.drawImage(cliffImg, CLIFF_EDGE - w * 0.4, groundY - h * 0.25, w, h);
    }
  }

  private drawWindSwooshes(ctx: CanvasRenderingContext2D): void {
    for (const swoosh of this.state.windSwooshes) {
      const assetKey = swoosh.asset;
      const img = assetLoader.getImage(NOIR_BACKGROUND_ASSETS.wind[assetKey]);
      if (!img) continue;

      const w = NOIR_ASSET_DIMENSIONS.swoosh.width * ASSET_SCALE;
      const h = NOIR_ASSET_DIMENSIONS.swoosh.height * ASSET_SCALE;

      ctx.globalAlpha = swoosh.opacity;
      ctx.drawImage(img, swoosh.x - w / 2, swoosh.y - h / 2, w, h);
      ctx.globalAlpha = 1;
    }
  }

  private drawWindParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.state.windParticles) {
      const assetMap: Record<string, string> = {
        dust1: NOIR_BACKGROUND_ASSETS.wind.particleDust1,
        dust2: NOIR_BACKGROUND_ASSETS.wind.particleDust2,
      };

      const img = assetLoader.getImage(assetMap[particle.asset]);
      if (!img) continue;

      const sizeMap: Record<string, number> = { dust1: 8, dust2: 6 };
      const size = sizeMap[particle.asset] || 6;
      const alpha = Math.min(0.7, particle.life / 600); // Lower alpha for noir

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
export const noirBackgroundRenderer = new NoirBackgroundRenderer();
```

**Step 2: Commit**

```bash
git add src/game/engine/noirBackgroundRenderer.ts
git commit -m "feat(background): add NoirBackgroundRenderer class"
```

---

## Task 4: Add Noir Background Preloading

**Files:**
- Modify: `src/components/Game.tsx` (or wherever preloading happens)

**Step 1: Find preloading code**

```bash
grep -r "backgroundRenderer.preload\|preloadAll" src/ --include="*.tsx"
```

**Step 2: Add noir preloading alongside flipbook**

Add import:

```typescript
import { noirBackgroundRenderer } from '@/game/engine/noirBackgroundRenderer';
```

Add to initialization (alongside existing `backgroundRenderer.preload()`):

```typescript
// Preload both theme backgrounds
await Promise.all([
  backgroundRenderer.preload(),
  noirBackgroundRenderer.preload(),
]);
```

**Step 3: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat(background): preload noir background assets on game init"
```

---

## Task 5: Integrate Noir Renderer with renderNoirFrame

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Import noir background renderer**

Add at top of file:

```typescript
import { noirBackgroundRenderer } from './noirBackgroundRenderer';
```

**Step 2: Replace procedural noir background (lines ~656-700)**

Replace the beginning of `renderNoirFrame()` with:

```typescript
function renderNoirFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Ground level reference
  const groundY = H - 20;

  // Update and render noir background layers using asset-based renderer
  noirBackgroundRenderer.update(state.wind, nowMs);
  noirBackgroundRenderer.render(ctx);

  // Best marker - animated flag using noir assets
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    noirBackgroundRenderer.drawFlag(ctx, flagX, groundY);
  }

  // Zeno target marker - glowing line (keep procedural)
  if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
    // ... keep existing target marker code ...
```

**Step 3: Remove these procedural calls from renderNoirFrame**

Delete/comment out:
- `bgGradient` creation and `fillRect` (background)
- `drawMoon()` call
- Ground line drawing (`ctx.moveTo(0, groundY)...`)
- Cliff drop-off line drawing
- Ground glow effect
- `drawNightCloud()` calls (3 of them)
- Best marker diamond drawing (replaced by flag)

**Step 4: Keep these elements procedural**

Keep in renderNoirFrame:
- Zeno target marker (glowing line + circle)
- Wind indicator box
- Ghost trail rendering
- Current trail (ink droplets)
- Particles
- Player rendering
- All UI elements
- Film grain and vignette (at the end)

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(background): integrate NoirBackgroundRenderer with noir render loop"
```

---

## Task 6: Clean Up Unused Noir Procedural Imports

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Remove unused imports**

After integration, these may no longer be needed in render.ts:
- `drawMoon` (if only used in noir)
- `drawNightCloud` (if only used in noir)

Check usage and remove if unused:

```typescript
// Remove from imports if no longer used:
import {
  // drawMoon,        // REMOVE if unused
  // drawNightCloud,  // REMOVE if unused
  // ... keep others
} from './sketchy';
```

**Step 2: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "refactor(render): remove unused procedural noir imports"
```

---

## Task 7: Test and Adjust Positioning

**Step 1: Run development server**

```bash
npm run dev
```

**Step 2: Switch to noir theme and verify**

Visual inspection checklist:
- [ ] Dark background with spotlight effect displays
- [ ] Terrain strip aligns correctly at groundY
- [ ] Cliff edge positioned at CLIFF_EDGE (x=420)
- [ ] Void layers visible below terrain
- [ ] Void parallax scrolls subtly with wind
- [ ] Clouds drift with wind (slower than flipbook)
- [ ] Flag animates on best marker position
- [ ] Wind particles spawn (dust only, not paper/leaf)
- [ ] Wind swooshes appear occasionally
- [ ] Film grain and vignette still apply on top

**Step 3: Adjust positioning if needed**

Common adjustments in `noirBackgroundRenderer.ts`:
- Terrain Y: Adjust `groundY - h + 25` offset in `drawTerrain()`
- Cliff X: Adjust `CLIFF_EDGE - w * 0.4` offset
- Cloud positions: Modify `createBackgroundState()` cloud Y values

**Step 4: Commit adjustments**

```bash
git add src/game/engine/noirBackgroundRenderer.ts
git commit -m "fix(background): adjust noir asset positioning"
```

---

## Task 8: Final Build and Test

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

- Play several rounds in noir theme
- Verify background doesn't interfere with gameplay
- Check performance (should be similar to flipbook)
- Test theme switching (flipbook ↔ noir)
- Verify both themes work correctly after switch

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(background): complete noir background assets integration"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Copy noir assets to public directory | `public/assets/background/noir/*` |
| 2 | Add noir asset paths and dimensions | `backgroundAssets.ts` |
| 3 | Create NoirBackgroundRenderer class | `noirBackgroundRenderer.ts` |
| 4 | Add noir preloading to game init | `Game.tsx` |
| 5 | Integrate with renderNoirFrame | `render.ts` |
| 6 | Clean up unused imports | `render.ts` |
| 7 | Test and adjust positioning | `noirBackgroundRenderer.ts` |
| 8 | Final build and test | - |

**Total: 8 tasks, ~12-15 commits**

---

## File Structure After Integration

```
public/assets/background/
├── paper-background.png          # Flipbook
├── clouds/                       # Flipbook clouds
├── terrain/                      # Flipbook terrain
├── void/                         # Flipbook void
├── wind/                         # Flipbook wind
├── flag/                         # Flipbook flag
└── noir/                         # NEW - Noir theme
    ├── noir-background.png
    ├── clouds/
    │   ├── noir-cloud-large.png
    │   ├── noir-cloud-medium.png
    │   └── noir-cloud-small.png
    ├── terrain/
    │   ├── noir-terrain-ground.png
    │   └── noir-cliff-edge.png
    ├── void/
    │   ├── noir-void-layer-1.png
    │   ├── noir-void-layer-2.png
    │   ├── noir-void-layer-3.png
    │   └── noir-void-gradient.png
    ├── flag/
    │   ├── noir-flag-frame-01.png
    │   ├── noir-flag-frame-02.png
    │   ├── noir-flag-frame-03.png
    │   └── noir-flag-frame-04.png
    └── wind/
        ├── noir-wind-swoosh-1.png
        ├── noir-wind-swoosh-2.png
        ├── noir-wind-swoosh-3.png
        ├── noir-particle-dust-1.png
        ├── noir-particle-dust-2.png
        └── noir-particle-dust-3.png
```
