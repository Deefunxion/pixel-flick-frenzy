import type { AudioRefs, AudioSettings } from '../types';
import { ensureAudioContext } from '../context';
import { playTone } from './tone';

export function playRecordBreak(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Rising triumphant arpeggio
  const notes = [392, 494, 587, 784, 988]; // G4, B4, D5, G5, B5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const startTime = now + i * 0.06;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12 * settings.volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.45);
  });
}

function playGradeFanfare(ctx: AudioContext, volume: number): void {
  // Quick ascending fanfare: C5, E5, G5, C6
  const notes = [523, 659, 784, 1047];
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.1;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.35 * volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

function playGradeWomp(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;

  // First womp
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(200, now);

  gain1.gain.setValueAtTime(0.2 * volume, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Second womp (descending)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(180, now + 0.2);
  osc2.frequency.exponentialRampToValueAtTime(80, now + 0.6);

  gain2.gain.setValueAtTime(0.2 * volume, now + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.2);
  osc2.stop(now + 0.65);
}

/**
 * Play sound for landing grade
 */
export function playGradeSound(refs: AudioRefs, settings: AudioSettings, grade: 'S' | 'A' | 'B' | 'C' | 'D'): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = refs.ctx;
  const vol = settings.volume;

  switch (grade) {
    case 'S':
      // Fanfare - quick ascending arpeggio
      playGradeFanfare(ctx, vol);
      break;
    case 'A':
      // Success chime (3 notes)
      playTone(refs, settings, 659, 0.15, 'sine', 0.3);
      setTimeout(() => playTone(refs, settings, 784, 0.15, 'sine', 0.3), 100);
      setTimeout(() => playTone(refs, settings, 988, 0.2, 'sine', 0.4), 200);
      break;
    case 'B':
      // Soft ding
      playTone(refs, settings, 523, 0.2, 'sine', 0.25);
      break;
    case 'C':
      // Neutral
      playTone(refs, settings, 392, 0.15, 'triangle', 0.15);
      break;
    case 'D':
      // Womp womp (descending)
      playGradeWomp(ctx, vol);
      break;
  }
}

/**
 * Sweet spot click - satisfying feedback when entering optimal charge range
 */
export function playSweetSpotClick(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = refs.ctx;
  const vol = settings.volume;
  const now = ctx.currentTime;

  // Short, satisfying click
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, now);

  gain.gain.setValueAtTime(0.2 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Streak break sound (sad fizzle)
 * Plays when a hot streak is lost
 */
export function playStreakBreakSound(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = refs.ctx;
  const vol = settings.volume;
  const now = ctx.currentTime;

  // Fizzle sound - descending sawtooth
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

  gain.gain.setValueAtTime(0.15 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.55);
}
