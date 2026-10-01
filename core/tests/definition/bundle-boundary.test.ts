import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * The Document Definition reader and writer build and inspect every element type, so anything that reaches them
 * from the main entry keeps every element in a consumer's bundle, including the ones they never use (charts, QR
 * codes, barcodes). They are therefore a subpath, `@bonniepdf/core/definition`, and nothing outside the
 * `Definition/` folder may import from it except that entry itself.
 */
describe('the definition code stays out of the main entry', () => {
  const src = join(__dirname, '../../src');

  function* sources(dir: string): Generator<string> {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) yield* sources(path);
      else if (path.endsWith('.ts')) yield path;
    }
  }

  it('is imported only by its own folder and the definition entry', () => {
    const offenders: string[] = [];
    for (const file of sources(src)) {
      const rel = relative(src, file).split(sep).join('/');
      if (rel.startsWith('Definition/') || rel === 'definition.ts') continue;
      if (/from\s+['"][^'"]*\/Definition\/|from\s+['"]\.\/definition['"]/.test(readFileSync(file, 'utf8')))
        offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });

  it('is exported as a package subpath', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
    expect(pkg.exports['./definition']).toMatchObject({
      import: './dist/definition.js',
      require: './dist/definition.cjs',
    });
  });
});
