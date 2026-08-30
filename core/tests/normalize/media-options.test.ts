import { describe, it, expect } from 'vitest';
import { Line, LINE_OPTION_KEYS } from '../../src/Elements/Shapes/Line';
import { Ellipse, ELLIPSE_OPTION_KEYS } from '../../src/Elements/Shapes/Ellipse';
import { Circle, CIRCLE_OPTION_KEYS } from '../../src/Elements/Shapes/Circle';
import { Barcode, BARCODE_OPTION_KEYS } from '../../src/Elements/Shapes/Barcode';
import { QRCode, QR_CODE_OPTION_KEYS } from '../../src/Elements/Shapes/QRCode';
import { DataMatrix, DATA_MATRIX_OPTION_KEYS } from '../../src/Elements/Shapes/DataMatrix';
import { Image, IMAGE_OPTION_KEYS } from '../../src/Elements/Media/Image';
import { CanvasElement, CANVAS_ELEMENT_OPTION_KEYS } from '../../src/Elements/Drawing/CanvasElement';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { LineOrientation } from '../../src/Elements/Shapes/Line';
import { BarcodeSymbology } from '../../src/Elements/Shapes/BarcodeSymbology';
import { QrEcc } from '../../src/Elements/Shapes/QrEcc';
import { ImageFitMode } from '../../src/Elements/Media/ImageFitMode';
import { Color } from '../../src/Core/Color';

const INTERNAL = {
  elementBase: ['startingY'],
  image: ['cachedInfo', 'displayWidth', 'displayHeight'],
  dataMatrix: ['memo'], // private encode cache; no runtime marker for `private`
  canvas: ['drawHandler'], // private readonly; constructor-only, not an option
} as const;

function settableSurface(instance: object, internal: readonly string[] = []): string[] {
  const skip = new Set<string>([...INTERNAL.elementBase, ...internal]);
  const names = new Set<string>();
  for (const k of Object.keys(instance)) {
    if (!k.startsWith('_') && !skip.has(k)) names.add(k);
  }
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (typeof d.set === 'function' && !k.startsWith('_') && !skip.has(k)) names.add(k);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

describe('Shapes options (09a Phase 2.G)', () => {
  it('Line accepts colour tokens and keeps the orientation enum', () => {
    const l = new Line({ thickness: 2, color: 'slate-300', orientation: LineOrientation.Vertical, length: 40 });
    expect(l.thickness).toBe(2);
    expect(l.color).toBe(ColorPalette.slate[300]);
    expect(l.orientation).toBe(LineOrientation.Vertical);
    expect(l.length).toBe(40);
    expect(new Line().thickness).toBe(1);
  });

  it('Ellipse and Circle accept fill colour tokens', () => {
    const e = new Ellipse({ width: 20, height: 10, fillColor: '#ff00aa', margin: 2 });
    expect(e.width).toBe(20);
    expect(e.fillColor).toEqual(Color.fromHex('#ff00aa'));
    expect(e.margin).toEqual(new Thickness(2));

    const c = new Circle({ diameter: 12, fillColor: 'rose-500' });
    expect(c.diameter).toBe(12);
    expect(c.fillColor).toBe(ColorPalette.rose[500]);
  });

  it('covers Line/Ellipse/Circle surfaces', () => {
    expect(settableSurface(new Line())).toEqual([...LINE_OPTION_KEYS].sort());
    expect(settableSurface(new Ellipse())).toEqual([...ELLIPSE_OPTION_KEYS].sort());
    expect(settableSurface(new Circle())).toEqual([...CIRCLE_OPTION_KEYS].sort());
  });
});

describe('2D code options', () => {
  it('Barcode configures in one expression', () => {
    const b = new Barcode({
      value: '5012345678900',
      symbology: BarcodeSymbology.Ean13,
      height: 50,
      foregroundColor: 'slate-900',
      backgroundColor: '#ffffff',
      includeTextLabel: false,
    });
    expect(b.value).toBe('5012345678900');
    expect(b.symbology).toBe(BarcodeSymbology.Ean13);
    expect(b.height).toBe(50);
    expect(b.foregroundColor).toBe(ColorPalette.slate[900]);
    expect(b.includeTextLabel).toBe(false);
  });

  it('QRCode accepts colour + errorCorrection tokens', () => {
    const q = new QRCode({
      data: 'https://bonniepdf.dev',
      size: 120,
      errorCorrection: 'high',
      foregroundColor: 'indigo-700',
      quietZone: 2,
    });
    expect(q.data).toBe('https://bonniepdf.dev');
    expect(q.size).toBe(120);
    expect(q.errorCorrection).toBe(QrEcc.High);
    expect(q.foregroundColor).toBe(ColorPalette.indigo[700]);
    expect(q.quietZone).toBe(2);
  });

  it('DataMatrix configures in one expression', () => {
    const d = new DataMatrix({ data: 'X', size: 80, rectangular: true, foregroundColor: 'gray-800' });
    expect(d.data).toBe('X');
    expect(d.size).toBe(80);
    expect(d.rectangular).toBe(true);
    expect(d.foregroundColor).toBe(ColorPalette.gray[800]);
  });

  it('covers their surfaces', () => {
    expect(settableSurface(new Barcode())).toEqual([...BARCODE_OPTION_KEYS].sort());
    expect(settableSurface(new QRCode())).toEqual([...QR_CODE_OPTION_KEYS].sort());
    expect(settableSurface(new DataMatrix(), INTERNAL.dataMatrix)).toEqual([...DATA_MATRIX_OPTION_KEYS].sort());
  });
});

describe('Image options', () => {
  it('configures source, sizing and fit token in one expression', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const img = new Image({
      imageData: bytes,
      width: 200,
      height: 100,
      fitMode: 'cover',
      altText: 'A photo',
      maintainAspectRatio: false,
    });
    expect(img.imageData).toBe(bytes);
    expect(img.width).toBe(200);
    expect(img.fitMode).toBe(ImageFitMode.Cover);
    expect(img.altText).toBe('A photo');
    expect(img.maintainAspectRatio).toBe(false);
    expect(new Image().fitMode).toBe(ImageFitMode.Contain);
  });

  it('covers its surface (cachedInfo/display* are internal)', () => {
    expect(settableSurface(new Image(), INTERNAL.image)).toEqual([...IMAGE_OPTION_KEYS].sort());
  });
});

describe('CanvasElement options (required handler)', () => {
  const handler = () => {};

  it('accepts the handler positionally or in the bag', () => {
    const a = new CanvasElement(handler);
    // 0 means "fill the available content width" - the shared default, matching
    // the .NET CanvasWidth. See the element catalogue's canvas sizing rules.
    expect(a.drawWidth).toBe(0);
    expect(a.drawHeight).toBe(100);

    const b = new CanvasElement(handler, { drawWidth: 300, altText: 'chart' });
    expect(b.drawWidth).toBe(300);
    expect(b.altText).toBe('chart');

    const c = new CanvasElement({ handler, drawHeight: 150, isDecorative: true });
    expect(c.drawHeight).toBe(150);
    expect(c.isDecorative).toBe(true);
  });

  it('does not leak a `handler` property onto the instance', () => {
    const c = new CanvasElement({ handler, drawWidth: 100 });
    expect(Object.keys(c)).not.toContain('handler');
    expect(settableSurface(c, INTERNAL.canvas)).toEqual([...CANVAS_ELEMENT_OPTION_KEYS].sort());
  });
});
