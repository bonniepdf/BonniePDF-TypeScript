import { examples, type ExampleDef } from './index';

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
  const defs: ExampleDef[] = options.ids ? examples.filter(e => options.ids!.includes(e.id)) : examples;

  const files: SvgAssetFile[] = [];
  const manifestExamples: SvgManifestExample[] = [];
  const failures: { id: string; error: string }[] = [];

  for (const def of defs) {
    try {
      const doc = def.generate();
      const svgs = await doc.generateSvgPagesAsync({
        maxPages,
        precision,
        includeAccessibilityMetadata: true,
        title: def.name,
      });

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
