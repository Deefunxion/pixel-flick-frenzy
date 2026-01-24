/**
 * Update system barrel export
 * Re-exports the main frame orchestrator and types
 */

// Main exports - public API
export { updateFrame } from './frame';
export type { GameAudio, GameUI, GameServices } from './frame';

// Internal modules not re-exported (implementation detail)
// - input.ts
// - charge.ts
// - flight.ts
// - slide.ts
// - outcomes.ts
// - progression.ts
// - cinematic.ts
// - fx.ts
