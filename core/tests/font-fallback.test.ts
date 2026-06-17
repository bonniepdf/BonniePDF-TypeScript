import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { PdfResourceRegistry } from '../src/Rendering/PdfResourceRegistry';
import { PdfAConformance } from '../src/Configuration/PdfAConformance';
import { FontManager } from '../src/Typography/FontManager';

// Liberation Sans is the standard-14 substitute. It covers Latin + common
// punctuation but NOT the black star (U+2605), which is exactly the glyph the
// list "custom bullet" example hit. These tests pin the fallback/guard
// behaviour of the resolver without depending on a symbol font (those ship
// only with @bonniepdf/examples, never core).
const SANS = fileURLToPath(new URL('../assets/fonts/LiberationSans-Regular.ttf', import.meta.url));
const STAR = '★';

describe('PdfResourceRegistry.resolveTextRuns — glyph fallback + .notdef guard', () => {
  beforeEach(() => {
    FontManager.clear();
    FontManager.registerFont(new Uint8Array(readFileSync(SANS)), {
      family: 'liberation sans',
      subfamily: 'regular',
    });
  });

  afterEach(() => FontManager.clear());

  function pdfaRegistry(): PdfResourceRegistry {
    const r = new PdfResourceRegistry();
    r.conformance = PdfAConformance.PdfA2b; // forces standard-14 -> embedded Liberation
    return r;
  }

  it('returns a single embedded run when the primary font covers the whole string', () => {
    const runs = pdfaRegistry().resolveTextRuns('Helvetica', 'Hello');
    expect(runs).toHaveLength(1);
    expect(runs[0].text).toBe('Hello');
    expect(runs[0].embeddedFont).not.toBeNull();
  });

  it('drops a glyph no font covers and records a diagnostic instead of emitting .notdef', () => {
    const r = pdfaRegistry();
    const runs = r.resolveTextRuns('Helvetica', `Hi${STAR}!`);

    // The star is dropped; the surrounding text stays in one primary run.
    const emitted = runs.map(run => run.text).join('');
    expect(emitted).toBe('Hi!');
    expect(emitted).not.toContain(STAR);

    const warning = r.diagnostics.all.find(d => d.category === 'font' && d.message.includes('U+2605'));
    expect(warning).toBeDefined();
  });

  it('leaves non-embedded (non-PDF/A) standard fonts as a single literal run', () => {
    const r = new PdfResourceRegistry(); // no conformance => Type1, not embedded
    const runs = r.resolveTextRuns('Helvetica', 'Hello');
    expect(runs).toHaveLength(1);
    expect(runs[0].embeddedFont).toBeNull();
    expect(runs[0].text).toBe('Hello');
  });
});
