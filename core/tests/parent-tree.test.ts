import { describe, it, expect } from 'vitest';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { StructureTreeBuilder } from '../src/Rendering/Tagging/StructureTreeBuilder';
import { StructureTreeWriter } from '../src/Rendering/Writers/StructureTreeWriter';
import type { IPdfWriter } from '../src/Rendering/Writers/PdfWriter';

/**
 * Stage-1 prep - /Pg + /ParentTree foundational fix. These tests
 * drive StructureTreeWriter with explicit page IDs (the production
 * path) rather than test-mode (no pages) and assert that:
 *   - Each StructElem whose MCIDs all live on one page gets
 *     /K [bare ints] + /Pg <page-ref>.
 *   - An element whose MCIDs span pages gets /K with /MCR dicts
 *     carrying explicit /Pg + /MCID per entry.
 *   - StructTreeRoot has /ParentTree + /ParentTreeNextKey.
 *   - The /ParentTree object's /Nums array has one slot per page
 *     listing the StructElem refs for that page's MCIDs.
 *
 * Pre-existing structure-tree-writer tests assert the test-mode
 * behaviour (no page IDs); together both suites cover the writer.
 */
describe('StructureTreeWriter - /Pg + /ParentTree', () => {
  interface EmittedObject {
    id: number;
    dict: Map<string, string>;
  }

  class FakeWriter implements IPdfWriter {
    private nextId = 100;
    public readonly objects: EmittedObject[] = [];
    getNewId(): number {
      return this.nextId++;
    }
    writeObject(id: number, dict: Map<string, string>): void {
      this.objects.push({ id, dict: new Map(dict) });
    }
    writeCompressedObject(): void {}
    writeBinaryObject(): void {}
    writeCompressedBinaryObject(): void {}
    writeLinkAnnotation(id: number): number {
      return id;
    }
    writeViewerPreferences(id: number): number {
      return id;
    }
    writeCatalog(): void {}
    writeUnencryptedBinaryObject(): void {}
    close(): void {}
    writeEncryptDictionary(id: number): number {
      return id;
    }
  }

  function write(builder: StructureTreeBuilder, pageIds: number[]) {
    const writer = new FakeWriter();
    const sut = new StructureTreeWriter(writer);
    const rootId = sut.write(builder, pageIds);
    return { writer, rootId };
  }

  it('single-page MCIDs => /K bare ints + /Pg', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0, 0);
    builder.addMcid(1, 0);
    builder.end();

    const pageIds = [200, 201];
    const { writer } = write(builder, pageIds);

    const p = writer.objects.find(o => o.dict.get('/S') === '/P')!;
    expect(p.dict.get('/K')).toBe('[ 0 1 ]');
    expect(p.dict.get('/Pg')).toBe('200 0 R'); // page 0's object id
  });

  it('multi-page MCIDs => /K becomes /MCR dicts with explicit /Pg', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0, 0); // page 0
    builder.addMcid(0, 1); // page 1 (MCIDs restart per page)
    builder.end();

    const pageIds = [200, 201];
    const { writer } = write(builder, pageIds);

    const p = writer.objects.find(o => o.dict.get('/S') === '/P')!;
    expect(p.dict.has('/Pg')).toBe(false); // no shared page
    expect(p.dict.get('/K')).toBe('[ << /Type /MCR /Pg 200 0 R /MCID 0 >> << /Type /MCR /Pg 201 0 R /MCID 0 >> ]');
  });

  it('StructTreeRoot carries /ParentTree + /ParentTreeNextKey', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0, 0);
    builder.end();

    const pageIds = [200, 201];
    const { writer, rootId } = write(builder, pageIds);

    const root = writer.objects.find(o => o.dict.get('/Type') === '/StructTreeRoot')!;
    expect(root.id).toBe(rootId);
    expect(root.dict.has('/ParentTree')).toBe(true);
    expect(root.dict.get('/ParentTreeNextKey')).toBe('2'); // 2 pages
  });

  it('/ParentTree.Nums maps page keys to StructElem ref arrays', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0, 0); // page 0 mcid 0 -> P
    builder.end();
    builder.begin(SemanticRole.H1);
    builder.addMcid(0, 1); // page 1 mcid 0 -> H1
    builder.end();

    const pageIds = [200, 201];
    const { writer } = write(builder, pageIds);

    // Find ParentTree object (the only one with /Nums)
    const parentTree = writer.objects.find(o => o.dict.has('/Nums'))!;
    const p = writer.objects.find(o => o.dict.get('/S') === '/P')!;
    const h1 = writer.objects.find(o => o.dict.get('/S') === '/H1')!;

    // Page 0's array slot 0 references P; page 1's slot 0 references H1.
    expect(parentTree.dict.get('/Nums')).toBe(`[ 0 [ ${p.id} 0 R ] 1 [ ${h1.id} 0 R ] ]`);
  });

  it('pages without marked content still appear in /ParentTree.Nums as empty arrays', () => {
    // No MCIDs at all on either page.
    const builder = new StructureTreeBuilder();
    const pageIds = [200, 201];
    const { writer } = write(builder, pageIds);

    const parentTree = writer.objects.find(o => o.dict.has('/Nums'))!;
    // Both pages get a slot so the key→value mapping is contiguous.
    expect(parentTree.dict.get('/Nums')).toBe('[ 0 [ ] 1 [ ] ]');
  });

  it('no page IDs (test mode) => no /Pg, no /ParentTree', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0);
    builder.end();

    const writer = new FakeWriter();
    new StructureTreeWriter(writer).write(builder); // no pageIds

    const p = writer.objects.find(o => o.dict.get('/S') === '/P')!;
    expect(p.dict.has('/Pg')).toBe(false);
    expect(p.dict.get('/K')).toBe('[ 0 ]');

    const root = writer.objects.find(o => o.dict.get('/Type') === '/StructTreeRoot')!;
    expect(root.dict.has('/ParentTree')).toBe(false);
  });
});
