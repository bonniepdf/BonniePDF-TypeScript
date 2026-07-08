// Vitest setup: configure Node platform IO for every test file.
//
// Production Node consumers get this from the `index.node.ts` entry point;
// tests import modules straight from `src/`, so the platform must be
// configured here or every sync file operation (TtfFont.fromFileSync,
// Document.save, bundled-font registration) would throw.
import { configurePlatform } from '../../src/Platform/PlatformIO';
import { NodePlatformIO } from '../../src/Platform/NodePlatformIO';

configurePlatform(new NodePlatformIO());
