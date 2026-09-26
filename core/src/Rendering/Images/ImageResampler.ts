import { ImageColorSpace, ImageFormat, ImageInfo } from './ImageInfo';

/** Milli-points per inch: 72 pt x 1000. */
const MILLI_POINTS_PER_INCH = 72000;

/**
 * Reduces an over-sampled image to the resolution its printed size can use.
 * Integer arithmetic throughout: the output is a function of the source samples
 * and the two sizes alone, so the same image reduces to the same bytes in every
 * implementation of BonniePDF and on every machine.
 *
 * Every sum stays below 2^53 (the largest is 255 x 255 x the source pixel count,
 * about 7.8e11 for 12 megapixels), so JavaScript numbers are exact here.
 */
export class ImageResampler {
  /**
   * The pixel length that keeps a drawn length at or under `dpi` pixels per inch,
   * never above the source and never below one pixel.
   */
  public static targetLength(drawnMilliPoints: number, dpi: number, sourceLength: number): number {
    const target = Math.max(1, Math.floor((drawnMilliPoints * dpi) / MILLI_POINTS_PER_INCH));
    return Math.min(sourceLength, target);
  }

  /**
   * True when the source carries at least 1.5 times the target's pixels. Below that the
   * saving is under a third of the raw pixels and the pixels are left alone. Decided on
   * pixel counts only, never on compressed size, which differs between implementations.
   */
  public static shouldResample(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): boolean {
    return 2 * sourceWidth * sourceHeight >= 3 * targetWidth * targetHeight;
  }

  /**
   * Whether the image is of a kind the resampler handles exactly: an 8-bit grey or RGB
   * PNG, with or without alpha. JPEG, indexed and 16-bit images are passed through
   * unchanged. Returns a short reason when it is not, for the diagnostic.
   */
  public static eligibility(image: ImageInfo): { eligible: true } | { eligible: false; reason: string } {
    if (image.format !== ImageFormat.Png) return { eligible: false, reason: 'not a PNG' };
    if (image.bitsPerComponent !== 8) {
      return { eligible: false, reason: `${image.bitsPerComponent}-bit samples` };
    }
    if (image.colorSpace !== ImageColorSpace.DeviceGray && image.colorSpace !== ImageColorSpace.DeviceRGB) {
      return { eligible: false, reason: 'indexed or CMYK colour' };
    }
    const pixels = image.width * image.height;
    if (image.data.length !== pixels * image.components || (image.hasAlpha && image.alphaData.length !== pixels)) {
      return { eligible: false, reason: 'sample data does not match the declared size' };
    }
    return { eligible: true };
  }

  /**
   * Returns a copy of `source` at the target size. Everything other than the pixels -
   * colour space, ICC profile, orientation - is carried over unchanged.
   */
  public static resampleImage(source: ImageInfo, targetWidth: number, targetHeight: number): ImageInfo {
    const { color, alpha } = ImageResampler.resample(
      source.data,
      source.hasAlpha ? source.alphaData : undefined,
      source.width,
      source.height,
      source.components,
      targetWidth,
      targetHeight
    );

    const reduced = new ImageInfo();
    Object.assign(reduced, source);
    reduced.data = color;
    reduced.alphaData = alpha ?? new Uint8Array();
    // The original file bytes describe the source pixels, not these.
    reduced.originalData = new Uint8Array();
    reduced.width = targetWidth;
    reduced.height = targetHeight;
    return reduced;
  }

  /**
   * The exact area average. `color` holds `components` interleaved samples per pixel;
   * `alpha`, if present, is a separate plane. With alpha the average is premultiplied: a
   * transparent pixel contributes nothing to the colour of its neighbours, and a colour
   * with no visible contribution is 0.
   */
  public static resample(
    color: Uint8Array,
    alpha: Uint8Array | undefined,
    sourceWidth: number,
    sourceHeight: number,
    components: number,
    targetWidth: number,
    targetHeight: number
  ): { color: Uint8Array; alpha?: Uint8Array } {
    const cc = components;
    const outColor = new Uint8Array(targetWidth * targetHeight * cc);
    const outAlpha = alpha ? new Uint8Array(targetWidth * targetHeight) : undefined;

    const xs = ImageResampler.overlaps(sourceWidth, targetWidth);
    const ys = ImageResampler.overlaps(sourceHeight, targetHeight);
    const total = sourceWidth * sourceHeight;

    // Per destination row: the vertical accumulation of the horizontally weighted rows.
    const accColor = new Float64Array(targetWidth * cc);
    const accAlpha = new Float64Array(alpha ? targetWidth : 0);
    const rowColor = new Float64Array(targetWidth * cc);

    for (let y = 0; y < targetHeight; y++) {
      accColor.fill(0);
      accAlpha.fill(0);

      for (let k = 0; k < ys.count[y]; k++) {
        const sy = ys.first[y] + k;
        const oy = ys.weights[ys.offset[y] + k];
        const rowStart = sy * sourceWidth;

        for (let x = 0; x < targetWidth; x++) {
          const wOff = xs.offset[x];
          let a = 0;
          for (let c = 0; c < cc; c++) rowColor[x * cc + c] = 0;

          for (let m = 0; m < xs.count[x]; m++) {
            const ox = xs.weights[wOff + m];
            const p = rowStart + xs.first[x] + m;
            if (!alpha) {
              for (let c = 0; c < cc; c++) rowColor[x * cc + c] += ox * color[p * cc + c];
            } else {
              const oa = ox * alpha[p];
              a += oa;
              for (let c = 0; c < cc; c++) rowColor[x * cc + c] += oa * color[p * cc + c];
            }
          }

          for (let c = 0; c < cc; c++) accColor[x * cc + c] += oy * rowColor[x * cc + c];
          if (alpha) accAlpha[x] += oy * a;
        }
      }

      for (let x = 0; x < targetWidth; x++) {
        const o = y * targetWidth + x;
        if (!alpha) {
          for (let c = 0; c < cc; c++) outColor[o * cc + c] = ImageResampler.roundHalfUp(accColor[x * cc + c], total);
        } else {
          const a = accAlpha[x];
          outAlpha![o] = ImageResampler.roundHalfUp(a, total);
          for (let c = 0; c < cc; c++) {
            outColor[o * cc + c] = a === 0 ? 0 : ImageResampler.roundHalfUp(accColor[x * cc + c], a);
          }
        }
      }
    }

    return { color: outColor, alpha: outAlpha };
  }

  /** round(n / d) with halves rounding up, for non-negative n and positive d. Exact below 2^53. */
  private static roundHalfUp(n: number, d: number): number {
    return Math.floor((2 * n + d) / (2 * d));
  }

  /**
   * For each target index d, the first source index that overlaps it, how many source
   * indices do, and the integer overlap weight of each. Output pixel d spans
   * [d*S, (d+1)*S) and source pixel i spans [i*T, (i+1)*T), both in units of 1/T of a
   * source pixel, so the weights of one target index sum to S.
   */
  private static overlaps(
    sourceLength: number,
    targetLength: number
  ): { first: Int32Array; count: Int32Array; offset: Int32Array; weights: Float64Array } {
    const first = new Int32Array(targetLength);
    const count = new Int32Array(targetLength);
    const offset = new Int32Array(targetLength);
    const weights: number[] = [];
    const s = sourceLength;
    const t = targetLength;

    for (let d = 0; d < targetLength; d++) {
      const lo = d * s;
      const hi = (d + 1) * s;
      const i0 = Math.floor(lo / t);
      const i1 = Math.ceil(hi / t) - 1;
      first[d] = i0;
      count[d] = i1 - i0 + 1;
      offset[d] = weights.length;
      for (let i = i0; i <= i1; i++) {
        weights.push(Math.min(hi, (i + 1) * t) - Math.max(lo, i * t));
      }
    }

    return { first, count, offset, weights: Float64Array.from(weights) };
  }
}
