// src/game/engine/sprite.ts

/**
 * Sprite - Represents a single frame from a sprite sheet
 * Handles drawing a rectangular region of an image to the canvas
 */
export class Sprite {
  private image: HTMLImageElement;
  private sx: number;  // Source X on sprite sheet
  private sy: number;  // Source Y on sprite sheet
  private sw: number;  // Source width
  private sh: number;  // Source height

  constructor(
    image: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number
  ) {
    this.image = image;
    this.sx = sx;
    this.sy = sy;
    this.sw = sw;
    this.sh = sh;
  }

  /**
   * Draw the sprite to the canvas.
   * Position is centered (dx, dy is the center point).
   *
   * @param ctx - Canvas rendering context
   * @param dx - Destination X (center)
   * @param dy - Destination Y (center)
   * @param dw - Destination width (optional, defaults to source width)
   * @param dh - Destination height (optional, defaults to source height)
   * @param flipH - Flip horizontally (for facing left/right)
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number = this.sw,
    dh: number = this.sh,
    flipH: boolean = false
  ): void {
    ctx.save();

    if (flipH) {
      // Flip horizontally around the center point
      ctx.translate(dx, dy);
      ctx.scale(-1, 1);
      ctx.translate(-dx, -dy);
    }

    // Draw centered on (dx, dy)
    ctx.drawImage(
      this.image,
      this.sx, this.sy, this.sw, this.sh,  // Source rectangle
      dx - dw / 2, dy - dh / 2, dw, dh      // Destination rectangle (centered)
    );

    ctx.restore();
  }

  /**
   * Get the source dimensions of this sprite frame.
   */
  public getSize(): { width: number; height: number } {
    return { width: this.sw, height: this.sh };
  }
}
