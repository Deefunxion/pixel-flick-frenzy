/**
 * Route Node Completion Juice System
 *
 * Provides feedback when completing route nodes:
 * - Text popups ("ROUTE 1!", "ROUTE 2!", "COMBO!")
 * - Distinct purple/blue theme (vs green/gold for rings)
 */

export interface RouteJuicePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  scale: number;
  opacity: number;
  nodeIndex: number; // Which node was completed (0, 1, 2...)
}

// Escalating text based on route progress
export const ROUTE_FEEDBACK = [
  { text: 'ROUTE 1!', color: '#9B59B6' },  // Purple
  { text: 'ROUTE 2!', color: '#3498DB' },  // Blue
  { text: 'COMBO!', color: '#E91E63' },    // Pink - completing 3+ nodes
];

// Popup animation constants
export const ROUTE_POPUP_DURATION_MS = 1000; // Slightly longer than ring
export const ROUTE_POPUP_RISE_SPEED = 50;    // Faster rise
export const ROUTE_POPUP_FADE_START = 0.5;   // Start fading at 50%

/**
 * Create a juice popup for route node completion
 */
export function createRoutePopup(
  nodeX: number,
  nodeY: number,
  nodeIndex: number,
  now: number
): RouteJuicePopup {
  const feedbackIndex = Math.min(nodeIndex, ROUTE_FEEDBACK.length - 1);
  const feedback = ROUTE_FEEDBACK[feedbackIndex];
  return {
    x: nodeX,
    y: nodeY - 30, // Start above the node
    text: feedback.text,
    color: feedback.color,
    createdAt: now,
    scale: 2.0,    // Start big
    opacity: 1.0,
    nodeIndex,
  };
}

/**
 * Update all route juice popups (call each frame)
 */
export function updateRoutePopups(
  popups: RouteJuicePopup[],
  deltaMs: number,
  now: number
): RouteJuicePopup[] {
  return popups
    .map(popup => {
      const age = now - popup.createdAt;
      const progress = age / ROUTE_POPUP_DURATION_MS;

      // Rise upward
      const newY = popup.y - (ROUTE_POPUP_RISE_SPEED * deltaMs / 1000);

      // Scale: 2.0 → 1.0 over first 300ms (punchy pop-in)
      const scaleProgress = Math.min(age / 300, 1);
      const newScale = 2.0 - 1.0 * scaleProgress;

      // Fade: start at 50%, complete at 100%
      const fadeProgress = Math.max(0, (progress - ROUTE_POPUP_FADE_START) / (1 - ROUTE_POPUP_FADE_START));
      const newOpacity = 1 - fadeProgress;

      return {
        ...popup,
        y: newY,
        scale: newScale,
        opacity: newOpacity,
      };
    })
    .filter(popup => (now - popup.createdAt) < ROUTE_POPUP_DURATION_MS);
}

/**
 * Get audio frequency for route node completion
 * Ascending chord: C5 → E5 → G5
 */
export function getRouteNodeFrequency(nodeIndex: number): number {
  const frequencies = [523, 659, 784]; // C5, E5, G5
  return frequencies[Math.min(nodeIndex, frequencies.length - 1)];
}
