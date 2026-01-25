// src/game/engine/arcade/generator/transform.ts
import type { CharacterData, StrokePoint } from './types';

// Game canvas bounds (game units)
// Full play area: x from 35 (after launch pad) to 410 (before cliff edge)
const GAME_CANVAS = {
  width: 420,
  height: 240,
  minX: 35,          // Start of play area (after launch pad)
  maxX: 410,         // End of play area (before cliff edge at 420)
  topMargin: 25,     // Leave space at top
  bottomMargin: 200, // Leave space for ground (ground at ~220)
};

// SVG source bounds (Make Me a Hanzi uses 0-1000)
const SVG_BOUNDS = {
  width: 1000,
  height: 1000,
};

export interface TransformOptions {
  maintainAspectRatio?: boolean;
  rotation?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  padding?: number;
}

export class StrokeTransformer {
  private options: Required<TransformOptions>;

  constructor(options: TransformOptions = {}) {
    this.options = {
      // Default: DON'T maintain aspect ratio - stretch to fill the wide game canvas
      maintainAspectRatio: options.maintainAspectRatio ?? false,
      rotation: options.rotation ?? 0,
      flipHorizontal: options.flipHorizontal ?? false,
      padding: options.padding ?? 5, // Smaller padding to maximize spread
    };
  }

  /**
   * Transform all stroke points to game canvas coordinates
   */
  transformToGameCanvas(character: CharacterData): StrokePoint[] {
    const allPoints: StrokePoint[] = [];

    for (const stroke of character.strokes) {
      for (const point of stroke.points) {
        allPoints.push(this.transformPoint(point));
      }
    }

    return allPoints;
  }

  /**
   * Extract unique positions for doodle placement
   * Uses stroke endpoints, deduplicates nearby points
   */
  extractDoodlePositions(character: CharacterData): StrokePoint[] {
    const positions: StrokePoint[] = [];
    const MERGE_THRESHOLD = 15; // Merge points closer than this

    for (const stroke of character.strokes) {
      // Use last point of each stroke as doodle position
      if (stroke.points.length > 0) {
        const endPoint = this.transformPoint(stroke.points[stroke.points.length - 1]);

        // Check if too close to existing position
        const tooClose = positions.some(p =>
          Math.abs(p.x - endPoint.x) < MERGE_THRESHOLD &&
          Math.abs(p.y - endPoint.y) < MERGE_THRESHOLD
        );

        if (!tooClose) {
          positions.push(endPoint);
        }
      }
    }

    return positions;
  }

  /**
   * Get the full path for trajectory analysis
   */
  getFullPath(character: CharacterData): StrokePoint[] {
    const path: StrokePoint[] = [];

    for (const stroke of character.strokes) {
      for (const point of stroke.points) {
        path.push(this.transformPoint(point));
      }
    }

    return path;
  }

  private transformPoint(point: StrokePoint): StrokePoint {
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

    // Calculate target bounds (full play zone: 35-410 x 25-200)
    const targetX = {
      min: GAME_CANVAS.minX + this.options.padding,   // 35 + 5 = 40
      max: GAME_CANVAS.maxX - this.options.padding,   // 410 - 5 = 405
    };
    const targetY = {
      min: GAME_CANVAS.topMargin + this.options.padding,     // 25 + 5 = 30
      max: GAME_CANVAS.bottomMargin - this.options.padding,  // 200 - 5 = 195
    };

    const targetWidth = targetX.max - targetX.min;   // 405 - 40 = 365
    const targetHeight = targetY.max - targetY.min;  // 195 - 30 = 165

    // Scale factors - stretch to fill the wide game canvas
    let scaleX = targetWidth / SVG_BOUNDS.width;   // 365/1000 = 0.365
    let scaleY = targetHeight / SVG_BOUNDS.height; // 165/1000 = 0.165

    // Maintain aspect ratio if requested (off by default for better spread)
    if (this.options.maintainAspectRatio) {
      const scale = Math.min(scaleX, scaleY);
      scaleX = scale;
      scaleY = scale;
    }

    // Center offset (only used if maintaining aspect ratio)
    const usedWidth = SVG_BOUNDS.width * scaleX;
    const usedHeight = SVG_BOUNDS.height * scaleY;
    const offsetX = (targetWidth - usedWidth) / 2;
    const offsetY = (targetHeight - usedHeight) / 2;

    // Apply transformation - spread character across full play area
    const transformedX = targetX.min + offsetX + (x / SVG_BOUNDS.width) * usedWidth;
    const transformedY = targetY.min + offsetY + (y / SVG_BOUNDS.height) * usedHeight;

    return {
      x: Math.round(transformedX),
      y: Math.round(transformedY),
    };
  }
}
