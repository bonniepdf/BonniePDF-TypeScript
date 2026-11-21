// Writes core/README.md, the README npm shows for @bonniepdf/core, from the
// repository README, so the two cannot drift apart.
//
// Content that only makes sense in the repository is wrapped in
//   <!-- package-readme:omit-start --> ... <!-- package-readme:omit-end -->
// and left out of the package copy. Content that only makes sense on npm sits
// inside a comment, which GitHub does not render:
//   <!-- package-readme:only
//   ...
//   -->
// The package copy replaces that comment with what it contains.
//
//   node scripts/sync-package-readme.mjs          rewrite core/README.md
//   node scripts/sync-package-readme.mjs --check  fail if it is out of date
//
// Every link in the README must be absolute: npm resolves relative links
// against the package, not the repository.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = `${root}README.md`;
const target = `${root}core/README.md`;

const banner =
  '<!-- Generated from the repository README by scripts/sync-package-readme.mjs. Edit README.md at the repository root instead. -->\n\n';

const readme = readFileSync(source, 'utf8');
const omitted = readme
  .replace(/<!-- package-readme:omit-start -->[\s\S]*?<!-- package-readme:omit-end -->\n*/g, '')
  .replace(/<!-- package-readme:only\n([\s\S]*?)\n-->/g, '$1');

const relative = [...omitted.matchAll(/\]\((?!https?:|mailto:|#)([^)]+)\)/g)].map(match => match[1]);
if (relative.length > 0) {
  console.error(`README.md has relative links, which break on npm: ${relative.join(', ')}`);
  process.exit(1);
}

const expected = banner + omitted;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    // A missing file is simply out of date.
  }
  if (current !== expected) {
    console.error('core/README.md is out of date. Run: node scripts/sync-package-readme.mjs');
    process.exit(1);
  }
  console.log('core/README.md matches README.md.');
} else {
  writeFileSync(target, expected);
  console.log('Wrote core/README.md from README.md.');
}
