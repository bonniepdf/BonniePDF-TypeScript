import { describe, expect, it } from 'vitest';
import { ImageFormat, ImageInfo } from '../src/Rendering/Images/ImageInfo';
import { PdfResourceRegistry } from '../src/Rendering/PdfResourceRegistry';
import { IPdfWriter } from '../src/Rendering/Writers/PdfWriter';

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

  it('reports PDF/A alpha graphics states as mitigated and writes opaque ExtGState', () => {
    const registry = new PdfResourceRegistry();
    registry.pdfAEnabled = true;
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

  it('reports PNG alpha data as mitigated when PDF/A image flattening is enabled', () => {
    const registry = new PdfResourceRegistry();
    registry.pdfAEnabled = true;
    const image = new ImageInfo();
    image.format = ImageFormat.Png;
    image.hasAlpha = true;
    image.alphaData = new Uint8Array([0, 128, 255, 255]);
    registry.loadedImages.set('png-alpha', image);

    const issues = registry.getPdfAResourceIssues();

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'png-soft-mask-flattened',
        severity: 'mitigated',
        resource: 'png-alpha',
      })
    );
  });
});
