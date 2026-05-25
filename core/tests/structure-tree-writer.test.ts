import { describe, it, expect } from 'vitest';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { StructureTreeBuilder } from '../src/Rendering/Tagging/StructureTreeBuilder';
import { StructureTreeWriter } from '../src/Rendering/Writers/StructureTreeWriter';
import type { IPdfWriter } from '../src/Rendering/Writers/PdfWriter';

interface EmittedObject {
  id: number;
  dict: Map<string, string>;
}

/**
 * this feature acceptance tests for StructureTreeWriter. Drives the writer
 * with a fake IPdfWriter that records every object emitted, so the
 * tests can assert the PDF object graph shape without spinning up a
 * full Document.
 */
describe('StructureTreeWriter', () => {
  function writeWithFake(builder: StructureTreeBuilder) {
    const writer = new FakeWriter();
    const sut = new StructureTreeWriter(writer);
    const rootId = sut.write(builder);
    return { writer, rootId };
  }

  it('write empty tree emits Document StructElem + StructTreeRoot', () => {
    const { writer, rootId } = writeWithFake(new StructureTreeBuilder());

    expect(writer.objects).toHaveLength(2);
    const documentElem = writer.objects.find(o => o.dict.get('/Type') === '/StructElem')!;
    expect(documentElem.dict.get('/S')).toBe('/Document');
    expect(documentElem.dict.get('/P')).toBe(`${rootId} 0 R`);
    expect(documentElem.dict.has('/K')).toBe(false);

    const root = writer.objects.find(o => o.dict.get('/Type') === '/StructTreeRoot')!;
    expect(root.dict.get('/K')).toBe(`[ ${documentElem.id} 0 R ]`);
  });

  it('nested tree produces correct parent refs and kids arrays', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.Sect);
    builder.begin(SemanticRole.H1);
    builder.end();
    builder.begin(SemanticRole.P);
    builder.end();
    builder.end();

    const { writer, rootId } = writeWithFake(builder);

    const elems = writer.objects.filter(o => o.dict.get('/Type') === '/StructElem');
    expect(elems).toHaveLength(4);

    const byRole = (role: string): EmittedObject => elems.find(e => e.dict.get('/S') === '/' + role)!;

    const doc = byRole('Document');
    const sect = byRole('Sect');
    const h1 = byRole('H1');
    const p = byRole('P');

    expect(doc.dict.get('/P')).toBe(`${rootId} 0 R`);
    expect(sect.dict.get('/P')).toBe(`${doc.id} 0 R`);
    expect(h1.dict.get('/P')).toBe(`${sect.id} 0 R`);
    expect(p.dict.get('/P')).toBe(`${sect.id} 0 R`);

    expect(doc.dict.get('/K')).toBe(`[ ${sect.id} 0 R ]`);
    expect(sect.dict.get('/K')).toBe(`[ ${h1.id} 0 R ${p.id} 0 R ]`);
    expect(h1.dict.has('/K')).toBe(false);
    expect(p.dict.has('/K')).toBe(false);
  });

  it('MCIDs appear as bare ints in /K array after struct refs', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.P);
    builder.addMcid(0);
    builder.addMcid(1);
    builder.begin(SemanticRole.Span);
    builder.addMcid(2);
    builder.end();
    builder.addMcid(3);
    builder.end();

    const { writer } = writeWithFake(builder);
    const p = writer.objects.find(o => o.dict.get('/S') === '/P')!;
    const span = writer.objects.find(o => o.dict.get('/S') === '/Span')!;

    expect(p.dict.get('/K')).toBe(`[ ${span.id} 0 R 0 1 3 ]`);
    expect(span.dict.get('/K')).toBe('[ 2 ]');
  });

  it('optional metadata appears as escaped string literals', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.Figure);
    builder.setAlt('Quarterly revenue (Q4)');
    builder.setActualText('£12.3M');
    builder.setLang('en-GB');
    builder.setTitle('Q4 chart');
    builder.end();

    const { writer } = writeWithFake(builder);
    const fig = writer.objects.find(o => o.dict.get('/S') === '/Figure')!;

    expect(fig.dict.get('/Alt')!.startsWith('(')).toBe(true);
    expect(fig.dict.get('/Alt')!.endsWith(')')).toBe(true);
    expect(fig.dict.get('/Alt')!).toContain('Quarterly revenue');
    expect(fig.dict.get('/Lang')).toBe('(en-GB)');
    expect(fig.dict.get('/T')).toBe('(Q4 chart)');
  });

  it('emission is post-order so children appear before parents', () => {
    const builder = new StructureTreeBuilder();
    builder.begin(SemanticRole.Sect);
    builder.begin(SemanticRole.H1);
    builder.end();
    builder.end();

    const { writer } = writeWithFake(builder);
    const sequence = writer.objects.map(o => {
      const t = o.dict.get('/Type');
      return t === '/StructElem' ? o.dict.get('/S') : t;
    });

    expect(sequence).toEqual(['/H1', '/Sect', '/Document', '/StructTreeRoot']);
  });
});

class FakeWriter implements IPdfWriter {
  private nextId = 100;
  public readonly objects: EmittedObject[] = [];

  getNewId(): number {
    return this.nextId++;
  }

  writeObject(id: number, dict: Map<string, string>): void {
    this.objects.push({ id, dict: new Map(dict) });
  }

  // Unused-by-tests interface fillers — return sensible defaults.
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
