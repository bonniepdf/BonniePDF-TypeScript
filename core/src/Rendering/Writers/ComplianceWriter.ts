import * as PdfKeys from '../Pdf/PdfKeys';
import { SRgbIccProfile } from '../../Metadata/SRgbIccProfile';
import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';

/**
 * Writes PDF/A compliance objects (sRGB ICC profile + OutputIntent).
 */
export class ComplianceWriter {
  constructor(
    private writer: IPdfWriter,
    private asyncWriter?: IAsyncPdfWriter
  ) {}

  public writeIccProfile(id: number): void {
    const iccData = SRgbIccProfile.generate();
    const dict = new Map<string, string>([
      [PdfKeys.ColorProfile.Components, '3'],
      [PdfKeys.Stream.DecodedLength, iccData.length.toString()],
    ]);
    this.writer.writeCompressedBinaryObject(id, dict, iccData);
  }

  public writeOutputIntent(id: number, iccProfileId: number): void {
    this.writer.writeObject(id, ComplianceWriter.outputIntentDictionary(iccProfileId));
  }

  public async writeIccProfileAsync(id: number): Promise<void> {
    const iccData = SRgbIccProfile.generate();
    const dict = new Map<string, string>([
      [PdfKeys.ColorProfile.Components, '3'],
      [PdfKeys.Stream.DecodedLength, iccData.length.toString()],
    ]);
    await this.asyncWriter!.writeCompressedBinaryObjectAsync(id, dict, iccData, iccData.length);
  }

  public async writeOutputIntentAsync(id: number, iccProfileId: number): Promise<void> {
    await this.asyncWriter!.writeObjectAsync(id, ComplianceWriter.outputIntentDictionary(iccProfileId));
  }

  private static outputIntentDictionary(iccProfileId: number): Map<string, string> {
    return new Map<string, string>([
      [PdfKeys.Common.Type, '/OutputIntent'],
      [PdfKeys.OutputIntent.Subtype, '/GTS_PDFA1'],
      [PdfKeys.OutputIntent.ConditionIdentifier, '(sRGB IEC61966-2.1)'],
      [PdfKeys.OutputIntent.RegistryName, '(http://www.color.org)'],
      [PdfKeys.OutputIntent.DestinationProfile, `${iccProfileId} 0 R`],
    ]);
  }
}
