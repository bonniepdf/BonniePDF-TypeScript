import { PdfVersion } from '../../Configuration/PdfVersion';
import { PdfWriter } from './PdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import { CatalogOptions } from './CatalogOptions';
import type { PdfEncryptor } from '../../Security/Encryption/PdfEncryptor';
import type { DocumentSettings } from '../../Configuration/DocumentSettings';
import type { RegisteredLink } from '../RegisteredLink';
import type { ViewerPreferencesSettings } from './IPdfWriter';

/** Async facade over the deterministic, in-memory PDF writer. */
export class AsyncPdfWriter implements IAsyncPdfWriter {
  private readonly _inner: PdfWriter;

  constructor(version: (typeof PdfVersion)[keyof typeof PdfVersion] = PdfVersion.Pdf14) {
    this._inner = new PdfWriter(version);
  }

  /** The synchronous writer this async facade delegates to. */
  public get syncWriter(): PdfWriter {
    return this._inner;
  }

  /** Delegates to the inner writer so encryption applies to delegated writes. */
  public get encryptor(): PdfEncryptor | null {
    return this._inner.encryptor;
  }
  public set encryptor(value: PdfEncryptor | null) {
    this._inner.encryptor = value;
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

  /**
   * Delegates to the synchronous writer, which compresses with the bundled
   * DEFLATE encoder.
   *
   * These used to compress through the platform's async `deflate` instead,
   * which meant two different compressors could produce two different files
   * from one document depending on which path a caller took. Compression is
   * deterministic and identical everywhere precisely because there is one
   * encoder; keep it that way.
   */
  public async writeCompressedObjectAsync(id: number, dictionary: Map<string, string>, stream: string): Promise<void> {
    this._inner.writeCompressedObject(id, dictionary, stream);
  }

  public async writeBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    _ct?: unknown
  ): Promise<void> {
    const slice = length != null ? bytes.slice(0, length) : bytes;
    this._inner.writeBinaryObject(id, dictionary, slice);
  }

  public async writeUnencryptedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array
  ): Promise<void> {
    this._inner.writeUnencryptedBinaryObject(id, dictionary, bytes);
  }

  public async writeCompressedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    _ct?: unknown
  ): Promise<void> {
    const slice = length != null ? bytes.slice(0, length) : bytes;
    this._inner.writeCompressedBinaryObject(id, dictionary, slice);
  }

  public async writeLinkAnnotationAsync(
    id: number,
    link: RegisteredLink,
    pageIds: number[],
    structParentKey?: number
  ): Promise<void> {
    this._inner.writeLinkAnnotation(id, link, pageIds, structParentKey);
  }

  public async writeViewerPreferencesAsync(id: number, settings: ViewerPreferencesSettings): Promise<number> {
    return this._inner.writeViewerPreferences(id, settings);
  }

  public async writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: DocumentSettings,
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
