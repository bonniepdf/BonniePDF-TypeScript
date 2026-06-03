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

    if (this.isPngSignature(data)) {
      return this.parsePng(data, /* preInflatedIdat */ undefined, /* preInflatedIcc */ undefined);
    }

    if (this.isJpegSignature(data)) {
      return this.parseJpeg(data);
    }

    throw new Error('Unknown image format. Supported formats: JPEG, PNG');
  }

  /**
   * Async counterpart to {@link loadFromBytes}.  For JPEGs the two paths are
   * equivalent (no decompression needed).  For PNGs this path uses the
   * runtime's built-in `DecompressionStream('deflate')` to inflate IDAT data,
   * which handles every real-world PNG — the sync path only supports the
   * stored-block subset and throws on Huffman-compressed streams.
   */
  public static async loadFromBytesAsync(data: Uint8Array): Promise<ImageInfo> {
    if (!data || data.length < 8) {
      throw new Error('Image data is empty or too small');
    }
    if (this.isPngSignature(data)) {
      const streams = await this.inflatePngStreamsAsync(data);
      return this.parsePng(data, streams.idat, streams.icc);
    }
    if (this.isJpegSignature(data)) {
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
    return this.parsePng(data, /* preInflatedIdat */ undefined, /* preInflatedIcc */ undefined);
  }

  /**
   * Async PNG loader that uses `DecompressionStream` for inflate, so it
   * handles Huffman-compressed IDAT chunks — i.e. every PNG exported from a
   * real image editor.  Prefer this over {@link loadPng} unless the input is
   * known to use stored deflate blocks only.
   */
  public static async loadPngAsync(data: Uint8Array): Promise<ImageInfo> {
    if (!data || data.length === 0) {
      throw new Error('Image data is empty');
    }
    const streams = await this.inflatePngStreamsAsync(data);
    return this.parsePng(data, streams.idat, streams.icc);
  }

  private static isPngSignature(data: Uint8Array): boolean {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }

  private static isJpegSignature(data: Uint8Array): boolean {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }

  private static parseJpeg(data: Uint8Array): ImageInfo {
    if (data.length < 3 || data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff) {
      throw new Error('Invalid JPEG file: Missing JPEG signature');
    }

    const info = new ImageInfo();
    info.data = data;
    info.originalData = data;
    info.format = ImageFormat.Jpeg;

    // ICC profile spans 1..N APP2 segments, indexed by a sequence number.
    // Collect them here and assemble into `info.iccProfile` after the scan.
    const iccChunks: Array<{ seq: number; bytes: Uint8Array }> = [];
    let iccTotal = 0;

    let pos = 2;
    let sofFound = false;
    while (pos < data.length - 1) {
      if (data[pos] !== 0xff) {
        pos++;
        continue;
      }

      const marker = data[pos + 1];

      // SOF0 markers (0xFFC0, 0xFFC1, 0xFFC2)
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        pos += 2;
        pos += 2; // skip segment length

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
        pos++;

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

        // Don't return yet — keep scanning for APP1/APP14 markers that may
        // appear after SOF in some encoders (rare but legal).
        sofFound = true;
        continue;
      }

      // APP0 (0xFFE0) — JFIF density (DPI hint).
      if (marker === 0xe0) {
        const segStart = pos + 2;
        const segLen = (data[segStart] << 8) | data[segStart + 1];
        const payloadStart = segStart + 2;
        const payloadEnd = segStart + segLen;
        this.tryParseJfifDensity(data, payloadStart, payloadEnd, info);
        pos = payloadEnd;
        continue;
      }

      // APP2 (0xFFE2) — may carry one chunk of an embedded ICC profile.
      if (marker === 0xe2) {
        const segStart = pos + 2;
        const segLen = (data[segStart] << 8) | data[segStart + 1];
        const payloadStart = segStart + 2;
        const payloadEnd = segStart + segLen;
        const chunk = this.tryParseIccProfileChunk(data, payloadStart, payloadEnd);
        if (chunk) {
          iccChunks.push({ seq: chunk.seq, bytes: chunk.bytes });
          iccTotal = chunk.total; // every chunk carries the same total
        }
        pos = payloadEnd;
        continue;
      }

      // APP1 (0xFFE1) — may contain "Exif\0\0" + TIFF header with orientation.
      if (marker === 0xe1) {
        const segStart = pos + 2;
        const segLen = (data[segStart] << 8) | data[segStart + 1];
        const payloadStart = segStart + 2;
        const payloadEnd = segStart + segLen;
        this.tryParseExifOrientation(data, payloadStart, payloadEnd, info);
        pos = payloadEnd;
        continue;
      }

      // APP14 (0xFFEE) — Adobe marker; transform=0 means CMYK ink-inverted.
      if (marker === 0xee) {
        const segStart = pos + 2;
        const segLen = (data[segStart] << 8) | data[segStart + 1];
        const payloadStart = segStart + 2;
        const payloadEnd = segStart + segLen;
        this.tryParseAdobeMarker(data, payloadStart, payloadEnd, info);
        pos = payloadEnd;
        continue;
      }

      // SOS marker — start of scan; no further metadata segments follow.
      if (marker === 0xda) break;

      // Skip any other marker segment by jumping past its declared length.
      pos += 2;
      if (pos < data.length - 1) {
        const length = (data[pos] << 8) | data[pos + 1];
        pos += length;
      }
    }

    if (!sofFound) {
      throw new Error('Could not find JPEG dimensions (missing SOF marker)');
    }

    // Assemble the ICC profile when every announced chunk arrived.  If
    // anything is missing (out-of-spec encoder) we drop the profile rather
    // than emit a truncated one — better to render with the device space.
    if (iccChunks.length > 0 && iccChunks.length === iccTotal) {
      iccChunks.sort((a, b) => a.seq - b.seq);
      const totalLen = iccChunks.reduce((s, c) => s + c.bytes.length, 0);
      const merged = new Uint8Array(totalLen);
      let off = 0;
      for (const c of iccChunks) {
        merged.set(c.bytes, off);
        off += c.bytes.length;
      }
      info.iccProfile = merged;
    }

    return info;
  }

  /**
   * Parse the JFIF APP0 segment's density fields and convert to DPI.  Units
   * 1 = pixels per inch (used as-is), 2 = pixels per centimetre (multiply
   * by 2.54).  Units 0 means "aspect ratio only", which we ignore.
   */
  private static tryParseJfifDensity(data: Uint8Array, start: number, end: number, info: ImageInfo): void {
    // "JFIF\0" identifier (5 bytes), then version(2) + units(1) + Xdens(2) + Ydens(2)
    if (end - start < 14) return;
    if (
      data[start] !== 0x4a || // 'J'
      data[start + 1] !== 0x46 || // 'F'
      data[start + 2] !== 0x49 || // 'I'
      data[start + 3] !== 0x46 || // 'F'
      data[start + 4] !== 0x00
    ) {
      return;
    }
    const units = data[start + 7];
    const xDens = (data[start + 8] << 8) | data[start + 9];
    const yDens = (data[start + 10] << 8) | data[start + 11];
    if (units === 1) {
      info.dpiX = xDens;
      info.dpiY = yDens;
    } else if (units === 2) {
      info.dpiX = Math.round(xDens * 2.54);
      info.dpiY = Math.round(yDens * 2.54);
    }
  }

  /**
   * Pull a single chunk of an embedded ICC profile out of an APP2 payload.
   * Returns null if the segment isn't an ICC chunk.  Each chunk advertises
   * its 1-based sequence number and the total chunk count so the caller can
   * reassemble profiles spanning multiple APP2 segments.
   */
  private static tryParseIccProfileChunk(
    data: Uint8Array,
    start: number,
    end: number
  ): { seq: number; total: number; bytes: Uint8Array } | null {
    // "ICC_PROFILE\0" identifier (12 bytes), then seq(1) + total(1) + bytes
    if (end - start < 14) return null;
    const id = [0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00];
    for (let i = 0; i < id.length; i++) {
      if (data[start + i] !== id[i]) return null;
    }
    const seq = data[start + 12];
    const total = data[start + 13];
    if (seq < 1 || total < 1 || seq > total) return null;
    return { seq, total, bytes: data.subarray(start + 14, end) };
  }

  /**
   * Parse the EXIF orientation tag (0x0112) from an APP1 payload, if present.
   * Returns silently when the segment isn't an EXIF blob or doesn't carry an
   * orientation tag — JPEGs without EXIF are extremely common.
   */
  private static tryParseExifOrientation(data: Uint8Array, start: number, end: number, info: ImageInfo): void {
    // "Exif\0\0" identifier (6 bytes).
    if (end - start < 6) return;
    if (
      data[start] !== 0x45 || // 'E'
      data[start + 1] !== 0x78 || // 'x'
      data[start + 2] !== 0x69 || // 'i'
      data[start + 3] !== 0x66 || // 'f'
      data[start + 4] !== 0x00 ||
      data[start + 5] !== 0x00
    ) {
      return;
    }

    // TIFF header begins immediately after the EXIF identifier.  All offsets
    // inside the TIFF block are relative to the TIFF base.
    const tiffBase = start + 6;
    if (end - tiffBase < 8) return;

    // Byte order: "II" = little-endian, "MM" = big-endian.
    const le = data[tiffBase] === 0x49 && data[tiffBase + 1] === 0x49;
    const be = data[tiffBase] === 0x4d && data[tiffBase + 1] === 0x4d;
    if (!le && !be) return;
    const u16 = (off: number) => (le ? data[off] | (data[off + 1] << 8) : (data[off] << 8) | data[off + 1]);
    const u32 = (off: number) =>
      le
        ? (data[off] | (data[off + 1] << 8) | (data[off + 2] << 16) | (data[off + 3] << 24)) >>> 0
        : ((data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3]) >>> 0;

    if (u16(tiffBase + 2) !== 0x002a) return; // TIFF magic

    const ifd0Offset = u32(tiffBase + 4);
    const ifd0 = tiffBase + ifd0Offset;
    if (ifd0 + 2 > end) return;
    const entryCount = u16(ifd0);
    let entry = ifd0 + 2;
    for (let i = 0; i < entryCount; i++, entry += 12) {
      if (entry + 12 > end) return;
      const tag = u16(entry);
      if (tag === 0x0112) {
        // Orientation tag.  Type SHORT (3), count 1, value packed into the
        // first 2 bytes of the 4-byte value field.
        const value = u16(entry + 8);
        if (value >= 1 && value <= 8) info.orientation = value;
        return;
      }
    }
  }

  /**
   * Parse the Adobe APP14 marker.  When the transform byte is 0 and the
   * image is CMYK, ink values are stored inverted (Photoshop convention);
   * we set the flag so the writer can emit the matching /Decode array.
   */
  private static tryParseAdobeMarker(data: Uint8Array, start: number, end: number, info: ImageInfo): void {
    // "Adobe\0" identifier is 6 bytes; the segment also carries 5 bytes of
    // version + flags + transform.  Total payload ≥ 12 bytes.
    if (end - start < 12) return;
    if (
      data[start] !== 0x41 || // 'A'
      data[start + 1] !== 0x64 || // 'd'
      data[start + 2] !== 0x6f || // 'o'
      data[start + 3] !== 0x62 || // 'b'
      data[start + 4] !== 0x65 // 'e'
    ) {
      return;
    }
    // Bytes: version(2) + flags0(2) + flags1(2) + transform(1).
    // APP14 typically precedes SOF in real-world JPEGs, so we can't check
    // colorSpace here — the writer guards on CMYK at emit time.
    const transform = data[start + 11];
    if (transform === 0) {
      info.invertCmykColors = true;
    }
  }

  private static parsePng(
    data: Uint8Array,
    preInflatedIdat: Uint8Array | undefined,
    preInflatedIcc: Uint8Array | undefined
  ): ImageInfo {
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
    let compressedIccProfile: Uint8Array | null = null;

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

        case 'pHYs':
          // 4 bytes X pixels per unit, 4 bytes Y, 1 byte unit (0=unknown, 1=metre).
          if (chunkLength >= 9) {
            const ppuX = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
            const ppuY = (data[pos + 4] << 24) | (data[pos + 5] << 16) | (data[pos + 6] << 8) | data[pos + 7];
            const unit = data[pos + 8];
            if (unit === 1) {
              // pixels per metre → DPI: ppm * 0.0254
              info.dpiX = Math.round(ppuX * 0.0254);
              info.dpiY = Math.round(ppuY * 0.0254);
            }
          }
          break;

        case 'iCCP':
          // Profile name (1–79 bytes, Latin-1, null-terminated) + compression
          // method (1 byte, always 0) + zlib-compressed ICC profile.  Stash
          // the compressed bytes; the async loader inflates them via
          // DecompressionStream.  Sync loaders silently drop the profile.
          {
            let nameEnd = pos;
            const limit = Math.min(pos + chunkLength, pos + 80);
            while (nameEnd < limit && data[nameEnd] !== 0) nameEnd++;
            // nameEnd points at the terminating null; +1 skips it, +1 more skips compression-method byte.
            const profStart = nameEnd + 2;
            const profEnd = pos + chunkLength;
            if (profStart < profEnd) {
              compressedIccProfile = data.subarray(profStart, profEnd);
            }
          }
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

    // Decompress and de-filter PNG data.  When `preInflatedIdat` is supplied
    // the caller has already inflated the zlib stream (typically via the
    // async path that uses `DecompressionStream`), so we skip the sync
    // inflater.
    const decompressedData = this.decompressPng(compressedData, info, preInflatedIdat);

    // Adopt the pre-inflated ICC profile if the async path supplied one.
    // The sync path never inflates iCCP, so a Huffman-compressed profile
    // is silently dropped — matching the sync IDAT behaviour.
    if (preInflatedIcc && preInflatedIcc.length > 0) {
      info.iccProfile = preInflatedIcc;
    }
    // Suppress unused-warning: compressedIccProfile is only consumed by
    // the async wrapper via inflatePngStreamsAsync, not directly here.
    void compressedIccProfile;

    info.data = decompressedData.pixelData;
    info.alphaData = decompressedData.alphaData ?? new Uint8Array();
    info.palette = palette ?? new Uint8Array();

    // After splitting RGBA → RGB + alpha, update components to reflect the
    // colour-only count so the PDF writer emits the right stride.
    if (info.hasAlpha) {
      info.components -= 1; // e.g. 4 (RGBA) → 3 (RGB), 2 (GA) → 1 (Gray)
    }

    return info;
  }

  private static decompressPng(
    compressedData: Uint8Array,
    info: ImageInfo,
    preInflated: Uint8Array | undefined
  ): { pixelData: Uint8Array; alphaData?: Uint8Array } {
    // Step 1: inflate the zlib/deflate stream to get raw scanline bytes.
    const rawScanlines = preInflated ?? this.inflateZlib(compressedData);

    // Step 2: walk scanlines, reverse PNG filters, separate colour from alpha.
    const bpp = info.components * (info.bitsPerComponent / 8); // bytes per pixel
    const rowBytes = info.width * bpp; // colour+alpha bytes per row
    const stride = 1 + rowBytes; // +1 for filter byte

    const hasAlpha = info.hasAlpha;
    const colorBpp = hasAlpha ? bpp - 1 : bpp; // bytes per pixel excl. alpha
    const colorRowBytes = info.width * colorBpp;

    const pixelData = new Uint8Array(info.width * info.height * colorBpp);
    const alphaData = hasAlpha ? new Uint8Array(info.width * info.height) : undefined;

    const prevRow = new Uint8Array(rowBytes); // previous unfiltered scanline (zeros for row 0)

    for (let y = 0; y < info.height; y++) {
      const base = y * stride;
      const filter = rawScanlines[base];

      // Copy scanline into a mutable buffer and apply filter reversal in-place.
      const row = rawScanlines.slice(base + 1, base + 1 + rowBytes);
      this.defilterScanline(row, prevRow, bpp, filter);

      // Separate colour components and alpha into their respective arrays.
      if (hasAlpha) {
        for (let x = 0; x < info.width; x++) {
          const srcOff = x * bpp;
          const dstColor = (y * info.width + x) * colorBpp;
          const dstAlpha = y * info.width + x;
          for (let c = 0; c < colorBpp; c++) pixelData[dstColor + c] = row[srcOff + c];
          alphaData![dstAlpha] = row[srcOff + colorBpp];
        }
      } else {
        pixelData.set(row, y * colorRowBytes);
      }

      prevRow.set(row);
    }

    return { pixelData, alphaData };
  }

  /**
   * Sync inflate for zlib streams that consist of stored (type-00) deflate
   * blocks only.  Throws on Huffman-compressed blocks — those require the
   * async path via {@link inflatePngIdatAsync}, which uses the runtime's
   * built-in `DecompressionStream`.  Every PNG produced by a real image
   * editor uses Huffman compression, so production code should prefer the
   * async loader; this sync path exists so the in-process PNG demo (which
   * intentionally emits stored blocks) keeps working without async plumbing.
   */
  private static inflateZlib(data: Uint8Array): Uint8Array {
    // Skip the 2-byte zlib header (CMF, FLG).
    let pos = 2;
    const chunks: Uint8Array[] = [];

    while (pos < data.length - 4) {
      // last 4 bytes are the Adler-32 checksum
      const bfinalBtype = data[pos++];
      const bfinal = bfinalBtype & 1;
      const btype = (bfinalBtype >> 1) & 3;

      if (btype !== 0) {
        throw new Error(
          `Compressed deflate block (btype=${btype}) is not supported by the synchronous PNG loader. ` +
            'Use ImageLoader.loadPngAsync() or Document.generateBytesAsync() — the async path uses ' +
            "the runtime's built-in DecompressionStream and handles every real-world PNG."
        );
      }

      // Stored block: LEN (2 bytes LE) + NLEN (2 bytes LE, one's complement)
      const len = data[pos] | (data[pos + 1] << 8);
      pos += 4; // skip LEN and NLEN

      chunks.push(data.subarray(pos, pos + len));
      pos += len;

      if (bfinal) break;
    }

    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      result.set(c, off);
      off += c.length;
    }
    return result;
  }

  /**
   * Inflate every zlib stream embedded in a PNG that the async loader cares
   * about — IDAT (always present) and iCCP (when an embedded ICC profile is
   * carried).  Both are inflated through the runtime's built-in
   * `DecompressionStream('deflate')`, so no inflate dependency is needed.
   * Works in every modern browser (Chrome 80+, Firefox 113+, Safari 16.4+),
   * Node ≥18, Bun, Deno, and Cloudflare Workers.
   */
  private static async inflatePngStreamsAsync(pngBytes: Uint8Array): Promise<{ idat: Uint8Array; icc?: Uint8Array }> {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(
        'ImageLoader: DecompressionStream is not available in this runtime. ' +
          'Async PNG loading requires the Web Streams API (Node ≥18, all modern browsers).'
      );
    }

    // Walk the chunk stream once, capturing IDAT bytes and any iCCP payload.
    const idatParts: Uint8Array[] = [];
    let iccCompressed: Uint8Array | null = null;
    let pos = 8; // skip PNG signature
    while (pos < pngBytes.length - 8) {
      const chunkLength =
        (pngBytes[pos] << 24) | (pngBytes[pos + 1] << 16) | (pngBytes[pos + 2] << 8) | pngBytes[pos + 3];
      pos += 4;
      const chunkType = String.fromCharCode(pngBytes[pos], pngBytes[pos + 1], pngBytes[pos + 2], pngBytes[pos + 3]);
      pos += 4;
      if (chunkType === 'IDAT') {
        idatParts.push(pngBytes.subarray(pos, pos + chunkLength));
      } else if (chunkType === 'iCCP') {
        // Skip profile name + null terminator + compression method byte.
        let nameEnd = pos;
        const limit = Math.min(pos + chunkLength, pos + 80);
        while (nameEnd < limit && pngBytes[nameEnd] !== 0) nameEnd++;
        const profStart = nameEnd + 2;
        const profEnd = pos + chunkLength;
        if (profStart < profEnd) {
          iccCompressed = pngBytes.subarray(profStart, profEnd);
        }
      }
      pos += chunkLength + 4; // payload + CRC
      if (chunkType === 'IEND') break;
    }

    // Concatenate and inflate IDAT.
    const idatTotal = idatParts.reduce((s, c) => s + c.length, 0);
    const idatZlib = new Uint8Array(idatTotal);
    let off = 0;
    for (const c of idatParts) {
      idatZlib.set(c, off);
      off += c.length;
    }
    const idat = await this.inflateStreamDeflate(idatZlib);

    // Inflate iCCP if present.
    const icc = iccCompressed ? await this.inflateStreamDeflate(iccCompressed) : undefined;

    return { idat, icc };
  }

  /** Inflate a zlib-wrapped deflate stream via `DecompressionStream`. */
  private static async inflateStreamDeflate(zlib: Uint8Array): Promise<Uint8Array> {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    // Slice into a fresh Uint8Array backed by a concrete ArrayBuffer (not
    // ArrayBufferLike) — TS's stricter typings reject the parameter view
    // when its buffer might be a SharedArrayBuffer, and Node's web-streams
    // adapter rejects bare ArrayBuffer arguments.  This shape works in
    // both Node and the browser.
    writer.write(zlib.slice()).then(() => writer.close());

    const outChunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      outChunks.push(value);
    }
    const outTotal = outChunks.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(outTotal);
    let outOff = 0;
    for (const c of outChunks) {
      out.set(c, outOff);
      outOff += c.length;
    }
    return out;
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
