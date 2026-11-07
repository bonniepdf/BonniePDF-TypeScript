import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { BarcodeEncoder } from '../../src/Elements/Shapes/BarcodeEncoder';
import { BarcodeSymbology } from '../../src/Elements/Shapes/BarcodeSymbology';
import { DataMatrixContentException, DataMatrixEncoder } from '../../src/Elements/Shapes/DataMatrixEncoder';
import { DEFINITION_FIXTURES } from '../definition/fixtures.generated';

it('reproduces the GS1 modules independently decoded as ]C1 and ]d2', () => {
  const fixture = DEFINITION_FIXTURES.valid['template-authoring']._expect.gs1;
  const hash = (bits: boolean[]) =>
    createHash('sha256')
      .update(Uint8Array.from(bits.map(Number)))
      .digest('hex');
  expect(hash(BarcodeEncoder.encode(BarcodeSymbology.Code128, fixture.payload, true).modules)).toBe(fixture.code128);
  expect(hash(DataMatrixEncoder.encode(fixture.payload, false, true).modules.flat())).toBe(fixture.dataMatrix);
  expect(() => DataMatrixEncoder.encode(fixture.payload + '\n', false, true)).toThrow(DataMatrixContentException);
});
