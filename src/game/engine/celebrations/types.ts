// src/game/engine/celebrations/types.ts

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape: 'rect' | 'circle' | 'star';
}

export type CelebrationIntensity = 'small' | 'medium' | 'large' | 'epic';
