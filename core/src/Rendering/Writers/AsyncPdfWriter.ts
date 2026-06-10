import { PdfVersion } from '../../Configuration/PdfVersion';
import { PdfWriter } from './PdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import { CatalogOptions } from './CatalogOptions';

// Full async implementation is out of scope (see SESSION_PLAN.md Session 4).
// Methods delegate to synchronous equivalents wrapped in Promise.resolve().

export class AsyncPdfWriter implements IAsyncPdfWriter {
  private readonly _inner: PdfWriter;
  public encryptor: any = null;

  constructor(version: (typeof PdfVersion)[keyof typeof PdfVersion] = PdfVersion.Pdf14) {
    this._inner = new PdfWriter(version);
  }

  public getNewId(): number {
    return this._inner.getNewId();
  }
  public toUint8Array(): Uint8Array {
    return this._inner.toUint8Array();
  }

  public async writeObjectAsync(id: number, dictionary: Map<string, string>, stream?: string): Promise<void> {
    this._inner.writeObject(id, dictionary, stream);
  }

  public async writeRawObjectAsync(id: number, body: string): Promise<void> {
    this._inner.writeRawObject(id, body);
  }

  public async writeCompressedObjectAsync(id: number, dictionary: Map<string, string>, stream: string): Promise<void> {
    // Encode as ISO-8859-1 then compress via the configured platform
    const rawBytes = new Uint8Array(stream.length);
    for (let i = 0; i < stream.length; i++) rawBytes[i] = stream.charCodeAt(i) & 0xff;

    const { deflate } = await import('../../Platform/PlatformIO');
    const compressed = await deflate(rawBytes);

    const dict = new Map(dictionary);
    dict.set('/Filter', '/FlateDecode');
    this._inner.writeBinaryObject(id, dict, compressed);
  }

  public async writeBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    _ct?: any
  ): Promise<void> {
    const slice = length != null ? bytes.slice(0, length) : bytes;
    this._inner.writeBinaryObject(id, dictionary, slice);
  }

  public async writeCompressedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    _ct?: any
  ): Promise<void> {
    const slice = length != null ? bytes.slice(0, length) : bytes;
    const { deflate } = await import('../../Platform/PlatformIO');
    const compressed = await deflate(slice);
    const dict = new Map(dictionary);
    dict.set('/Filter', '/FlateDecode');
    this._inner.writeBinaryObject(id, dict, compressed);
  }

  public async writeLinkAnnotationAsync(
    id: number,
    link: any,
    pageIds: number[],
    structParentKey?: number
  ): Promise<void> {
    this._inner.writeLinkAnnotation(id, link, pageIds, structParentKey);
  }

  public async writeViewerPreferencesAsync(id: number, settings: any): Promise<number> {
    return this._inner.writeViewerPreferences(id, settings);
  }

  public async writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: any,
    options: CatalogOptions
  ): Promise<void> {
    this._inner.writeCatalog(id, pagesId, firstPageId, settings, options);
  }

  public async writeEncryptDictionaryAsync(id: number): Promise<number> {
    return this._inner.writeEncryptDictionary(id);
  }

  public async closeAsync(catalogId: number, infoId: number): Promise<void> {
    this._inner.close(catalogId, infoId);
  }
}
