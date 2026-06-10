import { CatalogOptions } from './CatalogOptions';

/**
 * Interface for async PDF writers.
 */
export interface IAsyncPdfWriter {
  encryptor?: any;
  getNewId(): number;
  writeObjectAsync(id: number, dictionary: Map<string, string>, stream?: string): Promise<void>;
  writeRawObjectAsync(id: number, body: string): Promise<void>;
  writeCompressedObjectAsync(id: number, dictionary: Map<string, string>, stream: string): Promise<void>;
  writeBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    ct?: any
  ): Promise<void>;
  writeCompressedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    ct?: any
  ): Promise<void>;
  writeLinkAnnotationAsync(id: number, link: any, pageIds: number[], structParentKey?: number): Promise<void>;
  writeViewerPreferencesAsync(id: number, settings: any): Promise<number>;
  writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: any,
    options: CatalogOptions
  ): Promise<void>;
  writeEncryptDictionaryAsync(id: number): Promise<number>;
  closeAsync(catalogId: number, infoId: number): Promise<void>;
}
