// Local stand-in for veraPDF rule 7.1-3: walks each (uncompressed) page content
// stream and flags any mark-producing operator (text show, path paint, XObject,
// shading) emitted while NOT inside a BDC/BMC marked-content scope. Reports a
// per-file count so we can drive the PDF/UA tagging gaps to zero without veraPDF.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'generated-pdfs');
const only = process.argv[3]; // optional filename filter

const TEXT_SHOW = new Set(['Tj', 'TJ', "'", '"']);
const PATH_PAINT = new Set(['f', 'F', 'f*', 'S', 's', 'B', 'B*', 'b', 'b*']);
const MARK = new Set([...TEXT_SHOW, ...PATH_PAINT, 'Do', 'sh', 'BI']);

function pageContentStreams(buf: Buffer): string[] {
  const text = buf.toString('latin1');
  const streams: string[] = [];
  const re = /(\d+ \d+ obj[\s\S]{0,400}?)?stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const header = m[1] ?? '';
    const body = m[2];
    // Form XObjects (charts, the "page X of Y" placeholder) carry their own
    // operators but are governed by the `Do` that paints them, not by
    // page-level 7.1 - skip them to match veraPDF.
    if (/\/Subtype\s*\/Form/.test(header)) continue;
    // Heuristic: page content is plaintext operators. Skip binary (font/image)
    // streams, which are FlateDecoded/raw bytes, by requiring a text or path
    // operator and rejecting high non-printable density.
    if (!/(\bBT\b|\bre\b|\bcm\b| Do\b)/.test(body)) continue;
    let nonPrintable = 0;
    for (let i = 0; i < body.length; i++) {
      const c = body.charCodeAt(i);
      if (c < 9 || (c > 13 && c < 32)) nonPrintable++;
    }
    if (nonPrintable / body.length > 0.05) continue;
    streams.push(body);
  }
  return streams;
}

function violationsIn(content: string, tally?: Map<string, number>): number {
  // Tokenize into whitespace-separated tokens, ignoring string/array literals'
  // inner content (we only care about operators). Track the marked-content
  // stack, recording whether each open scope is an /Artifact, so we can flag:
  //   7.1-3: a mark emitted outside any scope (untagged content)
  //   7.1-2: a structure (non-/Artifact) scope opened inside an /Artifact
  let violations = 0;
  const artifactStack: boolean[] = []; // true = this open scope is /Artifact
  let operands: string[] = []; // /names seen since the last operator (tag is operands[0])

  // Strip () strings and <> hex strings so their bytes aren't read as operators.
  const cleaned = content.replace(/\((?:\\.|[^\\)])*\)/g, ' ').replace(/<[0-9A-Fa-f\s]*>/g, ' ');
  const tokens = cleaned.split(/\s+/);
  const note = (kind: string) => {
    violations++;
    if (tally) tally.set(kind, (tally.get(kind) ?? 0) + 1);
  };

  for (const tok of tokens) {
    if (tok.startsWith('/')) {
      operands.push(tok);
      continue;
    }
    if (tok === '<<' || tok === '>>' || tok === '[' || tok === ']' || tok === '') continue;

    if (tok === 'BDC' || tok === 'BMC') {
      const isArtifact = operands[0] === '/Artifact';
      if (!isArtifact && artifactStack.some(a => a)) note('7.1-2');
      artifactStack.push(isArtifact);
    } else if (tok === 'EMC') {
      artifactStack.pop();
    } else if (MARK.has(tok) && artifactStack.length === 0) {
      note(tok); // 7.1-3: mark with no enclosing scope
    }
    operands = [];
  }
  return violations;
}

const files = readdirSync(dir)
  .filter(f => f.endsWith('.pdf'))
  .filter(f => !only || f.includes(only))
  .sort();

let total = 0;
for (const f of files) {
  const buf = readFileSync(resolve(dir, f));
  let v = 0;
  const tally = new Map<string, number>();
  for (const s of pageContentStreams(buf)) v += violationsIn(s, tally);
  if (v > 0) {
    const byOp = [...tally.entries()].map(([op, n]) => `${op}:${n}`).join(' ');
    console.log(`${String(v).padStart(5)}  ${f}   [${byOp}]`);
    total += v;
  }
}
console.log(`\nTotal untagged marks: ${total} across ${files.length} files scanned`);
