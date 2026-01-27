// src/game/engine/arcade/generator/types.ts
import type { ArcadeLevel } from '../types';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface CharacterStroke {
  path: string; // SVG path data
  points: StrokePoint[]; // Simplified key points
}

export interface CharacterData {
  character: string;
  strokes: CharacterStroke[];
  strokeCount: number;
}

export interface GeneratorConfig {
  seed: string;
  levelRange: { start: number; end: number };
}

export interface GenerationResult {
  success: boolean;
  level?: ArcadeLevel;
  ghostReplay?: GhostInput[];
  error?: string;
  attempts: number;
}

export interface GhostInput {
  timestamp: number;
  action: 'press' | 'release';
}

// Archetype definitions for level variety
export type Archetype = 'runner' | 'diver' | 'climber' | 'zigzag' | 'perimeter' | 'split' | 'general';

export interface ArchetypeTransform {
  // X range on game canvas (50-400)
  xMin: number;
  xMax: number;
  // Y range on game canvas (30-190)
  yMin: number;
  yMax: number;
  // Whether to invert Y (for climber - start low, end high)
  invertY: boolean;
  // Whether Y alternates between bands (for zigzag)
  alternateBands: boolean;
  // Band ranges for alternating (zigzag only)
  bandA?: { min: number; max: number };
  bandB?: { min: number; max: number };
  // Whether to push points toward edges (perimeter)
  pushToEdges: boolean;
  // Whether to split into two X clusters (split)
  bifurcateX: boolean;
  leftCluster?: { min: number; max: number };
  rightCluster?: { min: number; max: number };
}

export interface CharacterClassification {
  character: string;
  strokeCount: number;
  archetype: Archetype;
  // Raw metrics used for classification
  aspectRatio: number;      // width / height
  verticalCoM: number;      // 0 = top, 1 = bottom
  horizontalSpread: number; // 0 = clustered, 1 = full spread
}

export interface ClassifiedCharacterData extends CharacterData {
  archetype: Archetype;
  aspectRatio: number;
  verticalCoM: number;
}
