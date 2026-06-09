import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { asPdf17, asPdfA } from '../src/Extensions/DocumentSettingsExtensions';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { pdfToText } from './helpers/test-base';

/**
 * this feature integration smoke tests. Builds a Document, opts into PDF/UA-1,
 * generates bytes, and inspects the raw output for the catalog entries
 * that the writer should now emit.
 *
 * VeraPDF integration lives in the .NET BonniePDF.Validation tool -
 * these tests just verify the byte-level wiring is present so a
 * validator run can pick up from here.
 */
describe('TaggedDocument', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('untagged document emits no StructTreeRoot', () => {
    doc = new Document();
    asPdf17(doc.settings);

    const text = pdfToText(doc.generateBytes());

    expect(text).not.toContain('/StructTreeRoot');
    expect(text).not.toContain('/Lang (');
    expect(text).not.toContain('/MarkInfo');
  });

  it('tagged document emits StructTreeRoot, MarkInfo, and Lang', () => {
    doc = new Document();
    asPdf17(doc.settings);
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';

    const text = pdfToText(doc.generateBytes());

    expect(text).toContain('/StructTreeRoot');
    expect(text).toContain('/MarkInfo << /Marked true >>');
    expect(text).toContain('/Lang (en-GB)');
    expect(text).toContain('/Type /StructElem');
    expect(text).toContain('/S /Document');
    // XMP carries the PDF/UA-1 conformance claim.
    expect(text).toContain('pdfuaid:part');
  });

  it('PDF/A only still emits MarkInfo for back-compat', () => {
    // Pre-G-1 behaviour: pdfAEnabled adds /MarkInfo. Make sure this
    // path is unchanged when tagging is off.
    doc = new Document();
    asPdfA(doc.settings);
    // accessibility stays None.

    const text = pdfToText(doc.generateBytes());

    expect(text).toContain('/MarkInfo << /Marked true >>');
    expect(text).not.toContain('/StructTreeRoot');
  });
});
