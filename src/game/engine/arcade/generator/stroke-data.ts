// src/game/engine/arcade/generator/stroke-data.ts
import type { CharacterData, ClassifiedCharacterData, Archetype } from './types';

// Stroke count ranges for level difficulty
export const STROKE_RANGES: Record<string, { min: number; max: number }> = {
  '1-10': { min: 1, max: 3 },
  '11-20': { min: 3, max: 5 },
  '21-40': { min: 5, max: 8 },
  '41-70': { min: 8, max: 12 },
  '71-100': { min: 12, max: 16 },
  '101-150': { min: 14, max: 18 },
  '151-200': { min: 16, max: 22 },
  '201-250': { min: 18, max: 25 },
};

export function getStrokeRangeForLevel(level: number): { min: number; max: number } {
  if (level <= 10) return STROKE_RANGES['1-10'];
  if (level <= 20) return STROKE_RANGES['11-20'];
  if (level <= 40) return STROKE_RANGES['21-40'];
  if (level <= 70) return STROKE_RANGES['41-70'];
  if (level <= 100) return STROKE_RANGES['71-100'];
  if (level <= 150) return STROKE_RANGES['101-150'];
  if (level <= 200) return STROKE_RANGES['151-200'];
  return STROKE_RANGES['201-250'];
}

// Will be populated from hanzi-classified.json (or hanzi-strokes.json as fallback)
let characterDatabase: ClassifiedCharacterData[] = [];

export async function loadStrokeDatabase(): Promise<void> {
  if (characterDatabase.length > 0) return;

  // Try classified data first, fall back to original
  try {
    const response = await fetch('/data/hanzi-classified.json');
    characterDatabase = await response.json();
  } catch {
    // Fallback: load original and classify on the fly (slower)
    const response = await fetch('/data/hanzi-strokes.json');
    const original: CharacterData[] = await response.json();
    const { classifyCharacter } = await import('./character-classifier');
    characterDatabase = original.map(c => ({
      ...c,
      archetype: classifyCharacter(c).archetype,
      aspectRatio: classifyCharacter(c).aspectRatio,
      verticalCoM: classifyCharacter(c).verticalCoM,
    }));
  }
}

/**
 * Get characters matching a specific archetype and stroke count range
 */
export function getCharactersByArchetype(
  archetype: Archetype,
  minStrokes: number,
  maxStrokes: number
): ClassifiedCharacterData[] {
  return characterDatabase.filter(c =>
    c.archetype === archetype &&
    c.strokeCount >= minStrokes &&
    c.strokeCount <= maxStrokes
  );
}

export function getCharactersByStrokeCount(min: number, max: number): ClassifiedCharacterData[] {
  return characterDatabase.filter(c => c.strokeCount >= min && c.strokeCount <= max);
}

export function getCharacterDatabase(): ClassifiedCharacterData[] {
  return characterDatabase;
}

// For testing: allow direct setting of database
export function setCharacterDatabase(data: CharacterData[]): void {
  // Convert to ClassifiedCharacterData if needed
  characterDatabase = data.map(c => {
    if ('archetype' in c) {
      return c as ClassifiedCharacterData;
    }
    // For test data without archetype, default to 'general'
    return {
      ...c,
      archetype: 'general' as Archetype,
      aspectRatio: 1,
      verticalCoM: 0.5,
    };
  });
}
