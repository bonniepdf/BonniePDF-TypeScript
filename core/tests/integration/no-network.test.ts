/**
 * Guards the claim that generating a PDF touches the network only when the
 * caller asks it to.
 *
 * BonniePDF is documented and sold as a library that generates documents
 * locally: no licence key, no activation check, no telemetry, and no part of a
 * customer's document leaving the machine. That is an absolute factual claim in
 * public copy and in the licensing pages, so it should be enforced rather than
 * believed. These tests fail the moment generation reaches for the network.
 *
 * Two complementary halves:
 *
 *   1. A runtime trap. Every outbound path a bundle could reasonably use is
 *      replaced with a recorder: the browser-facing globals (`fetch`,
 *      `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`) and, for
 *      Node, `Socket.prototype.connect` and `dns.lookup`. Trapping the socket
 *      rather than `http.request` means anything layered on TCP is caught, so a
 *      dependency-free HTTP call written by hand cannot slip past.
 *
 *   2. A source scan. The runtime trap can only prove the paths a test happens
 *      to execute, and the Node test environment never installs
 *      `BrowserPlatformIO`, so the browser fetch path is not exercised here at
 *      all. The scan closes that gap structurally: no module under `src/` may
 *      reference a network API except `Platform/BrowserPlatformIO.ts`, whose
 *      single `fetch` is caller-directed - it retrieves a URL the caller passed
 *      to `TtfFont.fromFile()`, to a host the caller named. A new call site
 *      anywhere else fails this test and forces the claim to be revisited
 *      alongside the code.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { Document } from '../../src/Document';
import { exportSvgPagesAsync } from '../../src/Export/SvgPageExporter';
import { Table } from '../../src/Elements/Tables/Table';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { StandardFonts } from '../../src/Typography/StandardFonts';

const require_ = createRequire(import.meta.url);

/** Every network attempt observed since the last reset, most useful first. */
let attempts: string[] = [];
const restorers: Array<() => void> = [];

/** Replaces `host[key]` with a recorder that also throws, and remembers how to put it back. */
function trap(host: Record<string, unknown>, key: string, label: string): void {
  if (!host || typeof host[key] === 'undefined') return;
  const original = host[key];
  host[key] = (...args: unknown[]) => {
    const target = typeof args[0] === 'string' ? ` -> ${args[0]}` : '';
    attempts.push(`${label}${target}`);
    throw new Error(`BonniePDF attempted a network call via ${label}${target}`);
  };
  restorers.push(() => {
    host[key] = original;
  });
}

beforeAll(() => {
  const globals = globalThis as unknown as Record<string, unknown>;
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']) trap(globals, name, name);
  if (typeof globals.navigator === 'object' && globals.navigator !== null) {
    trap(globals.navigator as Record<string, unknown>, 'sendBeacon', 'navigator.sendBeacon');
  }
  // Below HTTP: anything that opens a TCP connection or resolves a hostname.
  trap(require_('node:net').Socket.prototype as Record<string, unknown>, 'connect', 'net.Socket.connect');
  trap(require_('node:dns') as Record<string, unknown>, 'lookup', 'dns.lookup');
  trap(require_('node:dns').promises as Record<string, unknown>, 'lookup', 'dns.promises.lookup');
});

afterAll(() => {
  for (const restore of restorers.reverse()) restore();
});

/** A document exercising text, multiple faces, pagination, and a tagged table. */
function buildDocument(): Document {
  const doc = new Document();
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';

  doc.add(new TextBlock('Invoice', { fontSize: 18, fontName: StandardFonts.HelveticaBold }));
  doc.add(new TextBlock('Prepared entirely on this machine.', { fontSize: 11, fontName: StandardFonts.Helvetica }));

  const cell = (text: string, header = false): TableCell => {
    const tc = new TableCell();
    const tb = new TextBlock();
    tb.text = text;
    tb.fontName = header ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    tc.content = tb;
    tc.isHeader = header;
    return tc;
  };

  const table = new Table(160, 160, 160);
  table.addHeader([cell('Item', true), cell('Quantity', true), cell('Total', true)]);
  table.addRow([cell('Widget'), cell('2'), cell('20.00')]);
  table.addRow([cell('Gadget'), cell('1'), cell('35.00')]);
  doc.add(table);

  doc.addPage();
  doc.add(new TextBlock('Second page', { fontSize: 12, fontName: StandardFonts.Helvetica }));
  return doc;
}

describe('No network access during generation', () => {
  // Without this, every other test in this file would still pass if the traps
  // silently failed to install - a guard that cannot fail proves nothing.
  it('the traps are armed, so a passing run is meaningful', () => {
    attempts = [];
    const globals = globalThis as unknown as { fetch: (url: string) => unknown };
    expect(() => globals.fetch('https://example.invalid/')).toThrow(/attempted a network call/);
    const socket = new (require_('node:net').Socket)();
    expect(() => socket.connect(80, 'example.invalid')).toThrow(/attempted a network call/);
    expect(attempts).toEqual(['fetch -> https://example.invalid/', 'net.Socket.connect']);
  });

  it('generateBytes() makes no network call', () => {
    attempts = [];
    const doc = buildDocument();
    try {
      expect(doc.generateBytes().length).toBeGreaterThan(0);
    } finally {
      doc.dispose();
    }
    expect(attempts).toEqual([]);
  });

  it('generateBytesAsync() makes no network call', async () => {
    attempts = [];
    const doc = buildDocument();
    try {
      expect((await doc.generateBytesAsync()).length).toBeGreaterThan(0);
    } finally {
      doc.dispose();
    }
    expect(attempts).toEqual([]);
  });

  it('SVG export makes no network call', async () => {
    attempts = [];
    const doc = buildDocument();
    try {
      expect((await exportSvgPagesAsync(doc)).length).toBeGreaterThan(0);
    } finally {
      doc.dispose();
    }
    expect(attempts).toEqual([]);
  });
});

describe('No network API outside the caller-directed browser read', () => {
  /**
   * The only module allowed to reference a network API. Its `fetch` retrieves a
   * URL the caller passed to `TtfFont.fromFile()`, from a host the caller named,
   * and carries no document content.
   */
  const ALLOWED = 'Platform/BrowserPlatformIO.ts';

  const NETWORK_API = /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\.connection)/;

  /** Source with block and line comments removed, so documentation is not a hit. */
  function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  }

  function sourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
      else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) out.push(path);
    }
    return out;
  }

  it('only BrowserPlatformIO references a network API', () => {
    // fileURLToPath, not .pathname: on Windows the latter yields '/C:/…',
    // whose leading slash readdirSync rejects.
    const root = fileURLToPath(new URL('../../src', import.meta.url));
    const offenders = sourceFiles(root)
      .filter(path => NETWORK_API.test(stripComments(readFileSync(path, 'utf8'))))
      .map(path => relative(root, path).split('\\').join('/'))
      .sort();

    expect(offenders).toEqual([ALLOWED]);
  });
});
