// A CommonJS consumer of every public entry point, typechecked against dist/.
// The `.cts` extension makes it CommonJS whatever the package's own type, so
// these imports compile to require() and resolve through the `require`
// conditions to the `.d.cts` declarations.
import { Document, FontManager, TextBlock, settings } from '@bonniepdf/core';
import { ChartSeries } from '@bonniepdf/core/charts';
import { QRCode } from '@bonniepdf/core/qr';
import { DataMatrix } from '@bonniepdf/core/datamatrix';
import { EncryptionSettings } from '@bonniepdf/core/security';
import { fromDefinition, validateDefinition, type DocumentDefinition } from '@bonniepdf/core/definition';

settings.license = 'evaluation';

export async function consume(definition: DocumentDefinition): Promise<number> {
  const doc: Document = await fromDefinition(definition);
  const bytes: Uint8Array = await doc.generateBytesAsync();
  void [FontManager, TextBlock, ChartSeries, QRCode, DataMatrix, EncryptionSettings];
  return bytes.length + validateDefinition(definition).errors.length;
}
