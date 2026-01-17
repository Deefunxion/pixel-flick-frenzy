// src/game/engine/animator.ts

import { Sprite } from './sprite';
import {
  AnimationName,
  AnimationConfig,
  ANIMATIONS,
  SPRITE_SHEETS,
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
    this.frameTimer = 0;
    this.finished = false;
    this.isPlaying = true;

    // For 'win' animation, randomly select one of the frames
    if (name === 'win') {
      const config = this.animationConfigs.get(name)!;
      this.currentFrameIndex = Math.floor(Math.random() * config.frames.length);
    } else {
      this.currentFrameIndex = 0;
    }
  }

  /**
   * Update animation timing.
   * Call this every frame with deltaTime in seconds.
   */
  public update(deltaTime: number): void {
    if (!this.isPlaying || this.finished) return;

    const config = this.animationConfigs.get(this.currentAnimation);
    if (!config) return;

    // Clamp deltaTime to prevent huge jumps (defensive for mobile)
    const safeDeltaTime = Math.min(deltaTime, 0.1); // Max 100ms per frame
    const frameDuration = 1 / config.frameRate;
    this.frameTimer += safeDeltaTime;

    // Limit iterations to prevent infinite loop (defensive)
    let iterations = 0;
    const maxIterations = 10;

    // Advance frames based on elapsed time
    while (this.frameTimer >= frameDuration && iterations < maxIterations) {
      this.frameTimer -= frameDuration;
      this.currentFrameIndex++;
      iterations++;

      // Handle end of animation
      if (this.currentFrameIndex >= config.frames.length) {
        if (config.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = config.frames.length - 1;
          this.finished = true;
          break;
        }
      }
    }

    // Final safety clamp
    if (this.currentFrameIndex < 0) this.currentFrameIndex = 0;
    if (config.frames.length > 0 && this.currentFrameIndex >= config.frames.length) {
      this.currentFrameIndex = config.frames.length - 1;
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
    if (!sprites || sprites.length === 0) {
      // Fallback: try to get idle animation sprites
      const idleSprites = this.sprites.get('idle');
      if (idleSprites && idleSprites.length > 0) {
        idleSprites[0].draw(ctx, x, y, ZENO_DISPLAY_WIDTH, ZENO_DISPLAY_HEIGHT, flipH);
      }
      return;
    }

    // Clamp frame index to valid range (defensive fix for mobile)
    const safeFrameIndex = Math.max(0, Math.min(this.currentFrameIndex, sprites.length - 1));
    const sprite = sprites[safeFrameIndex];
    if (!sprite) {
      // Fallback to first frame
      if (sprites[0]) {
        sprites[0].draw(ctx, x, y, ZENO_DISPLAY_WIDTH, ZENO_DISPLAY_HEIGHT, flipH);
      }
      return;
    }

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
