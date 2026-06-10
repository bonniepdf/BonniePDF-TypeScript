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
    const dict = new Map<string, string>([['/N', '3']]);
    this.writer.writeBinaryObject(id, dict, iccData);
  }

  public writeOutputIntent(id: number, iccProfileId: number): void {
    this.writer.writeObject(
      id,
      new Map<string, string>([
        ['/Type', '/OutputIntent'],
        ['/S', '/GTS_PDFA1'],
        ['/OutputConditionIdentifier', '(sRGB IEC61966-2.1)'],
        ['/RegistryName', '(http://www.color.org)'],
        ['/DestOutputProfile', `${iccProfileId} 0 R`],
      ])
    );
  }

  public async writeIccProfileAsync(id: number): Promise<void> {
    const iccData = SRgbIccProfile.generate();
    const dict = new Map<string, string>([['/N', '3']]);
    await this.asyncWriter!.writeBinaryObjectAsync(id, dict, iccData, iccData.length);
  }

  public async writeOutputIntentAsync(id: number, iccProfileId: number): Promise<void> {
    this.writeOutputIntent(id, iccProfileId);
  }
}
