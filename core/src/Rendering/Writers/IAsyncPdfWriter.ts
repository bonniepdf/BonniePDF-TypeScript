import { CatalogOptions } from './CatalogOptions';
import type { PdfEncryptor } from '../../Security/Encryption/PdfEncryptor';
import type { DocumentSettings } from '../../Configuration/DocumentSettings';
import type { RegisteredLink } from '../RegisteredLink';
import type { ViewerPreferencesSettings } from './IPdfWriter';

/**
 * Interface for async PDF writers.
 */
export interface IAsyncPdfWriter {
  encryptor?: PdfEncryptor | null;
  getNewId(): number;
  writeObjectAsync(id: number, dictionary: Map<string, string>, stream?: string): Promise<void>;
  writeRawObjectAsync(id: number, body: string): Promise<void>;
  writeCompressedObjectAsync(id: number, dictionary: Map<string, string>, stream: string): Promise<void>;
  writeBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    ct?: unknown
  ): Promise<void>;
  writeUnencryptedBinaryObjectAsync(id: number, dictionary: Map<string, string>, bytes: Uint8Array): Promise<void>;
  writeCompressedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    ct?: unknown
  ): Promise<void>;
  writeLinkAnnotationAsync(
    id: number,
    link: RegisteredLink,
    pageIds: number[],
    structParentKey?: number
  ): Promise<void>;
  writeViewerPreferencesAsync(id: number, settings: ViewerPreferencesSettings): Promise<number>;
  writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: DocumentSettings,
    options: CatalogOptions
  ): Promise<void>;
  writeEncryptDictionaryAsync(id: number): Promise<number>;
  closeAsync(catalogId: number, infoId: number): Promise<void>;
}
