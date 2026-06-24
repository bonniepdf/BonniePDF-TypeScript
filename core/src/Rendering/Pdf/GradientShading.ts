// Native PDF gradient shadings — axial (`/ShadingType 2`, linear) and radial
// (`/ShadingType 3`).
//
// A gradient is emitted as a real shading dictionary whose colour is driven by a
// PDF function built from the gradient stops. This is the analytic, single-layer
// equivalent of SVG's `<linearGradient>` / `<radialGradient>` — the viewer
// evaluates one exact blend per pixel, so it matches the SVG preview instead of
// the dimmer, viewer-dependent result you get from approximating the gradient
// with many stacked translucent strips or discs (whose tiny per-layer alphas
// round toward zero when a viewer composites them in 8-bit).
//
// Transparency (stops with alpha < 1) is handled by a parallel **grayscale**
// shading used as a luminosity soft mask (see PdfResourceRegistry): the colour
// shading carries the RGB, the alpha shading carries the opacity as a gray
// level (white = opaque, black = transparent).

/** One gradient stop, pre-resolved to straight RGBA components in [0, 1]. */
export interface ShadingStop {
  offset: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ShadingRequest {
  /** `2` = axial (linear), `3` = radial. */
  shadingType: 2 | 3;
  /** `[x0 y0 x1 y1]` (axial) or `[x0 y0 r0 x1 y1 r1]` (radial), in shading space. */
  coords: number[];
  /** Stops sorted by offset and padded so the first is at 0 and the last at 1. */
  stops: ShadingStop[];
  /** PDF `/Extend` — pad the start/end colour beyond the axis/radii (SVG "pad"). */
  extend: [boolean, boolean];
  /** Bounding box of the painted region in shading space, for the mask form. */
  bbox: [number, number, number, number];
  /** True when any stop is translucent, i.e. a soft mask is required. */
  hasAlpha: boolean;
}

/** Formats a number compactly for PDF output (no exponent, trimmed zeros). */
function num(v: number): string {
  if (!Number.isFinite(v)) return '0';
  const s = v.toFixed(5);
  return s.replace(/\.?0+$/, '') || '0';
}

function arr(values: number[]): string {
  return `[${values.map(num).join(' ')}]`;
}

/**
 * Builds an inline PDF function dict mapping the parametric domain [0, 1] to the
 * stop components returned by `components`. Uses a single Type-2 (exponential)
 * function for two stops, or a Type-3 stitching function across the segments.
 */
function buildStopFunction(stops: ShadingStop[], components: (s: ShadingStop) => number[]): string {
  const type2 = (a: ShadingStop, b: ShadingStop): string =>
    `<< /FunctionType 2 /Domain [0 1] /C0 ${arr(components(a))} /C1 ${arr(components(b))} /N 1 >>`;

  if (stops.length === 2) return type2(stops[0], stops[1]);

  const functions: string[] = [];
  const bounds: number[] = [];
  const encode: number[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    functions.push(type2(stops[i], stops[i + 1]));
    encode.push(0, 1);
    if (i > 0) bounds.push(stops[i].offset);
  }
  return (
    `<< /FunctionType 3 /Domain [0 1] /Functions [${functions.join(' ')}] ` +
    `/Bounds ${arr(bounds)} /Encode ${arr(encode)} >>`
  );
}

/** Inline shading dictionary carrying the gradient's RGB colour. */
export function buildColorShadingDict(req: ShadingRequest): string {
  const fn = buildStopFunction(req.stops, s => [s.r, s.g, s.b]);
  return (
    `<< /ShadingType ${req.shadingType} /ColorSpace /DeviceRGB /Coords ${arr(req.coords)} ` +
    `/Domain [0 1] /Extend [${req.extend[0]} ${req.extend[1]}] /Function ${fn} >>`
  );
}

/**
 * Inline shading dictionary whose single grayscale channel encodes the
 * gradient's alpha (white = opaque). Painted inside the luminosity soft-mask
 * group so the colour shading is revealed in proportion to each stop's opacity.
 */
export function buildAlphaShadingDict(req: ShadingRequest): string {
  const fn = buildStopFunction(req.stops, s => [s.a]);
  return (
    `<< /ShadingType ${req.shadingType} /ColorSpace /DeviceGray /Coords ${arr(req.coords)} ` +
    `/Domain [0 1] /Extend [${req.extend[0]} ${req.extend[1]}] /Function ${fn} >>`
  );
}
