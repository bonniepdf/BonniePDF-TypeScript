// Shared Node runtime setup for the scripts that render the example catalogue
// (generate-tagged-pdfs.ts, generate-showcase-assets.ts).
//
// The examples are written for the browser: they reference fonts by asset URL
// and expect a platform layer for file and deflate access. Both scripts need
// exactly the same wiring, so it lives here rather than being duplicated - a
// second, drifting copy of the font-fallback chain is how a script quietly
// starts emitting .notdef glyphs.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { configurePlatform, NodePlatformIO, FontManager } from '@bonniepdf/core';
import type { ExampleDef } from '../examples/src/index.ts';

// Map the browser-style asset URLs the examples use to on-disk font files:
//   /fonts/liberation/<f>  -> core/assets/fonts/<f>   (the bundled Liberation set)
//   /fonts/<f>             -> examples/assets/fonts/<f> (the bundled Noto set)
const exampleFontsDir = resolve(import.meta.dirname, '..', 'examples', 'assets', 'fonts');
const coreFontsDir = resolve(import.meta.dirname, '..', 'core', 'assets', 'fonts');
function mapFontUrl(path: string): string {
  if (path.startsWith('/fonts/liberation/')) return resolve(coreFontsDir, path.slice('/fonts/liberation/'.length));
  if (path.startsWith('/fonts/')) return resolve(exampleFontsDir, path.slice('/fonts/'.length));
  return path;
}

// The bundled Noto fonts, registered as a glyph-fallback chain. The engine routes
// any code point the document's primary font lacks (e.g. a ★ list bullet, a
// symbol, an emoji) to the first registered font that covers it, embedding it
// on demand, rather than emitting a forbidden .notdef glyph. These fonts ship
// only with the private @bonniepdf/examples package - never with @bonniepdf/core.
const FALLBACK_FONTS: ReadonlyArray<readonly [file: string, family: string]> = [
  ['NotoSans-Regular', 'noto sans'],
  ['NotoSansSymbols2-Regular', 'noto sans symbols 2'],
  ['NotoSansMath-Regular', 'noto sans math'],
  ['NotoEmoji-Regular', 'noto emoji'],
];

/**
 * Points the engine at the Node filesystem and registers the glyph-fallback
 * chain. Call once, before generating any document.
 */
export function configureExampleRuntime(): void {
  const base = new NodePlatformIO();
  configurePlatform({
    readFile: (path: string) => base.readFile(mapFontUrl(path)),
    writeFile: (path: string, data: Uint8Array) => base.writeFile(path, data),
    readFileSync: (path: string) => base.readFileSync(mapFontUrl(path)),
    writeFileSync: (path: string, data: Uint8Array) => base.writeFileSync(path, data),
    fileExistsSync: (path: string) => base.fileExistsSync(mapFontUrl(path)),
    deflate: (data: Uint8Array) => base.deflate(data),
  });

  for (const [file, family] of FALLBACK_FONTS) {
    try {
      const bytes = new Uint8Array(readFileSync(resolve(exampleFontsDir, `${file}.ttf`)));
      FontManager.registerFont(bytes, { family, subfamily: 'regular' });
    } catch {
      // font not present in this checkout - skip
    }
  }
}

const exampleAssetsDir = resolve(import.meta.dirname, '..', 'examples', 'assets');

/** Pre-loads the files an example declares in `requiredAssets`. */
export function loadAssets(def: ExampleDef): ReadonlyMap<string, Uint8Array> {
  const map = new Map<string, Uint8Array>();
  for (const path of def.requiredAssets ?? []) {
    const fullPath = resolve(exampleAssetsDir, path);
    if (existsSync(fullPath)) map.set(path, new Uint8Array(readFileSync(fullPath)));
  }
  return map;
}
