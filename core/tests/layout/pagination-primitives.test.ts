import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Heading } from '../../src/Elements/Text/Heading';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { pdfToText } from '../helpers/test-base';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { EnsureSpace, ENSURE_SPACE_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/EnsureSpace';
import {
  PreventPageBreak,
  PREVENT_PAGE_BREAK_OPTION_KEYS,
} from '../../src/Elements/Layout/Pagination/PreventPageBreak';
import { ShowEntire, SHOW_ENTIRE_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/ShowEntire';
import { StopPaging, STOP_PAGING_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/StopPaging';
import { ShowIf, SHOW_IF_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/ShowIf';
import { ShowOnce, SHOW_ONCE_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/ShowOnce';
import { SkipOnce, SKIP_ONCE_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/SkipOnce';
import { Unconstrained, UNCONSTRAINED_OPTION_KEYS } from '../../src/Elements/Layout/Pagination/Unconstrained';
import type { IElement } from '../../src/Elements/IElement';
import type { LayoutNode } from '../../src/Rendering/LayoutRecorder';

/**
 * Pagination control primitives - shared conformance fixture
 * `layout/pagination-primitives`.
 *
 * Every case is expressed with `Container` heights rather than text, so the
 * numbers are font-independent and the .NET suite asserts exactly the same
 * ones. A4 portrait with a 50pt margin gives a body band of 741.89pt
 * (841.89 - 2 x 50), which every "how much is left" figure below derives from.
 *
 * Mirrors the .NET PaginationPrimitivesTests.
 */

const PAGE = PdfSize.a4;
const MARGIN = 50;
/** Body content height of one page: 841.89 - 2 x 50. */
const BAND = 741.89;

function newDoc(): Document {
  const doc = new Document();
  doc.settings.pageSize = PAGE;
  doc.settings.margin = MARGIN;
  return doc;
}

/** A block of an exact height, independent of any font metric. */
function block(height: number, name: string): Container {
  return new Container({ height, captureName: name });
}

/** Text tall enough to be split by the engine, measured in whole lines. */
function lines(count: number, name: string): TextBlock {
  return new TextBlock(Array.from({ length: count }, (_, i) => `line ${i + 1}`).join('\n'), {
    fontSize: 12,
    fontName: StandardFonts.Helvetica,
    captureName: name,
  });
}

interface Placement {
  readonly page: number;
  readonly y: number;
  readonly height: number;
}

/** Every rect the named node occupied, in page order. */
async function placements(doc: Document, name: string): Promise<Placement[]> {
  const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
  const found: LayoutNode[] = [];
  const visit = (node: LayoutNode): void => {
    if (node.name === name) found.push(node);
    node.children.forEach(visit);
  };
  visit(snapshot!.root);
  return found.flatMap(node => node.rects.map(r => ({ page: r.page, y: round(r.y), height: round(r.height) })));
}

/** Pages the document laid out to. */
async function pageCount(doc: Document): Promise<number> {
  const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
  return snapshot!.pages.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A stack that fills `used` points of the page, then the element under test. */
function afterFiller(used: number, subject: IElement): VerticalStack {
  const stack = new VerticalStack();
  stack.add(block(used, 'filler'));
  stack.add(subject);
  return stack;
}

/**
 * A stack whose leading text overflows onto a second page, so the element under
 * test is reached with the cursor already on page 2. A `Container` filler cannot
 * do this - it breaks whole rather than splitting, which leaves the cursor at
 * the top of the new page *before* the filler, not after it.
 */
function onSecondPage(subject: IElement): VerticalStack {
  const stack = new VerticalStack();
  stack.add(lines(70, 'filler'));
  stack.add(subject);
  return stack;
}

describe('breakAllowed (the PreventPageBreak property form)', () => {
  it('splits a stateful child that allows breaking', async () => {
    // 20 lines at 12pt ~ 240pt; only 100pt is left, so it splits.
    const doc = newDoc();
    doc.add(afterFiller(BAND - 100, lines(20, 'body')));

    const rects = await placements(doc, 'body');
    expect(rects.length).toBeGreaterThan(1);
    expect(rects[0].page).toBe(0);
    expect(rects[1].page).toBe(1);
  });

  it('moves a child that refuses to break whole onto the next page', async () => {
    const doc = newDoc();
    const body = lines(20, 'body');
    body.breakAllowed = false;
    doc.add(afterFiller(BAND - 100, body));

    const rects = await placements(doc, 'body');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(1);
    expect(rects[0].y).toBe(MARGIN);
  });

  it('still splits a child too tall for any page, whatever it asks for', async () => {
    const doc = newDoc();
    const body = lines(120, 'body');
    body.breakAllowed = false;
    doc.add(body);

    const rects = await placements(doc, 'body');
    expect(rects.length).toBeGreaterThan(1);
  });
});

describe('EnsureSpace', () => {
  it('breaks when less than the required space remains', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 100, new EnsureSpace({ minHeight: 150, child: block(40, 'heading') })));

    const rects = await placements(doc, 'heading');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(1);
  });

  it('stays put when the required space is available', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 200, new EnsureSpace({ minHeight: 150, child: block(40, 'heading') })));

    const rects = await placements(doc, 'heading');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(0);
  });

  it('never breaks at the top of a page, which would only add a blank one', async () => {
    const doc = newDoc();
    // Demanding more than a whole band can ever offer.
    doc.add(new EnsureSpace({ minHeight: BAND + 200, child: block(40, 'heading') }));

    const rects = await placements(doc, 'heading');
    expect(rects[0].page).toBe(0);
    expect(await pageCount(doc)).toBe(1);
  });

  it('accepts a length token for minHeight', () => {
    expect(new EnsureSpace({ minHeight: '1in' }).minHeight).toBe(72);
    expect(new EnsureSpace(150).minHeight).toBe(150);
  });
});

describe('PreventPageBreak', () => {
  it('moves a child that would straddle the boundary onto the next page', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 100, new PreventPageBreak(lines(20, 'body'))));

    const rects = await placements(doc, 'body');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(1);
  });

  it('leaves a child that fits exactly where it is', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 300, new PreventPageBreak(lines(20, 'body'))));

    const rects = await placements(doc, 'body');
    expect(rects[0].page).toBe(0);
  });

  it('still splits a child taller than a whole page', async () => {
    const doc = newDoc();
    doc.add(new PreventPageBreak(lines(120, 'body')));

    const rects = await placements(doc, 'body');
    expect(rects.length).toBeGreaterThan(1);
  });
});

describe('ShowEntire', () => {
  it('moves a child that does not fit onto a fresh page', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 100, new ShowEntire(lines(20, 'panel'))));

    const rects = await placements(doc, 'panel');
    expect(rects[0].page).toBe(1);
  });

  it('refuses to split, dropping what does not fit on one page', async () => {
    const doc = newDoc();
    doc.add(new ShowEntire(lines(120, 'panel')));

    const rects = await placements(doc, 'panel');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(0);
    expect(await pageCount(doc)).toBe(1);
  });
});

describe('StopPaging', () => {
  it('renders what fits on the current page and discards the rest', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 100, new StopPaging(lines(60, 'appendix'))));

    const rects = await placements(doc, 'appendix');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(0);
    expect(await pageCount(doc)).toBe(1);
  });

  it('does not move to a fresh page first, unlike ShowEntire', async () => {
    const doc = newDoc();
    doc.add(afterFiller(BAND - 100, new StopPaging(lines(20, 'appendix'))));

    const rects = await placements(doc, 'appendix');
    expect(rects[0].page).toBe(0);
  });
});

describe('ShowIf, ShowOnce and SkipOnce', () => {
  it('renders when the predicate accepts the page', async () => {
    const doc = newDoc();
    doc.add(new ShowIf({ predicate: p => p.isFirstPage, child: block(40, 'note') }));

    expect(await placements(doc, 'note')).toHaveLength(1);
  });

  it('renders nothing when the predicate rejects the page', async () => {
    const doc = newDoc();
    doc.add(new ShowIf({ predicate: p => !p.isFirstPage, child: block(40, 'note') }));

    expect(await placements(doc, 'note')).toHaveLength(0);
  });

  it('passes the 1-based page number to the predicate', async () => {
    const seen: number[] = [];
    const doc = newDoc();
    doc.settings.headerTemplate = () =>
      new ShowIf({
        predicate: p => {
          seen.push(p.pageNumber);
          return true;
        },
        child: block(20, 'running-head'),
      });
    doc.add(lines(120, 'body'));
    await pageCount(doc);

    expect(seen.length).toBeGreaterThan(0);
    expect(Math.min(...seen)).toBe(1);
  });

  it('treats a missing predicate as a transparent wrapper', async () => {
    const doc = newDoc();
    doc.add(new ShowIf({ child: block(40, 'note') }));

    expect(await placements(doc, 'note')).toHaveLength(1);
  });

  it('ShowOnce renders on the first page only', async () => {
    const onPageOne = newDoc();
    onPageOne.add(new ShowOnce(block(40, 'cover-note')));
    expect(await placements(onPageOne, 'cover-note')).toHaveLength(1);

    const onPageTwo = newDoc();
    onPageTwo.add(onSecondPage(new ShowOnce(block(40, 'cover-note'))));
    expect(await placements(onPageTwo, 'cover-note')).toHaveLength(0);
  });

  it('SkipOnce is the mirror of ShowOnce', async () => {
    const onPageOne = newDoc();
    onPageOne.add(new SkipOnce(block(40, 'running-note')));
    expect(await placements(onPageOne, 'running-note')).toHaveLength(0);

    const onPageTwo = newDoc();
    onPageTwo.add(onSecondPage(new SkipOnce(block(40, 'running-note'))));
    const rects = await placements(onPageTwo, 'running-note');
    expect(rects).toHaveLength(1);
    expect(rects[0].page).toBe(1);
  });
});

describe('Unconstrained', () => {
  it('consumes no flow height, so the next element starts where it did', async () => {
    const doc = newDoc();
    const stack = new VerticalStack();
    stack.add(new Unconstrained(block(200, 'stamp')));
    stack.add(block(40, 'after'));
    doc.add(stack);

    const stamp = await placements(doc, 'stamp');
    const after = await placements(doc, 'after');
    expect(stamp[0].y).toBe(MARGIN);
    expect(after[0].y).toBe(MARGIN);
    expect(after[0].page).toBe(0);
  });

  it('measures as zero height whatever the child measures', () => {
    expect(new Unconstrained(block(400, 'stamp')).measureHeight(500)).toBe(0);
    expect(block(400, 'stamp').measureHeight(500)).toBe(400);
  });

  it('leaves the cursor untouched, so following content overlaps it', async () => {
    const doc = newDoc();
    const stack = new VerticalStack();
    stack.add(new Unconstrained(lines(4, 'stamp')));
    stack.add(lines(4, 'over'));
    doc.add(stack);

    const stamp = await placements(doc, 'stamp');
    const over = await placements(doc, 'over');
    expect(stamp[0].y).toBe(over[0].y);
  });
});

/**
 * Option-bag coverage, matching the rule in `tests/normalize/base-options.test.ts`:
 * a property settable on the class but missing from its `*_OPTION_KEYS` bag is a
 * knob TypeScript callers can reach and C# callers cannot, which is a parity
 * defect rather than a spelling difference.
 */
describe('pagination primitive option bags', () => {
  /** Settable names on an instance: own enumerable fields plus prototype setters. */
  function settableSurface(instance: object): string[] {
    const names = new Set<string>();
    for (const key of Object.keys(instance)) {
      if (!key.startsWith('_') && key !== 'startingY') names.add(key);
    }
    let proto: object | null = Object.getPrototypeOf(instance);
    while (proto && proto !== Object.prototype) {
      for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
        if (typeof d.set === 'function' && !key.startsWith('_')) names.add(key);
      }
      proto = Object.getPrototypeOf(proto);
    }
    return [...names].sort();
  }

  const cases: ReadonlyArray<readonly [string, object, readonly string[]]> = [
    ['EnsureSpace', new EnsureSpace(), ENSURE_SPACE_OPTION_KEYS],
    ['PreventPageBreak', new PreventPageBreak(), PREVENT_PAGE_BREAK_OPTION_KEYS],
    ['ShowEntire', new ShowEntire(), SHOW_ENTIRE_OPTION_KEYS],
    ['StopPaging', new StopPaging(), STOP_PAGING_OPTION_KEYS],
    ['ShowIf', new ShowIf(), SHOW_IF_OPTION_KEYS],
    ['ShowOnce', new ShowOnce(), SHOW_ONCE_OPTION_KEYS],
    ['SkipOnce', new SkipOnce(), SKIP_ONCE_OPTION_KEYS],
    ['Unconstrained', new Unconstrained(), UNCONSTRAINED_OPTION_KEYS],
  ];

  for (const [name, instance, keys] of cases) {
    it(`${name}'s option keys cover its settable surface exactly`, () => {
      expect(settableSurface(instance)).toEqual([...keys].sort());
    });
  }
});

describe('pagination wrappers keep their child tagged', () => {
  function headingCount(wrap: boolean, wrapper: (child: Heading) => IElement): number {
    const doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    const heading = new Heading('Section');
    heading.level = 2;
    doc.add(wrap ? wrapper(heading) : heading);
    doc.add(new TextBlock('Body text.'));
    const text = pdfToText(doc.generateBytes());
    doc.dispose();
    return (text.match(/\/S\s*\/H2\b/g) ?? []).length;
  }

  // SkipOnce is absent on purpose: it renders nothing on the first page, where this document puts the heading.
  const wrappers: Array<[string, (child: Heading) => IElement]> = [
    ['EnsureSpace', c => new EnsureSpace({ minHeight: 50, child: c })],
    ['PreventPageBreak', c => new PreventPageBreak({ child: c })],
    ['ShowEntire', c => new ShowEntire({ child: c })],
    ['ShowIf', c => new ShowIf({ predicate: () => true, child: c })],
    ['ShowOnce', c => new ShowOnce({ child: c })],
    ['StopPaging', c => new StopPaging({ child: c })],
  ];

  for (const [name, wrapper] of wrappers) {
    it(`${name} leaves a heading in the structure tree`, () => {
      expect(headingCount(false, wrapper)).toBe(1);
      expect(headingCount(true, wrapper)).toBe(1);
    });
  }
});
