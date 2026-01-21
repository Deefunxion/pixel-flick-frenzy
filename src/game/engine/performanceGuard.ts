/**
 * Performance Guardrails
 *
 * Monitors and enforces performance limits for juice effects.
 * Critical for Google Play Store success (battery/performance reviews).
 *
 * Guardrails:
 * - Particle budget (max 100-200)
 * - FPS monitoring with auto-degradation
 * - Audio instance limits
 * - Battery-conscious haptic limits
 */

// Configuration
const MAX_PARTICLES = 150;
const TARGET_FPS = 60;
const FPS_WARNING_THRESHOLD = 45;
const FPS_CRITICAL_THRESHOLD = 30;

// Tracking
let frameTimestamps: number[] = [];
let currentFPS = 60;
let qualityLevel: 'high' | 'medium' | 'low' = 'high';

// Particle budget
let activeParticleCount = 0;

/**
 * Update FPS tracking (call every frame)
 */
export function trackFrame(timestamp: number): void {
  frameTimestamps.push(timestamp);

  // Keep last 60 frames
  if (frameTimestamps.length > 60) {
    frameTimestamps.shift();
  }

  // Calculate FPS
  if (frameTimestamps.length >= 2) {
    const oldest = frameTimestamps[0];
    const newest = frameTimestamps[frameTimestamps.length - 1];
    const duration = newest - oldest;
    currentFPS = Math.round((frameTimestamps.length - 1) / (duration / 1000));
  }

  // Auto-adjust quality
  if (currentFPS < FPS_CRITICAL_THRESHOLD) {
    qualityLevel = 'low';
  } else if (currentFPS < FPS_WARNING_THRESHOLD) {
    qualityLevel = 'medium';
  } else {
    qualityLevel = 'high';
  }
}

/**
 * Get current FPS
 */
export function getCurrentFPS(): number {
  return currentFPS;
}

/**
 * Get current quality level
 */
export function getQualityLevel(): 'high' | 'medium' | 'low' {
  return qualityLevel;
}

/**
 * Check if we can spawn more particles
 */
export function canSpawnParticles(count: number): boolean {
  const limit = qualityLevel === 'high' ? MAX_PARTICLES
              : qualityLevel === 'medium' ? MAX_PARTICLES * 0.6
              : MAX_PARTICLES * 0.3;

  return activeParticleCount + count <= limit;
}

/**
 * Register particle spawn
 */
export function registerParticles(count: number): void {
  activeParticleCount += count;
}

/**
 * Register particle death
 */
export function unregisterParticles(count: number): void {
  activeParticleCount = Math.max(0, activeParticleCount - count);
}

/**
 * Get scaled particle count based on quality
 */
export function getScaledParticleCount(baseCount: number): number {
  const scale = qualityLevel === 'high' ? 1.0
              : qualityLevel === 'medium' ? 0.6
              : 0.3;
  return Math.max(1, Math.round(baseCount * scale));
}

/**
 * Check if effect should be skipped for performance
 */
export function shouldSkipEffect(effectType: 'particle' | 'glow' | 'shake'): boolean {
  if (qualityLevel === 'low') {
    // In low quality, skip non-essential effects
    return effectType === 'glow';
  }
  if (qualityLevel === 'medium') {
    // In medium, skip expensive effects sometimes
    return effectType === 'glow' && Math.random() > 0.5;
  }
  return false;
}

/**
 * Get maximum concurrent haptic operations
 * Battery-conscious limiting
 */
export function getMaxHapticOps(): number {
  return qualityLevel === 'high' ? 10
       : qualityLevel === 'medium' ? 5
       : 2;
}

/**
 * Reset performance tracking (call on game restart)
 */
export function resetPerformanceTracking(): void {
  frameTimestamps = [];
  currentFPS = 60;
  qualityLevel = 'high';
  activeParticleCount = 0;
}
