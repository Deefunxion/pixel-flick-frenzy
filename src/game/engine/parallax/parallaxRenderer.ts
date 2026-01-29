// src/game/engine/parallax/parallaxRenderer.ts

import type { ParallaxConfig, ParallaxLayer } from './types';
import type { GalaxyColorPalette, GalaxyParallaxAssets } from '../arcade/progression/types';
import { W, H } from '@/game/constants';

export class ParallaxRenderer {
  private config: ParallaxConfig;
  private scrollOffset: number = 0;
  private currentGalaxyId: number = 0;
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.config = this.createDefaultConfig();
  }

  private createDefaultConfig(): ParallaxConfig {
    return {
      far: { image: null, scrollSpeed: 0.1, yOffset: 0, opacity: 0.6 },
      mid: { image: null, scrollSpeed: 0.3, yOffset: 40, opacity: 0.8 },
      near: { image: null, scrollSpeed: 0.6, yOffset: 100, opacity: 1.0 },
    };
  }

  async loadGalaxy(galaxyId: number, assets: GalaxyParallaxAssets): Promise<void> {
    if (this.currentGalaxyId === galaxyId) return;

    const loadImage = async (path: string): Promise<HTMLImageElement> => {
      if (this.loadedImages.has(path)) {
        return this.loadedImages.get(path)!;
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.loadedImages.set(path, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = `/assets/parallax/${path}`;
      });
    };

    try {
      const [far, mid, near] = await Promise.all([
        loadImage(assets.far),
        loadImage(assets.mid),
        loadImage(assets.near),
      ]);

      this.config.far.image = far;
      this.config.mid.image = mid;
      this.config.near.image = near;
      this.currentGalaxyId = galaxyId;
    } catch (e) {
      console.warn('Failed to load parallax assets for galaxy', galaxyId);
    }
  }

  update(playerX: number): void {
    // Scroll based on player position (0-420 range)
    this.scrollOffset = playerX;
  }

  render(ctx: CanvasRenderingContext2D, palette: GalaxyColorPalette): void {
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, palette.sky);
    gradient.addColorStop(0.7, palette.horizon);
    gradient.addColorStop(1, palette.ground);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Draw parallax layers (far to near)
    this.renderLayer(ctx, this.config.far);
    this.renderLayer(ctx, this.config.mid);
    this.renderLayer(ctx, this.config.near);
  }

  private renderLayer(ctx: CanvasRenderingContext2D, layer: ParallaxLayer): void {
    if (!layer.image) return;

    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Calculate scroll position (seamless wrap)
    const scrollX = -(this.scrollOffset * layer.scrollSpeed) % layer.image.width;

    // Draw image twice for seamless scrolling
    ctx.drawImage(layer.image, scrollX, layer.yOffset);
    ctx.drawImage(layer.image, scrollX + layer.image.width, layer.yOffset);

    ctx.restore();
  }

  get currentGalaxy(): number {
    return this.currentGalaxyId;
  }

  reset(): void {
    this.scrollOffset = 0;
    this.currentGalaxyId = 0;
    this.config = this.createDefaultConfig();
  }
}

export const parallaxRenderer = new ParallaxRenderer();
