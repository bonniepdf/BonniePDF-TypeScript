import { configurePlatform } from './Platform/PlatformIO';
import { NodePlatformIO } from './Platform/NodePlatformIO';
import { FontManager } from './Typography/FontManager';
import * as path from 'path';
import { fileURLToPath } from 'url';

configurePlatform(new NodePlatformIO());
export { NodePlatformIO } from './Platform/NodePlatformIO';

// Auto-register bundled Liberation fonts so pdfAEnabled: true works without
// the caller having to supply font files. Reads go through the platform IO
// configured above (static fs import in NodePlatformIO), so this works under
// both CJS and strict ESM.
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
FontManager.autoRegisterBundledFonts(path.join(_dirname, '../assets/fonts'));

export * from './index';
