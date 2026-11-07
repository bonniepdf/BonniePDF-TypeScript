import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { RichText } from '../../src/Elements/Text/RichText';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { inflateSync } from 'node:zlib';

/** Spec 03 (RichText link spans, Hyperlink underline) and 11 §1: links inside a paragraph. */
describe('inline links', () => {
  const LINK = 'terms of service and the privacy notice before you place an order with us today';

  function pdf(tagged: boolean, build: (doc: Document) => void): string {
    const doc = new Document();
    if (tagged) {
      doc.settings.accessibility = AccessibilityMode.PdfUa1;
      doc.settings.language = 'en-GB';
      doc.metadata.title = 'Inline links';
    }
    build(doc);
    try {
      // The file with every stream inflated, so content operators can be read.
      const bytes = doc.generateBytes();
      const raw = Buffer.from(bytes).toString('latin1');
      let text = raw;
      for (const m of raw.matchAll(/stream\r?\n/g)) {
        const start = m.index! + m[0].length;
        try {
          text += '\n' + inflateSync(bytes.subarray(start, raw.indexOf('endstream', start))).toString('latin1');
        } catch {
          // Not a deflated stream.
        }
      }
      return text;
    } finally {
      doc.dispose();
    }
  }

  const paragraph = (doc: Document) =>
    doc.add(new RichText().span('Please read our ').link(LINK, 'https://example.com/terms').span(' and keep a copy.'));

  it('gives each line a wrapped link span covers its own region, described by the whole span', () => {
    const text = pdf(false, paragraph);
    expect(text.match(/\/Subtype \/Link/g)).toHaveLength(2);
    expect(text.match(new RegExp(`/Contents \\(${LINK}\\)`, 'g'))).toHaveLength(2);
    expect(text.match(/\/URI \(https:\/\/example\.com\/terms\)/g)).toHaveLength(2);
  });

  it('leaves the space before and after the link out of its region', () => {
    const rects = [...pdf(false, paragraph).matchAll(/\/Rect \[([\d. ]+)\]/g)].map(m => m[1].split(' ').map(Number));
    // The first region starts after "Please read our " and its space (Helvetica 12), the second at the left margin.
    expect(rects[0][0]).toBeCloseTo(50 + FontMetrics.getStringWidth('Please read our ', 'Helvetica', 12), 2);
    expect(rects[1][0]).toBe(50);
  });

  it('tags each link region as a Link inside the paragraph', () => {
    const text = pdf(true, paragraph);
    expect(text.match(/\/S \/Link/g)).toHaveLength(2);
    expect(text.match(/\/OBJR/g)).toHaveLength(2);
    expect(text.match(/\/StructParent \d+/g)).toHaveLength(2);
    // The paragraph's content resumes after the link: three P sequences around two Link sequences.
    expect(text.match(/\/P << \/MCID \d+ >> BDC/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('underlines a Hyperlink only when asked', () => {
    const line = /\d[\d.]* [\d.]+ m [\d.]+ [\d.]+ l/;
    expect(pdf(false, d => d.add(new Hyperlink('Contact us', 'mailto:support@example.com')))).not.toMatch(line);
    expect(
      pdf(false, d => d.add(new Hyperlink('Contact us', 'mailto:support@example.com', { underline: true })))
    ).toMatch(line);
  });
});
