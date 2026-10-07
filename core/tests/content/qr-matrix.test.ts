import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { QrCodeEncoder } from '../../src/Elements/Shapes/QrCodeEncoder';
import { QrEcc } from '../../src/Elements/Shapes/QrEcc';

const vectors = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/qr-matrices.json'), 'utf8')).cases as Array<{
  text: string;
  requestedCorrection: string;
  version: number;
  mask: number;
  sha256: string;
}>;
describe('Independent QR matrix vectors', () => {
  it.each(vectors)('$text / $requestedCorrection', ({ text, requestedCorrection, version, mask, sha256 }) => {
    const ecl =
      requestedCorrection === 'low'
        ? QrEcc.Low
        : requestedCorrection === 'quartile'
          ? QrEcc.Quartile
          : requestedCorrection === 'high'
            ? QrEcc.High
            : QrEcc.Medium;
    const qr = QrCodeEncoder.encodeText(text, ecl);
    const rows = qr
      .toMatrix()
      .map(row => row.map(dark => (dark ? '1' : '0')).join(''))
      .join('\n');
    expect(qr.version).toBe(version);
    expect(qr.mask).toBe(mask);
    expect(createHash('sha256').update(rows, 'ascii').digest('hex')).toBe(sha256);
  });
});
