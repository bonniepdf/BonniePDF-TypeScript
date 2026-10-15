import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { RenderStatus } from '../../src/Elements/RenderStatus';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import type { IStatefulElement } from '../../src/Elements/IElement';
import type { RenderContext } from '../../src/Rendering/RenderContext';
import { pdfToText } from '../helpers/test-base';

/** Returns the scripted status for each renderStateful call. Mirrors the .NET OverflowGuardTests. */
class ScriptedElement implements IStatefulElement {
  public calls = 0;
  public lastPageIndex = -1;
  constructor(private readonly results: (i: number) => RenderStatus) {}
  measureHeight(): number {
    return 10;
  }
  getPreferredWidth(): number {
    return 0;
  }
  render(): void {}
  renderStateful(ctx: RenderContext): RenderStatus {
    ctx.currentY += 10;
    this.lastPageIndex = ctx.currentPageIndex;
    return this.results(this.calls++);
  }
  resetState(): void {}
}

function pageCount(bytes: Uint8Array): number {
  return (
    Buffer.from(bytes)
      .toString('latin1')
      .match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []
  ).length;
}

describe('top-level overflow guard', () => {
  it('lets one element span more than 500 pages', () => {
    // Long reports are a single top-level column; every page it fills is progress.
    const element = new ScriptedElement(i => (i < 799 ? RenderStatus.Overflow : RenderStatus.Complete));
    const doc = new Document();
    doc.add(element);
    const after = new ScriptedElement(() => RenderStatus.Complete);
    doc.add(after);
    doc.add(new TextBlock('After the long element'));

    const bytes = doc.generateBytes();

    expect(element.calls).toBe(800);
    expect(pageCount(bytes)).toBe(800);
    expect(after.lastPageIndex).toBe(799);
    expect(pdfToText(bytes)).toContain('After the long element');
  });

  it('abandons an element that cannot fit after two fresh pages', () => {
    const element = new ScriptedElement(() => RenderStatus.WrapRequired);
    const doc = new Document();
    doc.add(element);
    const after = new ScriptedElement(() => RenderStatus.Complete);
    doc.add(after);
    doc.add(new TextBlock('After the oversized element'));

    const bytes = doc.generateBytes();

    // First attempt, then two retries on fresh pages; the next element continues on the third page.
    expect(element.calls).toBe(3);
    expect(pageCount(bytes)).toBe(3);
    expect(after.lastPageIndex).toBe(2);
    expect(pdfToText(bytes)).toContain('After the oversized element');
  });

  it('resets the retry count whenever the element makes progress', () => {
    const pattern = [RenderStatus.WrapRequired, RenderStatus.WrapRequired, RenderStatus.Overflow];
    const element = new ScriptedElement(i => (i < 9 ? pattern[i % 3] : RenderStatus.Complete));
    const doc = new Document();
    doc.add(element);

    const bytes = doc.generateBytes();

    expect(element.calls).toBe(10);
    expect(pageCount(bytes)).toBe(10);
  });
});
