/**
 * Input Buffer System
 *
 * Stores player inputs during slow-mo/freeze frames
 * and applies them when time resumes.
 *
 * Research: "Buffer Inputs: Store input events during the freeze
 * and apply them once time resumes to maintain responsiveness"
 */

interface BufferedInput {
  type: 'press' | 'release' | 'tap';
  timestamp: number;
  data?: {
    x?: number;
    y?: number;
  };
}

// Buffer storage
let inputBuffer: BufferedInput[] = [];
let bufferingActive = false;

// Buffer window (how long to hold inputs)
const BUFFER_WINDOW_MS = 200;

/**
 * Start buffering inputs (call when entering slow-mo/freeze)
 */
export function startBuffering(): void {
  bufferingActive = true;
  inputBuffer = [];
}

/**
 * Stop buffering and return buffered inputs
 */
export function stopBuffering(): BufferedInput[] {
  bufferingActive = false;
  const buffered = [...inputBuffer];
  inputBuffer = [];
  return buffered;
}

/**
 * Check if currently buffering
 */
export function isBuffering(): boolean {
  return bufferingActive;
}

/**
 * Add input to buffer (call from input handlers)
 */
export function bufferInput(
  type: BufferedInput['type'],
  data?: BufferedInput['data']
): void {
  if (!bufferingActive) return;

  const now = Date.now();

  // Clear old inputs outside buffer window
  inputBuffer = inputBuffer.filter(
    input => now - input.timestamp < BUFFER_WINDOW_MS
  );

  inputBuffer.push({
    type,
    timestamp: now,
    data,
  });
}

/**
 * Get the most recent buffered input of a type
 */
export function getBufferedInput(type: BufferedInput['type']): BufferedInput | null {
  const matching = inputBuffer.filter(i => i.type === type);
  return matching.length > 0 ? matching[matching.length - 1] : null;
}

/**
 * Check if a specific input was buffered
 */
export function hasBufferedInput(type: BufferedInput['type']): boolean {
  return inputBuffer.some(i => i.type === type);
}

/**
 * Clear the buffer
 */
export function clearBuffer(): void {
  inputBuffer = [];
}
