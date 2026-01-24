/**
 * ADSR envelope helper - sets attack/decay envelope on a gain node
 * @param gain - GainNode to apply envelope to
 * @param now - Current audio context time
 * @param peak - Peak gain value
 * @param duration - Duration of envelope decay
 */
export function env(gain: GainNode, now: number, peak: number, duration: number): void {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
}
