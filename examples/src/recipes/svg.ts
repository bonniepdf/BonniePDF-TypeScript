import { embeddedFontFamily } from '@bonniepdf/core';
import { examples, type ExampleDef } from '../index';

/**
 * Resolves the pre-loaded asset bytes an example needs before `generate()` runs
 * (keyed by the paths in {@link ExampleDef.requiredAssets}). Supplied by the
 * caller so this module stays filesystem-free: the Node build reads the bytes
 * off disk, the browser fetches them. When omitted, examples render with their
 * built-in placeholders. May be async.
 */
export type ExampleAssetLoader = (
  def: ExampleDef
) => ReadonlyMap<string, Uint8Array> | Promise<ReadonlyMap<string, Uint8Array>>;

/**
 * One generated SVG file: a path relative to the output root and its contents.
 */
export interface SvgAssetFile {
  /** Path relative to the output root, e.g. `business-invoice/page-1.svg`. */
  path: string;
  /** SVG markup. */
  content: string;
}

/** One page entry in the manifest. */
export interface SvgManifestPage {
  /** One-based page number. */
  page: number;
  /** Page width in PDF points. */
  width: number;
  /** Page height in PDF points. */
  height: number;
  /** Path (relative to the output root) of the SVG for this page. */
  file: string;
}

/** One example entry in the manifest. */
export interface SvgManifestExample {
  id: string;
  name: string;
  category: string;
  pages: SvgManifestPage[];
}

/** Top-level manifest describing every generated preview. */
export interface SvgManifest {
  /** Which engine produced the assets. */
  generator: 'typescript';
  /** Max pages exported per example. */
  maxPages: number;
  /** ISO-8601 generation timestamp (omitted when `deterministic` is set). */
  generatedAt?: string;
  examples: SvgManifestExample[];
}

/** Result of {@link buildExampleSvgAssets}. */
export interface BuildSvgAssetsResult {
  manifest: SvgManifest;
  /** All generated files, including `manifest.json`. */
  files: SvgAssetFile[];
  /** Ids that failed to render, with the error message. Empty on success. */
  failures: { id: string; error: string }[];
}

/** Options for {@link buildExampleSvgAssets}. */
export interface BuildSvgAssetsOptions {
  /** Pages to export per example. Defaults to 2. */
  maxPages?: number;
  /** Coordinate decimal places. Defaults to 2 (compact previews). */
  precision?: number;
  /** Restrict to these example ids. Defaults to every example in the registry. */
  ids?: string[];
  /**
   * When true, omit the `generatedAt` timestamp from the manifest so the output
   * is byte-stable across runs (useful for CI diffing / committed artifacts).
   */
  deterministic?: boolean;
  /**
   * Supplies the pre-loaded assets (images, embedded data) each example needs.
   * Without it, examples that require external assets render their built-in
   * placeholder instead of the real artwork - so the gallery previews would
   * diverge from the live viewer. See {@link ExampleAssetLoader}.
   */
  loadAssets?: ExampleAssetLoader;
}

const VIEWBOX_RE = /viewBox="0 0 ([\d.]+) ([\d.]+)"/;

/**
 * Renders the first `maxPages` pages of every example in the registry to
 * standalone SVG strings and returns them alongside a manifest. Pure and
 * browser-safe: it performs no filesystem I/O, so it can run inside a Vite/Astro
 * build or a Node CLI alike.
 *
 * Fonts must already be registered (via `FontManager.registerFont(...)`) before
 * calling this, exactly as the PDF generation path requires - see the runner
 * scripts for the Node and browser registration patterns.
 *
 * Per-example failures are captured in {@link BuildSvgAssetsResult.failures}
 * rather than aborting the whole run, so one bad example never blocks a build.
 */
export async function buildExampleSvgAssets(options: BuildSvgAssetsOptions = {}): Promise<BuildSvgAssetsResult> {
  const maxPages = options.maxPages ?? 2;
  const precision = options.precision ?? 2;
  // Preview SVGs are a website/marketing asset, so default to the gallery subset.
  // An explicit `ids` list still resolves against the full set (e.g. to render a
  // conformance-corpus example on demand).
  const defs: ExampleDef[] = options.ids
    ? examples.filter(e => options.ids!.includes(e.id))
    : examples.filter(e => e.gallery !== false);

  const files: SvgAssetFile[] = [];
  const manifestExamples: SvgManifestExample[] = [];
  const failures: { id: string; error: string }[] = [];

  for (const def of defs) {
    try {
      const assets = options.loadAssets ? await options.loadAssets(def) : new Map<string, Uint8Array>();
      const doc = def.generate(assets);
      const { pages: renderedPages, fontFaceCss } = await doc.generateSvgDocumentAsync({
        maxPages,
        precision,
        includeAccessibilityMetadata: true,
        title: def.name,
      });
      // Gallery previews are loaded through <img>, so document-level CSS from
      // the live preview cannot reach inside them. Inline embedded subsets and
      // declare any browser-loadable TTF URLs to keep each asset standalone.
      const svgs = renderedPages.map(svg => makeStandalonePreviewSvg(svg, fontFaceCss));

      const pages: SvgManifestPage[] = svgs.map((svg, i) => {
        const file = `${def.id}/page-${i + 1}.svg`;
        files.push({ path: file, content: svg });
        const m = VIEWBOX_RE.exec(svg);
        return {
          page: i + 1,
          width: m ? Number(m[1]) : 0,
          height: m ? Number(m[2]) : 0,
          file,
        };
      });

      manifestExamples.push({ id: def.id, name: def.name, category: def.category, pages });
    } catch (err) {
      failures.push({ id: def.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const manifest: SvgManifest = {
    generator: 'typescript',
    maxPages,
    ...(options.deterministic ? {} : { generatedAt: new Date().toISOString() }),
    examples: manifestExamples,
  };

  files.push({ path: 'manifest.json', content: JSON.stringify(manifest, null, 2) });

  return { manifest, files, failures };
}

/** Makes a generated page self-contained for use through `<img src="...">`.
 * Embedded subsets are inlined. URL-based TTF identifiers that could not be
 * fetched by the Node build are bound to a real CSS family and left for the
 * browser to load from the public site. */
function makeStandalonePreviewSvg(svg: string, documentFontCss: string): string {
  let css = documentFontCss;
  const urlFonts = new Set<string>();

  const page = svg.replace(/font-family="([^"]+\.ttf)"/gi, (_match, fontUrl: string) => {
    urlFonts.add(fontUrl);
    return `font-family="${embeddedFontFamily(fontUrl)}"`;
  });

  for (const fontUrl of urlFonts) {
    const family = embeddedFontFamily(fontUrl);
    const safeUrl = fontUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    css += `@font-face{font-family:'${family}';font-display:block;src:url("${safeUrl}") format("truetype");}`;
  }

  if (!css) return page;
  const style = `<style>${css}</style>`;
  const titleEnd = page.indexOf('</title>');
  if (titleEnd >= 0) return page.slice(0, titleEnd + 8) + style + page.slice(titleEnd + 8);
  const rootEnd = page.indexOf('>');
  return page.slice(0, rootEnd + 1) + style + page.slice(rootEnd + 1);
}
