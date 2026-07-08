import { CatalogOptions } from './CatalogOptions';
import type { PdfEncryptor } from '../../Security/Encryption/pdfEncryptor';
import type { DocumentSettings } from '../../Configuration/DocumentSettings';
import type { RegisteredLink } from '../RegisteredLink';

/**
 * The viewer-preference flags read when writing /ViewerPreferences.
 * Structurally satisfied by {@link DocumentSettings} (and by shallow copies
 * of it, e.g. when PDF/UA forces `displayDocTitle`).
 */
export interface ViewerPreferencesSettings {
  hideToolbar?: boolean;
  hideMenubar?: boolean;
  hideWindowUI?: boolean;
  fitWindow?: boolean;
  centerWindow?: boolean;
  displayDocTitle?: boolean;
}

/**
 * Interface for PDF writers, allowing both sync and async implementations.
 */
export interface IPdfWriter {
  encryptor?: PdfEncryptor | null;
  getNewId(): number;
  writeObject(id: number, dictionary: Map<string, string>, stream?: string): void;
  /**
   * Writes a PDF object whose body is already a pre-formatted PDF fragment
   * (e.g. the global Resources dict composed by `PdfResourceRegistry`).
   * The body is written verbatim with no encryption or compression.
   */
  writeRawObject(id: number, body: string): void;
  writeCompressedObject(id: number, dictionary: Map<string, string>, stream: string): void;
  writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void;
  writeCompressedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void;
  writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void;
  writeLinkAnnotation(id: number, link: RegisteredLink, pageIds: number[], structParentKey?: number): number;
  writeEncryptDictionary(id: number): number;
  writeViewerPreferences(id: number, settings: ViewerPreferencesSettings): number;
  writeCatalog(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: DocumentSettings,
    options: CatalogOptions
  ): void;
  close(catalogId: number, infoId: number): void;
}
