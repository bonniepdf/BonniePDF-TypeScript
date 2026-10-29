import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { records } from '../helpers/glyph-records';

/**
 * Pins what the embedded-font shaper produces for ordinary Latin text, so an optimisation that skips
 * work for "simple" text can be proved to change nothing.
 *
 * Every corpus string is shaped and its glyph records (id, cluster, advances, offsets, flags) are
 * hashed per bucket. The golden file is captured from the shaper as it stands; any change to the
 * output of any string changes its bucket hash. Run with `UPDATE_SHAPING_GOLDEN=1` to recapture, and
 * only do so for an intended change to shaping, never to make an optimisation pass.
 *
 * The corpus deliberately includes text the fast path must NOT take (combining marks, decomposed
 * sequences, joiners, uncovered characters) alongside the text it should.
 */

const fonts = [
  { id: 'liberation-serif', path: '../../assets/fonts/LiberationSerif-Regular.ttf' },
  { id: 'noto-sans', path: './fixtures/NotoSans-Regular.ttf' },
].map(f => {
  const file = fileURLToPath(new URL(f.path, import.meta.url));
  const bytes = new Uint8Array(readFileSync(file));
  return { id: f.id, font: TtfFont.loadFromBytes(bytes), sha256: createHash('sha256').update(bytes).digest('hex') };
});

const goldenPath = fileURLToPath(new URL('./fixtures/shaping-fast-path.golden.json', import.meta.url));

// A small deterministic generator (mulberry32), so the corpus is identical on every platform.
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ascii = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i));
const latin1 = Array.from({ length: 0xff - 0xa0 + 1 }, (_, i) => String.fromCharCode(0xa0 + i));
// Typographic punctuation and symbols that ordinary prose (Gutenberg texts, word processors) uses.
const punctuation = [
  0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2022, 0x2026, 0x2030, 0x2039, 0x203a, 0x20ac,
  0x2122,
].map(cp => String.fromCodePoint(cp));
const simple = [...ascii, ...latin1, ...punctuation];

const sentences = [
  'It was the best of times, it was the worst of times, it was the age of wisdom.',
  '“There is nothing,” said Mr. Lorry, “that I would not do—for her.”',
  'Café, naïve façade, über-cool ‘quoted’ text with an em dash — and an ellipsis…',
  'Price: €12.50 • Terms™ ‰ ‹a› « b »',
  'AV To Ty Yo Wa fi fl ffi ffl ff 1/2 ½ 3² © 2026',
  'The quick brown fox jumps over the lazy dog. THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.',
];

// Text the fast path must leave to the full pipeline: marks, decomposed forms, joiners, uncovered scalars.
const generic = [
  'é',
  'à́',
  'Å',
  'ñ',
  'ȫ',
  'ẋ̣',
  'i̇',
  'café au lait',
  'Angèle',
  'ẛ̣',
  'A̸',
  'Ǻ',
  'a‍b',
  'a‌b',
  'a​b',
  'a­b',
  'a️b',
  ' a',
  ' b',
  'Ω',
  'K',
  'Å',
  '̈́',
  'fiﬁx',
  'ﬀ ﬁ ﬂ',
  'กา',
  'אָ',
  'اَ',
  '😀 smile',
  '     ',
  'tab\there',
  'a\u0000b',
  '\u0080\u009f',
  '',
  '�',
  '',
  ' ',
  '  ',
  'a',
  'A',
  '’',
  '“',
  'é',
  'Å',
];

function buckets(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  out['ascii-pairs'] = ascii.flatMap(a => ascii.map(b => a + b));
  out['latin1-pairs'] = latin1.flatMap(a => [...ascii, ...latin1].flatMap(b => [a + b, b + a]));
  out['punctuation-pairs'] = punctuation.flatMap(a =>
    [...ascii, ...latin1, ...punctuation].flatMap(b => [a + b, b + a])
  );
  out['sentences'] = sentences;
  out['generic'] = generic;
  const next = rng(20261027);
  const pick = (): string => simple[Math.floor(next() * simple.length)];
  out['random-simple'] = Array.from({ length: 4000 }, () =>
    Array.from({ length: 3 + Math.floor(next() * 38) }, pick).join('')
  );
  // Prose-like: mostly lower-case ASCII words with the occasional quote, dash or accent.
  const words =
    'the of and to in a is that it was for on are as with his they at be this from have or by one had not but what all were when we there can an your which their said if do will each about how up out them then she many some so these would other into has more her two like him see time could no make than first been its who now people my made over did down only way find use may water long little very after words called just where most know'.split(
      ' '
    );
  out['random-prose'] = Array.from({ length: 3000 }, () => {
    const n = 4 + Math.floor(next() * 20);
    let line = '';
    for (let i = 0; i < n; i++) {
      let w = words[Math.floor(next() * words.length)];
      if (next() < 0.1) w = '“' + w + '”';
      // Each next() is a fresh draw, so this is not the same test as the one above.
      // eslint-disable-next-line no-dupe-else-if
      else if (next() < 0.1) w = w + '’s';
      else if (next() < 0.05) w = w.replace('e', 'é');
      line += (i ? (next() < 0.06 ? ' — ' : ' ') : '') + w;
    }
    return line + (next() < 0.5 ? '.' : ',');
  });
  return out;
}

function fingerprint(font: TtfFont, texts: string[]): string {
  const hash = createHash('sha256');
  for (const text of texts) {
    let line: string;
    try {
      line = JSON.stringify(
        records(font.shape(text)).map(g => [
          g.id,
          g.cluster,
          g.advanceX,
          g.advanceY,
          g.offsetX,
          g.offsetY,
          g.componentCount,
          g.isMark ? 1 : 0,
          g.isLigature ? 1 : 0,
          g.sourceLength,
          g.unsafeToBreak ? 1 : 0,
          g.componentIndex,
        ])
      );
    } catch (error) {
      // An error is part of the contract too: it must not change either.
      line = 'ERR:' + (error instanceof Error ? error.name + ':' + error.message : String(error));
    }
    hash.update(line).update('\n');
  }
  return hash.digest('hex');
}

function capture(): Record<string, Record<string, { count: number; sha256: string }>> {
  const all = buckets();
  const result: Record<string, Record<string, { count: number; sha256: string }>> = {};
  for (const { id, font } of fonts) {
    result[id] = {};
    for (const [name, texts] of Object.entries(all))
      result[id][name] = { count: texts.length, sha256: fingerprint(font, texts) };
  }
  return result;
}

describe('embedded Latin shaping: output is pinned', () => {
  it('matches the golden fingerprints for every bucket and font', () => {
    const actual = capture();
    if (process.env.UPDATE_SHAPING_GOLDEN === '1') {
      const body = { fonts: Object.fromEntries(fonts.map(f => [f.id, f.sha256])), buckets: actual };
      writeFileSync(goldenPath, JSON.stringify(body, null, 2) + '\n');
      return;
    }
    const golden = JSON.parse(readFileSync(goldenPath, 'utf8')) as {
      fonts: Record<string, string>;
      buckets: typeof actual;
    };
    expect(Object.fromEntries(fonts.map(f => [f.id, f.sha256]))).toEqual(golden.fonts);
    expect(actual).toEqual(golden.buckets);
  }, 120_000);

  it('reports shaping time for the prose buckets (informational)', () => {
    const all = buckets();
    const texts = [...all['random-prose'], ...all['sentences']];
    for (const { id, font } of fonts) {
      const start = performance.now();
      for (let pass = 0; pass < 3; pass++) for (const t of texts) font.shape(t);
      const ms = performance.now() - start;
      console.log(`shape ${id}: ${texts.length * 3} strings in ${ms.toFixed(0)} ms`);
    }
    expect(texts.length).toBeGreaterThan(0);
  }, 120_000);
});
