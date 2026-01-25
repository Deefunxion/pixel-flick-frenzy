// src/game/engine/arcade/generator/transform.ts
import type { CharacterData, StrokePoint } from './types';

// Game canvas bounds (game units)
// Full play area: x from 50 (safe start) to 400 (before cliff edge)
const GAME_BOUNDS = {
  minX: 50,          // Start of play area (safe distance from launch pad)
  maxX: 400,         // End of play area (safe distance from cliff edge at 420)
  minY: 35,          // Top of play area
  maxY: 190,         // Bottom (above ground at ~220)
};

// Minimum spacing between doodles for playability
const MIN_DOODLE_SPACING = 40;

// SVG source bounds (Make Me a Hanzi uses 0-1000)
const SVG_BOUNDS = {
  width: 1000,
  height: 1000,
};

export interface TransformOptions {
  rotation?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
}

export class StrokeTransformer {
  private options: Required<TransformOptions>;

  constructor(options: TransformOptions = {}) {
    this.options = {
      rotation: options.rotation ?? 0,
      flipHorizontal: options.flipHorizontal ?? false,
    };
  }

  /**
   * Transform all stroke points to game canvas coordinates (basic transform)
   */
  transformToGameCanvas(character: CharacterData): StrokePoint[] {
    const allPoints: StrokePoint[] = [];

    for (const stroke of character.strokes) {
      for (const point of stroke.points) {
        allPoints.push(this.transformPointBasic(point));
      }
    }

    return allPoints;
  }

  /**
   * Extract doodle positions - SPREAD evenly across the play area
   * Uses character Y-pattern as inspiration but redistributes X positions
   * for playable trajectories
   */
  extractDoodlePositions(character: CharacterData, targetCount: number = 0): StrokePoint[] {
    // Step 1: Collect ALL points from the character
    const rawPoints: StrokePoint[] = [];
    for (const stroke of character.strokes) {
      for (const point of stroke.points) {
        rawPoints.push(this.applyRotationAndFlip(point));
      }
    }

    if (rawPoints.length === 0) return [];

    // Step 2: Normalize Y values to get relative heights (0-1)
    const minY = Math.min(...rawPoints.map(p => p.y));
    const maxY = Math.max(...rawPoints.map(p => p.y));
    const yRange = maxY - minY || 1;

    const normalizedPoints = rawPoints.map(p => ({
      x: p.x,
      yNorm: (p.y - minY) / yRange, // 0 = top of character, 1 = bottom
    }));

    // Step 3: Sort by X to get left-to-right order
    normalizedPoints.sort((a, b) => a.x - b.x);

    // Step 4: Determine how many positions we need
    const count = targetCount > 0 ? targetCount : Math.min(rawPoints.length, 15);

    // Step 5: Create Y pattern by sampling from normalized points
    // If we need more positions than we have points, we'll interpolate
    const yValues: number[] = [];

    if (normalizedPoints.length >= count) {
      // Sample evenly across the sorted points
      for (let i = 0; i < count; i++) {
        const idx = count > 1
          ? Math.floor((i / (count - 1)) * (normalizedPoints.length - 1))
          : 0;
        yValues.push(normalizedPoints[idx].yNorm);
      }
    } else {
      // We have fewer points than needed - interpolate
      for (let i = 0; i < count; i++) {
        const progress = count > 1 ? i / (count - 1) : 0.5;
        const floatIdx = progress * (normalizedPoints.length - 1);
        const lowIdx = Math.floor(floatIdx);
        const highIdx = Math.min(lowIdx + 1, normalizedPoints.length - 1);
        const blend = floatIdx - lowIdx;

        const yNorm = normalizedPoints[lowIdx].yNorm * (1 - blend) +
                      normalizedPoints[highIdx].yNorm * blend;
        yValues.push(yNorm);
      }
    }

    // Step 6: Redistribute X positions EVENLY across play area
    const playWidth = GAME_BOUNDS.maxX - GAME_BOUNDS.minX; // 350 pixels
    const playHeight = GAME_BOUNDS.maxY - GAME_BOUNDS.minY; // 155 pixels

    const positions: StrokePoint[] = [];

    for (let i = 0; i < count; i++) {
      // X: evenly distributed from left to right
      const xProgress = count > 1 ? i / (count - 1) : 0.5;
      const x = GAME_BOUNDS.minX + xProgress * playWidth;

      // Y: use the character's relative Y pattern, mapped to play area
      // Add some variation based on position to create interesting arcs
      const baseY = GAME_BOUNDS.minY + yValues[i] * playHeight;

      // Create a gentle arc - higher in the middle
      const arcInfluence = Math.sin(xProgress * Math.PI) * 30;
      const y = Math.max(GAME_BOUNDS.minY, Math.min(GAME_BOUNDS.maxY, baseY - arcInfluence));

      positions.push({
        x: Math.round(x),
        y: Math.round(y),
      });
    }

    // Step 6: Ensure minimum spacing (adjust Y if X positions cause overlap)
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const dx = curr.x - prev.x;
      const dy = Math.abs(curr.y - prev.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_DOODLE_SPACING) {
        // Adjust Y to increase spacing
        const neededDy = Math.sqrt(MIN_DOODLE_SPACING * MIN_DOODLE_SPACING - dx * dx);
        if (curr.y >= prev.y) {
          curr.y = Math.min(GAME_BOUNDS.maxY, prev.y + neededDy);
        } else {
          curr.y = Math.max(GAME_BOUNDS.minY, prev.y - neededDy);
        }
      }
    }

    return positions;
  }

  /**
   * Get the full path for trajectory analysis
   */
  getFullPath(character: CharacterData): StrokePoint[] {
    return this.transformToGameCanvas(character);
  }

  /**
   * Apply rotation and flip to a point (in SVG coordinates)
   */
  private applyRotationAndFlip(point: StrokePoint): StrokePoint {
    let { x, y } = point;

    // Apply rotation around center
    if (this.options.rotation !== 0) {
      const cx = SVG_BOUNDS.width / 2;
      const cy = SVG_BOUNDS.height / 2;
      const rad = (this.options.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const nx = cos * (x - cx) - sin * (y - cy) + cx;
      const ny = sin * (x - cx) + cos * (y - cy) + cy;
      x = nx;
      y = ny;
    }

    // Apply flip
    if (this.options.flipHorizontal) {
      x = SVG_BOUNDS.width - x;
    }

    return { x, y };
  }

  /**
   * Basic point transformation to game coordinates
   */
  private transformPointBasic(point: StrokePoint): StrokePoint {
    const rotated = this.applyRotationAndFlip(point);

    // Map SVG coords (0-1000) to game coords
    const x = GAME_BOUNDS.minX + (rotated.x / SVG_BOUNDS.width) * (GAME_BOUNDS.maxX - GAME_BOUNDS.minX);
    const y = GAME_BOUNDS.minY + (rotated.y / SVG_BOUNDS.height) * (GAME_BOUNDS.maxY - GAME_BOUNDS.minY);

    return {
      x: Math.round(x),
      y: Math.round(y),
    };
  }
}
