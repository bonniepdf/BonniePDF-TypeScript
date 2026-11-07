// An ES module consumer of every public entry point, typechecked against dist/.
import { Document, FontManager, TextBlock, settings } from '@bonniepdf/core';
import { ChartSeries } from '@bonniepdf/core/charts';
import { QRCode } from '@bonniepdf/core/qr';
import { DataMatrix } from '@bonniepdf/core/datamatrix';
import { EncryptionSettings } from '@bonniepdf/core/security';
import { fromDefinition, toDefinition, validateDefinition, type DocumentDefinition } from '@bonniepdf/core/definition';

settings.license = 'evaluation';

export async function consume(definition: DocumentDefinition): Promise<number> {
  const doc: Document = await fromDefinition(definition);
  const issues: number = validateDefinition(definition).errors.length;
  const written = await toDefinition(doc);
  const bytes: Uint8Array = await doc.generateBytesAsync();
  void [FontManager, TextBlock, ChartSeries, QRCode, DataMatrix, EncryptionSettings, written.notes];
  return bytes.length + issues;
}
