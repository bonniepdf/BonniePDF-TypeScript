export enum ImageColorSpace {
  DeviceRGB = 'DeviceRGB',
  DeviceCMYK = 'DeviceCMYK',
  DeviceGray = 'DeviceGray',
  Indexed = 'Indexed',
}

export enum ImageFormat {
  Jpeg = 'Jpeg',
  Png = 'Png',
}

export class ImageInfo {
  public data: Uint8Array = new Uint8Array();
  public originalData: Uint8Array = new Uint8Array();
  public width: number = 0;
  public height: number = 0;
  public format: ImageFormat = ImageFormat.Png;
  public colorSpace: ImageColorSpace = ImageColorSpace.DeviceRGB;
  public bitsPerComponent: number = 8;
  public components: number = 3;
  public hasAlpha: boolean = false;
  public alphaData: Uint8Array = new Uint8Array();
  public palette: Uint8Array = new Uint8Array();
}

export class BigEndianReader {
  private data: Uint8Array;
  private position: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  public readUInt8(): number {
    return this.data[this.position++];
  }

  public readUInt16BE(): number {
    const value = (this.data[this.position] << 8) | this.data[this.position + 1];
    this.position += 2;
    return value;
  }

  public readUInt32BE(): number {
    const value =
      (this.data[this.position] << 24) |
      (this.data[this.position + 1] << 16) |
      (this.data[this.position + 2] << 8) |
      this.data[this.position + 3];
    this.position += 4;
    return value;
  }

  public skip(bytes: number): void {
    this.position += bytes;
  }

  public getPosition(): number {
    return this.position;
  }

  public getLength(): number {
    return this.data.length;
  }

  public hasMore(): boolean {
    return this.position < this.data.length;
  }
}
