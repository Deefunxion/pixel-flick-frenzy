/**
 * Audio Pool & Anti-Fatigue System
 *
 * Prevents audio fatigue through:
 * - Sound pooling (max concurrent instances)
 * - Pitch variation (random within range)
 * - Session volume decay
 * - Cooldown enforcement
 *
 * Research: "Slightly randomize the pitch of frequent sound effects
 * (within 0.9-1.1 range) to reduce perceptual fatigue"
 */

interface PooledSound {
  lastPlayedAt: number;
  playCount: number;
}

// Track sound instances
const soundPool: Map<string, PooledSound[]> = new Map();

// Configuration
const MAX_CONCURRENT_SOUNDS = 4;
const DEFAULT_COOLDOWN_MS = 100;
const PITCH_VARIATION = 0.15;  // +/-15%

// Session volume decay
let sessionStartTime = Date.now();
let sessionVolumeMultiplier = 1.0;
const VOLUME_DECAY_INTERVAL_MS = 3 * 60 * 1000;  // Every 3 minutes
const VOLUME_DECAY_AMOUNT = 0.05;  // 5% quieter
const MIN_SESSION_VOLUME = 0.7;  // Never below 70%

/**
 * Update session volume (call periodically)
 */
export function updateSessionVolume(): number {
  const elapsed = Date.now() - sessionStartTime;
  const decaySteps = Math.floor(elapsed / VOLUME_DECAY_INTERVAL_MS);
  sessionVolumeMultiplier = Math.max(
    MIN_SESSION_VOLUME,
    1.0 - (decaySteps * VOLUME_DECAY_AMOUNT)
  );
  return sessionVolumeMultiplier;
}

/**
 * Reset session volume (e.g., on page focus)
 */
export function resetSessionVolume(): void {
  sessionStartTime = Date.now();
  sessionVolumeMultiplier = 1.0;
}

/**
 * Get current session volume multiplier
 */
export function getSessionVolumeMultiplier(): number {
  return sessionVolumeMultiplier;
}

/**
 * Check if a sound can play (respects pooling and cooldown)
 */
export function canPlaySound(
  soundId: string,
  cooldownMs: number = DEFAULT_COOLDOWN_MS
): boolean {
  const now = Date.now();
  const pool = soundPool.get(soundId) || [];

  // Clean up old entries (older than 1 second)
  const activePool = pool.filter(s => now - s.lastPlayedAt < 1000);

  // Check concurrent limit
  if (activePool.length >= MAX_CONCURRENT_SOUNDS) {
    return false;
  }

  // Check cooldown
  const lastPlayed = activePool[activePool.length - 1];
  if (lastPlayed && now - lastPlayed.lastPlayedAt < cooldownMs) {
    return false;
  }

  return true;
}

/**
 * Register a sound play
 */
export function registerSoundPlay(soundId: string): void {
  const now = Date.now();
  const pool = soundPool.get(soundId) || [];

  // Clean up old entries (older than 1 second)
  const activePool = pool.filter(s => now - s.lastPlayedAt < 1000);

  activePool.push({ lastPlayedAt: now, playCount: 1 });
  soundPool.set(soundId, activePool);
}

/**
 * Get random pitch variation
 * Returns multiplier between (1 - variation) and (1 + variation)
 */
export function getRandomPitch(variation: number = PITCH_VARIATION): number {
  return 1 + (Math.random() * 2 - 1) * variation;
}

/**
 * Get volume with session decay applied
 */
export function getDecayedVolume(baseVolume: number): number {
  updateSessionVolume();
  return baseVolume * sessionVolumeMultiplier;
}

/**
 * Cooldown values for different sound types
 */
export const SOUND_COOLDOWNS = {
  ringCollect: 150,
  coinCollect: 100,
  impact: 200,
  whoosh: 100,
  denied: 300,
  achievement: 500,
  gradeSound: 300,
  heartbeat: 400,
};

/**
 * Clear the entire sound pool (e.g., on game reset)
 */
export function clearSoundPool(): void {
  soundPool.clear();
}
