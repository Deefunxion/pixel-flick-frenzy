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

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;
  private maxParticles = 150;

  emit(type: ParticleType, options: ParticleEmitOptions): void {
    const count = options.count ?? 5;
    const spread = options.spread ?? Math.PI * 0.5;
    const baseAngle = options.baseAngle ?? -Math.PI / 2; // Default: upward
    const baseSpeed = options.speed ?? 2;
    const speedVar = options.speedVariance ?? 1;
    const baseLife = options.life ?? 30;
    const lifeVar = options.lifeVariance ?? 10;
    const baseSize = options.size ?? 3;
    const sizeVar = options.sizeVariance ?? 1;
    const gravity = options.gravity ?? 0.1;
    const color = options.color ?? '#1a4a7a';

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        // Remove oldest particle
        this.particles.shift();
      }

      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = baseSpeed + (Math.random() - 0.5) * speedVar * 2;
      const life = baseLife + (Math.random() - 0.5) * lifeVar * 2;
      const size = baseSize + (Math.random() - 0.5) * sizeVar * 2;

      this.particles.push({
        id: this.nextId++,
        type,
        x: options.x + (Math.random() - 0.5) * 10,
        y: options.y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Math.max(1, size),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        color,
        gravity: type === 'swirl' ? 0 : gravity, // Swirls don't fall
      });
    }
  }

  update(deltaTime: number = 1): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Apply gravity
      p.vy += p.gravity * deltaTime;

      // Update rotation for debris
      p.rotation += p.rotationSpeed * deltaTime;

      // Decrease life
      p.life -= deltaTime;

      // Apply type-specific behaviors
      if (p.type === 'swirl') {
        // Swirls orbit and expand slightly
        const orbitSpeed = 0.1;
        const tempX = p.vx;
        p.vx = p.vx * Math.cos(orbitSpeed) - p.vy * Math.sin(orbitSpeed);
        p.vy = tempX * Math.sin(orbitSpeed) + p.vy * Math.cos(orbitSpeed);
      } else if (p.type === 'dust') {
        // Dust expands and slows
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.size *= 1.02;
      }

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }

  get count(): number {
    return this.particles.length;
  }
}
