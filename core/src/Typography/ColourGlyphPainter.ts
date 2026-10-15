import type { ICanvas } from '../Drawing/ICanvas';
import { Color } from '../Core/Color';
import { ImageLoader } from '../Rendering/Images/ImageLoader';
import { ImageInfo } from '../Rendering/Images/ImageInfo';
import type { TtfFont } from './TrueType/TtfFont';
import type { GlyphRun } from './Engine/Api/GlyphRun';
import type { Glyph } from './Engine/Fonts/Outlines/Glyph';
import type { FontPoint } from './Engine/Fonts/Outlines/FontPoint';
import type { PaletteColour } from './Engine/Fonts/Colour/PaletteColour';
import type { BitmapGlyphData } from './Engine/Fonts/Colour/BitmapGlyphData';

interface Layer {
  outline: Glyph;
  colour?: PaletteColour;
  foreground: boolean;
}
interface Artwork {
  layers: Layer[];
  bitmap: BitmapGlyphData | null;
  image?: ImageInfo;
  bytes: number;
}
const caches = new WeakMap<TtfFont, { entries: Map<string, Artwork>; bytes: number }>();

function read(font: TtfFont, glyph: number, ppem: number, textPresentation: boolean): Artwork {
  let cache = caches.get(font);
  if (!cache) {
    cache = { entries: new Map(), bytes: 0 };
    caches.set(font, cache);
  }
  const key = `${glyph}:${ppem}:${textPresentation}`;
  const hit = cache.entries.get(key);
  if (hit) return hit;
  const face = font.engineFace;
  const layers: Layer[] = [];
  let bytes = 0;
  const add = (id: number, foreground: boolean, colour?: PaletteColour) => {
    const outline = face.readGlyph(id);
    for (const contour of outline.contours) bytes += contour.length * 24 + 32;
    layers.push({ outline, colour, foreground });
  };
  if (!textPresentation) for (const layer of face.layers(glyph)) add(layer.glyph, layer.foreground, layer.colour);
  const bitmap = layers.length === 0 && !textPresentation ? face.bitmapGlyph(glyph, ppem) : null;
  let image: ImageInfo | undefined;
  if (bitmap) {
    image = new ImageInfo();
    image.originalData = bitmap.getPngBytes();
    image.width = bitmap.width;
    image.height = bitmap.height;
    image.keepResolution = true;
    const target = image;
    let pending: Promise<void> | undefined;
    image.prepareDeferred = () =>
      (pending ??= ImageLoader.loadFromBytesAsync(target.originalData).then(decoded => {
        if (decoded.width !== bitmap.width || decoded.height !== bitmap.height)
          throw new Error('Emoji bitmap dimensions disagree with its font metrics.');
        Object.assign(target, decoded);
        target.keepResolution = true;
        target.prepareDeferred = undefined;
      }));
    bytes += image.width * image.height * 4 + image.originalData.length;
  } else if (layers.length === 0 && font.hasOutlines) add(glyph, true);
  const result: Artwork = { layers, bitmap, image, bytes };
  if (bytes <= 16 * 1024 * 1024) {
    while (cache.entries.size >= 128 || cache.bytes + bytes > 16 * 1024 * 1024) {
      const old = cache.entries.keys().next().value!;
      cache.bytes -= cache.entries.get(old)!.bytes;
      cache.entries.delete(old);
    }
    cache.entries.set(key, result);
    cache.bytes += bytes;
  }
  return result;
}

/** @internal Paints the same selected-font artwork through PDF, SVG or raster canvases. */
export function drawColourGlyph(
  canvas: ICanvas,
  font: TtfFont,
  glyphs: GlyphRun,
  glyph: number,
  source: string,
  x: number,
  baseline: number,
  size: number,
  foreground: Color
): void {
  if (!source.trim()) return;
  const art = read(
    font,
    glyphs.id(glyph),
    Math.max(1, Math.min(65535, Math.floor((size * 96) / 72 + 0.5))),
    source.includes('\ufe0e')
  );
  const scale = size / font.unitsPerEm;
  x += glyphs.offsetX(glyph) * scale;
  baseline -= glyphs.offsetY(glyph) * scale;
  if (art.image && art.bitmap) {
    const b = art.bitmap,
      sx = size / b.ppemX,
      sy = size / b.ppemY;
    canvas.drawImage(art.image, x + b.bearingX * sx, baseline - b.bearingY * sy, b.width * sx, b.height * sy);
    return;
  }
  if (art.layers.length === 0)
    throw new Error('This emoji has no monochrome outline or supported colour artwork in the selected font.');
  for (const layer of art.layers) {
    canvas.beginPath();
    for (const contour of layer.outline.contours) {
      if (contour.length < 2) continue;
      const points: FontPoint[] = [];
      for (let i = 0; i < contour.length; i++) {
        const a = contour[i],
          b = contour[(i + 1) % contour.length];
        points.push(a);
        if (!a.onCurve && !b.onCurve) points.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, onCurve: true });
      }
      const start = points.findIndex(p => p.onCurve);
      if (start < 0) continue;
      const at = (i: number) => points[(start + i) % points.length];
      const X = (p: FontPoint) => x + p.x * scale,
        Y = (p: FontPoint) => baseline - p.y * scale;
      canvas.moveTo(X(at(0)), Y(at(0)));
      for (let i = 1; i < points.length; i++) {
        const p = at(i);
        if (p.onCurve) canvas.lineTo(X(p), Y(p));
        else {
          const end = at(++i);
          canvas.quadraticBezierTo(X(p), Y(p), X(end), Y(end));
        }
      }
      canvas.closePath();
    }
    const c = layer.colour;
    canvas.fillCurrentPath(
      layer.foreground || !c ? foreground : new Color(c.r, c.g, c.b, c.a).withAlpha((c.a / 255) * foreground.scA)
    );
  }
}
