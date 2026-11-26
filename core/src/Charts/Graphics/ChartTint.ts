// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color } from '../ChartHost';

/**
 * A darker shade for mark outlines: each sRGB channel reduced by 30%, in integers from the colour's hex form.
 */
export function darkenColor(color: Color): Color {
  const hex = color.toHexString();
  const channel = (offset: number): number => {
    const c = parseInt(hex.slice(offset, offset + 2), 16);
    return c - Math.floor((c * 30 + 50) / 100);
  };
  return new Color(channel(1), channel(3), channel(5));
}

/**
 * The colour a pie slice gradient starts from: each sRGB channel moved 45% of the way to white,
 * in integers from the colour's hex form so every implementation produces the same bytes.
 */
export function tintColor(color: Color): Color {
  if (color.scA !== 1) throw new RangeError('Pie slice gradients require opaque colours.');
  const hex = color.toHexString();
  const channel = (offset: number): number => {
    const c = parseInt(hex.slice(offset, offset + 2), 16);
    return c + Math.floor(((255 - c) * 45 + 50) / 100);
  };
  return new Color(channel(1), channel(3), channel(5));
}

/**
 * Mixes `color` towards `background`, keeping the fraction `keep` of the colour: `1` returns `color`, `0` the background.
 * Used to dim marks that a highlight does not select; a colour mix, not transparency, so it is valid under PDF/A-1.
 */
export function dimColor(color: Color, background: Color, keep: number): Color {
  const fg = color.toHexString();
  const bg = background.toHexString();
  const channel = (offset: number): number => {
    const c = parseInt(fg.slice(offset, offset + 2), 16);
    const b = parseInt(bg.slice(offset, offset + 2), 16);
    return Math.round(c * keep + b * (1 - keep));
  };
  return new Color(channel(1), channel(3), channel(5));
}

/** The top face of a 3D bar: each channel 20 % of the way to white, in integers. */
export function tintFace(color: Color): Color {
  const hex = color.toHexString();
  const channel = (offset: number): number => {
    const c = parseInt(hex.slice(offset, offset + 2), 16);
    return c + Math.floor(((255 - c) * 20 + 50) / 100);
  };
  return new Color(channel(1), channel(3), channel(5));
}

/** The side face of a 3D bar: each channel reduced by 20 %, in integers. */
export function shadeFace(color: Color): Color {
  const hex = color.toHexString();
  const channel = (offset: number): number => {
    const c = parseInt(hex.slice(offset, offset + 2), 16);
    return c - Math.floor((c * 20 + 50) / 100);
  };
  return new Color(channel(1), channel(3), channel(5));
}
