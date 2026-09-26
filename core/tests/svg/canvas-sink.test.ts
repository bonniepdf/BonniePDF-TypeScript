import { describe, expect, it } from 'vitest';
import { BonniePdfCanvasSink } from '../../src/Drawing/BonniePdfCanvasSink';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { importSvg } from '../../src/Rendering/Svg/ImportSvg';

/** Mirrors BonniePDF.Tests/Rendering/BonniePdfCanvasSinkTests.cs, including the expected bytes. */
describe('imported SVG on the PDF canvas', () => {
  function draw(svg: string, width: number, height: number): string {
    const canvas = new PdfCanvas(1000, 0, 0, undefined, () => '/Im0');
    importSvg(svg, new BonniePdfCanvasSink(canvas), { width, height });
    return (canvas as unknown as { stream: string[] }).stream.join('');
  }

  it("strokes with SVG's default miter limit of 4, not PDF's 10", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
      '<path d="M1 1 L9 9" stroke="#0000ff" stroke-width="2" fill="none"/></svg>';
    expect(draw(svg, 20, 20)).toBe('q\nq\n2 w\n0 J\n0 j\n4 M\n0 0 1 RG\n2 998 m\n18 982 l\nS\nQ\nQ\n');
  });

  it('keeps a miter limit the document sets', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
      '<path d="M1 1 L9 9" stroke="#0000ff" stroke-miterlimit="7" fill="none"/></svg>';
    expect(draw(svg, 10, 10)).toContain('7 M\n');
  });
});
