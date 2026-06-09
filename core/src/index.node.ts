import { configurePlatform } from './Platform/PlatformIO';
import { NodePlatformIO } from './Platform/NodePlatformIO';
import { FontManager } from './Typography/FontManager';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

configurePlatform(new NodePlatformIO());

// Auto-register bundled Liberation fonts so pdfAEnabled: true works
// without the caller having to supply font files.
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const bundledFontsDir = path.join(_dirname, '../assets/fonts');

const BUNDLED_FONTS: Array<[string, string, string]> = [
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

for (const [file, family, weight] of BUNDLED_FONTS) {
  const fullPath = path.join(bundledFontsDir, `${file}.ttf`);
  if (fs.existsSync(fullPath)) {
    try {
      // Read bytes eagerly - registerFontFilePath stores a path for lazy loading,
      // but lazy loading via require('fs') fails in Node.js ESM (dynamic require shim
      // throws in strict ESM). Reading here via the static fs import is reliable.
      const bytes = Uint8Array.from(fs.readFileSync(fullPath));
      FontManager.registerFont(bytes, { family, subfamily: weight });
    } catch {
      // File unreadable - skip silently.
    }
  }
}

export * from './index';
