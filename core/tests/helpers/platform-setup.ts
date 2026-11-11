// Vitest setup: configure Node platform IO for every test file.
//
// Production Node consumers get this from the `index.node.ts` entry point;
// tests import modules straight from `src/`, so the platform must be
// configured here or every sync file operation (TtfFont.fromFileSync,
// Document.save, bundled-font registration) would throw.
import { configurePlatform } from '../../src/Platform/PlatformIO';
import { NodePlatformIO } from '../../src/Platform/NodePlatformIO';

configurePlatform(new NodePlatformIO());

// Declare a licence tier for the suite.
//
// The library requires the consuming application to declare which licence
// applies to it, and treats a test runner as a development environment - so
// without this line every test that generates a document would throw. The test
// suite is not production use, so `evaluation` is the honest declaration.
import { settings } from '../../src/Licensing/Settings';

settings.license = 'evaluation';

// Register the bundled Liberation fonts, as the Node entry point does for an
// application. Without them, tagged and PDF/A documents fall back to
// unembedded standard fonts and lose their claims, so tests would check output
// that no Node application produces. Tests of that fallback clear the registry
// with `withoutRegisteredFonts` (helpers/bundled-fonts.ts).
import { registerBundledFonts } from './bundled-fonts';

registerBundledFonts();
