/**
 * Haptic Feedback System
 *
 * Provides tactile feedback for key game events.
 * Uses Vibration API with graceful fallback.
 *
 * Research: "Combined audiohaptic feedback significantly enhances
 * motor performance and precision" - Husain et al., 2019
 */

// Check for Vibration API support
export function hasHapticSupport(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// User preference for haptics
let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('omf_haptics_enabled', enabled ? '1' : '0');
  }
}

export function getHapticsEnabled(): boolean {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('omf_haptics_enabled');
    if (stored !== null) {
      hapticsEnabled = stored === '1';
    }
  }
  return hapticsEnabled;
}

/**
 * Trigger haptic feedback
 * @param pattern - Single duration or pattern array [vibrate, pause, vibrate, ...]
 */
function vibrate(pattern: number | number[]): void {
  if (!hapticsEnabled || !hasHapticSupport()) return;

  try {
    navigator.vibrate(pattern);
  } catch (e) {
    // Silently fail - haptics are enhancement, not critical
  }
}

// === Haptic Patterns ===

/**
 * Ring collection - short, satisfying tap
 * Intensity scales with ring index (0, 1, 2)
 */
export function hapticRingCollect(ringIndex: number): void {
  const durations = [20, 35, 50];  // Escalating intensity
  vibrate(durations[Math.min(ringIndex, 2)]);
}

/**
 * Perfect landing - celebratory pattern
 */
export function hapticPerfectLanding(): void {
  vibrate([50, 30, 80]);  // Short-pause-long
}

/**
 * Good landing - single medium pulse
 */
export function hapticGoodLanding(): void {
  vibrate(40);
}

/**
 * Near-miss - dramatic pulse synced with heartbeat
 */
export function hapticNearMiss(): void {
  vibrate([80, 150, 60]);  // thump-pause-thump
}

/**
 * Fail/fall - impact feedback
 */
export function hapticFail(): void {
  vibrate(60);
}

/**
 * Achievement unlock - celebration pattern
 */
export function hapticAchievement(): void {
  vibrate([30, 50, 30, 50, 80]);  // Quick celebration
}

/**
 * Multiplier threshold crossed
 */
export function hapticMultiplierThreshold(): void {
  vibrate([25, 25, 40]);
}

/**
 * Action denied - sharp negative feedback
 */
export function hapticDenied(): void {
  vibrate([15, 30, 15]);  // Quick double-tap
}

/**
 * Charge release - snap feedback
 */
export function hapticRelease(): void {
  vibrate(30);
}

/**
 * Streak milestone (3, 5, 10, 15)
 */
export function hapticStreakMilestone(streak: number): void {
  if (streak >= 10) {
    vibrate([40, 30, 40, 30, 60]);  // Big celebration
  } else if (streak >= 5) {
    vibrate([30, 30, 50]);
  } else {
    vibrate([25, 25, 35]);
  }
}

/**
 * Landing impact - scales with velocity
 */
export function hapticLandingImpact(intensity: number): void {
  // intensity 0-1, maps to 20-80ms
  const duration = Math.floor(20 + intensity * 60);
  vibrate(duration);
}

// === Arcade-Specific Haptic Patterns ===

/**
 * Spring bounce - bouncy feedback
 */
export function hapticSpringBounce(strength: number): void {
  // strength 0.5-3.0, maps to 15-60ms
  const duration = Math.floor(15 + (strength / 3) * 45);
  vibrate(duration);
}

/**
 * Portal warp - whooshy pattern
 */
export function hapticPortalWarp(): void {
  vibrate([20, 30, 40, 30, 20]);
}

/**
 * Doodle collect - light tap
 */
export function hapticDoodleCollect(): void {
  vibrate(15);
}

/**
 * Hazard hit - sharp negative
 */
export function hapticHazardHit(): void {
  vibrate([40, 20, 60]);
}

/**
 * World unlock - celebration
 */
export function hapticWorldUnlock(): void {
  vibrate([30, 50, 30, 50, 100]);
}

/**
 * Galaxy unlock - epic celebration
 */
export function hapticGalaxyUnlock(): void {
  vibrate([50, 30, 50, 30, 50, 30, 150]);
}
