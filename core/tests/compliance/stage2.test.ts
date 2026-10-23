import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Table } from '../../src/Elements/Tables/Table';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { SemanticGroup } from '../../src/Elements/Layout/SemanticGroup';
import { Line } from '../../src/Elements/Shapes/Line';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { SemanticRole } from '../../src/Rendering/Tagging/SemanticRole';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { pdfToText } from '../helpers/test-base';

/**
 * Stage 2 accessibility hardening (TS mirror).
 * Semantic groups, artifact tagging for headers/footers/watermarks,
 * /Tabs /S reading-order hint, and annotation /StructParent + /OBJR.
 */
describe('Stage 2 accessibility hardening', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function generateTagged(populate: (d: Document) => void): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  function generateUntagged(populate: (d: Document) => void): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  // ── SemanticGroup ──────────────────────────────────────────

  it('SemanticGroup has the correct semanticRole', () => {
    expect(new SemanticGroup(SemanticRole.Sect).semanticRole).toBe(SemanticRole.Sect);
  });

  it('tagged SemanticGroup(Sect) emits /S /Sect, /S /H1, /S /P', () => {
    const pdf = generateTagged(d => {
      const g = new SemanticGroup(SemanticRole.Sect);
      const h = new Heading('Section heading');
      h.tocIdentifier = 's';
      h.level = 1;
      h.fontSize = 18;
      g.add(h);
      const p = new TextBlock();
      p.text = 'Body text.';
      p.fontSize = 12;
      g.add(p);
      d.add(g);
    });

    expect(pdf).toContain('/S /Sect');
    expect(pdf).toContain('/S /H1');
    expect(pdf).toContain('/S /P');
  });

  it('VerticalStack children are tagged', () => {
    const pdf = generateTagged(d => {
      const stack = new VerticalStack();
      const h = new Heading('Stack heading');
      h.tocIdentifier = 'sh';
      h.level = 2;
      h.fontSize = 16;
      stack.add(h);
      const p = new TextBlock();
      p.text = 'Stack body.';
      p.fontSize = 12;
      stack.add(p);
      d.add(stack);
    });

    expect(pdf).toContain('/S /H2');
    expect(pdf).toContain('/S /P');
  });

  it('Table inside VerticalStack produces full table structure', () => {
    const pdf = generateTagged(d => {
      const stack = new VerticalStack();
      const t = new Table(150, 150);
      const tbA = new TextBlock();
      tbA.text = 'A';
      const tbB = new TextBlock();
      tbB.text = 'B';
      t.addHeader(tbA, tbB);
      const tb1 = new TextBlock();
      tb1.text = '1';
      const tb2 = new TextBlock();
      tb2.text = '2';
      t.addRow(tb1, tb2);
      stack.add(t);
      d.add(stack);
    });

    expect(pdf).toContain('/S /Table');
    expect(pdf).toContain('/S /TR');
    expect(pdf).toContain('/S /TH');
    expect(pdf).toContain('/S /TD');
  });

  // ── Artifact tags ──────────────────────────────────────────

  it('headerTemplate in tagged doc emits /Artifact BMC', () => {
    const pdf = generateTagged(d => {
      d.settings.headerTemplate = _ => {
        const tb = new TextBlock();
        tb.text = 'Header';
        tb.fontSize = 9;
        return tb;
      };
      const p = new TextBlock();
      p.text = 'Body content.';
      p.fontSize = 12;
      d.add(p);
    });

    expect(pdf).toContain('/Artifact BMC');
    expect(pdf).toContain('/S /Document');
  });

  it('footerTemplate in tagged doc emits /Artifact BMC', () => {
    const pdf = generateTagged(d => {
      d.settings.footerTemplate = _ => {
        const tb = new TextBlock();
        tb.text = 'Footer';
        tb.fontSize = 9;
        return tb;
      };
      const p = new TextBlock();
      p.text = 'Body content.';
      p.fontSize = 12;
      d.add(p);
    });

    expect(pdf).toContain('/Artifact BMC');
  });

  it('untagged drawing operations in tagged docs are emitted as artifacts', () => {
    const pdf = generateTagged(d => {
      const line = new Line();
      line.thickness = 2;
      d.add(line);
    });

    expect(pdf).toContain('/Artifact BMC');
  });

  // ── /Tabs /S ───────────────────────────────────────────────

  it('tagged document page dict contains /Tabs /S', () => {
    const pdf = generateTagged(d => {
      const p = new TextBlock();
      p.text = 'Content.';
      p.fontSize = 12;
      d.add(p);
    });

    expect(pdf).toContain('/Tabs /S');
  });

  it('untagged document page dict does not contain /Tabs /S', () => {
    const pdf = generateUntagged(d => {
      const p = new TextBlock();
      p.text = 'Content.';
      p.fontSize = 12;
      d.add(p);
    });

    expect(pdf).not.toContain('/Tabs /S');
  });

  // ── Annotation /StructParent + /OBJR ───────────────────────

  it('tagged hyperlink annotation carries /StructParent', () => {
    const pdf = generateTagged(d => {
      const link = new Hyperlink('Visit');
      link.uri = 'https://example.com';
      link.fontSize = 12;
      d.add(link);
    });

    expect(pdf).toContain('/StructParent');
  });

  it('tagged hyperlink produces /OBJR in struct tree', () => {
    const pdf = generateTagged(d => {
      const link = new Hyperlink('Visit');
      link.uri = 'https://example.com';
      link.fontSize = 12;
      d.add(link);
    });

    expect(pdf).toContain('/OBJR');
  });

  it('untagged hyperlink has no /StructParent or /OBJR', () => {
    const pdf = generateUntagged(d => {
      const link = new Hyperlink('Visit');
      link.uri = 'https://example.com';
      link.fontSize = 12;
      d.add(link);
    });

    expect(pdf).not.toContain('/StructParent');
    expect(pdf).not.toContain('/OBJR');
  });
});
