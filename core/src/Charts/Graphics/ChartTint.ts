// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color } from '../ChartHost';

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
