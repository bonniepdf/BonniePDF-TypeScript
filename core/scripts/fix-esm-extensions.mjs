/**
 * Rewrites extensionless relative import/export specifiers in the ESM output to
 * explicit `.js` paths.
 *
 * The sources use `moduleResolution: "bundler"` and omit extensions, which is
 * fine for the type-checker and for bundlers but invalid for native ESM: Node,
 * Deno and browsers do not resolve `./Core/Unit` to `./Core/Unit.js`. The ESM
 * build preserves module structure (see tsup.config.ts) and so ships those
 * specifiers verbatim; this step makes them loadable without a bundler.
 *
 * The emitted declaration files (`.d.ts`) carry the same extensionless
 * specifiers, including `import("./X")` type references. TypeScript consumers
 * using `moduleResolution: "node16"` or `"nodenext"` cannot follow those, and
 * then see no exports at all, so declarations are rewritten the same way. The
 * build runs this script again after `tsc --emitDeclarationOnly` for that.
 *
 * A directory specifier resolves to its `index.js`. Specifiers that already
 * carry an extension, and bare package specifiers, are left alone.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const distDir = resolve(process.argv[2] ?? 'dist')
const SPEC = /(from\s*|import\s*|import\(\s*|export\s*\*\s*from\s*)(['"])(\.\.?\/[^'"]*?)\2/g
const isDeclaration = (p) => p.endsWith('.d.ts')

function walk (dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith('.js') || isDeclaration(p)) out.push(p)
  }
  return out
}

let filesChanged = 0
let specifiersRewritten = 0

for (const file of walk(distDir)) {
  const src = readFileSync(file, 'utf8')
  const next = src.replace(SPEC, (whole, head, quote, spec) => {
    if (/\.[cm]?js$/.test(spec)) return whole
    const base = resolve(dirname(file), spec)
    // A declaration's target is the sibling `.d.ts`; it is still imported as `.js`.
    const target = isDeclaration(file) ? '.d.ts' : '.js'
    let fixed = null
    if (existsSync(`${base}${target}`)) fixed = `${spec}.js`
    else if (existsSync(join(base, `index${target}`))) fixed = `${spec.replace(/\/$/, '')}/index.js`
    if (!fixed) return whole
    specifiersRewritten++
    return `${head}${quote}${fixed}${quote}`
  })
  if (next !== src) { writeFileSync(file, next); filesChanged++ }
}

console.log(`[fix-esm-extensions] ${specifiersRewritten} specifiers in ${filesChanged} files`)
