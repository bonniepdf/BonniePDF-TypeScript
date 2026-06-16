import { describe, expect, it } from 'vitest';
import { QrSegment, Mode } from '../src/Elements/Shapes/QrSegment';

// QR alphanumeric mode covers only "0-9 A-Z space $%*+-./:" — there is NO
// lowercase. Mode selection must therefore be case-sensitive: a string with
// lowercase has to fall through to byte mode so its case is preserved on the
// scanned result, rather than being silently upper-cased into alphanumeric.
describe('QrSegment.makeSegments — mode selection', () => {
  const modeOf = (text: string): Mode => QrSegment.makeSegments(text)[0].segmentMode;

  it('encodes a lowercase URL in byte mode (preserves case)', () => {
    expect(modeOf('https://bonniepdf.dev')).toBe(Mode.Byte);
  });

  it('uses byte mode for any text containing lowercase letters', () => {
    expect(modeOf('Hello')).toBe(Mode.Byte);
    expect(modeOf('mixedCASE')).toBe(Mode.Byte);
  });

  it('uses the compact alphanumeric mode for all-uppercase alphanumeric text', () => {
    expect(modeOf('HTTPS://BONNIEPDF.DEV')).toBe(Mode.Alphanumeric);
    expect(modeOf('HELLO-WORLD 123')).toBe(Mode.Alphanumeric);
  });

  it('uses numeric mode for digit-only text', () => {
    expect(modeOf('1234567890')).toBe(Mode.Numeric);
  });

  it('does not upper-case lowercase byte-mode data', () => {
    // Byte mode encodes UTF-8 bytes verbatim; the first byte of "https" must be
    // 'h' (0x68), not 'H' (0x48) — proving the data is not silently upper-cased.
    const seg = QrSegment.makeSegments('https')[0];
    expect(seg.segmentMode).toBe(Mode.Byte);
    // First 8 data bits, MSB-first, equal the byte 'h' = 0x68 = 0b01101000.
    const firstByte = seg
      .getData()
      .slice(0, 8)
      .reduce((acc, bit) => (acc << 1) | (bit ? 1 : 0), 0);
    expect(firstByte).toBe('h'.charCodeAt(0));
  });
});
