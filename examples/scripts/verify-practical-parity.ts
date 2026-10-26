// Run both language examples and compare page counts and the text on each page.
// This complements visual review and the engine's conformance suite.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { settings } from '@bonniepdf/core';
import { examples } from '../src/index';
import { registerBundledFonts } from './register-bundled-fonts';

settings.license = 'evaluation';
registerBundledFonts();
const netRoot = process.env.BONNIEPDF_NET_ROOT ?? resolve(import.meta.dirname, '../../../BonniePDF-NET');
const output = mkdtempSync(resolve(tmpdir(), 'bonniepdf-example-parity-'));
for (const project of [
  'CodeRecipes/BonniePDF.Examples.PracticalRecipes',
  'IndustryTemplates/BonniePDF.Examples.PracticalDocuments',
]) {
  const run = spawnSync('dotnet', ['run', '--project', resolve(netRoot, 'Examples', project), '-v:q', '--', output], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
}
function text(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match =>
    match[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([a-f\d]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
  );
}
for (const id of [
  'page-break-control',
  'practical-tables',
  'browser-download',
  'font-fallback',
  'document-diagnostics',
  'large-order-invoice',
  'long-basket-receipt',
  'multilingual-customer-letter',
]) {
  const example = examples.find(example => example.id === id)!;
  const assets = new Map(
    (example.requiredAssets ?? []).map(path => [
      path,
      new Uint8Array(readFileSync(resolve(import.meta.dirname, '../assets', path))),
    ])
  );
  const doc = example.generate(assets);
  try {
    const actual = await doc.generateSvgPagesAsync();
    const files = readdirSync(output)
      .filter(file => file.startsWith(id + '-') && file.endsWith('.svg'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    assert.equal(actual.length, files.length, `${id}: page count`);
    files.forEach((file, index) =>
      assert.deepEqual(
        text(actual[index]),
        text(readFileSync(resolve(output, file), 'utf8')),
        `${id}, page ${index + 1}`
      )
    );
    console.log(`${id}: ${actual.length} matching pages`);
  } finally {
    doc.dispose();
  }
}
