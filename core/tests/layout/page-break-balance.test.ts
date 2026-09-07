import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/**
 * Neither a graphics-state scope (PDF `q`/`Q`) nor its SVG equivalent (`<g>`) may
 * cross a page boundary, so a page break has to close what is open on the
 * outgoing page and reopen it on the new one.
 *
 * The render pipeline wraps every element in saveState/restoreState. When an
 * element breaks the page from inside its own render, that restoreState runs
 * against the *new* page — so the close was silently dropped and the page the
 * element started on was left unbalanced: an unclosed `q` in the PDF content
 * stream (invalid per ISO 32000-1), and an unclosed `<g>` that the SVG exporter's
 * own group-balancing then papered over, hiding the defect on this side.
 *
 * The .NET suite asserts the same invariants in `PageBreakBalanceTests`.
 */

/**
 * A document whose content breaks the page from inside a container's own render —
 * the shape that leaves a scope open across the boundary. A container is measured
 * whole and moves itself to a new page when it does not fit, which is that path.
 */
function paginatingDoc(): Document {
  const doc = new Document();
  for (let block = 0; block < 4; block++) {
    const stack = new VerticalStack();
    for (let line = 0; line < 20; line++) {
      const t = new TextBlock(`Block ${block}, line ${line} of flowing body content.`);
      t.fontSize = 11;
      stack.add(t);
    }
    doc.add(new Container({ padding: 8, child: stack }));
  }
  return doc;
}

/** Every text-bearing (i.e. page) content stream in the PDF, inflated. */
function contentStreams(bytes: Uint8Array): string[] {
  const text = Buffer.from(bytes).toString('latin1');
  const out: string[] = [];
  let idx = 0;
  for (;;) {
    const start = text.indexOf('stream', idx);
    if (start === -1) break;
    let contentStart = start + 'stream'.length;
    if (text[contentStart] === '\r') contentStart++;
    if (text[contentStart] === '\n') contentStart++;
    const end = text.indexOf('endstream', contentStart);
    if (end === -1) break;

    const raw = Buffer.from(text.slice(contentStart, end), 'latin1');
    let s: string;
    try {
      s = inflateSync(raw).toString('latin1');
    } catch {
      s = raw.toString('latin1');
    }
    if (s.includes('BT')) out.push(s);
    idx = end + 'endstream'.length;
  }
  return out;
}

function count(s: string, re: RegExp): number {
  return (s.match(re) ?? []).length;
}

describe('page-break scope balance', () => {
  it('paginates, so the fixture means something', async () => {
    const doc = paginatingDoc();
    try {
      expect((await doc.generateSvgPagesAsync()).length).toBeGreaterThan(1);
    } finally {
      doc.dispose();
    }
  });

  it('balances q and Q in every PDF content stream', async () => {
    const doc = paginatingDoc();
    try {
      const streams = contentStreams(await doc.generateBytesAsync());
      expect(streams.length).toBeGreaterThan(0);
      for (const [i, s] of streams.entries()) {
        const q = count(s, /(?:^|\s)q(?:\s|$)/g);
        const qq = count(s, /(?:^|\s)Q(?:\s|$)/g);
        expect(q, `content stream ${i + 1}: ${q} q vs ${qq} Q`).toBe(qq);
      }
    } finally {
      doc.dispose();
    }
  });

  it('closes every group it opens on each SVG page', async () => {
    const doc = paginatingDoc();
    try {
      const pages = await doc.generateSvgPagesAsync();
      for (const [i, page] of pages.entries()) {
        const body = page.replace(/<style>[\s\S]*?<\/style>/g, '');
        let depth = 0;
        for (const m of body.matchAll(/<(\/?)g\b[^>]*?(\/?)>/g)) {
          if (m[1]) depth--;
          else if (!m[2]) depth++;
        }
        // Note this assertion alone would pass even with the page-break defect
        // present: the SVG exporter's closing sweep balances whatever is left
        // open, which is exactly how the bug stayed invisible on this side. The
        // `q`/`Q` assertion above is what actually catches it here. This one is
        // kept because it is the invariant the parity spec states and the one
        // .NET enforces without a sweep to fall back on.
        expect(depth, `SVG page ${i + 1} left ${depth} group(s) open`).toBe(0);
      }
    } finally {
      doc.dispose();
    }
  });
});
