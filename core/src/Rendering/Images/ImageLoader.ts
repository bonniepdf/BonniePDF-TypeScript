import { ImageInfo, ImageFormat, ImageColorSpace } from './ImageInfo';

export class ImageLoader {
  public static load(filePath: string): ImageInfo {
    // Stub: would load from file system
    throw new Error('ImageLoader.load not implemented - use loadFromBytes instead');
  }

  public static loadFromBytes(data: Uint8Array): ImageInfo {
    if (!data || data.length < 8) {
      throw new Error('Image data is empty or too small');
    }

    // Check for PNG signature (89 50 4E 47 0D 0A 1A 0A)
    if (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    ) {
      return this.parsePng(data);
    }

    // Check for JPEG signature (FF D8 FF)
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
      return this.parseJpeg(data);
    }

    throw new Error('Unknown image format. Supported formats: JPEG, PNG');
  }

  public static loadJpeg(data: Uint8Array): ImageInfo {
    if (!data || data.length === 0) {
      throw new Error('Image data is empty');
    }
    return this.parseJpeg(data);
  }

  public static loadPng(data: Uint8Array): ImageInfo {
    if (!data || data.length === 0) {
      throw new Error('Image data is empty');
    }
    return this.parsePng(data);
  }

  private static parseJpeg(data: Uint8Array): ImageInfo {
    if (data.length < 3 || data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff) {
      throw new Error('Invalid JPEG file: Missing JPEG signature');
    }

    const info = new ImageInfo();
    info.data = data;
    info.originalData = data;
    info.format = ImageFormat.Jpeg;

    let pos = 2;
    while (pos < data.length - 1) {
      if (data[pos] !== 0xff) {
        pos++;
        continue;
      }

      const marker = data[pos + 1];

      // SOF0 markers (0xFFC0, 0xFFC1, 0xFFC2)
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        pos += 2;
        const length = (data[pos] << 8) | data[pos + 1];
        pos += 2;

        if (pos + 5 >= data.length) {
          throw new Error('Invalid JPEG file: Incomplete SOF marker');
        }

        info.bitsPerComponent = data[pos];
        pos++;

        // Height comes first, then width in JPEG
        info.height = (data[pos] << 8) | data[pos + 1];
        info.width = (data[pos + 2] << 8) | data[pos + 3];
        pos += 4;

        info.components = data[pos];

        switch (info.components) {
          case 1:
            info.colorSpace = ImageColorSpace.DeviceGray;
            break;
          case 3:
            info.colorSpace = ImageColorSpace.DeviceRGB;
            break;
          case 4:
            info.colorSpace = ImageColorSpace.DeviceCMYK;
            break;
          default:
            info.colorSpace = ImageColorSpace.DeviceRGB;
        }

        if (info.width <= 0 || info.height <= 0) {
          throw new Error('Invalid JPEG file: Invalid dimensions');
        }

        return info;
      }

      // SOS marker - end of metadata
      if (marker === 0xda) break;

      pos += 2;
      if (pos < data.length - 1) {
        const length = (data[pos] << 8) | data[pos + 1];
        pos += length;
      }
    }

    throw new Error('Could not find JPEG dimensions (missing SOF marker)');
  }

  private static parsePng(data: Uint8Array): ImageInfo {
    // Verify PNG signature
    if (
      data.length < 8 ||
      data[0] !== 0x89 ||
      data[1] !== 0x50 ||
      data[2] !== 0x4e ||
      data[3] !== 0x47 ||
      data[4] !== 0x0d ||
      data[5] !== 0x0a ||
      data[6] !== 0x1a ||
      data[7] !== 0x0a
    ) {
      throw new Error('Invalid PNG file: Missing PNG signature');
    }

    const info = new ImageInfo();
    info.format = ImageFormat.Png;
    info.originalData = data;

    const idatChunks: Uint8Array[] = [];
    let palette: Uint8Array | null = null;
    let colorType = 0;
    let bitDepth = 8;

    let pos = 8; // Skip signature

    while (pos < data.length - 8) {
      const chunkLength = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
      pos += 4;

      const chunkType = String.fromCharCode(data[pos], data[pos + 1], data[pos + 2], data[pos + 3]);
      pos += 4;

      switch (chunkType) {
        case 'IHDR':
          info.width = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
          info.height = (data[pos + 4] << 24) | (data[pos + 5] << 16) | (data[pos + 6] << 8) | data[pos + 7];
          bitDepth = data[pos + 8];
          colorType = data[pos + 9];

          info.bitsPerComponent = bitDepth;

          switch (colorType) {
            case 0: // Grayscale
              info.colorSpace = ImageColorSpace.DeviceGray;
              info.components = 1;
              info.hasAlpha = false;
              break;
            case 2: // RGB
              info.colorSpace = ImageColorSpace.DeviceRGB;
              info.components = 3;
              info.hasAlpha = false;
              break;
            case 3: // Indexed
              info.colorSpace = ImageColorSpace.Indexed;
              info.components = 1;
              info.hasAlpha = false;
              break;
            case 4: // Grayscale + Alpha
              info.colorSpace = ImageColorSpace.DeviceGray;
              info.components = 2;
              info.hasAlpha = true;
              break;
            case 6: // RGBA
              info.colorSpace = ImageColorSpace.DeviceRGB;
              info.components = 4;
              info.hasAlpha = true;
              break;
            default:
              throw new Error(`Unsupported PNG color type: ${colorType}`);
          }
          break;

        case 'PLTE':
          palette = new Uint8Array(chunkLength);
          palette.set(data.subarray(pos, pos + chunkLength));
          break;

        case 'IDAT':
          const chunk = data.subarray(pos, pos + chunkLength);
          idatChunks.push(chunk);
          break;

        case 'IEND':
          break;
      }

      pos += chunkLength;
      pos += 4; // Skip CRC
    }

    if (info.width <= 0 || info.height <= 0) {
      throw new Error('Invalid PNG file: Missing or invalid IHDR chunk');
    }

    // Combine IDAT chunks
    const totalLength = idatChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of idatChunks) {
      compressedData.set(chunk, offset);
      offset += chunk.length;
    }

    // Decompress PNG data (stub - would use zlib/pako)
    const decompressedData = this.decompressPng(compressedData, info);

    info.data = decompressedData.pixelData;
    info.alphaData = decompressedData.alphaData ?? new Uint8Array();
    info.palette = palette ?? new Uint8Array();

    return info;
  }

  private static decompressPng(
    compressedData: Uint8Array,
    info: ImageInfo
  ): { pixelData: Uint8Array; alphaData?: Uint8Array } {
    // Stub: would use zlib/pako for decompression
    const bytesPerPixel = info.components * (info.bitsPerComponent / 8);
    const rawDataLength = info.width * info.height * bytesPerPixel;
    const pixelData = new Uint8Array(rawDataLength);

    // For now, just copy without decompression
    const dataLength = Math.min(rawDataLength, compressedData.length - 2);
    pixelData.set(compressedData.subarray(2, 2 + dataLength));

    return { pixelData };
  }

  private static defilterScanline(
    scanline: Uint8Array,
    prevScanline: Uint8Array,
    bytesPerPixel: number,
    filter: number
  ): void {
    switch (filter) {
      case 0: // None
        break;

      case 1: // Sub
        for (let i = bytesPerPixel; i < scanline.length; i++) {
          scanline[i] = scanline[i] + scanline[i - bytesPerPixel];
        }
        break;

      case 2: // Up
        for (let i = 0; i < scanline.length; i++) {
          scanline[i] = scanline[i] + prevScanline[i];
        }
        break;

      case 3: // Average
        for (let i = 0; i < scanline.length; i++) {
          const a = i >= bytesPerPixel ? scanline[i - bytesPerPixel] : 0;
          const b = prevScanline[i];
          scanline[i] = scanline[i] + (a + b) / 2;
        }
        break;

      case 4: // Paeth
        for (let i = 0; i < scanline.length; i++) {
          const a = i >= bytesPerPixel ? scanline[i - bytesPerPixel] : 0;
          const b = prevScanline[i];
          const c = i >= bytesPerPixel ? prevScanline[i - bytesPerPixel] : 0;
          scanline[i] = scanline[i] + this.paethPredictor(a, b, c);
        }
        break;
    }
  }

  private static paethPredictor(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);

    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }
}
