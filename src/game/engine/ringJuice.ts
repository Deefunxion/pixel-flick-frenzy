/**
 * Ring Collection Juice System
 *
 * Provides escalating feedback for ring collection:
 * - Text popups ("Nice!", "Great!", "PERFECT!")
 * - Screen edge glow effects
 * - Micro-freeze timing
 */

export interface RingJuicePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  scale: number;
  opacity: number;
}

// Escalating text based on rings collected this throw
export const RING_FEEDBACK = [
  { text: 'Nice!', color: '#7FD858', glow: false },      // Ring 1 - green
  { text: 'Great!', color: '#FFD700', glow: true },      // Ring 2 - gold + edge glow
  { text: 'PERFECT!', color: '#FFA500', glow: true, flash: true },  // Ring 3 - orange + flash
];

// Popup animation constants
export const POPUP_DURATION_MS = 800;
export const POPUP_RISE_SPEED = 40;  // pixels per second
export const POPUP_FADE_START = 0.6; // start fading at 60% of duration

// Micro-freeze duration (skip if already in slow-mo)
export const MICRO_FREEZE_MS = 70;

/**
 * Create a juice popup for ring collection
 */
export function createRingPopup(
  ringX: number,
  ringY: number,
  ringIndex: number,  // 0, 1, or 2 (how many collected so far, 0-indexed)
  now: number
): RingJuicePopup {
  const feedback = RING_FEEDBACK[Math.min(ringIndex, 2)];
  return {
    x: ringX,
    y: ringY - 20,  // Start slightly above ring
    text: feedback.text,
    color: feedback.color,
    createdAt: now,
    scale: 1.5,     // Start big
    opacity: 1.0,
  };
}

/**
 * Update all juice popups (call each frame)
 */
export function updateRingPopups(
  popups: RingJuicePopup[],
  deltaMs: number,
  now: number
): RingJuicePopup[] {
  return popups
    .map(popup => {
      const age = now - popup.createdAt;
      const progress = age / POPUP_DURATION_MS;

      // Rise upward
      const newY = popup.y - (POPUP_RISE_SPEED * deltaMs / 1000);

      // Scale: 1.5 → 1.0 over first 200ms
      const scaleProgress = Math.min(age / 200, 1);
      const newScale = 1.5 - 0.5 * scaleProgress;

      // Fade: start at 60%, complete at 100%
      const fadeProgress = Math.max(0, (progress - POPUP_FADE_START) / (1 - POPUP_FADE_START));
      const newOpacity = 1 - fadeProgress;

      return {
        ...popup,
        y: newY,
        scale: newScale,
        opacity: newOpacity,
      };
    })
    .filter(popup => (now - popup.createdAt) < POPUP_DURATION_MS);
}

/**
 * Check if we should apply micro-freeze
 */
export function shouldMicroFreeze(currentSlowMo: number): boolean {
  // Skip if already in slow-mo (> 0.3 means significant slowdown)
  return currentSlowMo < 0.3;
}

/**
 * Get edge glow intensity (0-1) based on rings collected
 */
export function getEdgeGlowIntensity(ringsCollected: number): number {
  if (ringsCollected < 2) return 0;
  if (ringsCollected === 2) return 0.3;
  return 0.6;  // 3 rings
}

/**
 * Check if screen flash should trigger
 */
export function shouldScreenFlash(ringsCollected: number): boolean {
  return ringsCollected >= 3;
}
