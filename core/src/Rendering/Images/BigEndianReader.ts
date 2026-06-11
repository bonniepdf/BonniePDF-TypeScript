export class BigEndianReader {
  private data: Uint8Array;
  private position: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  public readUInt16(): number {
    const value = (this.data[this.position] << 8) | this.data[this.position + 1];
    this.position += 2;
    return value;
  }

  public readUInt32(): number {
    const value =
      (this.data[this.position] << 24) |
      (this.data[this.position + 1] << 16) |
      (this.data[this.position + 2] << 8) |
      this.data[this.position + 3];
    this.position += 4;
    return value;
  }

  public readFixed(): number {
    // TrueType Fixed is a 4-byte 16.16 fixed-point: 2-byte signed integer + 2-byte fraction.
    const integer = this.readInt16(); // 2 bytes
    const fraction = this.readUInt16(); // 2 bytes  (total = 4)
    return integer + fraction / 65536.0;
  }

  public readInt32(): number {
    const value =
      (this.data[this.position] << 24) |
      (this.data[this.position + 1] << 16) |
      (this.data[this.position + 2] << 8) |
      this.data[this.position + 3];
    this.position += 4;
    return value;
  }

  public readTag(): string {
    const tag = String.fromCharCode(
      this.data[this.position],
      this.data[this.position + 1],
      this.data[this.position + 2],
      this.data[this.position + 3]
    );
    this.position += 4;
    return tag;
  }

  public skip(bytes: number): void {
    this.position += bytes;
  }

  public seek(position: number): void {
    this.position = position;
  }

  public get remaining(): number {
    return this.data.length - this.position;
  }

  public readInt16(): number {
    const v = this.readUInt16();
    return v >= 0x8000 ? v - 0x10000 : v;
  }

  public getPosition(): number {
    return this.position;
  }

  public readBytes(count: number): Uint8Array {
    const result = this.data.slice(this.position, this.position + count);
    this.position += count;
    return result;
  }

  public readUInt8(): number {
    return this.data[this.position++];
  }

  public getLength(): number {
    return this.data.length;
  }

  public hasMore(): boolean {
    return this.position < this.data.length;
  }
}
