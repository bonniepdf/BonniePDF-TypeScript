import { describe, expect, it } from 'vitest';
import { PdfResourceRegistry } from '../../src/Rendering/PdfResourceRegistry';
import { ImageInfo } from '../../src/Rendering/Images/ImageInfo';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { Color } from '../../src/Core/Color';

// The registry hands out stable, de-duplicated resource names (/F1, /I1, /GS_ALPHA_1, …)
// and avoids emitting the same font/image/graphics-state twice. These tests pin that
// registration + de-duplication logic (the writer-dependent serialization is covered by
// the document/serialization integration tests).

function imageWithData(bytes: number[]): ImageInfo {
  const info = new ImageInfo();
  info.data = new Uint8Array(bytes);
  return info;
}

describe('PdfResourceRegistry.isEmbeddedFont', () => {
  it('recognises TTF/OTF paths and virtual keys, case-insensitively', () => {
    expect(PdfResourceRegistry.isEmbeddedFont('font.ttf')).toBe(true);
    expect(PdfResourceRegistry.isEmbeddedFont('FONT.OTF')).toBe(true);
    expect(PdfResourceRegistry.isEmbeddedFont('virtual:Helvetica')).toBe(true);
    expect(PdfResourceRegistry.isEmbeddedFont('Helvetica')).toBe(false);
  });
});

describe('PdfResourceRegistry — font registration', () => {
  it('numbers standard fonts sequentially and de-duplicates by identifier', () => {
    const r = new PdfResourceRegistry();
    expect(r.registerFont('Helvetica')).toBe('/F1');
    expect(r.registerFont('Helvetica')).toBe('/F1'); // same identifier => same name
    expect(r.registerFont('Times-Roman')).toBe('/F2'); // new identifier => next number
  });

  it('hasNonEmbeddedStandardFont reflects whether a non-embedded Type1 font was registered', () => {
    const r = new PdfResourceRegistry();
    expect(r.hasNonEmbeddedStandardFont()).toBe(false);
    r.registerFont('Helvetica');
    expect(r.hasNonEmbeddedStandardFont()).toBe(true);
  });
});

describe('PdfResourceRegistry — image registration', () => {
  it('returns a new id for new content and the same id for identical content', () => {
    const r = new PdfResourceRegistry();
    const id1 = r.registerImage(imageWithData([1, 2, 3]));
    const idDup = r.registerImage(imageWithData([1, 2, 3])); // identical bytes
    const id2 = r.registerImage(imageWithData([4, 5, 6])); // different bytes

    expect(idDup).toBe(id1); // de-duplicated
    expect(id2).not.toBe(id1);
  });

  it('getNewImageId increments and getImageResourceName maps id => /I{id} (stable)', () => {
    const r = new PdfResourceRegistry();
    expect(r.getNewImageId()).toBe(1);
    expect(r.getNewImageId()).toBe(2);
    expect(r.getImageResourceName(2)).toBe('/I2');
    expect(r.getImageResourceName(2)).toBe('/I2'); // cached, stable
  });
});

describe('PdfResourceRegistry — alpha graphics states', () => {
  it('numbers states sequentially and de-duplicates equal alphas', () => {
    const r = new PdfResourceRegistry();
    expect(r.registerAlphaGraphicsState(0.5)).toBe('/GS_ALPHA_1');
    expect(r.registerAlphaGraphicsState(0.5)).toBe('/GS_ALPHA_1'); // dedup
    expect(r.registerAlphaGraphicsState(0.25)).toBe('/GS_ALPHA_2');
  });

  it('clamps alpha into [0,1] so out-of-range values collapse to the same state', () => {
    const r = new PdfResourceRegistry();
    const a = r.registerAlphaGraphicsState(1.5); // clamps to 1.0
    const b = r.registerAlphaGraphicsState(2.0); // also clamps to 1.0
    expect(b).toBe(a);
  });

  it('forces alpha to 1 under PDF/A-1 (no transparency), collapsing all states', () => {
    const r = new PdfResourceRegistry();
    r.conformance = PdfAConformance.PdfA1b;
    const a = r.registerAlphaGraphicsState(0.5); // forced to 1.0
    const b = r.registerAlphaGraphicsState(0.9); // forced to 1.0
    expect(b).toBe(a);
    expect(a).toBe('/GS_ALPHA_1');
  });
});

describe('PdfResourceRegistry — deferred XObjects', () => {
  it('numbers deferred xobjects and de-duplicates by font + size + colour', () => {
    const r = new PdfResourceRegistry();
    expect(r.registerDeferredXObject('Helvetica', 12, Color.black)).toBe('/DXO1');
    expect(r.registerDeferredXObject('Helvetica', 12, Color.black)).toBe('/DXO1'); // dedup
    expect(r.registerDeferredXObject('Helvetica', 14, Color.black)).toBe('/DXO2'); // different size
  });
});

describe('PdfResourceRegistry — PDF/A conformance flag', () => {
  it('keeps pdfAEnabled and conformance in sync', () => {
    const r = new PdfResourceRegistry();
    expect(r.pdfAEnabled).toBe(false);
    expect(r.conformance).toBe(PdfAConformance.None);

    r.pdfAEnabled = true;
    expect(r.conformance).toBe(PdfAConformance.PdfA2b);

    r.conformance = PdfAConformance.PdfA1b;
    expect(r.pdfAEnabled).toBe(true);

    r.conformance = PdfAConformance.None;
    expect(r.pdfAEnabled).toBe(false);
  });

  it('getEmbeddedFont returns null for an unknown path', () => {
    expect(new PdfResourceRegistry().getEmbeddedFont('nope.ttf')).toBeNull();
  });
});
