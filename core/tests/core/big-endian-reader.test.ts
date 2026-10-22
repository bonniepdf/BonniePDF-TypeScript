import { describe, expect, it } from 'vitest';
import { BigEndianReader } from '../../src/Rendering/Images/BigEndianReader';

describe('BigEndianReader', () => {
  it('reads an unsigned 32-bit value of 2^31 or more as positive', () => {
    const reader = new BigEndianReader(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00]));

    expect(reader.readUInt32()).toBe(0xffffffff);
    expect(reader.readUInt32()).toBe(0x80000000);
  });

  it('reads a signed 32-bit value of 2^31 or more as negative', () => {
    const reader = new BigEndianReader(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00]));

    expect(reader.readInt32()).toBe(-1);
    expect(reader.readInt32()).toBe(-0x80000000);
  });

  it('reads small unsigned values unchanged', () => {
    const reader = new BigEndianReader(new Uint8Array([0x00, 0x01, 0x02, 0x03]));

    expect(reader.readUInt32()).toBe(0x00010203);
  });
});
