import { describe, it, expect } from 'vitest';
import { extractStrokeWidths, estimateWidthFromPointDensity } from '../stroke-width-extractor';

describe('extractStrokeWidths', () => {
  it('returns width array matching points length', () => {
    const points = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
      { x: 400, y: 100 },
    ];
    const widths = extractStrokeWidths(points);
    expect(widths.length).toBe(points.length);
  });

  it('starts thick and ends thin (calligraphic style)', () => {
    const points = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
      { x: 400, y: 100 },
    ];
    const widths = extractStrokeWidths(points);
    expect(widths[0]).toBeGreaterThan(widths[widths.length - 1]);
  });

  it('width range is 0.6 to 1.4 (normalized)', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({ x: i * 50, y: 100 }));
    const widths = extractStrokeWidths(points);
    for (const w of widths) {
      expect(w).toBeGreaterThanOrEqual(0.6);
      expect(w).toBeLessThanOrEqual(1.4);
    }
  });

  it('handles empty array', () => {
    const widths = extractStrokeWidths([]);
    expect(widths).toEqual([]);
  });

  it('handles single point', () => {
    const widths = extractStrokeWidths([{ x: 100, y: 100 }]);
    expect(widths.length).toBe(1);
    expect(widths[0]).toBe(1.0);
  });
});

describe('estimateWidthFromPointDensity', () => {
  it('returns higher width for dense point clusters', () => {
    const densePoints = [
      { x: 100, y: 100 },
      { x: 105, y: 100 },
      { x: 110, y: 100 },
    ];
    const sparsePoints = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
    ];
    const denseWidth = estimateWidthFromPointDensity(densePoints, 1);
    const sparseWidth = estimateWidthFromPointDensity(sparsePoints, 1);
    expect(denseWidth).toBeGreaterThan(sparseWidth);
  });

  it('handles single point array', () => {
    const width = estimateWidthFromPointDensity([{ x: 100, y: 100 }], 0);
    expect(width).toBe(1.0);
  });
});
