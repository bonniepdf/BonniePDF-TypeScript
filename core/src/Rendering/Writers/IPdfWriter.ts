import { CatalogOptions } from './CatalogOptions';

/**
 * Interface for PDF writers, allowing both sync and async implementations.
 */
export interface IPdfWriter {
  encryptor?: any;
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
  writeLinkAnnotation(id: number, link: any, pageIds: number[], structParentKey?: number): number;
  writeEncryptDictionary(id: number): number;
  writeViewerPreferences(id: number, settings: any): number;
  writeCatalog(id: number, pagesId: number, firstPageId: number, settings: any, options: CatalogOptions): void;
  close(catalogId: number, infoId: number): void;
}
