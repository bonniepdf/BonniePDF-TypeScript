import { describe, it, expect } from 'vitest';
import { SemanticRole, toPdfTag } from '../src/Rendering/Tagging/SemanticRole';
import { StructureElement } from '../src/Rendering/Tagging/StructureElement';
import { StructureTreeBuilder } from '../src/Rendering/Tagging/StructureTreeBuilder';
import { StructureTreeException } from '../src/Rendering/Tagging/StructureTreeException';
import type { IStructureVisitor } from '../src/Rendering/Tagging/IStructureVisitor';

/**
 * this feature acceptance tests for the in-memory structure-tree model.
 * Covers builder invariants, MCID attachment, optional metadata,
 * visitor traversal, and the human-readable tree dump used by later
 * golden tests.
 */
describe('StructureTreeBuilder', () => {
  it('new builder has a Document root', () => {
    const builder = new StructureTreeBuilder();
    expect(builder.root.role).toBe(SemanticRole.Document);
    expect(builder.current).toBe(builder.root);
    expect(builder.root.children).toHaveLength(0);
    expect(builder.root.mcIds).toHaveLength(0);
  });

  it('begin creates a child and makes it current', () => {
    const builder = new StructureTreeBuilder();
    const h1 = builder.begin(SemanticRole.H1);

    expect(h1.role).toBe(SemanticRole.H1);
    expect(h1.parent).toBe(builder.root);
    expect(builder.current).toBe(h1);
    expect(builder.root.children).toHaveLength(1);
    expect(builder.root.children[0]).toBe(h1);
  });

  it('end restores the previous current', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    expect(builder.current.role).toBe(SemanticRole.P);
    builder.end();
    expect(builder.current).toBe(builder.root);
  });

  it('nested begin/end composes correctly', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.Sect);
    builder.begin(SemanticRole.H1);
    builder.end();
    builder.begin(SemanticRole.P);
    builder.end();
    builder.end();

    expect(builder.root.children).toHaveLength(1);
    const sect = builder.root.children[0];
    expect(sect.role).toBe(SemanticRole.Sect);
    expect(sect.children).toHaveLength(2);
    expect(sect.children[0].role).toBe(SemanticRole.H1);
    expect(sect.children[1].role).toBe(SemanticRole.P);
  });

  it('end at the document root throws', () => {
    const builder = new StructureTreeBuilder();
    expect(() => builder.end()).toThrow(StructureTreeException);
  });

  it('too many ends throws', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.end();
    expect(() => builder.end()).toThrow(StructureTreeException);
  });

  it('addMcid attaches to the current element only', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0);
    builder.addMcid(1);
    builder.end();

    const p = builder.root.children[0];
    expect(p.mcIds).toEqual([0, 1]);
    expect(builder.root.mcIds).toEqual([]);
  });

  it('setAlt / setActualText / setLang / setTitle round-trip on the current', () => {
    const builder = new StructureTreeBuilder();
    const fig = builder.begin(SemanticRole.Figure);
    builder.setAlt('Quarterly revenue chart');
    builder.setActualText('£12.3M');
    builder.setLang('en-GB');
    builder.setTitle('Q4 revenue');
    builder.end();

    expect(fig.alt).toBe('Quarterly revenue chart');
    expect(fig.actualText).toBe('£12.3M');
    expect(fig.lang).toBe('en-GB');
    expect(fig.title).toBe('Q4 revenue');
  });

  it('walk traverses depth-first with enter/leave pairs', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.Sect);
    builder.begin(SemanticRole.H1);
    builder.end();
    builder.begin(SemanticRole.P);
    builder.end();
    builder.end();

    const visitor = new RecordingVisitor();
    builder.walk(visitor);

    expect(visitor.events).toEqual([
      'enter:Document',
      'enter:Sect',
      'enter:H1',
      'leave:H1',
      'enter:P',
      'leave:P',
      'leave:Sect',
      'leave:Document',
    ]);
  });

  it('toTreeString produces a stable golden repr', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.H1);
    builder.addMcid(0);
    builder.end();
    builder.begin(SemanticRole.Figure);
    builder.addMcid(1);
    builder.setAlt('logo');
    builder.end();

    const expected = ['Document', '  H1 [mcids: 0]', '  Figure [mcids: 1] /Alt=logo', ''].join('\n');
    expect(builder.root.toTreeString()).toBe(expected);
  });

  it('toPdfTag matches the enum value', () => {
    expect(toPdfTag(SemanticRole.H1)).toBe('H1');
    expect(toPdfTag(SemanticRole.Figure)).toBe('Figure');
    expect(toPdfTag(SemanticRole.Artifact)).toBe('Artifact');
    expect(toPdfTag(SemanticRole.BlockQuote)).toBe('BlockQuote');
  });
});

class RecordingVisitor implements IStructureVisitor {
  public readonly events: string[] = [];
  visitEnter(element: StructureElement): void {
    this.events.push(`enter:${toPdfTag(element.role)}`);
  }
  visitLeave(element: StructureElement): void {
    this.events.push(`leave:${toPdfTag(element.role)}`);
  }
}
