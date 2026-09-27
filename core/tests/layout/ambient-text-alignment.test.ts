import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { RichText } from '../../src/Elements/Text/RichText';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { HorizontalAlignment } from '../../src/Core/HorizontalAlignment';
import { IElement } from '../../src/Elements/IElement';
import { pdfToText } from '../helpers/test-base';

/**
 * A Container whose horizontalAlignment is Start/Center/End establishes that as the ambient horizontal
 * text alignment for descendant text that sets none of its own (spec 01 "Document Model" §3.2). This is
 * what makes the common idiom - a centred container wrapping a Text - centre a paragraph
 * that wraps, not only a single line short enough for block positioning to already have handled.
 * Mirrors BonniePDF.Tests/Layout/AmbientTextAlignmentTests.cs.
 */

const LONG_TITLE =
  'This is a long enough piece of text that it will not fit on a single line and must wrap across several lines within the page margins';

interface TextRun {
  x: number;
  text: string;
}

function textRuns(stream: string): TextRun[] {
  const runs: TextRun[] = [];
  for (const m of stream.matchAll(/1 0 0 1 ([\d.]+) [\d.]+ Tm[\s\S]{0,80}?\((.*?)\) Tj/g)) {
    runs.push({ x: Number(m[1]), text: m[2] });
  }
  return runs;
}

// Matches the .NET tests' `root.Column(...)`/`root.Row(...)`/`root.AlignCenter()` shape: one top-level
// element, built directly.
async function renderElement(build: () => IElement): Promise<string> {
  const doc = new Document(new DocumentSettings({ margin: 50 }));
  doc.add(build());
  const text = pdfToText(await doc.generateBytesAsync());
  doc.dispose();
  return text;
}

describe('ambient horizontal text alignment', () => {
  it('centres every line of a wrapped paragraph when the enclosing container centres', async () => {
    // The exact reported shape: a centred Container wrapping a Text long enough to wrap.
    const text = await renderElement(
      () =>
        new VerticalStack({
          children: [
            new Container({
              horizontalAlignment: HorizontalAlignment.Center,
              child: new TextBlock({ text: LONG_TITLE, fontSize: 13 }),
            }),
          ],
        })
    );

    const runs = textRuns(text);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs)
      expect(r.x, `line "${r.text}" starts at x=${r.x}, which reads as left-aligned`).toBeGreaterThan(55);

    // Genuinely centred, not just indented: the shorter trailing line is indented further than the first.
    expect(runs[runs.length - 1].x).toBeGreaterThan(runs[0].x);
  });

  it('still centres a single short line as before', async () => {
    const text = await renderElement(
      () =>
        new VerticalStack({
          children: [
            new Container({
              horizontalAlignment: HorizontalAlignment.Center,
              child: new TextBlock({ text: 'Short Title', fontSize: 13 }),
            }),
          ],
        })
    );

    const runs = textRuns(text);
    expect(runs).toHaveLength(1);
    expect(runs[0].x).toBeGreaterThan(200);
  });

  it('lets an explicit alignment always win over the ambient', async () => {
    const text = await renderElement(
      () =>
        new VerticalStack({
          children: [
            new Container({
              horizontalAlignment: HorizontalAlignment.Center,
              child: new TextBlock({ text: LONG_TITLE, fontSize: 13, alignment: TextAlignment.Left }),
            }),
          ],
        })
    );

    const runs = textRuns(text);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs) expect(r.x).toBeCloseTo(50, 1);
  });

  it('passes the ambient through an unset or stretch container unchanged', async () => {
    // A plain wrapping VerticalStack between the centring container and the text does not reset the ambient.
    const text = await renderElement(
      () =>
        new Container({
          horizontalAlignment: HorizontalAlignment.Center,
          child: new VerticalStack({ children: [new TextBlock({ text: LONG_TITLE, fontSize: 13 })] }),
        })
    );

    const runs = textRuns(text);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs) expect(r.x).toBeGreaterThan(55);
  });

  it('lets a nested container override the outer ambient', async () => {
    const text = await renderElement(
      () =>
        new Container({
          horizontalAlignment: HorizontalAlignment.Center,
          child: new VerticalStack({
            children: [
              new Container({
                horizontalAlignment: HorizontalAlignment.Start,
                child: new TextBlock({ text: LONG_TITLE, fontSize: 13 }),
              }),
            ],
          }),
        })
    );

    const runs = textRuns(text);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs) expect(r.x).toBeCloseTo(50, 1);
  });

  it('lets RichText pick up the ambient too', async () => {
    const text = await renderElement(() => {
      const rich = new RichText();
      rich.span(LONG_TITLE);
      return new VerticalStack({
        children: [new Container({ horizontalAlignment: HorizontalAlignment.Center, child: rich })],
      });
    });

    const runs = textRuns(text);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs) expect(r.x).toBeGreaterThan(55);
  });

  it('does not let HorizontalStack.alignment (a cross-axis concept) feed the ambient', async () => {
    // HorizontalStack.alignment is cross-axis (vertical) positioning of row children, not text alignment,
    // and MUST NOT leak into descendant text as a centring ambient.
    const text = await renderElement(
      () =>
        new HorizontalStack({
          alignment: HorizontalAlignment.Center,
          children: [new TextBlock({ text: LONG_TITLE, fontSize: 13 })],
        })
    );

    const runs = textRuns(text);
    expect(runs.length).toBeGreaterThanOrEqual(2);
    for (const r of runs) expect(r.x).toBeCloseTo(50, 1);
  });
});
