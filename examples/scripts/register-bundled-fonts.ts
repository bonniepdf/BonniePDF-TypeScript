// Node-only helper: registers the bundled Liberation fonts with FontManager so
// that example documents using the standard-14 families (mapped to Liberation)
// embed and measure correctly when generating outside the browser.
//
// NOTE: we deliberately do NOT call FontManager.autoRegisterBundledFonts(), as
// its internal `require('fs')` is broken in the ESM bundle (a known tsup
// limitation). We read the bytes ourselves and register them the same way the
// browser does.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FontManager } from '@bonniepdf/core';

const BUNDLED: ReadonlyArray<readonly [file: string, family: string, subfamily: string]> = [
  ['LiberationSans-Regular', 'liberation sans', 'regular'],
  ['LiberationSans-Bold', 'liberation sans', 'bold'],
  ['LiberationSans-Italic', 'liberation sans', 'italic'],
  ['LiberationSans-BoldItalic', 'liberation sans', 'bolditalic'],
  ['LiberationSerif-Regular', 'liberation serif', 'regular'],
  ['LiberationSerif-Bold', 'liberation serif', 'bold'],
  ['LiberationSerif-Italic', 'liberation serif', 'italic'],
  ['LiberationSerif-BoldItalic', 'liberation serif', 'bolditalic'],
  ['LiberationMono-Regular', 'liberation mono', 'regular'],
  ['LiberationMono-Bold', 'liberation mono', 'bold'],
  ['LiberationMono-Italic', 'liberation mono', 'italic'],
  ['LiberationMono-BoldItalic', 'liberation mono', 'bolditalic'],
];

/**
 * Registers the 12 bundled Liberation TTFs found in `@bonniepdf/core`'s
 * `assets/fonts` directory. Missing files are skipped silently.
 */
export function registerBundledFonts(fontsDir?: string): void {
  // core/assets/fonts relative to this file (examples/scripts -> ../../core/...)
  const dir = fontsDir ?? resolve(import.meta.dirname, '..', '..', 'core', 'assets', 'fonts');
  for (const [file, family, subfamily] of BUNDLED) {
    try {
      const bytes = new Uint8Array(readFileSync(resolve(dir, `${file}.ttf`)));
      FontManager.registerFont(bytes, {
        family,
        subfamily,
        identifier: `/fonts/liberation/${file}.ttf`,
      });
    } catch {
      // font not present in this checkout - skip
    }
  }
}
