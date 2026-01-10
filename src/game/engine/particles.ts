// Particle system for visual effects
// Types: swirl (charging energy), dust (landing), debris (impact), crack (ground impact)

export type ParticleType = 'swirl' | 'dust' | 'debris' | 'crack' | 'spark';

export interface Particle {
  id: number;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;      // Current life (counts down)
  maxLife: number;   // Initial life for calculating alpha
  size: number;
  rotation: number;  // For debris
  rotationSpeed: number;
  color: string;
  gravity: number;   // Per-particle gravity
}

export interface ParticleEmitOptions {
  x: number;
  y: number;
  count?: number;
  spread?: number;      // Angle spread in radians
  baseAngle?: number;   // Direction to emit
  speed?: number;
  speedVariance?: number;
  life?: number;
  lifeVariance?: number;
  size?: number;
  sizeVariance?: number;
  color?: string;
  gravity?: number;
}
