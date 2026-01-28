// src/game/engine/arcade/generator/transform.ts
import type { CharacterData, StrokePoint, Archetype, ArchetypeTransform } from './types';
import type { StrokeOverlay } from '../types';
import { ARCHETYPE_TRANSFORMS } from './archetypes';
import { extractStrokeWidthsWithDensity } from './stroke-width-extractor';

// Game canvas bounds
const GAME_BOUNDS = {
  minX: 50,
  maxX: 400,
  minY: 30,
  maxY: 190,
};

const MIN_DOODLE_SPACING = 25; // Reduced for smaller doodles

const SVG_BOUNDS = {
  width: 1000,
  height: 1000,
};

export interface TransformOptions {
  rotation?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  archetype?: Archetype;
}

export class StrokeTransformer {
  private options: Required<TransformOptions>;
  private transform: ArchetypeTransform;

  constructor(options: TransformOptions = {}) {
    this.options = {
      rotation: options.rotation ?? 0,
      flipHorizontal: options.flipHorizontal ?? false,
      archetype: options.archetype ?? 'general',
    };
    this.transform = ARCHETYPE_TRANSFORMS[this.options.archetype];
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
   * Extract doodle positions using archetype-specific transform
   * Limits to MAX_STROKES (3) clear paths and distributes doodles along them
   */
  extractDoodlePositions(character: CharacterData, targetCount: number = 0): StrokePoint[] {
    const MAX_STROKES = 3; // Maximum number of distinct paths

    // Get strokes with their transformed points
    const strokesWithPoints = character.strokes.map(stroke => ({
      points: stroke.points.map(p => this.applyRotationAndFlip(p)),
      length: stroke.points.length,
    }));

    if (strokesWithPoints.length === 0) return [];

    // Sort strokes by length (longest first) and take top MAX_STROKES
    const sortedStrokes = [...strokesWithPoints]
      .sort((a, b) => b.length - a.length)
      .slice(0, MAX_STROKES);

    // Calculate total points across selected strokes
    const totalPoints = sortedStrokes.reduce((sum, s) => sum + s.points.length, 0);
    if (totalPoints === 0) return [];

    // Determine count
    const count = targetCount > 0 ? targetCount : Math.min(totalPoints, 15);
    if (count === 0) return [];

    // Calculate global bounds for normalization
    const allPoints = sortedStrokes.flatMap(s => s.points);
    const xs = allPoints.map(p => p.x);
    const ys = allPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Distribute doodles proportionally across strokes based on stroke length
    const sampled: Array<{ x: number; y: number }> = [];
    let doodlesRemaining = count;

    for (let strokeIdx = 0; strokeIdx < sortedStrokes.length; strokeIdx++) {
      const stroke = sortedStrokes[strokeIdx];
      const isLastStroke = strokeIdx === sortedStrokes.length - 1;

      // Calculate how many doodles for this stroke (proportional to length)
      const strokeRatio = stroke.points.length / totalPoints;
      const doodlesForStroke = isLastStroke
        ? doodlesRemaining // Last stroke gets all remaining
        : Math.max(1, Math.round(count * strokeRatio));

      const actualCount = Math.min(doodlesForStroke, doodlesRemaining);
      doodlesRemaining -= actualCount;

      // Sample points evenly along this stroke (maintaining stroke order)
      for (let i = 0; i < actualCount; i++) {
        const idx = actualCount > 1
          ? Math.floor((i / (actualCount - 1)) * (stroke.points.length - 1))
          : Math.floor(stroke.points.length / 2);

        const point = stroke.points[Math.min(idx, stroke.points.length - 1)];

        // Normalize point
        sampled.push({
          x: (point.x - minX) / rangeX,
          y: (point.y - minY) / rangeY,
        });
      }
    }

    // Apply archetype-specific transform
    const positions = this.applyArchetypeTransform(sampled);

    // Ensure minimum spacing
    this.enforceSpacing(positions);

    return positions;
  }

  /**
   * Apply archetype-specific coordinate transformation
   */
  private applyArchetypeTransform(normalized: Array<{ x: number; y: number }>): StrokePoint[] {
    const t = this.transform;
    const positions: StrokePoint[] = [];

    for (let i = 0; i < normalized.length; i++) {
      const n = normalized[i];
      let x: number, y: number;

      // Handle X transformation
      if (t.bifurcateX && t.leftCluster && t.rightCluster) {
        // Split: alternate between left and right clusters
        if (i % 2 === 0) {
          x = t.leftCluster.min + n.x * (t.leftCluster.max - t.leftCluster.min);
        } else {
          x = t.rightCluster.min + n.x * (t.rightCluster.max - t.rightCluster.min);
        }
      } else if (t.pushToEdges) {
        // Perimeter: push toward edges
        const centerDist = Math.abs(n.x - 0.5) + Math.abs(n.y - 0.5);
        const pushFactor = 1.5 - centerDist;
        const pushed = n.x + (n.x - 0.5) * pushFactor * 0.5;
        x = t.xMin + Math.max(0, Math.min(1, pushed)) * (t.xMax - t.xMin);
      } else {
        // Normal X spread
        x = t.xMin + n.x * (t.xMax - t.xMin);
      }

      // Handle Y transformation
      if (t.alternateBands && t.bandA && t.bandB) {
        // Zigzag: alternate between bands
        const band = i % 2 === 0 ? t.bandA : t.bandB;
        y = band.min + n.y * (band.max - band.min);
      } else if (t.invertY) {
        // Climber: invert Y (start low, end high)
        y = t.yMax - n.y * (t.yMax - t.yMin);
      } else {
        // Normal Y mapping
        y = t.yMin + n.y * (t.yMax - t.yMin);
      }

      // Clamp to game bounds
      x = Math.max(GAME_BOUNDS.minX, Math.min(GAME_BOUNDS.maxX, x));
      y = Math.max(GAME_BOUNDS.minY, Math.min(GAME_BOUNDS.maxY, y));

      positions.push({ x: Math.round(x), y: Math.round(y) });
    }

    return positions;
  }

  /**
   * Enforce minimum spacing between doodles
   */
  private enforceSpacing(positions: StrokePoint[]): void {
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_DOODLE_SPACING) {
        // If points are at same position, push in X direction
        if (distance === 0) {
          dx = MIN_DOODLE_SPACING;
          dy = 0;
        } else {
          // Scale the offset to achieve minimum spacing
          const scale = MIN_DOODLE_SPACING / distance;
          dx = dx * scale;
          dy = dy * scale;
        }

        curr.x = Math.round(prev.x + dx);
        curr.y = Math.round(prev.y + dy);

        // Clamp to bounds
        curr.x = Math.max(GAME_BOUNDS.minX, Math.min(GAME_BOUNDS.maxX, curr.x));
        curr.y = Math.max(GAME_BOUNDS.minY, Math.min(GAME_BOUNDS.maxY, curr.y));
      }
    }
  }

  /**
   * Apply rotation and flip to a point (in SVG coordinates)
   */
  private applyRotationAndFlip(point: StrokePoint): StrokePoint {
    let { x, y } = point;

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

  /**
   * Get the full path for trajectory analysis
   */
  getFullPath(character: CharacterData): StrokePoint[] {
    return this.transformToGameCanvas(character);
  }

  /**
   * Get the archetype being used
   */
  getArchetype(): Archetype {
    return this.options.archetype;
  }

  /**
   * Create stroke overlays for editor visualization
   * Transforms all strokes to game coordinates with width data
   */
  createStrokeOverlays(character: CharacterData): StrokeOverlay[] {
    const overlays: StrokeOverlay[] = [];

    for (let i = 0; i < character.strokes.length; i++) {
      const stroke = character.strokes[i];
      const transformedPoints: Array<{ x: number; y: number }> = [];

      // Transform each point from SVG to game coordinates
      for (const point of stroke.points) {
        const rotated = this.applyRotationAndFlip(point);
        const gameCoords = this.svgToGameCoords(rotated);
        transformedPoints.push(gameCoords);
      }

      // Extract widths for calligraphic sizing
      const widths = extractStrokeWidthsWithDensity(stroke.points);

      overlays.push({
        id: `stroke-${i}`,
        points: transformedPoints,
        widths,
        populated: false,
        doodleIds: [],
      });
    }

    return overlays;
  }

  /**
   * Convert SVG coordinates (0-1000) to game canvas coordinates
   */
  private svgToGameCoords(point: StrokePoint): { x: number; y: number } {
    // SVG bounds: 0-1000 x 0-1000
    // Game bounds: 50-400 (X), 30-190 (Y)
    const nx = point.x / SVG_BOUNDS.width;  // Normalize to 0-1
    const ny = point.y / SVG_BOUNDS.height;

    const gameX = GAME_BOUNDS.minX + nx * (GAME_BOUNDS.maxX - GAME_BOUNDS.minX);
    const gameY = GAME_BOUNDS.minY + ny * (GAME_BOUNDS.maxY - GAME_BOUNDS.minY);

    return {
      x: Math.round(gameX),
      y: Math.round(gameY),
    };
  }
}
