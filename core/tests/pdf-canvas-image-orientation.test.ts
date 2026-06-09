import { describe, it, expect } from 'vitest';
import { PdfCanvas } from '../src/Drawing/PdfCanvas';

/**
 * Verifies the EXIF orientation transform emitted by PdfCanvas.drawImage.
 * Each orientation maps the image's stored unit square to a different
 * arrangement of the display box; the per-orientation matrix is documented
 * inline in PdfCanvas.ts.  PdfOperators.concatMatrix renders values with
 * 3-decimal precision, so expectations are matched in that format.
 */
describe('PdfCanvas.drawImage - EXIF orientation', () => {
  function emit(orientation: number): string {
    const canvas = new PdfCanvas(1000, 0, 0, undefined, () => '/Im1');
    canvas.drawImage({ orientation }, 10, 20, 100, 50);
    return canvas.getStream().join('');
  }

  it('orientation 1 (default) emits scale-equivalent cm', () => {
    expect(emit(1)).toContain('100.000 0.000 0.000 50.000 0.000 0.000 cm');
  });

  it('orientation 6 (90° CW) emits 0 -h w 0 0 h matrix', () => {
    expect(emit(6)).toContain('0.000 -50.000 100.000 0.000 0.000 50.000 cm');
  });

  it('orientation 8 (90° CCW) emits 0 h -w 0 w 0 matrix', () => {
    expect(emit(8)).toContain('0.000 50.000 -100.000 0.000 100.000 0.000 cm');
  });

  it('orientation 3 (180°) emits -w 0 0 -h w h matrix', () => {
    expect(emit(3)).toContain('-100.000 0.000 0.000 -50.000 100.000 50.000 cm');
  });

  it('orientation 2 (flip-H) emits -w 0 0 h w 0 matrix', () => {
    expect(emit(2)).toContain('-100.000 0.000 0.000 50.000 100.000 0.000 cm');
  });

  it('unknown orientation falls back to orientation 1', () => {
    expect(emit(42)).toContain('100.000 0.000 0.000 50.000 0.000 0.000 cm');
  });

  it('image with no orientation field falls back to orientation 1', () => {
    const canvas = new PdfCanvas(1000, 0, 0, undefined, () => '/Im1');
    canvas.drawImage({} /* no orientation */, 10, 20, 100, 50);
    expect(canvas.getStream().join('')).toContain('100.000 0.000 0.000 50.000 0.000 0.000 cm');
  });
});
