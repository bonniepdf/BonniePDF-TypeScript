import { fileURLToPath } from 'node:url';
import { FontManager } from '../../src/Typography/FontManager';

/** The Liberation faces the Node entry point registers for an application. */
export const BUNDLED_FONTS_DIR = fileURLToPath(new URL('../../assets/fonts', import.meta.url));

/** Registers the bundled fonts, as `index.node.ts` does, so tagged and PDF/A output embeds them. */
export function registerBundledFonts(): void {
  FontManager.autoRegisterBundledFonts(BUNDLED_FONTS_DIR);
}

/** Runs `body` with no fonts registered, then restores the bundled ones. For tests of the no-font path. */
export function withoutRegisteredFonts<T>(body: () => T): T {
  FontManager.clear();
  try {
    return body();
  } finally {
    registerBundledFonts();
  }
}
