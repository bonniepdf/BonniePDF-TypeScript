import type { TtfFont } from './TrueType/TtfFont';

/** Repackages whole CFF programs with a glyph-index CID charset; no glyph or subroutine pruning. */
export function cffProgram(font: TtfFont, name: string): Uint8Array {
  const cff = font.engineFace.font.cff;
  if (!cff) throw new Error('Expected CFF outlines.');
  const data = cff.embeddingData();
  const concat = (...parts: Uint8Array[]) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) {
      out.set(p, at);
      at += p.length;
    }
    return out;
  };
  const integer = (n: number) => {
    if (!Number.isInteger(n) || n < -2147483648 || n > 2147483647) throw new Error('CFF integer out of range.');
    return new Uint8Array([29, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
  };
  const real = (n: number) => {
    const text = n.toString().toUpperCase(),
      digits: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch >= '0' && ch <= '9') digits.push(Number(ch));
      else if (ch === '.') digits.push(10);
      else if (ch === 'E') {
        if (text[i + 1] === '-') {
          digits.push(12);
          i++;
        } else {
          digits.push(11);
          if (text[i + 1] === '+') i++;
        }
      } else if (ch === '-') digits.push(14);
      else throw new Error('Invalid CFF real.');
    }
    digits.push(15);
    if (digits.length % 2) digits.push(15);
    return new Uint8Array([30, ...digits.filter((_, i) => i % 2 === 0).map((v, i) => (v << 4) | digits[i * 2 + 1])]);
  };
  const op = (code: number, ...numbers: number[]) =>
    concat(...numbers.map(integer), new Uint8Array(code >= 1200 ? [12, code - 1200] : [code]));
  const array = (code: number, numbers: number[]) =>
    concat(...numbers.map(real), new Uint8Array(code >= 1200 ? [12, code - 1200] : [code]));
  const index = (items: Uint8Array[]) => {
    if (!items.length) return new Uint8Array([0, 0]);
    if (items.length > 65535) throw new Error('CFF INDEX count exceeded.');
    const header = new Uint8Array(3 + (items.length + 1) * 4);
    header[0] = items.length >> 8;
    header[1] = items.length & 255;
    header[2] = 4;
    const view = new DataView(header.buffer);
    let at = 1;
    for (let i = 0; i <= items.length; i++) {
      view.setUint32(3 + i * 4, at);
      if (i < items.length) at += items[i].length;
    }
    return concat(header, ...items);
  };
  const names = index([new TextEncoder().encode(name)]),
    strings = index([new TextEncoder().encode('Adobe'), new TextEncoder().encode('Identity')]),
    globals = index(data.globals),
    chars = index(data.chars);
  const charset = new Uint8Array(1 + (data.chars.length - 1) * 2);
  for (let i = 1; i < data.chars.length; i++) {
    charset[i * 2 - 1] = i >> 8;
    charset[i * 2] = i & 255;
  }
  const select = new Uint8Array([0, ...data.selection]);
  const fd = (offsets: number[]) =>
    index(
      data.privates.map((_, i) => concat(op(18, data.privateSizes[i], offsets[i]), array(1207, data.fdMatrices[i])))
    );
  const top = (charsetAt: number, selectAt: number, fdAt: number, charsAt: number) =>
    concat(
      op(1230, 391, 392, 0),
      op(1234, data.chars.length),
      array(5, data.bbox),
      array(1207, data.matrix),
      op(15, charsetAt),
      op(1237, selectAt),
      op(1236, fdAt),
      op(17, charsAt)
    );
  const head = new Uint8Array([1, 0, 4, 4]);
  const charsetAt = head.length + names.length + index([top(0, 0, 0, 0)]).length + strings.length + globals.length;
  const selectAt = charsetAt + charset.length,
    fdAt = selectAt + select.length,
    charsAt = fdAt + fd(data.privates.map(() => 0)).length;
  let at = charsAt + chars.length;
  const offsets = data.privates.map(p => {
    const value = at;
    at += p.length;
    return value;
  });
  return concat(
    head,
    names,
    index([top(charsetAt, selectAt, fdAt, charsAt)]),
    strings,
    globals,
    charset,
    select,
    fd(offsets),
    chars,
    ...data.privates
  );
}

/** Character codes remain source-specific while the CFF CIDs are glyph indices. */
export function cffEncoding(codes: ReadonlyMap<number, number>): string {
  const lines = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> def',
    '/CMapName /BonnieCffIdentity def',
    '/CMapType 1 def',
    '/WMode 0 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange',
  ];
  const entries = [...codes].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < entries.length; i += 100) {
    const batch = entries.slice(i, i + 100);
    lines.push(`${batch.length} begincidchar`);
    for (const [code, gid] of batch) lines.push(`<${code.toString(16).padStart(4, '0').toUpperCase()}> ${gid}`);
    lines.push('endcidchar');
  }
  lines.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
  return lines.join('\n');
}
