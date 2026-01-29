// src/game/engine/celebrations/manager.ts

import { confettiSystem } from './confetti';
import type { CelebrationIntensity } from './types';
import type { AudioRefs, AudioSettings } from '@/game/audio/types';
import { playStarBurst, playWorldFanfare, playGalaxyFanfare, playRankReveal } from '@/game/audio/celebrations';
import { hapticAchievement, hapticPerfectLanding } from '../haptics';
import { W, H } from '@/game/constants';

export type CelebrationType =
  | 'level-3star'
  | 'world-complete'
  | 'galaxy-complete'
  | 'daily-rank';

interface CelebrationOptions {
  audioRefs: AudioRefs;
  audioSettings: AudioSettings;
  rank?: number; // For daily-rank
}

export function triggerCelebration(
  type: CelebrationType,
  options: CelebrationOptions
): void {
  const { audioRefs, audioSettings, rank } = options;

  switch (type) {
    case 'level-3star':
      confettiSystem.emit('small', W / 2, H / 2);
      playStarBurst(audioRefs, audioSettings);
      hapticPerfectLanding();
      break;

    case 'world-complete':
      confettiSystem.emit('large', W / 2, H / 3);
      playWorldFanfare(audioRefs, audioSettings);
      hapticAchievement();
      break;

    case 'galaxy-complete':
      confettiSystem.emit('epic', W / 2, H / 4);
      playGalaxyFanfare(audioRefs, audioSettings);
      hapticAchievement();
      // Trigger screen shake or other effects here
      break;

    case 'daily-rank':
      confettiSystem.emit('medium', W / 2, H / 2);
      playRankReveal(audioRefs, audioSettings, rank ?? 50);
      hapticAchievement();
      break;
  }
}

export function updateCelebrations(): void {
  confettiSystem.update();
}

export function renderCelebrations(ctx: CanvasRenderingContext2D): void {
  confettiSystem.render(ctx);
}

export function isCelebrationActive(): boolean {
  return confettiSystem.isActive;
}
