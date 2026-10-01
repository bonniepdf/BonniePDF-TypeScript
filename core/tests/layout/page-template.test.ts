import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { pageTemplate, getPageTemplateElements, type PageTemplateElements } from '../../src/Configuration/PageTemplate';
import { Container } from '../../src/Elements/Layout/Container';
import { PageBreak } from '../../src/Elements/Layout/PageBreak';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import type { IElement } from '../../src/Elements/IElement';
import { pdfToText } from '../helpers/test-base';

/**
 * Element-based page templates - shared conformance fixture
 * `layout/page-template-resolution` (spec 01 §4.0). For page n the template
 * returns the first present of firstPage (n = 1), odd/even, default.
 *
 * Mirrors the .NET PageTemplateTests.
 */

type Member = keyof PageTemplateElements;
const MEMBERS: readonly Member[] = ['default', 'firstPage', 'odd', 'even'];

/** One distinct marker element per member, so the answer can be read off by identity. */
function markers(): Record<Member, IElement> {
  return {
    default: new Container({ height: 1 }),
    firstPage: new Container({ height: 2 }),
    odd: new Container({ height: 3 }),
    even: new Container({ height: 4 }),
  };
}

/** Which member's marker the template returned for a page, or null for nothing. */
function resolve(members: readonly Member[], page: number): Member | null {
  const all = markers();
  const built: PageTemplateElements = {};
  for (const m of members) built[m] = all[m];
  const result = pageTemplate(built)(page);
  if (result === undefined) return null;
  return MEMBERS.find(m => all[m] === result) ?? null;
}

describe('pageTemplate resolution', () => {
  const cases: { id: string; members: Member[]; expect: Record<number, Member | null> }[] = [
    { id: 'default-only', members: ['default'], expect: { 1: 'default', 2: 'default', 3: 'default', 10: 'default' } },
    {
      id: 'first-page-then-default',
      members: ['default', 'firstPage'],
      expect: { 1: 'firstPage', 2: 'default', 3: 'default' },
    },
    { id: 'first-page-alone', members: ['firstPage'], expect: { 1: 'firstPage', 2: null, 3: null } },
    {
      id: 'odd-even',
      members: ['odd', 'even'],
      expect: { 1: 'odd', 2: 'even', 3: 'odd', 4: 'even', 11: 'odd', 12: 'even' },
    },
    { id: 'even-alone', members: ['even'], expect: { 1: null, 2: 'even', 3: null, 4: 'even' } },
    {
      id: 'odd-even-with-default',
      members: ['default', 'even'],
      expect: { 1: 'default', 2: 'even', 3: 'default', 4: 'even' },
    },
    {
      id: 'first-page-beats-parity',
      members: ['default', 'firstPage', 'odd', 'even'],
      expect: { 1: 'firstPage', 2: 'even', 3: 'odd', 4: 'even' },
    },
  ];

  for (const c of cases) {
    it(c.id, () => {
      for (const [page, member] of Object.entries(c.expect)) {
        expect(resolve(c.members, Number(page)), `page ${page}`).toBe(member);
      }
    });
  }

  it('fails at construction when built from no element', () => {
    expect(() => pageTemplate({})).toThrow();
    expect(() => pageTemplate({ default: undefined, odd: undefined })).toThrow();
  });
});

describe('getPageTemplateElements', () => {
  it('reads back the elements a template was built from', () => {
    const all = markers();
    const template = pageTemplate({ default: all.default, even: all.even });
    const back = getPageTemplateElements(template);
    expect(back?.default).toBe(all.default);
    expect(back?.even).toBe(all.even);
    expect(back?.firstPage).toBeUndefined();
    expect(back?.odd).toBeUndefined();
  });

  it('returns undefined for a hand-written function and for no template', () => {
    expect(getPageTemplateElements(() => undefined)).toBeUndefined();
    expect(getPageTemplateElements(undefined)).toBeUndefined();
  });
});

describe('pageTemplate in a document', () => {
  function threePageDocument(settings: ConstructorParameters<typeof DocumentSettings>[0]): Document {
    const doc = new Document(new DocumentSettings(settings));
    doc.add(new TextBlock({ text: 'first' }));
    doc.add(new PageBreak());
    doc.add(new TextBlock({ text: 'second' }));
    doc.add(new PageBreak());
    doc.add(new TextBlock({ text: 'third' }));
    return doc;
  }

  it('draws the chosen footer on each page, with page tokens resolved', async () => {
    const doc = threePageDocument({
      margin: 50,
      footerTemplate: pageTemplate({
        default: new TextBlock({ text: 'Page {{CurrentPage}} of {{TotalPages}}' }),
        even: new TextBlock({ text: 'Even {{CurrentPage}} of {{TotalPages}}' }),
      }),
    });

    const text = pdfToText(await doc.generateBytesAsync());

    expect(text).not.toContain('{{');
    expect(text).toContain('(Page 1 of ) Tj');
    expect(text).toContain('(Even 2 of ) Tj');
    expect(text).toContain('(Page 3 of ) Tj');
    expect(text).not.toContain('(Page 2 of )');
    expect(text).not.toContain('(Even 1 of )');
    doc.dispose();
  });

  it('draws a first-page-only header once', async () => {
    const doc = threePageDocument({
      margin: 50,
      headerTemplate: pageTemplate({ firstPage: new TextBlock({ text: 'Confidential' }) }),
    });

    const text = pdfToText(await doc.generateBytesAsync());

    expect(text.split('(Confidential) Tj').length - 1).toBe(1);
    doc.dispose();
  });

  it('matches an equivalent hand-written function byte for byte', async () => {
    const build = (footer: DocumentSettings['footerTemplate']) => {
      const doc = threePageDocument({ margin: 50, footerTemplate: footer });
      return doc;
    };
    const a = new TextBlock({ text: 'A {{CurrentPage}}' });
    const b = new TextBlock({ text: 'B {{CurrentPage}}' });

    const fromFactory = build(pageTemplate({ default: a, even: b }));
    const fromFunction = build(n => (n % 2 === 0 ? b : a));

    // The trailer's /ID is random per generation; nothing else may differ.
    const maskId = (text: string) =>
      text.replace(/\/ID \[[^\]]*\]/, '/ID []').replace(/\/(CreationDate|ModDate) \([^)]*\)/g, '');
    const x = maskId(pdfToText(await fromFactory.generateBytesAsync()));
    const y = maskId(pdfToText(await fromFunction.generateBytesAsync()));
    expect(x).toBe(y);
    fromFactory.dispose();
    fromFunction.dispose();
  });
});
