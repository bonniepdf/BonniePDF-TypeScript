import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Document } from '../src/Document';
import { Heading } from '../src/Elements/Text/Heading';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { Table } from '../src/Elements/Tables/Table';
import { TableCell } from '../src/Elements/Tables/TableCell';
import { VerticalStack } from '../src/Elements/Layout/VerticalStack';
import { QRCode } from '../src/Elements/Shapes/QRCode';
import { Hyperlink } from '../src/Core/Hyperlink';
import { Color } from '../src/Core/Color';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { EncryptionSettings } from '../src/Security/Models/EncryptionSettings';
import { StandardFonts } from '../src/Typography/StandardFonts';
import { FontManager } from '../src/Typography/FontManager';
import { pdfToText } from './helpers/test-base';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * this feature (TS mirror) - 10-fixture hardening pass. Throws representative
 * edge-case documents at the tagging machinery to surface bugs the
 * focused stage-1 closeout tests don't hit: encryption + tagging,
 * PDF/A + PDF/UA combination, empty docs, internal hyperlinks, every
 * heading level, header/footer templates, nested layouts, etc.
 *
 * Mirrors the .NET HardeningTests. Each test asserts (a) the doc
 * generates without crashing, (b) per-page BDC/EMC stays balanced
 * where relevant, and (c) the expected struct elements are present.
 *
 * Known stage-2 gaps that VeraPDF will still flag (documented in the
 * fixtures rather than silently passing):
 *  - Header/footer template content is rendered but not tagged as
 *    /Artifact (this feature fixes this).
 *  - Hyperlink annotations don't carry /StructParent (full annotation
 *    reachability - deferred from this feature).
 */
describe('Hardening fixtures', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function generate(populate: (d: Document) => void): string {
    doc = new Document();
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  function generateTagged(populate: (d: Document) => void): string {
    return generate(d => {
      d.settings.version = PdfVersion.Pdf17;
      d.settings.accessibility = AccessibilityMode.PdfUa1;
      d.settings.language = 'en-GB';
      populate(d);
    });
  }

  // ── 1. Empty tagged document ────────────────────────────────────

  it('fixture 01 - empty tagged document produces valid struct tree', () => {
    const pdf = generate(d => {
      d.settings.version = PdfVersion.Pdf17;
      d.settings.accessibility = AccessibilityMode.PdfUa1;
      d.settings.language = 'en-GB';
    });

    // Catalog wiring still present even with no content.
    expect(pdf).toContain('/StructTreeRoot');
    expect(pdf).toContain('/MarkInfo << /Marked true >>');
    expect(pdf).toContain('/S /Document');
    // No other struct elements.
    expect(countSubstring(pdf, '/S /P')).toBe(0);
    expect(countSubstring(pdf, '/S /H1')).toBe(0);
  });

  // ── 2. PDF/A + PDF/UA combined ──────────────────────────────────

  it('fixture 02 - PDF/A claim is suppressed when standard fonts are used (this feature contract)', () => {
    // PDF/A-1b §6.3.4 forbids non-embedded fonts. When the caller
    // asks for PDF/A but uses any of the standard 14 (Helvetica
    // here), the serializer drops the PDF/A claim rather than
    // emitting an invalid one. PDF/UA-1 still ships because it has
    // no font-embedding requirement.
    const pdf = generate(d => {
      d.settings.version = PdfVersion.Pdf17;
      d.settings.pdfAEnabled = true;
      d.settings.accessibility = AccessibilityMode.PdfUa1;
      d.settings.language = 'en-GB';
      const h = new Heading('Combined');
      h.tocIdentifier = 'c';
      h.level = 1;
      h.fontSize = 18;
      d.add(h);
    });

    // PDF/A claim and OutputIntent are suppressed (honest about what we ship).
    expect(pdf).not.toContain('pdfaid:part');
    expect(pdf).not.toContain('/OutputIntents');
    // PDF/UA-1 plumbing is unaffected.
    expect(pdf).toContain('pdfuaid:part');
    expect(pdf).toContain('/StructTreeRoot');
    expect(pdf).toContain('/MarkInfo << /Marked true >>');
  });

  // ── 3. Encrypted tagged document ────────────────────────────────

  it('fixture 03 - encrypted tagged document generates without error', () => {
    // PDF spec allows tagging inside encrypted docs. XMP stream is
    // unencrypted; struct tree objects are encrypted alongside the
    // content. The combo shouldn't break either feature.
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    const enc = new EncryptionSettings();
    enc.userPassword = 'secret';
    enc.ownerPassword = 'secret';
    doc.settings.encryption = enc;

    const h = new Heading('Confidential');
    h.tocIdentifier = 'c';
    h.level = 1;
    h.fontSize = 18;
    doc.add(h);

    const tb = new TextBlock();
    tb.text = 'Top-secret content.';
    tb.fontSize = 12;
    doc.add(tb);

    const bytes = doc.generateBytes();
    const pdf = pdfToText(bytes);

    expect(pdf).toContain('/Encrypt');
    expect(pdf).toContain('/StructTreeRoot');
    expect(bytes.length).toBeGreaterThan(1000);
  });

  // ── 4. Internal hyperlink (targetPageIndex, not URI) ────────────

  it('fixture 04 - internal hyperlink still emits /S /Link and /Contents', () => {
    const pdf = generateTagged(d => {
      const h = new Heading('Go');
      h.tocIdentifier = 'g';
      h.level = 1;
      h.fontSize = 18;
      d.add(h);
      d.addPage();

      const link = new Hyperlink('Jump to page 1');
      link.targetPageIndex = 0;
      link.fontName = StandardFonts.Helvetica;
      link.fontSize = 12;
      d.add(link);
    });

    expect(pdf).toContain('/S /Link');
    expect(pdf).toContain('/Contents (Jump to page 1)');
    // Internal-link annotation uses /A << /S /GoTo /D ... >> not URI.
    expect(pdf).toContain('/S /GoTo');
  });

  // ── 5. All six heading levels ───────────────────────────────────

  it('fixture 05 - all heading levels map to correct struct roles', () => {
    const pdf = generateTagged(d => {
      for (let lvl = 1; lvl <= 6; lvl++) {
        const h = new Heading(`Heading ${lvl}`);
        h.tocIdentifier = `h${lvl}`;
        h.level = lvl;
        h.fontName = StandardFonts.HelveticaBold;
        h.fontSize = 24 - lvl * 2;
        d.add(h);
      }
    });

    for (let lvl = 1; lvl <= 6; lvl++) {
      expect(pdf).toContain(`/S /H${lvl}`);
    }
  });

  // ── 6. Heading.level out of range - clamped to H1/H6 ────────────

  it('fixture 06 - heading level out of range is clamped to H1 / H6', () => {
    const pdf = generateTagged(d => {
      const low = new Heading('Too low');
      low.tocIdentifier = 'lo';
      low.level = 0;
      low.fontSize = 18;
      d.add(low);

      const high = new Heading('Too high');
      high.tocIdentifier = 'hi';
      high.level = 99;
      high.fontSize = 18;
      d.add(high);
    });

    // level=0 clamps to H1 (the "<= 1" branch in Heading.semanticRole).
    // level=99 clamps to H6.
    expect(pdf).toContain('/S /H1');
    expect(pdf).toContain('/S /H6');
  });

  // ── 7. Long heading text that wraps ─────────────────────────────

  it('fixture 07 - long wrapping heading stays one struct elem', () => {
    // A heading whose text exceeds one line still produces exactly
    // one /H1 StructElem - wrapping is a layout concern, not a
    // semantic one.
    const pdf = generateTagged(d => {
      const h = new Heading(
        'A long heading that exercises the line-wrapping path and forces the text to flow onto a second line within the page margins'
      );
      h.tocIdentifier = 'long';
      h.level = 1;
      h.fontName = StandardFonts.HelveticaBold;
      h.fontSize = 24;
      d.add(h);
    });

    expect(countSubstring(pdf, '/S /H1')).toBe(1);
  });

  // ── 8. Header/footer templates (known stage-2 gap) ──────────────

  it('fixture 08 - header/footer templates emit /Artifact BMC (this feature fixed)', () => {
    // this feature fixed this: header/footer template content is now tagged as
    // /Artifact so screen readers skip it.
    const pdf = generateTagged(d => {
      d.settings.headerTemplate = pageNum => {
        const tb = new TextBlock();
        tb.text = `Header - page ${pageNum}`;
        tb.fontSize = 9;
        tb.textColor = Color.slate500;
        return tb;
      };
      d.settings.footerTemplate = pageNum => {
        const tb = new TextBlock();
        tb.text = `- ${pageNum} -`;
        tb.fontSize = 9;
        tb.textColor = Color.slate500;
        return tb;
      };
      const h = new Heading('Body');
      h.tocIdentifier = 'b';
      h.level = 1;
      h.fontSize = 18;
      d.add(h);
    });

    // Body content tags correctly.
    expect(pdf).toContain('/S /H1');
    // Document structure exists.
    expect(pdf).toContain('/S /Document');
    // this feature fixed: header/footer are now emitted as /Artifact regions.
    expect(pdf).toContain('/Artifact BMC');
  });

  // ── 9. Nested layout: VerticalStack containing Tables ───────────

  it('fixture 09 - nested layout preserves struct hierarchy', () => {
    // VerticalStack itself isn't IRoleProvider - it's a layout
    // primitive that doesn't claim a semantic role. Inner content
    // (the Table) still gets tagged correctly.
    const pdf = generateTagged(d => {
      const stack = new VerticalStack();

      const h = new Heading('Inside a stack');
      h.tocIdentifier = 's';
      h.level = 1;
      h.fontSize = 18;
      stack.addChild(h);

      const t = new Table(150, 150);
      const cellA = new TableCell();
      const tbA = new TextBlock();
      tbA.text = 'A';
      cellA.content = tbA;
      const cellB = new TableCell();
      const tbB = new TextBlock();
      tbB.text = 'B';
      cellB.content = tbB;
      t.addHeader(cellA, cellB);

      const tb1 = new TextBlock();
      tb1.text = '1';
      const tb2 = new TextBlock();
      tb2.text = '2';
      t.addRow(tb1, tb2);

      stack.addChild(t);
      d.add(stack);
    });

    // Headings inside the stack still get tagged as H1.
    expect(pdf).toContain('/S /H1');
    // Table inside the stack still gets the full table structure.
    expect(pdf).toContain('/S /Table');
    expect(pdf).toContain('/S /TR');
    expect(pdf).toContain('/S /TH');
    expect(pdf).toContain('/S /TD');
  });

  // ── 10. Alt-text with special characters that need escaping ─────

  it('fixture 10a - alt-text with Latin-1 special chars is PDF-escaped', () => {
    // Backslashes and parens are PDF string-literal metacharacters and
    // must be backslash-escaped; the structure-tree writer routes
    // through encodeMetadataString → PdfSyntax.escape for that.
    const pdf = generateTagged(d => {
      const qr = new QRCode();
      qr.data = 'https://example.com';
      qr.size = 60;
      qr.altText = 'Chart for FY (2026) \\ revenue "projection"';
      d.add(qr);
    });

    expect(pdf).toContain('/Alt (Chart for FY \\(2026\\) \\\\ revenue "projection")');
  });

  // ── 11. this feature Stage 2 - real PDF/A when fonts are registered ────────

  describe('fixture 11 - this feature stage 2: real PDF/A with registered Liberation Sans', () => {
    const fontsDir = join(__dirname, '../assets/fonts');

    beforeEach(() => {
      FontManager.clear();
    });

    afterEach(() => {
      FontManager.clear();
    });

    it('pdfaid XMP block emitted when all fonts are embedded via FontManager', () => {
      // Register Liberation Sans so pdfAEnabled can be backed up.
      const bytes = readFileSync(join(fontsDir, 'LiberationSans-Regular.ttf'));
      FontManager.registerFont(new Uint8Array(bytes));

      const pdf = generate(d => {
        d.settings.version = PdfVersion.Pdf17;
        d.settings.pdfAEnabled = true;
        const tb = new TextBlock();
        tb.text = 'Hello PDF/A';
        tb.fontName = StandardFonts.Helvetica;
        tb.fontSize = 12;
        d.add(tb);
      });

      // With a registered font, the claim is now valid.
      expect(pdf).toContain('pdfaid:part');
      expect(pdf).toContain('/OutputIntents');
    });

    it('FontManager.getBytesForStandardFont returns bytes for known standard fonts', () => {
      const bytes = readFileSync(join(fontsDir, 'LiberationSans-Regular.ttf'));
      FontManager.registerFont(new Uint8Array(bytes));

      expect(FontManager.getBytesForStandardFont('Helvetica')).not.toBeNull();
      expect(FontManager.getBytesForStandardFont('Helvetica-Bold')).toBeNull(); // not registered
      expect(FontManager.getBytesForStandardFont('Symbol')).toBeNull(); // not in map
    });

    it('registerFont parses family name from font binary', () => {
      const bytes = readFileSync(join(fontsDir, 'LiberationSans-Bold.ttf'));
      FontManager.registerFont(new Uint8Array(bytes));

      // Family and subfamily inferred from the font name table.
      const result = FontManager.getBytesForFamily('liberation sans', 'bold');
      expect(result).not.toBeNull();
    });

    it('autoRegisterBundledFonts registers all 12 variants from directory', () => {
      FontManager.autoRegisterBundledFonts(fontsDir);

      // All three standard-font families covered.
      expect(FontManager.getBytesForStandardFont('Helvetica')).not.toBeNull();
      expect(FontManager.getBytesForStandardFont('Helvetica-Bold')).not.toBeNull();
      expect(FontManager.getBytesForStandardFont('Times-Roman')).not.toBeNull();
      expect(FontManager.getBytesForStandardFont('Courier')).not.toBeNull();
      expect(FontManager.hasBundledFonts()).toBe(true);
    });
  });

  it('fixture 10b - alt-text with non-Latin-1 chars is UTF-16BE hex encoded', () => {
    // Em-dash (U+2014) doesn't fit in a single-byte PDF string literal
    // and would otherwise be byte-truncated to 0x14 by the Latin-1
    // writer. Per the XMP/PDF spec, such strings must become a
    // <FEFF…> UTF-16BE hex literal - Adobe and VeraPDF both expect
    // this form.
    const pdf = generateTagged(d => {
      const qr = new QRCode();
      qr.data = 'https://example.com';
      qr.size = 60;
      qr.altText = 'Year 2026 — projection';
      d.add(qr);
    });

    // BOM (FEFF) then UTF-16BE bytes:
    //   "Y" 0x0059, "e" 0x0065, …, " " 0x0020, "-" 0x2014, …
    expect(pdf).toMatch(/\/Alt <FEFF[0-9A-F]+>/);
    // Spot-check the em-dash codepoint is present in the hex stream.
    expect(pdf).toMatch(/\/Alt <FEFF[0-9A-F]*2014[0-9A-F]*>/);
  });
});

function countSubstring(source: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = source.indexOf(needle, idx)) >= 0) {
    count++;
    idx += needle.length;
  }
  return count;
}
