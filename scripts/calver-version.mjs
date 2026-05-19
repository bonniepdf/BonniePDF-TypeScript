#!/usr/bin/env node
/**
 * Runs `changeset version` to consume pending changesets and generate changelogs,
 * then overwrites the package version with CalVer (YYYY.M.N).
 *
 * N increments within the current month; resets to 0 on a new month.
 * The highest published version for this month is fetched from npm to pick N.
 */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const pkgPath = resolve(root, 'core/package.json')

// Consume changeset files and write CHANGELOG entries
execSync('pnpm changeset version', { stdio: 'inherit', cwd: root })

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1
const prefix = `${year}.${month}.`

// Find the highest patch already published this month on npm
let nextPatch = 0
try {
  const raw = execSync(`npm show @bonniepdf/core versions --json`, { encoding: 'utf-8' })
  const versions = JSON.parse(raw)
  const thisMonth = versions
    .filter(v => v.startsWith(prefix))
    .map(v => parseInt(v.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
  if (thisMonth.length > 0) {
    nextPatch = Math.max(...thisMonth) + 1
  }
} catch {
  // Package not yet on npm, or network unavailable — start at 0
}

const newVersion = `${prefix}${nextPatch}`

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
pkg.version = newVersion
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`@bonniepdf/core → ${newVersion}`)
