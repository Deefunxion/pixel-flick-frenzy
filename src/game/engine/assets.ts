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
