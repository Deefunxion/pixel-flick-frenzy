// src/game/engine/arcade/generator/transform.ts
import type { CharacterData, StrokePoint } from './types';

// Game canvas bounds (game units)
// Full play area: x from 50 (safe start) to 400 (before cliff edge)
const GAME_BOUNDS = {
  minX: 50,          // Start of play area (safe distance from launch pad)
  maxX: 400,         // End of play area (safe distance from cliff edge at 420)
  minY: 30,          // Top of play area (just below ceiling at 28)
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
   * Extract doodle positions following REALISTIC PHYSICS trajectory:
   * - Launch phase: Y can decrease (going UP on screen)
   * - After peak: Y must increase (going DOWN on screen due to gravity)
   *
   * Character pattern provides small variations, not the base trajectory.
   */
  extractDoodlePositions(character: CharacterData, targetCount: number = 0): StrokePoint[] {
    // Step 1: Collect points from character for variation inspiration
    const rawPoints: StrokePoint[] = [];
    for (const stroke of character.strokes) {
      for (const point of stroke.points) {
        rawPoints.push(this.applyRotationAndFlip(point));
      }
    }

    if (rawPoints.length === 0) return [];

    // Step 2: Normalize Y values for variation (0 = top, 1 = bottom)
    const minY = Math.min(...rawPoints.map(p => p.y));
    const maxY = Math.max(...rawPoints.map(p => p.y));
    const yRange = maxY - minY || 1;
    const normalizedPoints = rawPoints.map(p => ({
      x: p.x,
      yNorm: (p.y - minY) / yRange,
    }));
    normalizedPoints.sort((a, b) => a.x - b.x);

    // Step 3: Determine count
    const count = targetCount > 0 ? targetCount : Math.min(rawPoints.length, 15);
    if (count === 0) return [];

    // Step 4: Sample character pattern for small variations
    const variations: number[] = [];
    for (let i = 0; i < count; i++) {
      if (normalizedPoints.length >= count) {
        const idx = count > 1 ? Math.floor((i / (count - 1)) * (normalizedPoints.length - 1)) : 0;
        variations.push((normalizedPoints[idx].yNorm - 0.5) * 20); // ±10 pixel variation
      } else {
        const progress = count > 1 ? i / (count - 1) : 0.5;
        const floatIdx = progress * (normalizedPoints.length - 1);
        const lowIdx = Math.floor(floatIdx);
        const highIdx = Math.min(lowIdx + 1, normalizedPoints.length - 1);
        const blend = floatIdx - lowIdx;
        const yNorm = normalizedPoints[lowIdx].yNorm * (1 - blend) +
                      normalizedPoints[highIdx].yNorm * blend;
        variations.push((yNorm - 0.5) * 20);
      }
    }

    // Step 5: Create PHYSICS-BASED parabolic trajectory
    // Screen coords: Y=35 (top/high physically), Y=190 (bottom/low physically)
    // Trajectory: start near ground → peak high → descend to landing

    const playWidth = GAME_BOUNDS.maxX - GAME_BOUNDS.minX; // 350 pixels

    // Peak position: around 25-35% through the trajectory (realistic throw)
    const peakRatio = 0.25 + (rawPoints.length % 10) * 0.01; // Slight variation 0.25-0.35
    const peakIndex = Math.max(2, Math.floor(count * peakRatio));

    // Y boundaries for trajectory
    const launchY = GAME_BOUNDS.maxY - 15;  // ~175 (start near ground)
    const peakY = GAME_BOUNDS.minY + 10;    // ~45 (highest point)
    const landingY = GAME_BOUNDS.maxY - 5;  // ~185 (end near ground)

    const positions: StrokePoint[] = [];

    for (let i = 0; i < count; i++) {
      // X: evenly distributed from left to right
      const xProgress = count > 1 ? i / (count - 1) : 0.5;
      const x = GAME_BOUNDS.minX + xProgress * playWidth;

      let baseY: number;

      if (i <= peakIndex) {
        // ASCENT PHASE: Y decreases (physically going UP)
        // Use smooth easing for natural arc
        const ascentProgress = peakIndex > 0 ? i / peakIndex : 1;
        const eased = 1 - Math.pow(1 - ascentProgress, 2); // ease-out
        baseY = launchY - (launchY - peakY) * eased;
      } else {
        // DESCENT PHASE: Y increases (physically going DOWN due to gravity)
        // Use accelerating easing (gravity)
        const descentProgress = (i - peakIndex) / (count - 1 - peakIndex);
        const eased = Math.pow(descentProgress, 1.5); // accelerating fall
        baseY = peakY + (landingY - peakY) * eased;
      }

      // Add small variation from character pattern
      const variation = variations[i] || 0;
      let y = baseY + variation;

      // Clamp to bounds
      y = Math.max(GAME_BOUNDS.minY, Math.min(GAME_BOUNDS.maxY, y));

      positions.push({
        x: Math.round(x),
        y: Math.round(y),
      });
    }

    // Step 6: ENFORCE PHYSICS CONSTRAINTS
    // After peak, each Y must be >= previous Y (must descend)
    for (let i = peakIndex + 1; i < positions.length; i++) {
      if (positions[i].y < positions[i - 1].y) {
        // Force descent: current must be at or below previous
        positions[i].y = positions[i - 1].y + Math.max(5, MIN_DOODLE_SPACING / 3);
      }
      // Clamp to bounds
      positions[i].y = Math.min(GAME_BOUNDS.maxY, positions[i].y);
    }

    // Step 7: Ensure minimum spacing
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const dx = curr.x - prev.x;
      const dy = Math.abs(curr.y - prev.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_DOODLE_SPACING) {
        const neededDy = Math.sqrt(MIN_DOODLE_SPACING * MIN_DOODLE_SPACING - dx * dx);
        // During descent, always push down; during ascent, push up
        if (i > peakIndex) {
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
