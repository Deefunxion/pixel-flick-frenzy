// src/game/engine/celebrations/confetti.ts

import type { ConfettiParticle, CelebrationIntensity } from './types';
import { W, H } from '@/game/constants';

const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF69B4',
];

const INTENSITY_CONFIG: Record<CelebrationIntensity, { count: number; spread: number; speed: number }> = {
  small: { count: 30, spread: 100, speed: 3 },
  medium: { count: 80, spread: 200, speed: 4 },
  large: { count: 150, spread: 300, speed: 5 },
  epic: { count: 300, spread: 400, speed: 6 },
};

export class ConfettiSystem {
  private particles: ConfettiParticle[] = [];

  emit(intensity: CelebrationIntensity, originX: number = W / 2, originY: number = H / 3): void {
    const config = INTENSITY_CONFIG[intensity];

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      this.particles.push({
        x: originX + (Math.random() - 0.5) * 50,
        y: originY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed * (0.3 + Math.random() * 0.7),
        vy: Math.sin(angle) * speed - 2, // Bias upward initially
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 6,
        life: 120 + Math.random() * 60,
        maxLife: 120 + Math.random() * 60,
        shape: ['rect', 'circle', 'star'][Math.floor(Math.random() * 3)] as 'rect' | 'circle' | 'star',
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.vx *= 0.99; // Air resistance
      p.rotation += p.rotationSpeed;
      p.life--;

      // Flutter effect
      p.vx += Math.sin(p.rotation) * 0.1;

      // Remove dead particles
      if (p.life <= 0 || p.y > H + 20) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / 30);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      switch (p.shape) {
        case 'rect':
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star':
          this.drawStar(ctx, 0, 0, p.size / 2);
          break;
      }

      ctx.restore();
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144 - 90) * Math.PI / 180;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  get isActive(): boolean {
    return this.particles.length > 0;
  }

  clear(): void {
    this.particles = [];
  }
}

export const confettiSystem = new ConfettiSystem();
