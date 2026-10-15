import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { RenderStatus } from '../../src/Elements/RenderStatus';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { SemanticGroup } from '../../src/Elements/Layout/SemanticGroup';
import { SemanticRole } from '../../src/Rendering/Tagging/SemanticRole';
import type { IStatefulElement } from '../../src/Elements/IElement';
import type { RenderContext } from '../../src/Rendering/RenderContext';
import { contentStreams } from '../helpers/test-base';

// Spec fixture layout/top-level-flow (02 §6.1, 04 §3.3). Mirrored by the .NET TopLevelFlowTests.

/** Returns the scripted status for each renderStateful call. */
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

const O = RenderStatus.Overflow;
const W = RenderStatus.WrapRequired;
const C = RenderStatus.Complete;

function pageCount(bytes: Uint8Array): number {
  return (new TextDecoder('latin1').decode(bytes).match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
}

/** The marked-content and graphics-state operator lines of each page content stream. */
function scopeOperators(bytes: Uint8Array): string[][] {
  return contentStreams(bytes)
    .filter(s => s.includes('BT'))
    .map(s => s.split('\n').filter(line => /(?:^|\s)(?:q|Q|BDC|BMC|EMC)$/.test(line)));
}

function balanced(ops: string[]): boolean {
  const opens = ops.filter(op => / (?:BDC|BMC)$/.test(op)).length;
  return opens === ops.filter(op => op === 'EMC').length;
}

function taggedDocument(): Document {
  return new Document({ settings: { accessibility: 'pdf/ua-1', language: 'en-GB' }, metadata: { title: 'Flow' } });
}

describe('top-level flow: pagination', () => {
  it('spans more than 500 pages', () => {
    const element = new ScriptedElement(i => (i < 799 ? O : C));
    const after = new ScriptedElement(() => C);
    const doc = new Document();
    doc.add(element);
    doc.add(after);

    const bytes = doc.generateBytes();

    expect(element.calls).toBe(800);
    expect(pageCount(bytes)).toBe(800);
    expect(after.lastPageIndex).toBe(799);
    expect(doc.diagnostics).toEqual([]);
  });

  it('skips an element after two fresh pages', () => {
    const element = new ScriptedElement(() => W);
    const after = new ScriptedElement(() => C);
    const doc = new Document();
    doc.add(element);
    doc.add(after);

    const bytes = doc.generateBytes();

    expect(element.calls).toBe(3);
    expect(pageCount(bytes)).toBe(3);
    expect(after.lastPageIndex).toBe(2);
  });

  it('resets the count whenever the element makes progress', () => {
    const pattern = [W, W, O];
    const element = new ScriptedElement(i => (i < 9 ? pattern[i % 3] : C));
    const doc = new Document();
    doc.add(element);

    const bytes = doc.generateBytes();

    expect(element.calls).toBe(10);
    expect(pageCount(bytes)).toBe(10);
    expect(doc.diagnostics).toEqual([]);
  });
});

describe('top-level flow: diagnostics', () => {
  it('warns when an element is skipped', () => {
    const doc = new Document();
    doc.add(new ScriptedElement(() => W));

    doc.generateBytes();

    expect(doc.diagnostics.map(d => [d.severity, d.category, d.source, d.message])).toEqual([
      ['warning', 'render', 'pagination', 'An element that does not fit on an empty page was skipped (page 3).'],
    ]);
  });
});

describe('top-level flow: tagging across page breaks', () => {
  it('splits a paragraph with its graphics state nested inside on every page', () => {
    const doc = taggedDocument();
    doc.add(
      new TextBlock(Array.from({ length: 600 }, (_, i) => `Line ${i} of a long paragraph that spans pages.`).join(' '))
    );

    const pages = scopeOperators(doc.generateBytes());

    expect(pages).toHaveLength(7);
    for (const ops of pages) {
      expect(balanced(ops)).toBe(true);
      expect(ops.slice(0, 2)).toEqual(['/P << /MCID 0 >> BDC', 'q']);
      expect(ops.slice(-2)).toEqual(['Q', 'EMC']);
    }
  });

  it('keeps a decorative region an artifact on every page', () => {
    const doc = taggedDocument();
    const group = new SemanticGroup(SemanticRole.Artifact);
    for (let i = 0; i < 120; i++) group.add(new TextBlock(`Decorative line ${i}`));
    doc.add(group);

    const bytes = doc.generateBytes();
    const pages = scopeOperators(bytes);

    expect(pages).toHaveLength(3);
    for (const ops of pages) {
      expect(balanced(ops)).toBe(true);
      expect(ops.slice(0, 2)).toEqual(['/Artifact BMC', 'q']);
    }
    expect(contentStreams(bytes).some(s => s.includes('/MCID'))).toBe(false);
  });
});
