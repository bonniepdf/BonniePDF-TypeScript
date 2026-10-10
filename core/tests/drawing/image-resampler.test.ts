import { describe, it, expect } from 'vitest';
import { ImageResampler } from '../../src/Rendering/Images/ImageResampler';

/**
 * The image resampler and the target-size rule, against the shared conformance data for image
 * resolution capping. The pixel cases are pure functions of (source samples, sizes): no layout
 * and no PDF. Mirrors BonniePDF.Tests/Drawing/ImageResamplerTests.cs.
 */

const targetDimensionCases: readonly (readonly [
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  boolean,
])[] = [
  ['the invoice logo, 175pt wide at the 288 default', 2658, 512, 175000, 33708, 288, 700, 134, true],
  ['a small image already below the cap is not upscaled', 100, 50, 200000, 100000, 288, 100, 50, false],
  ['exactly on the cap: 72pt at 300 dpi is 300px', 300, 300, 72000, 72000, 300, 300, 300, false],
  ['a 12-megapixel photo in a 3in x 2in box at 288', 4000, 3000, 216000, 144000, 288, 864, 576, true],
  ['a sliver: the drawn size rounds down to a floor of 1px', 5000, 5000, 100, 100, 288, 1, 1, true],
  [
    'a 1.44x pixel oversample is inside the 1.5x tolerance, so it is left alone',
    1200,
    960,
    250000,
    200000,
    288,
    1000,
    800,
    false,
  ],
  [
    'a 1.56x pixel oversample is past the tolerance, so it is resampled',
    1250,
    1000,
    250000,
    200000,
    288,
    1000,
    800,
    true,
  ],
  ['anisotropic fill: each axis is capped on its own', 2000, 400, 100000, 100000, 288, 400, 400, true],
];

const pixelCases: readonly {
  id: string;
  sourceWidth: number;
  sourceHeight: number;
  channels: number;
  targetWidth: number;
  targetHeight: number;
  source: number[];
  expect: number[];
}[] = [
  {
    id: 'grey-4x4-to-2x2-exact',
    sourceWidth: 4,
    sourceHeight: 4,
    channels: 1,
    targetWidth: 2,
    targetHeight: 2,
    source: [0, 60, 120, 180, 17, 77, 137, 197, 34, 94, 154, 214, 51, 111, 171, 231],
    expect: [39, 159, 73, 193],
  },
  {
    id: 'grey-5x3-to-2x2-fractional',
    sourceWidth: 5,
    sourceHeight: 3,
    channels: 1,
    targetWidth: 2,
    targetHeight: 2,
    source: [0, 50, 100, 150, 200, 71, 121, 171, 221, 15, 142, 192, 242, 36, 86],
    expect: [64, 150, 158, 108],
  },
  {
    id: 'grey-7x7-to-3x2-anisotropic',
    sourceWidth: 7,
    sourceHeight: 7,
    channels: 1,
    targetWidth: 3,
    targetHeight: 2,
    source: [
      0, 37, 74, 111, 148, 185, 222, 91, 128, 165, 202, 239, 20, 57, 182, 219, 0, 37, 74, 111, 148, 17, 54, 91, 128,
      165, 202, 239, 108, 145, 182, 219, 0, 37, 74, 199, 236, 17, 54, 91, 128, 165, 34, 71, 108, 145, 182, 219, 0,
    ],
    expect: [96, 118, 140, 116, 117, 118],
  },
  {
    id: 'rgb-6x4-to-4x3',
    sourceWidth: 6,
    sourceHeight: 4,
    channels: 3,
    targetWidth: 4,
    targetHeight: 3,
    source: [
      0, 97, 194, 41, 138, 235, 82, 179, 20, 123, 220, 61, 164, 5, 102, 205, 46, 143, 23, 120, 217, 64, 161, 2, 105,
      202, 43, 146, 243, 84, 187, 28, 125, 228, 69, 166, 46, 143, 240, 87, 184, 25, 128, 225, 66, 169, 10, 107, 210, 51,
      148, 251, 92, 189, 69, 166, 7, 110, 207, 48, 151, 248, 89, 192, 33, 130, 233, 74, 171, 18, 115, 212,
    ],
    expect: [
      19, 116, 192, 74, 171, 76, 142, 154, 80, 197, 38, 135, 48, 145, 157, 103, 200, 41, 171, 98, 109, 226, 67, 164, 77,
      174, 58, 132, 229, 70, 200, 41, 138, 127, 96, 193,
    ],
  },
  {
    id: 'grey-alpha-4x4-to-2x2',
    sourceWidth: 4,
    sourceHeight: 4,
    channels: 2,
    targetWidth: 2,
    targetHeight: 2,
    source: [
      9, 0, 79, 85, 149, 170, 219, 0, 9, 85, 79, 170, 149, 0, 219, 0, 9, 170, 79, 0, 149, 0, 219, 85, 9, 0, 79, 0, 149,
      85, 219, 0,
    ],
    expect: [62, 85, 149, 43, 9, 43, 184, 43],
  },
  {
    id: 'rgba-5x5-to-2x2-premultiplied',
    sourceWidth: 5,
    sourceHeight: 5,
    channels: 4,
    targetWidth: 2,
    targetHeight: 2,
    source: [
      200, 140, 80, 0, 205, 145, 85, 0, 210, 150, 90, 60, 215, 155, 95, 60, 220, 160, 100, 60, 200, 140, 80, 0, 205,
      145, 85, 0, 210, 150, 90, 100, 215, 155, 95, 100, 220, 160, 100, 100, 200, 140, 80, 0, 205, 145, 85, 0, 210, 150,
      90, 140, 215, 155, 95, 140, 220, 160, 100, 140, 200, 140, 80, 0, 205, 145, 85, 0, 210, 150, 90, 180, 215, 155, 95,
      180, 220, 160, 100, 180, 200, 140, 80, 0, 205, 145, 85, 0, 210, 150, 90, 220, 215, 155, 95, 220, 220, 160, 100,
      220,
    ],
    expect: [210, 150, 90, 18, 216, 156, 96, 92, 210, 150, 90, 38, 216, 156, 96, 188],
  },
  {
    id: 'rgba-3x3-to-1x1-transparent-block',
    sourceWidth: 3,
    sourceHeight: 3,
    channels: 4,
    targetWidth: 1,
    targetHeight: 1,
    source: [
      255, 128, 0, 0, 255, 128, 0, 0, 255, 128, 0, 0, 255, 128, 0, 0, 255, 128, 0, 255, 255, 128, 0, 0, 255, 128, 0, 0,
      255, 128, 0, 0, 255, 128, 0, 0,
    ],
    expect: [255, 128, 0, 28],
  },
  {
    id: 'rgba-8x2-to-3x1',
    sourceWidth: 8,
    sourceHeight: 2,
    channels: 4,
    targetWidth: 3,
    targetHeight: 1,
    source: [
      0, 43, 86, 255, 29, 72, 115, 224, 58, 101, 144, 193, 87, 130, 173, 162, 116, 159, 202, 131, 145, 188, 231, 100,
      174, 217, 4, 69, 203, 246, 33, 38, 61, 104, 147, 246, 90, 133, 176, 215, 119, 162, 205, 184, 148, 191, 234, 153,
      177, 220, 7, 122, 206, 249, 36, 91, 235, 22, 65, 60, 8, 51, 94, 29,
    ],
    expect: [53, 96, 139, 223, 126, 169, 161, 142, 174, 169, 80, 61],
  },
  {
    id: 'rgba-6x4-opaque-to-4x3',
    sourceWidth: 6,
    sourceHeight: 4,
    channels: 4,
    targetWidth: 4,
    targetHeight: 3,
    source: [
      0, 97, 194, 255, 41, 138, 235, 255, 82, 179, 20, 255, 123, 220, 61, 255, 164, 5, 102, 255, 205, 46, 143, 255, 23,
      120, 217, 255, 64, 161, 2, 255, 105, 202, 43, 255, 146, 243, 84, 255, 187, 28, 125, 255, 228, 69, 166, 255, 46,
      143, 240, 255, 87, 184, 25, 255, 128, 225, 66, 255, 169, 10, 107, 255, 210, 51, 148, 255, 251, 92, 189, 255, 69,
      166, 7, 255, 110, 207, 48, 255, 151, 248, 89, 255, 192, 33, 130, 255, 233, 74, 171, 255, 18, 115, 212, 255,
    ],
    expect: [
      19, 116, 192, 255, 74, 171, 76, 255, 142, 154, 80, 255, 197, 38, 135, 255, 48, 145, 157, 255, 103, 200, 41, 255,
      171, 98, 109, 255, 226, 67, 164, 255, 77, 174, 58, 255, 132, 229, 70, 255, 200, 41, 138, 255, 127, 96, 193, 255,
    ],
  },
  {
    id: 'rgba-2x1-last-alpha-254-to-1x1',
    sourceWidth: 2,
    sourceHeight: 1,
    channels: 4,
    targetWidth: 1,
    targetHeight: 1,
    source: [0, 0, 0, 255, 255, 255, 255, 254],
    expect: [127, 127, 127, 255],
  },
];

describe('ImageResampler target size', () => {
  for (const [id, sw, sh, mw, mh, dpi, tw, th, resample] of targetDimensionCases) {
    it(id, () => {
      const targetWidth = ImageResampler.targetLength(mw, dpi, sw);
      const targetHeight = ImageResampler.targetLength(mh, dpi, sh);
      expect([targetWidth, targetHeight]).toEqual([tw, th]);
      expect(ImageResampler.shouldResample(sw, sh, targetWidth, targetHeight)).toBe(resample);
    });
  }
});

describe('ImageResampler exact area average', () => {
  for (const c of pixelCases) {
    it(c.id, () => {
      const hasAlpha = c.channels === 2 || c.channels === 4;
      const cc = hasAlpha ? c.channels - 1 : c.channels;

      // The fixture interleaves alpha as the last channel; the resampler takes it as its own plane.
      const pixels = c.sourceWidth * c.sourceHeight;
      const color = new Uint8Array(pixels * cc);
      const alpha = hasAlpha ? new Uint8Array(pixels) : undefined;
      for (let p = 0; p < pixels; p++) {
        for (let k = 0; k < cc; k++) color[p * cc + k] = c.source[p * c.channels + k];
        if (alpha) alpha[p] = c.source[p * c.channels + cc];
      }

      const out = ImageResampler.resample(
        color,
        alpha,
        c.sourceWidth,
        c.sourceHeight,
        cc,
        c.targetWidth,
        c.targetHeight
      );

      const actual: number[] = [];
      for (let p = 0; p < c.targetWidth * c.targetHeight; p++) {
        for (let k = 0; k < cc; k++) actual.push(out.color[p * cc + k]);
        if (out.alpha) actual.push(out.alpha[p]);
      }
      expect(actual).toEqual(c.expect);
    });
  }
});
