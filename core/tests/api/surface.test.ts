import { describe, it, expect } from 'vitest';
import * as main from '../../src/index';
import * as charts from '../../src/charts';
import * as security from '../../src/security';
import * as qr from '../../src/qr';
import * as datamatrix from '../../src/datamatrix';
import * as definition from '../../src/definition';
import { INTERNAL_NAMES, INTERNAL_PATTERNS } from './surface.generated';

/**
 * The public surface: the package exports the API and not its plumbing. `surface.generated.ts` lists the names
 * that are internal; none of them may be exported by any entry point. (Type-only names are not visible at run
 * time; the specification repository checks the built declarations for those.)
 *
 * Mirrors the .NET PublicSurfaceTests.
 */
const internal = (name: string) =>
  INTERNAL_NAMES.includes(name) || INTERNAL_PATTERNS.some(p => new RegExp(p).test(name));

describe('public surface', () => {
  const entries: Record<string, object> = { '.': main, charts, security, qr, datamatrix, definition };
  for (const [entry, module] of Object.entries(entries)) {
    it(`entry point "${entry}" exports no internal name`, () => {
      expect(Object.keys(module).filter(internal)).toEqual([]);
    });
  }

  it('still exports the front door', () => {
    for (const name of ['Document', 'TextBlock', 'Table', 'Container', 'FontManager', 'ImageLoader', 'RenderContext']) {
      expect(Object.keys(main)).toContain(name);
    }
  });
});
