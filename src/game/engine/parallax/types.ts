// src/game/engine/parallax/types.ts

export interface ParallaxLayer {
  image: HTMLImageElement | null;
  scrollSpeed: number;  // 0.1 = slow (far), 1.0 = fast (near)
  yOffset: number;      // Vertical position
  opacity: number;
}

export interface ParallaxConfig {
  far: ParallaxLayer;
  mid: ParallaxLayer;
  near: ParallaxLayer;
}
