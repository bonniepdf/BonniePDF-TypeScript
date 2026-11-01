import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const sha256 = text => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
export function verify(directory) {
  const root = path.resolve(directory);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'chart-sources.json'), 'utf8'));
  if (manifest.version !== 1 || !/^[a-f0-9]{64}$/.test(manifest.source.sha256)) throw new Error('Invalid chart source provenance.');
  if (sha256(JSON.stringify(manifest.source.files)) !== manifest.source.sha256) throw new Error('Chart source pin does not match its recorded input hashes.');
  for (const [file, hash] of Object.entries(manifest.files)) {
    const resolved = path.resolve(root, file);
    if (!resolved.startsWith(root + path.sep)) throw new Error(`Invalid chart path: ${file}`);
    if (sha256(fs.readFileSync(resolved, 'utf8')) !== hash) throw new Error(`Modified chart source: ${file}. Regenerate from its authoritative source.`);
  }
  return manifest;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verify(process.argv[2] ?? path.resolve(import.meta.dirname, '..'));
  process.stdout.write('Chart source provenance verified.\n');
}
