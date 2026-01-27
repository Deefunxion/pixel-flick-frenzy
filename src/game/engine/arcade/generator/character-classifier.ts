// src/game/engine/arcade/generator/character-classifier.ts
import type { Archetype, CharacterData, CharacterClassification } from './types';

/**
 * Calculate aspect ratio (width / height) of character bounding box
 * > 1.5 = wide, < 0.7 = tall
 */
export function calculateAspectRatio(char: CharacterData): number {
  const points = char.strokes.flatMap(s => s.points);
  if (points.length < 2) return 1;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);

  if (height === 0) return 10; // Very wide
  return width / height;
}

/**
 * Calculate vertical center of mass (0 = top, 1 = bottom)
 * Based on SVG coordinates where Y increases downward
 */
export function calculateVerticalCoM(char: CharacterData): number {
  const points = char.strokes.flatMap(s => s.points);
  if (points.length === 0) return 0.5;

  const ys = points.map(p => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;

  if (maxY === minY) return 0.5;
  return (avgY - minY) / (maxY - minY);
}

/**
 * Detect if stroke has horizontal orientation (width > height * 2)
 */
function isHorizontalStroke(points: Array<{ x: number; y: number }>): boolean {
  if (points.length < 2) return false;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return width > height * 2;
}

/**
 * Detect if stroke has vertical orientation (height > width * 2)
 */
function isVerticalStroke(points: Array<{ x: number; y: number }>): boolean {
  if (points.length < 2) return false;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return height > width * 2;
}

/**
 * Detect if character has 3+ strokes with alternating orientations
 */
export function detectAlternatingStrokes(char: CharacterData): boolean {
  if (char.strokes.length < 3) return false;

  const orientations = char.strokes.map(s => {
    if (isHorizontalStroke(s.points)) return 'h';
    if (isVerticalStroke(s.points)) return 'v';
    return 'o'; // other/diagonal
  });

  // Count alternations
  let alternations = 0;
  for (let i = 1; i < orientations.length; i++) {
    const prev = orientations[i - 1];
    const curr = orientations[i];
    if ((prev === 'h' && curr === 'v') || (prev === 'v' && curr === 'h')) {
      alternations++;
    }
  }

  return alternations >= 2;
}

/**
 * Detect if points cluster near edges (sparse center)
 */
function detectPerimeterPattern(char: CharacterData): boolean {
  const points = char.strokes.flatMap(s => s.points);
  if (points.length < 4) return false;

  // Normalize points to 0-1
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  if (maxX === minX || maxY === minY) return false;

  // Count points near edges vs center
  let edgeCount = 0;
  let centerCount = 0;

  for (const p of points) {
    const nx = (p.x - minX) / (maxX - minX);
    const ny = (p.y - minY) / (maxY - minY);

    // Near edge = within 0.25 of any edge
    const nearEdge = nx < 0.25 || nx > 0.75 || ny < 0.25 || ny > 0.75;
    if (nearEdge) {
      edgeCount++;
    } else {
      centerCount++;
    }
  }

  // Perimeter if >70% of points near edges
  return edgeCount > points.length * 0.7;
}

/**
 * Detect if character has two distinct point clusters (gap in middle)
 */
function detectSplitPattern(char: CharacterData): boolean {
  const points = char.strokes.flatMap(s => s.points);
  if (points.length < 4) return false;

  const xs = points.map(p => p.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);

  if (maxX === minX) return false;

  // Normalize X to 0-1 and count distribution
  const normalized = points.map(p => (p.x - minX) / (maxX - minX));

  const leftCount = normalized.filter(x => x < 0.35).length;
  const centerCount = normalized.filter(x => x >= 0.35 && x <= 0.65).length;
  const rightCount = normalized.filter(x => x > 0.65).length;

  // Split if center is sparse and both sides have points
  return centerCount < points.length * 0.2 &&
         leftCount > points.length * 0.25 &&
         rightCount > points.length * 0.25;
}

/**
 * Classify a character into an archetype based on its shape
 */
export function classifyCharacter(char: CharacterData): CharacterClassification {
  const aspectRatio = calculateAspectRatio(char);
  const verticalCoM = calculateVerticalCoM(char);

  let archetype: Archetype = 'general';

  // Priority order for classification
  // 1. Runner: very wide
  if (aspectRatio > 1.5) {
    archetype = 'runner';
  }
  // 2. Climber: tall AND bottom-heavy
  else if (aspectRatio < 0.7 && verticalCoM > 0.5) {
    archetype = 'climber';
  }
  // 3. Diver: top-heavy (regardless of aspect)
  else if (verticalCoM < 0.4) {
    archetype = 'diver';
  }
  // 4. Zigzag: alternating stroke orientations
  else if (detectAlternatingStrokes(char)) {
    archetype = 'zigzag';
  }
  // 5. Perimeter: points clustered near edges
  else if (detectPerimeterPattern(char)) {
    archetype = 'perimeter';
  }
  // 6. Split: two distinct clusters
  else if (detectSplitPattern(char)) {
    archetype = 'split';
  }
  // 7. General: doesn't strongly match any pattern

  return {
    character: char.character,
    strokeCount: char.strokeCount,
    archetype,
    aspectRatio,
    verticalCoM,
    horizontalSpread: 0, // Not used in current classification
  };
}

/**
 * Classify all characters in a database
 */
export function classifyAllCharacters(characters: CharacterData[]): CharacterClassification[] {
  return characters.map(classifyCharacter);
}
