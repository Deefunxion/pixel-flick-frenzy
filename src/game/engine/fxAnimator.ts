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
