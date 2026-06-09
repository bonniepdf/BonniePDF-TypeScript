import { describe, it, expect } from 'vitest';
import { PdfCanvas } from '../src/Drawing/PdfCanvas';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { StructureTreeBuilder } from '../src/Rendering/Tagging/StructureTreeBuilder';
import { TaggingContext } from '../src/Rendering/Tagging/TaggingContext';

/**
 * marked-content emission tests for PdfCanvas. Drives the
 * canvas directly with a TaggingContext and asserts the emitted PDF
 * operators wrap content in BDC/EMC. Mirrors the .NET
 * PdfCanvasMarkedContentTests.
 */
describe('PdfCanvas - marked content', () => {
  function newTaggedCanvas(): { canvas: PdfCanvas; tree: StructureTreeBuilder; ctx: TaggingContext } {
    const tree = new StructureTreeBuilder();
    const ctx = new TaggingContext(tree);
    const canvas = new PdfCanvas(800);
    canvas.setTaggingContext(ctx);
    return { canvas, tree, ctx };
  }

  it('beginMarkedContent emits BDC with MCID and attaches to the tree', () => {
    const { canvas, tree } = newTaggedCanvas();
    tree.begin(SemanticRole.P);

    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();

    const output = canvas.getStream().join('');
    expect(output).toContain('/P << /MCID 0 >> BDC');
    expect(output).toContain('EMC');
    expect(tree.current.mcIds).toEqual([0]);
  });

  it('MCID increments across multiple begin/end pairs', () => {
    const { canvas, tree, ctx } = newTaggedCanvas();
    tree.begin(SemanticRole.P);

    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();
    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();
    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();

    const output = canvas.getStream().join('');
    expect(output).toContain('/MCID 0 >>');
    expect(output).toContain('/MCID 1 >>');
    expect(output).toContain('/MCID 2 >>');
    expect(ctx.allocateMcid()).toBe(3); // next allocation would be 3
  });

  it('resetPage restarts the MCID counter at 0', () => {
    const { canvas, tree, ctx } = newTaggedCanvas();
    tree.begin(SemanticRole.P);

    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();
    expect(canvas.getStream().join('')).toContain('/MCID 0 >>');

    ctx.resetPage();
    // Drain the stream and start fresh
    const fresh = new PdfCanvas(800);
    fresh.setTaggingContext(ctx);
    fresh.beginMarkedContent('P');
    fresh.endMarkedContent();

    expect(fresh.getStream().join('')).toContain('/MCID 0 >>');
  });

  it('without tagging context, begin/end are no-ops', () => {
    const canvas = new PdfCanvas(800);
    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();

    expect(canvas.getStream()).toEqual([]);
  });

  it('nested begin/end pairs emit in order', () => {
    const { canvas, tree } = newTaggedCanvas();
    tree.begin(SemanticRole.Sect);

    canvas.beginMarkedContent('Sect');
    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();
    canvas.beginMarkedContent('P');
    canvas.endMarkedContent();
    canvas.endMarkedContent();

    const output = canvas.getStream().join('');
    const sectIdx = output.indexOf('/Sect << /MCID');
    const p1Idx = output.indexOf('/P BMC');
    const p2Idx = output.indexOf('/P BMC', p1Idx + 1);
    expect(sectIdx).toBeGreaterThanOrEqual(0);
    expect(p1Idx).toBeGreaterThan(sectIdx);
    expect(p2Idx).toBeGreaterThan(p1Idx);
  });

  it('unbalanced endMarkedContent is tolerated', () => {
    const { canvas, tree } = newTaggedCanvas();
    tree.begin(SemanticRole.P);

    // No matching begin - end is a no-op rather than emitting a stray EMC.
    canvas.endMarkedContent();
    expect(canvas.getStream()).toEqual([]);
  });
});
