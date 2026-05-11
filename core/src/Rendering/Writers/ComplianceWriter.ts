import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import { SRgbIccProfile } from '../../Metadata/SRgbIccProfile';
import { PdfVersion } from '../../Configuration/PdfVersion';


  /**
   * Writes PDF/A compliance objects (ICC Profiles, Output Intents) to PDF.
   */
  export class ComplianceWriter {
    private readonly writer: IPdfWriter | undefined;
    private readonly asyncWriter: IAsyncPdfWriter | undefined;

    constructor(writer: IPdfWriter | IAsyncPdfWriter) {
      if ('writeObject' in writer) {
        this.writer = writer as IPdfWriter;
        this.asyncWriter = undefined;
      } else {
        this.asyncWriter = writer as IAsyncPdfWriter;
        this.writer = undefined;
      }
    }

    /**
     * Writes the sRGB ICC color profile to the PDF.
     * Required for PDF/A-1b compliance.
     * @param id The object ID for the ICC profile.
     */
    writeIccProfile(id: number): void {
      if (!this.writer) throw new Error('Sync writer not available');
      const iccData = SRgbIccProfile.generate();

      // Compress the ICC profile
      const compressed = this.compressData(iccData);

      const dict = new Map<string, string>();
      dict.set('/N', '3');
      dict.set('/Filter', '/FlateDecode');
      dict.set('/Length1', iccData.length.toString());

      this.writer.writeBinaryObject(id, dict, compressed);
    }

    /**
     * Writes the sRGB ICC color profile to the PDF asynchronously.
     * Required for PDF/A-1b compliance.
     * @param id The object ID for the ICC profile.
     * @param cancellationToken Cancellation token.
     */
    async writeIccProfileAsync(id: number, cancellationToken?: AbortSignal): Promise<void> {
      if (!this.asyncWriter) throw new Error('Async writer not available');
      const iccData = SRgbIccProfile.generate();
      const compressed = this.compressData(iccData);

      const dict = new Map<string, string>();
      dict.set('/N', '3');
      dict.set('/Filter', '/FlateDecode');
      dict.set('/Length1', iccData.length.toString());

      await this.asyncWriter.writeBinaryObjectAsync(id, dict, compressed, compressed.length, cancellationToken);
    }

    /**
     * Writes the Output Intent dictionary to the PDF.
     * Required for PDF/A-1b compliance to specify the color reproduction characteristics.
     * @param id The object ID for the Output Intent dictionary.
     * @param iccProfileId The object ID of the referenced ICC profile.
     */
    writeOutputIntent(id: number, iccProfileId: number): void {
      if (!this.writer) throw new Error('Sync writer not available');
      const dict = new Map<string, string>();
      dict.set('/Type', '/OutputIntent');
      dict.set('/S', '/GTS_PDFA1');
      dict.set('/OutputConditionIdentifier', '(sRGB IEC61966-2.1)');
      dict.set('/RegistryName', '(http://www.color.org)');
      dict.set('/DestOutputProfile', `${iccProfileId} 0 R`);

      this.writer.writeObject(id, dict);
    }

    /**
     * Writes the Output Intent dictionary to the PDF asynchronously.
     * Required for PDF/A-1b compliance to specify the color reproduction characteristics.
     * @param id The object ID for the Output Intent dictionary.
     * @param iccProfileId The object ID of the referenced ICC profile.
     * @param cancellationToken Cancellation token.
     */
    async writeOutputIntentAsync(id: number, iccProfileId: number, cancellationToken?: AbortSignal): Promise<void> {
      if (!this.asyncWriter) throw new Error('Async writer not available');
      const dict = new Map<string, string>();
      dict.set('/Type', '/OutputIntent');
      dict.set('/S', '/GTS_PDFA1');
      dict.set('/OutputConditionIdentifier', '(sRGB IEC61966-2.1)');
      dict.set('/RegistryName', '(http://www.color.org)');
      dict.set('/DestOutputProfile', `${iccProfileId} 0 R`);

      await this.asyncWriter.writeObjectAsync(id, dict, undefined, cancellationToken);
    }

    private compressData(data: Uint8Array): Uint8Array {
      // Use zlib compression if available, otherwise return uncompressed
      // This is a stub - real implementation would use zlib/pako
      return data;
    }
  }

  // Constructor overloads
  export namespace ComplianceWriter {
    export function create(writer: IPdfWriter): ComplianceWriter {
      return new ComplianceWriter(writer as any);
    }

    export function createAsync(asyncWriter: IAsyncPdfWriter): ComplianceWriter {
      return new ComplianceWriter(asyncWriter as any);
    }
  }
