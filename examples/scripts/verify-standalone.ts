// Execute each source file using the same single-file rules as the playground.
// This catches helper imports that a bundled catalogue can silently resolve.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'sucrase';
import * as core from '@bonniepdf/core';
import { registerBundledFonts } from './register-bundled-fonts.ts';

// Freeze the clock before loading the catalogue: a few examples stamp their
// report date at module initialization, while standalone files run later.
const realDate = globalThis.Date;
const now = realDate.UTC(2026, 9, 7, 12, 0, 0);
globalThis.Date = new Proxy(realDate, {
  construct(target, args) {
    return Reflect.construct(target, args.length ? args : [now]);
  },
  get(target, property) {
    return property === 'now' ? () => now : Reflect.get(target, property);
  },
});
const { examples } = await import('../src/index.ts');

core.settings.license = 'evaluation';
registerBundledFonts();

const sourceRoot = resolve(import.meta.dirname, '../src');
const registry = readFileSync(resolve(sourceRoot, 'index.ts'), 'utf8');
const sources = new Map(
  [...registry.matchAll(/import\s*\{\s*generate\s+as\s+(\w+)\s*\}\s*from\s*['"]([^'"]+)['"]/g)].map(match => [
    match[1],
    resolve(sourceRoot, `${match[2]}.ts`),
  ])
);
// Registry entries retain their imported generator's binding name.
const entries = [...registry.matchAll(/id:\s*['"]([^'"]+)['"][\s\S]*?generate:\s*(\w+)/g)];
const byId = new Map(entries.map(match => [match[1], sources.get(match[2])]));
const failures: string[] = [];
let passed = 0;

for (const example of examples) {
  try {
    const file = byId.get(example.id);
    if (!file) throw new Error('No standalone source found in the registry');
    const source = readFileSync(file, 'utf8');
    const { code } = transform(source, { transforms: ['typescript'], disableESTransforms: true });
    const body = code
      .replace(
        /import\s*\{([^}]+)\}\s*from\s*['"]@bonniepdf\/core['"]\s*;?/g,
        (_, names: string) => `const {${names}} = __core;`
      )
      .replace(/^export\s+/gm, '');
    const assets = new Map(
      (example.requiredAssets ?? []).map(asset => [
        asset,
        new Uint8Array(readFileSync(resolve(import.meta.dirname, '../assets', asset))),
      ])
    );
    const generate = new Function('__core', '__assets', `"use strict";\n${body}\nreturn generate(__assets);`);
    const document = generate(core, assets);
    if (!(document instanceof core.Document)) throw new Error('generate() must return a Document');
    const actual = await document.generateSvgPagesAsync({ maxPages: 3 });
    const expected = await example.generate(assets).generateSvgPagesAsync({ maxPages: 3 });
    // The batch report measures elapsed time, so two executions print different figures.
    if (
      actual.length !== expected.length ||
      (example.id !== 'batch-generation' && actual.join('\n') !== expected.join('\n'))
    )
      throw new Error('Standalone output differs from the catalogue');
    const bytes = await document.generateBytesAsync();
    if (bytes.length < 100) throw new Error('The PDF is empty');
    passed++;
  } catch (error) {
    failures.push(`${example.id}: ${(error as Error).message.split('\n')[0]}`);
  }
}

console.log(`${passed} of ${examples.length} examples work as standalone playground files.`);
for (const failure of failures) console.error(`  ✗ ${failure}`);
process.exitCode = failures.length ? 1 : 0;
globalThis.Date = realDate;
