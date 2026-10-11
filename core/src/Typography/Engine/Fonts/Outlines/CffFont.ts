// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from "../../Data/BigEndianData";
import { invalid, unsupported } from "../../Api/FontError";
import { Glyph } from "./Glyph";
import { OutlineReadLimits } from "./OutlineReadLimits";

/** CFF 1 reader, following Adobe Technical Notes 5176 and 5177. */
export class CffFont {
  private readonly data: BigEndianData;
  private embeddingChecked = false;
  private readonly chars: Uint8Array[];
  private readonly globals: Uint8Array[];
  private readonly locals: Uint8Array[][] = [];
  private readonly privates: Uint8Array[] = [];
  private readonly privateSizes: number[] = [];
  private readonly fdMatrices: number[][] = [];
  private readonly selection: number[];
  readonly matrix: readonly number[];
  readonly bbox: readonly number[];
  constructor(
    bytes: Uint8Array,
    readonly glyphCount: number,
    readonly unitsPerEm: number,
    readonly limits: OutlineReadLimits,
  ) {
    this.data = new BigEndianData(new Uint8Array(bytes));
    const d = this.data;
    if (d.u8(0) !== 1 || d.u8(1) !== 0)
      unsupported("Only CFF 1.0 is supported.");
    const header = d.u8(2);
    if (header < 4 || d.u8(3) < 1 || d.u8(3) > 4)
      invalid("Invalid CFF header.");
    const names = this.index(header),
      tops = this.index(names.end),
      strings = this.index(tops.end),
      globals = this.index(strings.end);
    if (names.items.length !== 1 || tops.items.length !== 1)
      unsupported("CFF FontSets are unsupported.");
    this.globals = globals.items;
    const top = this.dict(tops.items[0]);
    if (this.value(top, 1205, 0) !== 0)
      unsupported("Only filled CFF outlines are supported.");
    if (this.value(top, 1206, 2) !== 2)
      unsupported("Only Type 2 charstrings are supported.");
    this.matrix = Object.freeze(top.get(1207) ?? [0.001, 0, 0, 0.001, 0, 0]);
    this.checkMatrix(this.matrix);
    this.bbox = Object.freeze(top.get(5) ?? [0, 0, 0, 0]);
    if (this.bbox.length !== 4) invalid("Invalid CFF FontBBox.");
    this.chars = this.index(this.integer(this.value(top, 17, -1))).items;
    if (this.chars.length !== glyphCount)
      invalid("CFF glyph count disagrees with maxp.");
    this.selection = new Array(glyphCount).fill(0);
    if (top.has(1230)) {
      const fds = this.index(this.integer(this.value(top, 1236, -1))).items;
      if (!fds.length || fds.length > 256) invalid("Invalid CFF FDArray.");
      for (const fd of fds) this.addPrivate(this.dict(fd), true);
      let p = this.integer(this.value(top, 1237, -1)),
        format = d.u8(p++);
      if (format === 0)
        for (let i = 0; i < glyphCount; i++) this.selection[i] = d.u8(p++);
      else if (format === 3) {
        const count = d.u16(p);
        p += 2;
        if (!count || count > glyphCount)
          invalid("Invalid CFF FDSelect range count.");
        let previous = 0;
        for (let i = 0; i < count; i++) {
          const first = d.u16(p),
            fd = d.u8(p + 2),
            next = d.u16(p + 3);
          p += 3;
          if (first !== previous || next <= first || next > glyphCount)
            invalid("Invalid CFF FDSelect ranges.");
          for (let g = first; g < next; g++) this.selection[g] = fd;
          previous = next;
        }
        if (previous !== glyphCount) invalid("Invalid CFF FDSelect sentinel.");
      } else unsupported("Unsupported CFF FDSelect format.");
    } else this.addPrivate(top, false);
    if (this.selection.some((fd) => fd >= this.locals.length))
      invalid("Invalid CFF font dictionary index.");
  }
  private value(
    dict: Map<number, number[]>,
    op: number,
    fallback: number,
  ): number {
    const values = dict.get(op);
    if (!values) return fallback;
    if (values.length !== 1) invalid("Invalid CFF DICT operand count.");
    return values[0];
  }
  private checkMatrix(m: readonly number[]) {
    if (
      m.length !== 6 ||
      m.some((n) => !Number.isFinite(n)) ||
      m[0] * m[3] === m[1] * m[2]
    )
      invalid("Invalid CFF FontMatrix.");
  }
  private integer(n: number | undefined): number {
    if (n === undefined || !Number.isInteger(n) || n < 0 || n > 0x7fffffff)
      invalid("Invalid CFF offset or index.");
    return n;
  }
  private index(p: number): { items: Uint8Array[]; end: number } {
    const d = this.data,
      count = d.u16(p);
    p += 2;
    if (!count) return { items: [], end: p };
    const size = d.u8(p++);
    if (size < 1 || size > 4) invalid("Invalid CFF INDEX offSize.");
    d.check(p, (count + 1) * size);
    const base = p + (count + 1) * size;
    const offset = (i: number) => {
      let value = 0;
      for (let j = 0; j < size; j++)
        value = value * 256 + d.u8(p + i * size + j);
      return value;
    };
    let prev = offset(0);
    if (prev !== 1) invalid("Invalid CFF INDEX origin.");
    const items: Uint8Array[] = [];
    for (let i = 0; i < count; i++) {
      const next = offset(i + 1);
      if (next < prev) invalid("Invalid CFF INDEX order.");
      items.push(d.copy(base + prev - 1, next - prev));
      prev = next;
    }
    d.check(base, prev - 1);
    return { items, end: base + prev - 1 };
  }
  private dict(bytes: Uint8Array): Map<number, number[]> {
    const d = new BigEndianData(bytes),
      result = new Map<number, number[]>();
    let p = 0,
      stack: number[] = [];
    while (p < bytes.length) {
      const b = d.u8(p++);
      let n: number;
      if (b >= 32 && b <= 246) n = b - 139;
      else if (b >= 247 && b <= 250) n = (b - 247) * 256 + d.u8(p++) + 108;
      else if (b >= 251 && b <= 254) n = -(b - 251) * 256 - d.u8(p++) - 108;
      else if (b === 28) {
        n = d.i16(p);
        p += 2;
      } else if (b === 29) {
        n = d.u32(p) | 0;
        p += 4;
      } else if (b === 30) {
        let value = "",
          done = false;
        while (!done) {
          const v = d.u8(p++);
          for (const digit of [v >> 4, v & 15]) {
            if (digit === 15) {
              done = true;
              break;
            }
            if (digit === 13) invalid("Invalid CFF real.");
            value +=
              digit < 10
                ? String(digit)
                : digit === 10
                  ? "."
                  : digit === 11
                    ? "E"
                    : digit === 12
                      ? "E-"
                      : "-";
            if (value.length > 64) invalid("CFF real too long.");
          }
        }
        n = Number(value);
      } else {
        const op = b === 12 ? 1200 + d.u8(p++) : b;
        if (b > 21 && b !== 12) invalid("Invalid CFF DICT operator.");
        if (result.has(op)) invalid("Duplicate CFF DICT operator.");
        result.set(op, stack);
        stack = [];
        continue;
      }
      if (!Number.isFinite(n) || stack.length >= 48)
        invalid("Invalid CFF DICT operands.");
      stack.push(n);
    }
    if (stack.length) invalid("Unterminated CFF DICT operands.");
    return result;
  }
  private addPrivate(dict: Map<number, number[]>, cid: boolean): void {
    const pair = dict.get(18) ?? [0, 0];
    if (pair.length !== 2) invalid("Invalid CFF Private DICT.");
    const size = this.integer(pair[0]),
      offset = this.integer(pair[1]);
    const raw = this.data.copy(offset, size),
      priv = this.dict(raw);
    const subOffset = priv.has(19) ? this.value(priv, 19, -1) : undefined;
    let subs: Uint8Array[] = [],
      end = offset + size;
    if (subOffset !== undefined) {
      const at = offset + this.integer(subOffset);
      if (at < end) invalid("CFF Subrs overlaps Private DICT.");
      const index = this.index(at);
      subs = index.items;
      end = index.end;
    }
    this.locals.push(subs);
    this.privates.push(this.data.copy(offset, end - offset));
    this.privateSizes.push(size);
    const matrix = cid
      ? (dict.get(1207) ?? [1, 0, 0, 1, 0, 0])
      : [1, 0, 0, 1, 0, 0];
    this.checkMatrix(matrix);
    this.fdMatrices.push(matrix);
  }
  /** Owned data for the consumer's lossless whole-program repackaging. */
  embeddingData() {
    if (!this.embeddingChecked) {
      let cost = 0;
      for (let id = 0; id < this.glyphCount; id++) {
        const t = new Type2(
          this.chars[id],
          this.locals[this.selection[id]],
          this.globals,
          this.limits,
          this.matrix,
          this.fdMatrices[this.selection[id]],
          this.unitsPerEm,
        );
        t.read();
        cost += t.operationCount;
        if (cost > 16000000)
          invalid("CFF whole-program operation limit exceeded.");
      }
      this.embeddingChecked = true;
    }
    return {
      chars: this.chars.map((x) => new Uint8Array(x)),
      globals: this.globals.map((x) => new Uint8Array(x)),
      privates: this.privates.map((x) => new Uint8Array(x)),
      privateSizes: [...this.privateSizes],
      selection: [...this.selection],
      matrix: [...this.matrix],
      fdMatrices: this.fdMatrices.map((x) => [...x]),
      bbox: [...this.bbox],
    };
  }
  readGlyph(id: number): Glyph {
    if (!Number.isInteger(id) || id < 0 || id >= this.glyphCount)
      invalid("Invalid glyph ID.");
    return new Type2(
      this.chars[id],
      this.locals[this.selection[id]],
      this.globals,
      this.limits,
      this.matrix,
      this.fdMatrices[this.selection[id]],
      this.unitsPerEm,
    ).read();
  }
}

class Type2 {
  private stack: number[] = [];
  private transient = new Array<number>(32).fill(0);
  private x = 0;
  private y = 0;
  private stems = 0;
  private width = false;
  private active = false;
  private ended = false;
  private operations = 0;
  private points = 0;
  private contours = 0;
  private seed = 1;
  private readonly glyph = new Glyph();
  constructor(
    private bytes: Uint8Array,
    private locals: Uint8Array[],
    private globals: Uint8Array[],
    private limits: OutlineReadLimits,
    private top: readonly number[],
    private fd: readonly number[],
    private upem: number,
  ) {}
  get operationCount() {
    return this.operations;
  }
  private fail(message = "Invalid Type 2 charstring."): never {
    return invalid(message);
  }
  private charge(n = 1) {
    this.operations += n;
    if (this.operations > this.limits.maxOperations)
      this.fail("CFF operation limit exceeded.");
  }
  private push(n: number) {
    if (
      !Number.isFinite(n) ||
      Math.abs(n) > 0x7fffffff ||
      this.stack.length >= 48
    )
      this.fail("CFF operand limit exceeded.");
    this.stack.push(n);
  }
  private pop() {
    if (!this.stack.length) this.fail("CFF stack underflow.");
    return this.stack.pop()!;
  }
  private integer(n: number, min: number, max: number) {
    if (!Number.isInteger(n) || n < min || n > max)
      this.fail("Invalid CFF operand index.");
    return n;
  }
  private arity(n: number) {
    if (this.stack.length !== n) this.fail();
  }
  private transform(x: number, y: number): number[] {
    const f = this.fd,
      t = this.top,
      a = f[0] * x + f[2] * y + f[4],
      b = f[1] * x + f[3] * y + f[5];
    const result = [
      (t[0] * a + t[2] * b + t[4]) * this.upem,
      (t[1] * a + t[3] * b + t[5]) * this.upem,
    ];
    if (result.some((v) => !Number.isFinite(v) || Math.abs(v) > 0x7fffffff))
      this.fail("CFF coordinate limit exceeded.");
    return result;
  }
  private command(kind: number, ...pairs: number[]) {
    this.points += pairs.length / 2;
    if (this.points > this.limits.maxPoints)
      this.fail("CFF point limit exceeded.");
    const c = [kind];
    for (let i = 0; i < pairs.length; i += 2)
      c.push(...this.transform(pairs[i], pairs[i + 1]));
    this.glyph.commands.push(c);
  }
  private close() {
    if (this.active) this.command(3);
    this.active = false;
  }
  private move(dx: number, dy: number) {
    this.close();
    this.x += dx;
    this.y += dy;
    if (++this.contours > this.limits.maxContours)
      this.fail("CFF contour limit exceeded.");
    this.command(0, this.x, this.y);
    this.active = true;
  }
  private line(dx: number, dy: number) {
    if (!this.active) this.fail("CFF path must begin with moveto.");
    this.x += dx;
    this.y += dy;
    this.command(1, this.x, this.y);
  }
  private curve(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {
    if (!this.active) this.fail("CFF path must begin with moveto.");
    const x1 = this.x + a,
      y1 = this.y + b,
      x2 = x1 + c,
      y2 = y1 + d;
    this.x = x2 + e;
    this.y = y2 + f;
    this.command(2, x1, y1, x2, y2, this.x, this.y);
  }
  private consumeWidth(expected: number, stem = false) {
    if (!this.width) {
      if (stem ? this.stack.length % 2 === 1 : this.stack.length > expected)
        this.stack.shift();
      this.width = true;
    }
  }
  private execute(bytes: Uint8Array, depth: number, sub = false): void {
    if (depth > Math.min(10, this.limits.maxDepth))
      this.fail("CFF subroutine depth limit exceeded.");
    const d = new BigEndianData(bytes);
    let p = 0;
    while (p < bytes.length && !this.ended) {
      this.charge();
      const op = d.u8(p++);
      if (op >= 32) {
        let n: number;
        if (op <= 246) n = op - 139;
        else if (op <= 250) n = (op - 247) * 256 + d.u8(p++) + 108;
        else if (op <= 254) n = -(op - 251) * 256 - d.u8(p++) - 108;
        else {
          n = (d.u32(p) | 0) / 65536;
          p += 4;
        }
        this.push(n);
        continue;
      }
      if (op === 28) {
        this.push(d.i16(p));
        p += 2;
        continue;
      }
      if (op === 10 || op === 29) {
        const list = op === 10 ? this.locals : this.globals,
          bias = list.length < 1240 ? 107 : list.length < 33900 ? 1131 : 32768;
        const index = this.integer(this.pop() + bias, 0, list.length - 1);
        this.execute(list[index], depth + 1, true);
        continue;
      }
      if (op === 11) {
        if (!sub) this.fail("Type 2 return outside subroutine.");
        return;
      }
      if (op === 12) {
        this.escape(d.u8(p++));
        continue;
      }
      const s = this.stack;
      if ([1, 3, 18, 23, 19, 20].includes(op)) {
        this.consumeWidth(0, true);
        if (s.length % 2) this.fail();
        this.stems += s.length / 2;
        if (this.stems > 96) this.fail("CFF stem limit exceeded.");
        this.stack = [];
        if (op === 19 || op === 20) {
          const n = Math.ceil(this.stems / 8);
          d.check(p, n);
          p += n;
        }
        continue;
      }
      if (op === 4 || op === 21 || op === 22) {
        const n = op === 21 ? 2 : 1;
        this.consumeWidth(n);
        this.arity(n);
        this.move(op === 4 ? 0 : s[0], op === 22 ? 0 : s[n - 1]);
      } else if (op === 5) {
        if (s.length < 2 || s.length % 2) this.fail();
        for (let i = 0; i < s.length; i += 2) this.line(s[i], s[i + 1]);
      } else if (op === 6 || op === 7) {
        if (!s.length) this.fail();
        let h = op === 6;
        for (const v of s) {
          this.line(h ? v : 0, h ? 0 : v);
          h = !h;
        }
      } else if (op === 8) {
        if (!s.length || s.length % 6) this.fail();
        for (let i = 0; i < s.length; i += 6)
          this.curve(
            ...(s.slice(i, i + 6) as [
              number,
              number,
              number,
              number,
              number,
              number,
            ]),
          );
      } else if (op === 24) {
        if (s.length < 8 || (s.length - 2) % 6) this.fail();
        let i = 0;
        for (; i < s.length - 2; i += 6)
          this.curve(
            ...(s.slice(i, i + 6) as [
              number,
              number,
              number,
              number,
              number,
              number,
            ]),
          );
        this.line(s[i], s[i + 1]);
      } else if (op === 25) {
        if (s.length < 8 || (s.length - 6) % 2) this.fail();
        let i = 0;
        for (; i < s.length - 6; i += 2) this.line(s[i], s[i + 1]);
        this.curve(
          ...(s.slice(i) as [number, number, number, number, number, number]),
        );
      } else if (op === 26 || op === 27) {
        if (s.length < 4 || ![0, 1].includes(s.length % 4)) this.fail();
        let i = s.length % 4,
          first = i ? s[0] : 0;
        for (; i < s.length; i += 4) {
          if (op === 26)
            this.curve(first, s[i], s[i + 1], s[i + 2], 0, s[i + 3]);
          else this.curve(s[i], first, s[i + 1], s[i + 2], s[i + 3], 0);
          first = 0;
        }
      } else if (op === 30 || op === 31) {
        if (s.length < 4 || ![0, 1].includes(s.length % 4)) this.fail();
        let i = 0,
          h = op === 31;
        while (i < s.length) {
          const a = s[i++],
            b = s[i++],
            c = s[i++],
            e = s[i++],
            last = s.length - i === 1 ? s[i++] : 0;
          if (h) this.curve(a, 0, b, c, last, e);
          else this.curve(0, a, b, c, e, last);
          h = !h;
        }
      } else if (op === 14) {
        if (!this.width) {
          if (s.length === 1 || s.length === 5) s.shift();
          this.width = true;
        }
        if (s.length === 4)
          unsupported("Deprecated Type 2 seac composites are unsupported.");
        this.arity(0);
        this.close();
        this.ended = true;
      } else this.fail("Unsupported or reserved Type 2 operator.");
      this.stack = [];
    }
    if (!this.ended)
      this.fail(
        sub
          ? "CFF subroutine missing return."
          : "CFF charstring missing endchar.",
      );
  }
  private escape(op: number) {
    const s = this.stack;
    let a: number, b: number;
    if (op === 34) {
      this.arity(7);
      this.curve(s[0], 0, s[1], s[2], s[3], 0);
      this.curve(s[4], 0, s[5], -s[2], s[6], 0);
      this.stack = [];
    } else if (op === 35) {
      this.arity(13);
      this.curve(
        ...(s.slice(0, 6) as [number, number, number, number, number, number]),
      );
      this.curve(
        ...(s.slice(6, 12) as [number, number, number, number, number, number]),
      );
      this.stack = [];
    } else if (op === 36) {
      this.arity(9);
      this.curve(s[0], s[1], s[2], s[3], s[4], 0);
      this.curve(s[5], 0, s[6], s[7], s[8], -s[1] - s[3] - s[7]);
      this.stack = [];
    } else if (op === 37) {
      this.arity(11);
      const dx = s[0] + s[2] + s[4] + s[6] + s[8],
        dy = s[1] + s[3] + s[5] + s[7] + s[9];
      this.curve(
        ...(s.slice(0, 6) as [number, number, number, number, number, number]),
      );
      this.curve(
        s[6],
        s[7],
        s[8],
        s[9],
        Math.abs(dx) > Math.abs(dy) ? s[10] : -dx,
        Math.abs(dx) > Math.abs(dy) ? -dy : s[10],
      );
      this.stack = [];
    } else if ([3, 4, 10, 11, 12, 15, 24].includes(op)) {
      b = this.pop();
      a = this.pop();
      this.push(
        op === 3
          ? a && b
            ? 1
            : 0
          : op === 4
            ? a || b
              ? 1
              : 0
            : op === 10
              ? a + b
              : op === 11
                ? a - b
                : op === 12
                  ? a / b
                  : op === 15
                    ? a === b
                      ? 1
                      : 0
                    : a * b,
      );
    } else if ([5, 9, 14, 26].includes(op)) {
      a = this.pop();
      this.push(
        op === 5
          ? a
            ? 0
            : 1
          : op === 9
            ? Math.abs(a)
            : op === 14
              ? -a
              : Math.sqrt(a),
      );
    } else if (op === 18) this.pop();
    else if (op === 20) {
      const i = this.integer(this.pop(), 0, 31);
      this.transient[i] = this.pop();
    } else if (op === 21)
      this.push(this.transient[this.integer(this.pop(), 0, 31)]);
    else if (op === 22) {
      const v2 = this.pop(),
        v1 = this.pop(),
        s2 = this.pop(),
        s1 = this.pop();
      this.push(v1 <= v2 ? s1 : s2);
    } else if (op === 23) {
      this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
      this.push((this.seed + 1) / 4294967296);
    } else if (op === 27) {
      a = this.pop();
      this.push(a);
      this.push(a);
    } else if (op === 28) {
      a = this.pop();
      b = this.pop();
      this.push(a);
      this.push(b);
    } else if (op === 29) {
      a = Math.max(0, this.pop());
      this.integer(a, 0, this.stack.length - 1);
      this.push(this.stack[this.stack.length - 1 - a]);
    } else if (op === 30) {
      const j = this.pop(),
        n = this.integer(this.pop(), 0, this.stack.length);
      if (!Number.isInteger(j)) this.fail();
      if (n) {
        const part = this.stack.splice(this.stack.length - n),
          rotation = ((j % n) + n) % n;
        this.stack.push(
          ...part.slice(n - rotation),
          ...part.slice(0, n - rotation),
        );
      }
    } else this.fail("Unsupported or reserved Type 2 escaped operator.");
  }
  read(): Glyph {
    this.execute(this.bytes, 0);
    let any = false,
      minX = 0,
      minY = 0,
      maxX = 0,
      maxY = 0;
    for (const c of this.glyph.commands)
      for (let i = 1; i < c.length; i += 2) {
        if (!any) {
          minX = maxX = c[i];
          minY = maxY = c[i + 1];
          any = true;
        } else {
          minX = Math.min(minX, c[i]);
          minY = Math.min(minY, c[i + 1]);
          maxX = Math.max(maxX, c[i]);
          maxY = Math.max(maxY, c[i + 1]);
        }
      }
    if (any) {
      this.glyph.xMin = Math.floor(minX);
      this.glyph.yMin = Math.floor(minY);
      this.glyph.xMax = Math.ceil(maxX);
      this.glyph.yMax = Math.ceil(maxY);
    }
    return this.glyph;
  }
}
