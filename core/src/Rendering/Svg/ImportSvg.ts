// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { buildIr, type BuildOptions } from './Ir/Build';
import { emit } from './Emit';
import type { IrDocument, IrNode } from './Ir/Types';
import type { VectorSink } from './Sink/VectorSink';
import { viewBoxTransform } from './Parsers/ViewBox';

/**
 * Renders a self-contained SVG document to PNG bytes, at the pixel size its
 * `width` and `height` attributes give.
 *
 * Supplied by the caller: this package never rasterizes anything itself, which is
 * what keeps it free of dependencies. Any renderer will do - a headless browser,
 * resvg, a server. It is called once per distinct snippet, in document order.
 */
export type SvgRasterizer = (svg: string) => Promise<Uint8Array>;

/** Raster pixels per unit of the target box when `rasterScale` is not given. */
export const DEFAULT_RASTER_SCALE = 2;

export interface ImportOptions extends Omit<BuildOptions, 'raster'> {
  /**
   * Throw when the document uses a feature outside the supported profile.
   *
   * Defaults to true, matching the `Svg` element's `strictUnsupportedFeatures`.
   * A caller that would rather render what it can passes false and reads
   * `unsupported` off the returned document.
   */
  readonly strict?: boolean;
  /**
   * Draws what the profile cannot as images, when `strict` is false. Without
   * one, those parts are skipped. Only `importSvgAsync` can call it.
   */
  readonly rasterizer?: SvgRasterizer;
  /** Raster pixels per unit of the target box; defaults to `DEFAULT_RASTER_SCALE`. */
  readonly rasterScale?: number;
}

export class SvgUnsupportedFeatureError extends Error {
  readonly features: readonly { feature: string; detail: string }[];

  constructor(features: readonly { feature: string; detail: string }[]) {
    const names = [...new Set(features.map((entry) => entry.feature))].join(', ');
    super(
      `SVG uses features outside the supported profile: ${names}. ` +
        `Turn off strict unsupported-feature checking to draw the rest without them, or register an SVG rasterizer to draw them as images. ` +
        features.map((entry) => `${entry.feature}: ${entry.detail}`).join('; ')
    );
    this.name = 'SvgUnsupportedFeatureError';
    this.features = features;
  }
}

/**
 * Parse SVG and draw it into a sink.
 *
 * Synchronous, so it cannot call a rasterizer: passing one is an error rather
 * than a silent skip. Use `importSvgAsync`.
 */
export function importSvg(source: string, sink: VectorSink, options: ImportOptions = {}): IrDocument {
  if (options.rasterizer !== undefined) {
    throw new Error('importSvg is synchronous and cannot call a rasterizer; use importSvgAsync');
  }
  const document = parseSvg(source, options);
  emit(document, sink);
  return document;
}

/**
 * Parse SVG and draw it into a sink, rasterizing what the profile cannot draw
 * when a rasterizer is supplied and `strict` is false.
 */
export async function importSvgAsync(source: string, sink: VectorSink, options: ImportOptions = {}): Promise<IrDocument> {
  const document = parseSvg(source, options);
  const images = new Map<string, Uint8Array>();
  if (options.rasterizer !== undefined) {
    // Sequentially and in document order, so a caller's rasterizer sees a
    // deterministic sequence; identical snippets are rendered once.
    for (const svg of rasterSnippets(document.children)) {
      if (!images.has(svg)) images.set(svg, await options.rasterizer(svg));
    }
  }
  emit(document, sink, images);
  return document;
}

/**
 * The same document fitted onto a different box.
 *
 * Only the root transform depends on the box, so this equals parsing again for
 * the new size, without parsing again - and keeps any rasterized images valid,
 * since their regions are in user space. The `Svg` element uses it to
 * rasterize before layout, when the final size is not yet known.
 */
export function fitDocument(document: IrDocument, width: number, height: number): IrDocument {
  return {
    ...document,
    rootTransform: viewBoxTransform(document.fit.userBox, { width, height }, document.fit.preserve),
    width,
    height,
  };
}

/** Parse SVG to the IR without drawing it - useful for inspection and tests. */
export function parseSvg(source: string, options: ImportOptions = {}): IrDocument {
  const rasterize = options.strict === false && options.rasterizer !== undefined;
  const document = buildIr(source, {
    ...options,
    ...(rasterize ? { raster: { scale: options.rasterScale ?? DEFAULT_RASTER_SCALE } } : {}),
  });
  if (options.strict !== false && document.unsupported.length > 0) {
    throw new SvgUnsupportedFeatureError(document.unsupported);
  }
  return document;
}

/** Every raster snippet in the IR, in drawing order. */
export function rasterSnippets(nodes: readonly IrNode[]): string[] {
  const found: string[] = [];
  const walk = (list: readonly IrNode[]): void => {
    for (const node of list) {
      if (node.kind === 'raster') found.push(node.svg);
      else if (node.kind !== 'path') walk(node.children);
    }
  };
  walk(nodes);
  return found;
}
