/**
 * Writes a CommonJS twin (`.d.cts`) of every emitted declaration file.
 *
 * The package is `"type": "module"`, so its `.d.ts` files describe ES modules.
 * A CommonJS consumer on `moduleResolution: "node16"` (or an older TypeScript
 * on `"nodenext"`) that reaches them through the `require` condition is told it
 * cannot `require` an ES module (TS1479), although the `.cjs` build it actually
 * loads is CommonJS. The `require` conditions in `exports` point at these
 * twins instead, so each runtime format gets declarations of the same format.
 *
 * Run after `fix-esm-extensions.mjs`, whose `.js` specifiers become `.cjs` here.
 * Source-map comments are dropped: the maps describe the `.d.ts` files.
 *
 *   node scripts/emit-cjs-declarations.mjs dist
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const distDir = resolve(process.argv[2] ?? 'dist')
const SPEC = /(from\s*|import\s*|import\(\s*|export\s*\*\s*from\s*)(['"])(\.\.?\/[^'"]*?)\.js\2/g

function walk (dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith('.d.ts')) out.push(p)
  }
  return out
}

let files = 0
for (const file of walk(distDir)) {
  const src = readFileSync(file, 'utf8')
  const cts = src
    .replace(SPEC, (_whole, head, quote, spec) => `${head}${quote}${spec}.cjs${quote}`)
    .replace(/^\/\/# sourceMappingURL=.*$/m, '')
  writeFileSync(file.slice(0, -'.d.ts'.length) + '.d.cts', cts)
  files++
}

console.log(`[emit-cjs-declarations] ${files} files`)
