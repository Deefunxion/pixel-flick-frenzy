// src/game/engine/arcade/generator/transform.ts
import type { CharacterData, StrokePoint, Archetype, ArchetypeTransform } from './types';
import { ARCHETYPE_TRANSFORMS } from './archetypes';

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
   */
  extractDoodlePositions(character: CharacterData, targetCount: number = 0): StrokePoint[] {
    // Collect and normalize character points
    const rawPoints: StrokePoint[] = [];
    for (const stroke of character.strokes) {
      for (const point of stroke.points) {
        rawPoints.push(this.applyRotationAndFlip(point));
      }
    }

    if (rawPoints.length === 0) return [];

    // Normalize to 0-1 range
    const xs = rawPoints.map(p => p.x);
    const ys = rawPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const normalized = rawPoints.map(p => ({
      x: (p.x - minX) / rangeX,
      y: (p.y - minY) / rangeY,
    }));

    // Sort by X for consistent ordering
    normalized.sort((a, b) => a.x - b.x);

    // Determine count
    const count = targetCount > 0 ? targetCount : Math.min(rawPoints.length, 15);
    if (count === 0) return [];

    // Sample points evenly
    const sampled: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i++) {
      const idx = count > 1
        ? Math.floor((i / (count - 1)) * (normalized.length - 1))
        : 0;
      sampled.push(normalized[Math.min(idx, normalized.length - 1)]);
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
}
