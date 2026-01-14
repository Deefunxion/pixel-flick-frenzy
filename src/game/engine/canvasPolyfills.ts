/**
 * Canvas API polyfills for older browsers (Safari <16, iOS <16)
 * roundRect was added in Safari 16 (Sept 2022) - iPhone SE 2021 on iOS 15 crashes without this
 */

export function polyfillCanvas(): void {
  if (typeof CanvasRenderingContext2D === 'undefined') return;

  // Polyfill roundRect for Safari <16
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      x: number,
      y: number,
      width: number,
      height: number,
      radii?: number | DOMPointInit | (number | DOMPointInit)[]
    ): void {
      // Normalize radii to a single number (simplified - handles our use case)
      let r = 0;
      if (typeof radii === 'number') {
        r = radii;
      } else if (Array.isArray(radii) && radii.length > 0) {
        const first = radii[0];
        r = typeof first === 'number' ? first : (first as DOMPointInit).x ?? 0;
      } else if (radii && typeof radii === 'object') {
        r = (radii as DOMPointInit).x ?? 0;
      }

      // Clamp radius to half the smaller dimension
      r = Math.min(r, width / 2, height / 2);

      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + width - r, y);
      this.arcTo(x + width, y, x + width, y + r, r);
      this.lineTo(x + width, y + height - r);
      this.arcTo(x + width, y + height, x + width - r, y + height, r);
      this.lineTo(x + r, y + height);
      this.arcTo(x, y + height, x, y + height - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
    };
  }
}
