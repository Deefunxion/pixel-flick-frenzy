import { describe, it, expect } from 'vitest';
import {
  classifyCharacter,
  calculateAspectRatio,
  calculateVerticalCoM,
  detectAlternatingStrokes
} from '../character-classifier';
import type { CharacterData } from '../types';

// Helper to create test character data
function makeCharacter(points: Array<{ x: number; y: number }>): CharacterData {
  return {
    character: 'test',
    strokeCount: 1,
    strokes: [{ path: '', points }],
  };
}

describe('calculateAspectRatio', () => {
  it('returns > 1.5 for wide horizontal line', () => {
    const char = makeCharacter([
      { x: 100, y: 500 },
      { x: 900, y: 500 },
    ]);
    expect(calculateAspectRatio(char)).toBeGreaterThan(1.5);
  });

  it('returns < 0.7 for tall vertical line', () => {
    const char = makeCharacter([
      { x: 500, y: 100 },
      { x: 500, y: 900 },
    ]);
    expect(calculateAspectRatio(char)).toBeLessThan(0.7);
  });

  it('returns ~1 for square shape', () => {
    const char = makeCharacter([
      { x: 200, y: 200 },
      { x: 800, y: 200 },
      { x: 800, y: 800 },
      { x: 200, y: 800 },
    ]);
    const ratio = calculateAspectRatio(char);
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.2);
  });
});

describe('calculateVerticalCoM', () => {
  it('returns < 0.4 for top-heavy character', () => {
    // Most points clustered at top, with one anchor at bottom
    const char = makeCharacter([
      { x: 300, y: 100 },
      { x: 400, y: 120 },
      { x: 500, y: 150 },
      { x: 600, y: 140 },
      { x: 700, y: 130 },
      { x: 500, y: 900 }, // Anchor point to establish range
    ]);
    expect(calculateVerticalCoM(char)).toBeLessThan(0.4);
  });

  it('returns > 0.6 for bottom-heavy character', () => {
    // Most points clustered at bottom, with one anchor at top
    const char = makeCharacter([
      { x: 500, y: 100 }, // Anchor point to establish range
      { x: 300, y: 800 },
      { x: 400, y: 820 },
      { x: 500, y: 850 },
      { x: 600, y: 830 },
      { x: 700, y: 900 },
    ]);
    expect(calculateVerticalCoM(char)).toBeGreaterThan(0.6);
  });
});

describe('detectAlternatingStrokes', () => {
  it('returns true for character with alternating horizontal/vertical strokes', () => {
    const char: CharacterData = {
      character: 'test',
      strokeCount: 4,
      strokes: [
        { path: '', points: [{ x: 100, y: 500 }, { x: 900, y: 500 }] }, // horizontal
        { path: '', points: [{ x: 500, y: 100 }, { x: 500, y: 400 }] }, // vertical
        { path: '', points: [{ x: 100, y: 600 }, { x: 900, y: 600 }] }, // horizontal
        { path: '', points: [{ x: 500, y: 700 }, { x: 500, y: 900 }] }, // vertical
      ],
    };
    expect(detectAlternatingStrokes(char)).toBe(true);
  });

  it('returns false for all horizontal strokes', () => {
    const char: CharacterData = {
      character: 'test',
      strokeCount: 3,
      strokes: [
        { path: '', points: [{ x: 100, y: 300 }, { x: 900, y: 300 }] },
        { path: '', points: [{ x: 100, y: 500 }, { x: 900, y: 500 }] },
        { path: '', points: [{ x: 100, y: 700 }, { x: 900, y: 700 }] },
      ],
    };
    expect(detectAlternatingStrokes(char)).toBe(false);
  });
});

describe('classifyCharacter', () => {
  it('classifies wide character as runner', () => {
    const char = makeCharacter([
      { x: 100, y: 500 },
      { x: 500, y: 480 },
      { x: 900, y: 520 },
    ]);
    expect(classifyCharacter(char).archetype).toBe('runner');
  });

  it('classifies tall bottom-heavy character as climber', () => {
    const char = makeCharacter([
      { x: 500, y: 900 },
      { x: 480, y: 700 },
      { x: 520, y: 500 },
      { x: 500, y: 100 },
    ]);
    expect(classifyCharacter(char).archetype).toBe('climber');
  });

  it('classifies top-heavy character as diver', () => {
    // Tall character (aspect < 1.5) with most mass at top
    const char = makeCharacter([
      { x: 400, y: 100 },
      { x: 500, y: 120 },
      { x: 600, y: 150 },
      { x: 450, y: 180 },
      { x: 550, y: 200 },
      { x: 500, y: 900 }, // Anchor point to establish range
    ]);
    expect(classifyCharacter(char).archetype).toBe('diver');
  });

  it('classifies ambiguous character as general', () => {
    // Square-ish shape with evenly distributed mass (many points in center)
    const char = makeCharacter([
      { x: 300, y: 300 },
      { x: 400, y: 400 },
      { x: 500, y: 450 },
      { x: 600, y: 500 },
      { x: 500, y: 550 },
      { x: 400, y: 600 },
      { x: 700, y: 700 },
    ]);
    expect(classifyCharacter(char).archetype).toBe('general');
  });
});
