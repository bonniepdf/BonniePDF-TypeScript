/**
 * Generates a self-contained coverage badge SVG from vitest's coverage summary.
 *
 * Run (from repo root or core/):  node BonniePDF-TypeScript/scripts/coverage-badge.mjs
 * Usually invoked via `pnpm coverage` in core/, which runs the tests with
 * `--coverage` first. Reads core/coverage/coverage-summary.json (line %) and
 * writes badges/coverage.svg. No network, no external badge service.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url)); // BonniePDF-TypeScript/scripts
const summaryPath = resolve(here, '../core/coverage/coverage-summary.json');
const badgeDir = resolve(here, '../badges');
const badgePath = resolve(badgeDir, 'coverage.svg');

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const pct = summary.total.lines.pct; // 0..100
const label = 'coverage';
const message = `${Math.round(pct * 10) / 10}%`;

function color(p) {
  if (p >= 90) return '#4c1';
  if (p >= 80) return '#97ca00';
  if (p >= 70) return '#a4a61d';
  if (p >= 60) return '#dfb317';
  if (p >= 50) return '#fe7d37';
  return '#e05d44';
}

// Approximate text widths (Verdana 11px ≈ 6.5px/char) + 10px horizontal padding.
const charW = 6.5;
const pad = 10;
const labelW = Math.round(label.length * charW) + pad;
const msgW = Math.round(message.length * charW) + pad;
const total = labelW + msgW;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${msgW}" height="20" fill="${color(pct)}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + msgW / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelW + msgW / 2}" y="14">${message}</text>
  </g>
</svg>
`;

mkdirSync(badgeDir, { recursive: true });
writeFileSync(badgePath, svg);
console.log(`coverage badge: ${message} lines → ${badgePath}`);
