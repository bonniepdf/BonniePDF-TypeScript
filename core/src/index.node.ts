import { configurePlatform } from './Platform/PlatformIO';
import { NodePlatformIO } from './Platform/NodePlatformIO';
import { FontManager } from './Typography/FontManager';
import * as path from 'path';

configurePlatform(new NodePlatformIO());

// Auto-register bundled Liberation fonts for zero-config PDF/A on Node.js
const bundledFontsDir = path.join(__dirname, '../assets/fonts');
FontManager.autoRegisterBundledFonts(bundledFontsDir);

export * from './index';
