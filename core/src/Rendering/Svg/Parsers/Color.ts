// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { SinkColor } from '../Sink/Geometry';
import { NAMED_COLORS } from './NamedColors';

/**
 * What a `fill` or `stroke` can resolve to.
 *
 * `none` is distinct from a transparent colour: it means "do not paint at all",
 * which matters because a stroke of `none` skips stroking entirely rather than
 * stroking invisibly, and the difference is observable in output size and in
 * how `inherit` behaves.
 */
export type PaintRef =
  | { readonly kind: 'color'; readonly color: SinkColor }
  | { readonly kind: 'none' }
  | { readonly kind: 'currentColor' }
  /** `url(#id)`; out of slice 1's profile, carried so the feature detector can report it. */
  | { readonly kind: 'reference'; readonly id: string };

const rgb = (r: number, g: number, b: number, a = 1): SinkColor => ({
  r: clamp01(r / 255),
  g: clamp01(g / 255),
  b: clamp01(b / 255),
  a: clamp01(a),
});

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Parse a percentage-or-number channel, as `rgb()` permits either. */
function channel(text: string): number {
  const trimmed = text.trim();
  if (trimmed.endsWith('%')) return (Number.parseFloat(trimmed) / 100) * 255;
  return Number.parseFloat(trimmed);
}

function alphaChannel(text: string): number {
  const trimmed = text.trim();
  if (trimmed.endsWith('%')) return Number.parseFloat(trimmed) / 100;
  return Number.parseFloat(trimmed);
}

/**
 * Parse any SVG paint value. Returns undefined for anything unrecognised, so
 * the cascade can fall back rather than throwing on one bad attribute - a
 * malformed colour in one icon should not fail a whole document.
 */
export function parsePaint(input: string): PaintRef | undefined {
  const text = input.trim();
  if (text === '') return undefined;
  const lower = text.toLowerCase();

  if (lower === 'none') return { kind: 'none' };
  if (lower === 'transparent') return { kind: 'color', color: rgb(0, 0, 0, 0) };
  if (lower === 'currentcolor') return { kind: 'currentColor' };

  if (lower.startsWith('url(')) {
    const match = /^url\([ \t\n\r\f]*['"]?#([^'") \t\n\r\f]+)['"]?[ \t\n\r\f]*\)/i.exec(text);
    return match ? { kind: 'reference', id: match[1]! } : undefined;
  }

  if (text.startsWith('#')) {
    const hex = text.slice(1);
    // 3 and 4 digit forms double each digit: #abc is #aabbcc.
    if (/^[0-9a-f]{3,4}$/i.test(hex)) {
      const parts = [...hex].map((ch) => Number.parseInt(ch + ch, 16));
      return { kind: 'color', color: rgb(parts[0]!, parts[1]!, parts[2]!, (parts[3] ?? 255) / 255) };
    }
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      const value = Number.parseInt(hex, 16);
      return { kind: 'color', color: rgb((value >> 16) & 255, (value >> 8) & 255, value & 255) };
    }
    if (/^[0-9a-f]{8}$/i.test(hex)) {
      const value = Number.parseInt(hex, 16);
      return {
        kind: 'color',
        color: rgb((value >>> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, (value & 255) / 255),
      };
    }
    return undefined;
  }

  const functional = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(text);
  if (functional) {
    const name = functional[1]!.toLowerCase();
    // Both comma and space separated forms are legal, and the space form uses
    // a slash before alpha: rgb(1 2 3 / 0.5).
    const body = functional[2]!.replace('/', ' ');
    const parts = body.split(/[ \t\n\r\f,]+/).filter((part) => part !== '');
    if (parts.length < 3) return undefined;

    if (name.startsWith('rgb')) {
      const alpha = parts.length > 3 ? alphaChannel(parts[3]!) : 1;
      return { kind: 'color', color: rgb(channel(parts[0]!), channel(parts[1]!), channel(parts[2]!), alpha) };
    }

    const hue = Number.parseFloat(parts[0]!);
    const saturation = Number.parseFloat(parts[1]!) / 100;
    const lightness = Number.parseFloat(parts[2]!) / 100;
    const alpha = parts.length > 3 ? alphaChannel(parts[3]!) : 1;
    const [r, g, b] = hslToRgb(hue, saturation, lightness);
    return { kind: 'color', color: rgb(r, g, b, alpha) };
  }

  const named = NAMED_COLORS.get(lower);
  if (named !== undefined) {
    return { kind: 'color', color: rgb((named >> 16) & 255, (named >> 8) & 255, named & 255) };
  }

  return undefined;
}

/** CSS Color 3 HSL-to-RGB. Hue wraps; saturation and lightness clamp. */
function hslToRgb(hueDegrees: number, s: number, l: number): [number, number, number] {
  const h = (((hueDegrees % 360) + 360) % 360) / 360;
  const saturation = clamp01(s);
  const lightness = clamp01(l);

  if (saturation === 0) {
    const grey = lightness * 255;
    return [grey, grey, grey];
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  return [hueToChannel(p, q, h + 1 / 3) * 255, hueToChannel(p, q, h) * 255, hueToChannel(p, q, h - 1 / 3) * 255];
}

function hueToChannel(p: number, q: number, tIn: number): number {
  let t = tIn;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
