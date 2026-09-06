import { ICanvas } from '../../Drawing/ICanvas';
import { Color } from '../../Core/Color';

/**
 * Line style for text decorations (underline/strikethrough/overline).
 * All variants are painted with straight {@link ICanvas.drawLine} segments so
 * they render identically on the PDF and SVG canvases.
 */
export enum DecorationStyle {
  /** A single continuous line (default). */
  Solid = 0,

  /** A sine wave, e.g. a spell-check squiggle. */
  Wavy = 1,

  /** Evenly spaced dashes. */
  Dashed = 2,

  /** Evenly spaced dots. */
  Dotted = 3,
}

/**
 * Paints a horizontal decoration line from `x` to `x + width` at baseline `y`
 * in the requested {@link DecorationStyle}. Wavy/dashed/dotted are approximated
 * with short straight segments so the output is canvas-agnostic and PDF/UA-safe
 * (paths only, no fonts). `Solid` emits a single segment, byte-identical to a
 * plain single-segment line.
 */
export function paintDecorationLine(
  canvas: ICanvas,
  x: number,
  y: number,
  width: number,
  color: Color,
  thickness: number,
  style: DecorationStyle
): void {
  if (width <= 0) return;

  switch (style) {
    case DecorationStyle.Solid:
      canvas.drawLine(x, y, x + width, y, color, thickness);
      return;

    case DecorationStyle.Wavy: {
      // Amplitude and wavelength scale with the line thickness so the squiggle
      // stays proportional at any font size.
      const amplitude = Math.max(0.75, thickness * 1.2);
      const wavelength = Math.max(3, amplitude * 4);
      const step = wavelength / 6; // 6 segments per wave = smooth enough
      let px = x;
      let py = y;
      for (let cx = x + step; cx <= x + width + 1e-6; cx += step) {
        const clamped = Math.min(cx, x + width);
        const cy = y + amplitude * Math.sin(((clamped - x) / wavelength) * 2 * Math.PI);
        canvas.drawLine(px, py, clamped, cy, color, thickness);
        px = clamped;
        py = cy;
      }
      return;
    }

    case DecorationStyle.Dashed: {
      const dash = Math.max(2, thickness * 3);
      const gap = dash * 0.6;
      for (let sx = x; sx < x + width; sx += dash + gap) {
        const ex = Math.min(sx + dash, x + width);
        canvas.drawLine(sx, y, ex, y, color, thickness);
      }
      return;
    }

    case DecorationStyle.Dotted: {
      const dot = Math.max(thickness, 0.75);
      const gap = dot * 1.8;
      for (let sx = x; sx < x + width; sx += dot + gap) {
        const ex = Math.min(sx + dot, x + width);
        canvas.drawLine(sx, y, ex, y, color, thickness);
      }
      return;
    }
  }
}
