import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * `src/Typography/Engine/` is vendored: maintained upstream and copied here by
 * tooling, never edited in this repository. Its `VENDORED.json` lists a SHA-256
 * for every file, taken with a leading BOM removed and line endings normalised
 * to LF, so a checkout's line endings do not matter. A change belongs upstream;
 * these checks fail on a hand edit, an added or removed file, or a copy synced
 * from uncommitted work. The .NET implementation checks its copy the same way.
 */
const folder = fileURLToPath(new URL('../../src/Typography/Engine', import.meta.url));

interface Stamp {
  readonly mapping: string;
  readonly source: { readonly commit: string | null; readonly dirty: boolean };
  readonly files: Readonly<Record<string, string>>;
}

const stamp = JSON.parse(readFileSync(join(folder, 'VENDORED.json'), 'utf8')) as Stamp;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(folder, path).split('\\').join('/')];
  });
}

function hash(path: string): string {
  const text = readFileSync(path, 'utf8');
  const normalised = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).replace(/\r\n?/g, '\n');
  return createHash('sha256').update(normalised, 'utf8').digest('hex');
}

describe('vendored text engine', () => {
  it('matches its stamp, file for file', () => {
    for (const [file, expected] of Object.entries(stamp.files)) {
      expect(hash(join(folder, file)), `${file} was edited here; change it upstream and re-sync`).toBe(expected);
    }
  });

  it('holds no file the stamp does not list', () => {
    const unlisted = walk(folder).filter(file => file !== 'VENDORED.json' && !(file in stamp.files));
    expect(unlisted).toEqual([]);
  });

  it('was synced from a committed source', () => {
    expect(stamp.source.dirty).toBe(false);
    expect(stamp.source.commit).toMatch(/^[0-9a-f]{40}$/);
  });
});
