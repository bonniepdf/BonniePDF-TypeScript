import { describe, it, expect } from 'vitest';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { ImageInfo } from '../../src/Rendering/Images/ImageInfo';

/** An ImageInfo carrying only the EXIF orientation these tests vary. */
function imageWithOrientation(orientation?: number): ImageInfo {
  const info = new ImageInfo();
  if (orientation !== undefined) info.orientation = orientation;
  return info;
}

/**
 * Verifies the EXIF orientation transform emitted by PdfCanvas.drawImage.
 * Each orientation maps the image's stored unit square to a different
 * arrangement of the display box; the per-orientation matrix is documented
 * inline in PdfCanvas.ts.  PdfOperators.concatMatrix renders values via
 * PdfSyntax.formatDecimal ("0.###" - trailing zeros trimmed), so e.g. 100 not 100.000.
 */
describe('PdfCanvas.drawImage - EXIF orientation', () => {
  function emit(orientation: number): string {
    const canvas = new PdfCanvas(1000, 0, 0, undefined, () => '/Im1');
    canvas.drawImage(imageWithOrientation(orientation), 10, 20, 100, 50);
    return canvas.getStream().join('');
  }

  it('orientation 1 (default) emits scale-equivalent cm', () => {
    expect(emit(1)).toContain('100 0 0 50 0 0 cm');
  });

  it('orientation 6 (90° CW) emits 0 -h w 0 0 h matrix', () => {
    expect(emit(6)).toContain('0 -50 100 0 0 50 cm');
  });

  it('orientation 8 (90° CCW) emits 0 h -w 0 w 0 matrix', () => {
    expect(emit(8)).toContain('0 50 -100 0 100 0 cm');
  });

  it('orientation 3 (180°) emits -w 0 0 -h w h matrix', () => {
    expect(emit(3)).toContain('-100 0 0 -50 100 50 cm');
  });

  it('orientation 2 (flip-H) emits -w 0 0 h w 0 matrix', () => {
    expect(emit(2)).toContain('-100 0 0 50 100 0 cm');
  });

  it('unknown orientation falls back to orientation 1', () => {
    expect(emit(42)).toContain('100 0 0 50 0 0 cm');
  });

  it('image with no orientation field falls back to orientation 1', () => {
    const canvas = new PdfCanvas(1000, 0, 0, undefined, () => '/Im1');
    canvas.drawImage(imageWithOrientation(), 10, 20, 100, 50);
    expect(canvas.getStream().join('')).toContain('100 0 0 50 0 0 cm');
  });
});
