import { describe, expect, it } from 'vitest';
import { ImageFormat } from '../../src/Rendering/Images/ImageFormat';
import { ImageInfo } from '../../src/Rendering/Images/ImageInfo';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { PdfResourceRegistry } from '../../src/Rendering/PdfResourceRegistry';
import { IPdfWriter } from '../../src/Rendering/Writers/IPdfWriter';

class MockPdfWriter implements IPdfWriter {
  public encryptor: any = null;
  private nextId = 1;
  public readonly objects: Array<{ id: number; dict: Map<string, string>; body?: string; bytes?: Uint8Array }> = [];

  getNewId(): number {
    return this.nextId++;
  }

  writeObject(id: number, dictionary: Map<string, string>, stream?: string): void {
    this.objects.push({ id, dict: new Map(dictionary), body: stream });
  }

  writeRawObject(id: number, body: string): void {
    this.objects.push({ id, dict: new Map(), body });
  }

  writeCompressedObject(id: number, dictionary: Map<string, string>, stream: string): void {
    this.writeObject(id, dictionary, stream);
  }

  writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.objects.push({ id, dict: new Map(dictionary), bytes });
  }

  writeDeflatedObject(id: number, dictionary: Map<string, string>, compressed: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, compressed);
  }

  writeCompressedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, bytes);
  }

  writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, bytes);
  }

  writeLinkAnnotation(): number {
    return 0;
  }

  writeEncryptDictionary(): number {
    return 0;
  }

  writeViewerPreferences(): number {
    return 0;
  }

  writeCatalog(): void {}

  close(): void {}
}

describe('PDF/A resource policy audit', () => {
  it('reports non-embedded standard fonts as blocking issues', () => {
    const registry = new PdfResourceRegistry();
    registry.registerFont('Helvetica');

    const issues = registry.getPdfAResourceIssues();

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'non-embedded-standard-font',
        severity: 'blocking',
        resource: 'Helvetica',
      })
    );
  });

  it('flattens alpha graphics states to opaque for PDF/A-1 (which forbids transparency)', () => {
    const registry = new PdfResourceRegistry();
    registry.conformance = PdfAConformance.PdfA1b;
    registry.registerAlphaGraphicsState(0.25);

    const issues = registry.getPdfAResourceIssues();
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'alpha-graphics-state-flattened',
        severity: 'mitigated',
        resource: '0.2500',
      })
    );

    const writer = new MockPdfWriter();
    const resources = registry.writeResources(writer, 1);
    const extGState = writer.objects.find(obj => obj.dict.get('/Type') === '/ExtGState');
    expect(resources).toContain('/ExtGState');
    expect(extGState?.dict.get('/ca')).toBe('1.0000');
    expect(extGState?.dict.get('/CA')).toBe('1.0000');
  });

  it('preserves real alpha transparency for PDF/A-2 (which permits constant alpha)', () => {
    const registry = new PdfResourceRegistry();
    registry.conformance = PdfAConformance.PdfA2b;
    registry.registerAlphaGraphicsState(0.25);

    // No flattening issue is raised: PDF/A-2/3/4 allow constant alpha.
    const issues = registry.getPdfAResourceIssues();
    expect(issues.some(i => i.code === 'alpha-graphics-state-flattened')).toBe(false);

    const writer = new MockPdfWriter();
    const resources = registry.writeResources(writer, 1);
    const extGState = writer.objects.find(obj => obj.dict.get('/Type') === '/ExtGState');
    expect(resources).toContain('/ExtGState');
    expect(extGState?.dict.get('/ca')).toBe('0.2500');
    expect(extGState?.dict.get('/CA')).toBe('0.2500');
  });

  it('reports PNG alpha as mitigated for PDF/A-1, but preserved for PDF/A-2', () => {
    const makeRegistry = (conformance: PdfAConformance): PdfResourceRegistry => {
      const registry = new PdfResourceRegistry();
      registry.conformance = conformance;
      const image = new ImageInfo();
      image.format = ImageFormat.Png;
      image.hasAlpha = true;
      image.alphaData = new Uint8Array([0, 128, 255, 255]);
      registry.loadedImages.set('png-alpha', image);
      return registry;
    };

    // PDF/A-1 forbids transparency -> the soft mask is flattened (mitigated).
    expect(makeRegistry(PdfAConformance.PdfA1b).getPdfAResourceIssues()).toContainEqual(
      expect.objectContaining({
        code: 'png-soft-mask-flattened',
        severity: 'mitigated',
        resource: 'png-alpha',
      })
    );

    // PDF/A-2 keeps the soft mask -> no flattening issue.
    expect(
      makeRegistry(PdfAConformance.PdfA2b)
        .getPdfAResourceIssues()
        .some(i => i.code === 'png-soft-mask-flattened')
    ).toBe(false);
  });
});
