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
