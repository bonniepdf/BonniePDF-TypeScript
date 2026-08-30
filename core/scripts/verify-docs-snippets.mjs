// Extracts every ```typescript fenced block that imports from '@bonniepdf/core'
// out of the website's TypeScript docs pages, rewrites that import to a
// relative path, and type-checks the lot against the real core types with
// `tsc --noEmit`. This is the same discipline used to verify the PDF/A
// conformance fixtures against a real validator rather than trusting a
// hand-written translation on faith - here applied to documentation code.
//
// Deliberately does NOT check blocks without their own `@bonniepdf/core`
// import (informal "continuation" snippets that assume a prior block's
// imports are still in scope) - there is no reliable way to know what's in
// scope for those without parsing the whole page, and this repo's docs
// convention keeps every meaningfully-different Options/Class pair
// self-contained specifically so it can be verified this way.
//
// Scratch-only: writes into core/src/_docsverify/ and removes it afterward,
// pass or fail. Not part of the build; run manually while authoring docs.
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const coreDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const docsDir = resolve(coreDir, 'the shared specification')
const outDir = join(coreDir, 'src/_docsverify')

const onlyFile = process.argv[2]

// Free variables the doc prose assumes are already in scope ("a long
// paragraph you already have"), not something to import. Declared ambiently
// so real undefined-identifier typos are still caught.
const PRELUDE =
  'declare const longParagraph: string\ndeclare const longText: string\ndeclare const photoBytes: Uint8Array\ndeclare const chartBytes: Uint8Array\ndeclare const ornamentBytes: Uint8Array\ndeclare const totalsBox: import("../index").IElement\n'

// Continuation blocks (see the module doc comment) sometimes carry their own
// import line for a *type* while still assuming a same-named instance from an
// earlier block on the page is in scope - `table.border = ...` following
// `import { Border, ... }`, say. `any` here does not weaken verification of
// anything this script actually authored: every self-contained pair this
// repo's docs are built from constructs its own `table`, so the ambient
// declaration below only ever fills in for blocks that don't.
const ASSUMED_INSTANCE_NAMES = ['table', 'list']

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const files = readdirSync(docsDir)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => !onlyFile || f === onlyFile)

let checked = 0
let skipped = 0

for (const file of files) {
  const src = readFileSync(join(docsDir, file), 'utf8')
  const blocks = [...src.matchAll(/```typescript\n([\s\S]*?)```/g)].map((m) => m[1])
  blocks.forEach((code, i) => {
    if (!code.includes("from '@bonniepdf/core'")) {
      skipped++
      return
    }
    checked++
    const rewritten = code.replaceAll("from '@bonniepdf/core'", "from '../index'")
    const instancePrelude = ASSUMED_INSTANCE_NAMES.filter((name) => !new RegExp(`\\bconst\\s+${name}\\b`).test(code))
      .map((name) => `declare const ${name}: any\n`)
      .join('')
    const contents = `// ${file} block #${i}\n${PRELUDE}${instancePrelude}${rewritten}`
    writeFileSync(join(outDir, `${file.replace('.md', '')}_${i}.ts`), contents)
  })
}

console.log(`Type-checking ${checked} self-contained block(s) (${skipped} continuation block(s) skipped)...`)

let ok = true
try {
  execSync('npx tsc --noEmit -p .', { cwd: coreDir, stdio: 'pipe' })
} catch (e) {
  ok = false
  const output = e.stdout?.toString() ?? ''
  const lines = output.split('\n').filter((l) => l.includes('_docsverify'))
  console.error(`\nType error(s):\n`)
  console.error(lines.length ? lines.join('\n') : output)
}

rmSync(outDir, { recursive: true, force: true })

if (!ok) process.exit(1)
console.log(`  ✓ all ${checked} block(s) type-check against @bonniepdf/core.`)
