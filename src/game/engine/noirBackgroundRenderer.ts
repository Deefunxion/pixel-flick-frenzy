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

    // Cliff edge rock removed - only flag marks the edge
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
