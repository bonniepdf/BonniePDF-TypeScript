// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { IDENTITY, multiply, scaling, translation, type Matrix } from '../Geometry/Matrix';

export interface ViewBox {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

export type Align =
  | 'none'
  | 'xMinYMin' | 'xMidYMin' | 'xMaxYMin'
  | 'xMinYMid' | 'xMidYMid' | 'xMaxYMid'
  | 'xMinYMax' | 'xMidYMax' | 'xMaxYMax';

export interface PreserveAspectRatio {
  readonly align: Align;
  readonly scaling: 'meet' | 'slice';
}

export const DEFAULT_PRESERVE_ASPECT_RATIO: PreserveAspectRatio = { align: 'xMidYMid', scaling: 'meet' };

const DECIMAL = /^[+-]?(?:[0-9]*\.[0-9]+|[0-9]+\.?)(?:[eE][+-]?[0-9]+)?$/;

export function parseViewBox(input: string): ViewBox | undefined {
  const parts = input.trim().split(/[ \t\n\r\f,]+/).filter((part) => part !== '');
  if (parts.length !== 4) return undefined;
  // Decimal numbers only: Number() also accepts 0x10, 0b1 and 0o7, which the
  // .NET parser rejects, and the two must agree on every input.
  if (!parts.every((part) => DECIMAL.test(part))) return undefined;
  const [minX, minY, width, height] = parts.map(Number) as [number, number, number, number];
  if (![minX, minY, width, height].every(Number.isFinite)) return undefined;
  // A zero or negative extent disables rendering per the spec; treat it as
  // absent and let the caller fall back to the viewport.
  if (width <= 0 || height <= 0) return undefined;
  return { minX, minY, width, height };
}

export function parsePreserveAspectRatio(input: string): PreserveAspectRatio {
  const parts = input.trim().split(/[ \t\n\r\f]+/).filter((part) => part !== '');
  // The optional `defer` prefix only applies to <image>, and is ignored here.
  const tokens = parts[0] === 'defer' ? parts.slice(1) : parts;
  const align = (tokens[0] ?? 'xMidYMid') as Align;
  const scale = tokens[1] === 'slice' ? 'slice' : 'meet';
  const valid: Align[] = ['none','xMinYMin','xMidYMin','xMaxYMin','xMinYMid','xMidYMid','xMaxYMid','xMinYMax','xMidYMax','xMaxYMax'];
  return { align: valid.includes(align) ? align : 'xMidYMid', scaling: scale };
}

/**
 * The matrix mapping viewBox user space onto a target rectangle.
 *
 * `meet` fits the whole viewBox inside the target, letterboxing; `slice` fills
 * the target, cropping. `none` stretches. The alignment keyword then places the
 * result within whichever axis has slack. This is the spec's algorithm
 * (SVG 1.1 §7.8) written out directly rather than special-cased per keyword.
 */
export function viewBoxTransform(
  viewBox: ViewBox | undefined,
  target: { readonly width: number; readonly height: number },
  preserve: PreserveAspectRatio = DEFAULT_PRESERVE_ASPECT_RATIO
): Matrix {
  if (!viewBox) return IDENTITY;

  let scaleX = target.width / viewBox.width;
  let scaleY = target.height / viewBox.height;

  if (preserve.align !== 'none') {
    const uniform = preserve.scaling === 'slice' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
    scaleX = uniform;
    scaleY = uniform;
  }

  const slackX = target.width - viewBox.width * scaleX;
  const slackY = target.height - viewBox.height * scaleY;

  let translateX = 0;
  let translateY = 0;
  if (preserve.align !== 'none') {
    if (preserve.align.includes('xMid')) translateX = slackX / 2;
    else if (preserve.align.includes('xMax')) translateX = slackX;
    if (preserve.align.includes('YMid')) translateY = slackY / 2;
    else if (preserve.align.includes('YMax')) translateY = slackY;
  }

  // Translate the viewBox origin to zero first, then scale, then place.
  return multiply(
    multiply(translation(translateX, translateY), scaling(scaleX, scaleY)),
    translation(-viewBox.minX, -viewBox.minY)
  );
}
