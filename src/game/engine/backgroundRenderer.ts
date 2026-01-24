// src/game/engine/backgroundRenderer.ts

import { assetLoader } from './assets';
import { BACKGROUND_ASSETS, getAllBackgroundAssetPaths, ASSET_SCALE, ASSET_DIMENSIONS } from './backgroundAssets';
import { BackgroundState, createBackgroundState, WindParticle, WindSwoosh, BirdState } from './backgroundState';
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
    this.updateWindParticles(wind, deltaMs);
    this.updateWindSwooshes(wind, deltaMs);
    this.updateBirds(wind, deltaMs);
  }

  /** Render all background layers in order */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.ready) return;

    this.drawPaperBackground(ctx);
    this.drawSun(ctx);           // Top right, behind clouds
    this.drawVoidLayers(ctx);
    this.drawClouds(ctx);
    this.drawBirds(ctx);         // Animated birds in sky
    this.drawBush(ctx);          // Background decoration
    this.drawTerrain(ctx);
    this.drawTree(ctx);          // Golden ratio position
    this.drawRocks(ctx);         // Foreground rocks
    this.drawGrass(ctx);         // Scattered grass
    this.drawSignpost(ctx);      // Near cliff edge
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
    const poleOffset = w * 0.018; // Distance from draw origin to pole base

    // Lean + flip to show wind direction and intensity
    ctx.save();
    ctx.translate(x, groundY);
    ctx.rotate(this.state.flagLean);
    ctx.scale(this.state.flagDirection, 1);

    // Position flag so pole base stays planted when flipped left/right
    const leftAdjust = w * 0.8; // shift right when flipped so the pole stays on-screen
    const drawX = this.state.flagDirection === 1
      ? -poleOffset
      : poleOffset - w + leftAdjust;
    ctx.drawImage(img, drawX, -h + 5, w, h);
    ctx.restore();
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
    // Normalize wind into 5 discrete levels (0-5) for readability on the flag
    // Typical wind from physics hovers around ±0.1, so clamp to keep signals obvious.
    const absWind = Math.abs(wind);
    const normalized = Math.min(absWind / 0.12, 1); // 0 → calm, ~0.12 → max level
    const level = Math.min(5, Math.max(0, Math.round(normalized * 5)));
    const intensity = level / 5; // Discrete 0-1 for 5 wind levels

    this.state.flagLevel = level;
    this.state.flagDirection = wind >= 0 ? 1 : -1;

    // Faster flutter with stronger wind; also accelerate the frame timer slightly
    const baseInterval = 260; // Calm wind
    const fastestInterval = 60; // Gale
    const interval = baseInterval - intensity * (baseInterval - fastestInterval);
    const flutterBoost = 0.8 + intensity * 2.2; // More updates per ms when windy

    this.state.flagFrameTimer += deltaMs * flutterBoost;
    if (this.state.flagFrameTimer >= interval) {
      this.state.flagFrameTimer = 0;
      this.state.flagFrame = (this.state.flagFrame + 1) % 4;
    }

    // Lean the pole into the wind and add a small sinusoidal sway so direction is visible
    const baseLean = intensity * 0.18; // Up to ~10°
    this.state.flagWavePhase += deltaMs * (0.002 + intensity * 0.006);
    const sway = Math.sin(this.state.flagWavePhase) * 0.05 * (0.5 + intensity);
    this.state.flagLean = (baseLean + sway) * this.state.flagDirection;
  }

  private updateWindParticles(wind: number, deltaMs: number): void {
    const windStrength = Math.abs(wind);

    // Spawn new particles based on wind strength
    const spawnRate = windStrength * 0.01; // Particles per ms
    if (Math.random() < spawnRate * deltaMs && this.state.windParticles.length < 20) {
      this.spawnWindParticle(wind);
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

  private spawnWindParticle(wind: number): void {
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

  private updateWindSwooshes(wind: number, deltaMs: number): void {
    const windStrength = Math.abs(wind);

    // Spawn swooshes occasionally in strong wind
    const spawnChance = windStrength * 0.0005 * deltaMs;
    if (Math.random() < spawnChance && this.state.windSwooshes.length < 3) {
      this.spawnWindSwoosh();
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

  private spawnWindSwoosh(): void {
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
    // Void offset - slight shift down for better ground visibility
    const VOID_Y_OFFSET = H * 0.025;
    const voidY = groundY + VOID_Y_OFFSET;
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
    const groundY = H - 19;

    // Offset to align cliff tip with physics edge (CLIFF_EDGE = 420)
    const TERRAIN_OFFSET_X = -50; // TODO: adjust after visual testing

    // Draw terrain ground strip
    const groundImg = assetLoader.getImage(BACKGROUND_ASSETS.terrain.ground);
    if (groundImg) {
      const w = ASSET_DIMENSIONS.terrainGround.width * ASSET_SCALE;
      const h = ASSET_DIMENSIONS.terrainGround.height * ASSET_SCALE;
      ctx.drawImage(groundImg, TERRAIN_OFFSET_X, groundY - h + 28, w, h);
    }

    // Draw cliff edge detail
    const cliffImg = assetLoader.getImage(BACKGROUND_ASSETS.terrain.cliffEdge);
    if (cliffImg) {
      const w = ASSET_DIMENSIONS.cliffEdge.width * ASSET_SCALE;
      const h = ASSET_DIMENSIONS.cliffEdge.height * ASSET_SCALE;
      // Position cliff edge at CLIFF_EDGE x coordinate
      ctx.drawImage(cliffImg, CLIFF_EDGE - w * 0.3 + TERRAIN_OFFSET_X, groundY - h * 0.18, w, h);
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

  // --- Decorative elements ---

  private drawSun(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.decor.sun);
    if (!img) return;

    const w = ASSET_DIMENSIONS.sun.width * ASSET_SCALE * 1.6;
    const h = ASSET_DIMENSIONS.sun.height * ASSET_SCALE * 1.6;

    // Top right corner
    ctx.drawImage(img, W - w - 15, 8, w, h);
  }

  private updateBirds(wind: number, deltaMs: number): void {
    if (!this.state.birds) return;
    const deltaS = deltaMs / 1000;

    for (const bird of this.state.birds) {
      // Move with wind influence
      bird.x += (bird.vx + wind * 0.3) * deltaS * 60;

      // Gentle vertical bobbing
      bird.wingPhase += deltaS * 4;
      bird.y = bird.baseY + Math.sin(bird.wingPhase) * 3;

      // Wrap around screen
      if (bird.x > W + 30) bird.x = -30;
      if (bird.x < -30) bird.x = W + 30;
    }
  }

  private drawBirds(ctx: CanvasRenderingContext2D): void {
    if (!this.state.birds) return;
    for (const bird of this.state.birds) {
      const assetKey = bird.asset === 'dove' ? 'birdDove' : 'birdSeagull';
      const img = assetLoader.getImage(BACKGROUND_ASSETS.decor[assetKey]);
      if (!img) continue;

      const w = ASSET_DIMENSIONS.bird.width * ASSET_SCALE * 1.6;
      const h = ASSET_DIMENSIONS.bird.height * ASSET_SCALE * 1.6;

      // Flip based on movement direction
      ctx.save();
      if (bird.vx < 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(img, -bird.x - w / 2, bird.y - h / 2, w, h);
      } else {
        ctx.drawImage(img, bird.x - w / 2, bird.y - h / 2, w, h);
      }
      ctx.restore();
    }
  }

  private drawTree(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.decor.tree);
    if (!img) return;

    const w = ASSET_DIMENSIONS.tree.width * ASSET_SCALE * 1.4;
    const h = ASSET_DIMENSIONS.tree.height * ASSET_SCALE * 1.4;
    const groundY = H - 20;

    // Golden ratio position (~61.8% from left)
    const goldenX = W * 0.618;
    ctx.drawImage(img, goldenX - w / 2, groundY - h + 5, w, h);
  }

  private drawBush(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.decor.bush);
    if (!img) return;

    const w = ASSET_DIMENSIONS.bush.width * ASSET_SCALE * 1.4;
    const h = ASSET_DIMENSIONS.bush.height * ASSET_SCALE * 1.4;
    const groundY = H - 20;

    // Background position (behind main action)
    ctx.globalAlpha = 0.7;  // Slightly faded for depth
    ctx.drawImage(img, 180, groundY - h + 8, w, h);
    ctx.globalAlpha = 1;
  }

  private drawRocks(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.decor.rocks);
    if (!img) return;

    const w = ASSET_DIMENSIONS.rocks.width * ASSET_SCALE * 1.2;
    const h = ASSET_DIMENSIONS.rocks.height * ASSET_SCALE * 1.2;
    const groundY = H - 20;

    // Foreground position
    ctx.drawImage(img, 60, groundY - h + 10, w, h);
  }

  private drawGrass(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.decor.grass);
    if (!img) return;

    const w = ASSET_DIMENSIONS.grass.width * ASSET_SCALE * 1.0;
    const h = ASSET_DIMENSIONS.grass.height * ASSET_SCALE * 1.0;
    const groundY = H - 20;

    // Scatter 3 grass tufts
    const positions = [
      { x: 100, alpha: 0.8 },
      { x: 220, alpha: 0.6 },
      { x: 340, alpha: 0.7 },
    ];

    for (const pos of positions) {
      ctx.globalAlpha = pos.alpha;
      ctx.drawImage(img, pos.x, groundY - h + 8, w, h);
    }
    ctx.globalAlpha = 1;
  }

  private drawSignpost(ctx: CanvasRenderingContext2D): void {
    const img = assetLoader.getImage(BACKGROUND_ASSETS.decor.signpost);
    if (!img) return;

    const w = ASSET_DIMENSIONS.signpost.width * ASSET_SCALE * 1.2;
    const h = ASSET_DIMENSIONS.signpost.height * ASSET_SCALE * 1.2;
    const groundY = H - 20;

    // Near edge, ~50px behind cliff (CLIFF_EDGE = 420)
    const signX = CLIFF_EDGE - 50;
    ctx.drawImage(img, signX - w / 2, groundY - h + 5, w, h);
  }
}

/** Singleton instance */
export const backgroundRenderer = new BackgroundRenderer();
