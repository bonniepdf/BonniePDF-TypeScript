import { FacturXError } from './FacturXError';
import { FacturXProfile } from './FacturXProfile';

/**
 * The invoice XML check behind {@link applyFacturX} (spec 04 §11.4).
 *
 * A small, single-pass well-formedness reader rather than a general XML parser: it exists to
 * answer two questions the Factur-X claim depends on (is this CII, and which profile does it
 * declare?) and to refuse input it cannot read safely. Document type declarations are refused
 * outright, so no entity is ever expanded. The rules are the specification's, not a platform
 * parser's, so every runtime accepts and rejects the same bytes.
 */

const CII_NAMESPACE = 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100';
const RAM_NAMESPACE = 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';

const EN16931 = 'urn:cen.eu:en16931:2017';
const GUIDELINES: ReadonlyMap<string, FacturXProfile> = new Map([
  ['urn:factur-x.eu:1p0:minimum', FacturXProfile.Minimum],
  ['urn:factur-x.eu:1p0:basicwl', FacturXProfile.BasicWl],
  [`${EN16931}#compliant#urn:factur-x.eu:1p0:basic`, FacturXProfile.Basic],
  [EN16931, FacturXProfile.En16931],
  [`${EN16931}#conformant#urn:factur-x.eu:1p0:extended`, FacturXProfile.Extended],
]);
const XRECHNUNG = /^urn:cen\.eu:en16931:2017#compliant#urn:xeinkauf\.de:kosit:xrechnung_[0-9]+\.[0-9]+$/;

/** The profile a BT-24 identifier declares, or `undefined` when it is not one core recognises. */
export function profileForGuideline(id: string): FacturXProfile | undefined {
  return GUIDELINES.get(id) ?? (XRECHNUNG.test(id) ? FacturXProfile.XRechnung : undefined);
}

/**
 * Checks `bytes` as Factur-X invoice XML and returns the profile its BT-24 identifier declares.
 * Throws {@link FacturXError} on the first failure, in the specification's order.
 */
export function checkFacturXXml(bytes: Uint8Array): { guideline: string; profile: FacturXProfile } {
  const text = decode(bytes);
  const { rootName, rootNamespace, guideline } = new Scanner(text).run();

  if (rootName !== 'CrossIndustryInvoice' || rootNamespace !== CII_NAMESPACE) {
    const found = rootNamespace ? `{${rootNamespace}}${rootName}` : rootName;
    throw new FacturXError('not-cii', `Factur-X invoice XML must be a CII CrossIndustryInvoice; the root is ${found}`);
  }
  const id = guideline === undefined ? '' : trimXmlWhitespace(guideline);
  if (id === '') {
    throw new FacturXError(
      'guideline-missing',
      'Factur-X invoice XML has no profile identifier (ExchangedDocumentContext/GuidelineSpecifiedDocumentContextParameter/ID)'
    );
  }
  const profile = profileForGuideline(id);
  if (profile === undefined) {
    throw new FacturXError(
      'guideline-unrecognized',
      `Factur-X invoice XML declares the profile identifier "${id}", which is not a Factur-X / ZUGFeRD 2.1+ profile`
    );
  }
  return { guideline: id, profile };
}

function decode(bytes: Uint8Array): string {
  if (bytes.length >= 2 && ((bytes[0] === 0xfe && bytes[1] === 0xff) || (bytes[0] === 0xff && bytes[1] === 0xfe))) {
    throw new FacturXError(
      'unsupported-encoding',
      'Factur-X invoice XML must be UTF-8; it starts with a UTF-16 byte order mark'
    );
  }
  const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(start));
  } catch {
    throw new FacturXError('malformed-xml', 'Factur-X invoice XML is not valid UTF-8');
  }

  // The declared encoding is checked before well-formedness, so a Latin-1 file is reported as
  // such even if the rest would also fail.
  if (text.startsWith('<?xml') && isDeclarationEnd(text.charCodeAt(5))) {
    const end = text.indexOf('?>');
    if (end !== -1) {
      const encoding = /\sencoding\s*=\s*(["'])([^"']*)\1/.exec(text.slice(5, end));
      if (encoding && encoding[2]!.toLowerCase() !== 'utf-8') {
        throw new FacturXError(
          'unsupported-encoding',
          `Factur-X invoice XML must be UTF-8; it declares encoding "${encoding[2]}"`
        );
      }
    }
  }
  return text;
}

function isDeclarationEnd(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d || c === 0x3f; // whitespace or '?'
}

function isXmlWhitespace(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
}

function trimXmlWhitespace(s: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && isXmlWhitespace(s.charCodeAt(start))) start++;
  while (end > start && isXmlWhitespace(s.charCodeAt(end - 1))) end--;
  return s.slice(start, end);
}

/** A UTF-16 code unit that may appear literally. Surrogates are paired: the text came from strict UTF-8. */
function isCharUnit(c: number): boolean {
  return c >= 0x20 ? c !== 0xfffe && c !== 0xffff : c === 0x09 || c === 0x0a || c === 0x0d;
}

function isCharCodePoint(c: number): boolean {
  return (
    c === 0x09 ||
    c === 0x0a ||
    c === 0x0d ||
    (c >= 0x20 && c <= 0xd7ff) ||
    (c >= 0xe000 && c <= 0xfffd) ||
    (c >= 0x10000 && c <= 0x10ffff)
  );
}

function isNameStart(c: number): boolean {
  return (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || c === 0x5f || c >= 0x80;
}

function isNameChar(c: number): boolean {
  return isNameStart(c) || (c >= 0x30 && c <= 0x39) || c === 0x2e || c === 0x2d;
}

function malformed(detail: string, offset: number): FacturXError {
  return new FacturXError('malformed-xml', `Factur-X invoice XML is not well-formed: ${detail} at offset ${offset}`);
}

const PREDEFINED: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

interface OpenElement {
  readonly qname: string;
  readonly namespaces: ReadonlyMap<string, string>;
  /** How far along the BT-24 path this element is: 1 root, 2 context, 3 parameter, 4 the ID. 0 off the path. */
  readonly step: number;
}

class Scanner {
  private pos = 0;
  private readonly stack: OpenElement[] = [];
  private rootSeen = false;
  private rootName = '';
  private rootNamespace: string | undefined;
  private capture: string | undefined;
  private guideline: string | undefined;
  private guidelineFound = false;

  constructor(private readonly s: string) {}

  run(): { rootName: string; rootNamespace: string | undefined; guideline: string | undefined } {
    const s = this.s;
    while (this.pos < s.length) {
      if (s.charCodeAt(this.pos) === 0x3c /* < */) this.markup();
      else this.text();
    }
    if (!this.rootSeen) throw malformed('no root element', this.pos);
    if (this.stack.length > 0) throw malformed(`<${this.stack[this.stack.length - 1]!.qname}> is not closed`, this.pos);
    return { rootName: this.rootName, rootNamespace: this.rootNamespace, guideline: this.guideline };
  }

  private markup(): void {
    const s = this.s;
    const at = this.pos;
    if (s.startsWith('<!--', at)) {
      const end = s.indexOf('-->', at + 4);
      if (end === -1) throw malformed('unterminated comment', at);
      this.checkChars(at + 4, end);
      this.pos = end + 3;
    } else if (s.startsWith('<![CDATA[', at)) {
      if (this.stack.length === 0) throw malformed('CDATA section outside the root element', at);
      const end = s.indexOf(']]>', at + 9);
      if (end === -1) throw malformed('unterminated CDATA section', at);
      this.checkChars(at + 9, end);
      if (this.capture !== undefined) this.capture += s.slice(at + 9, end);
      this.pos = end + 3;
    } else if (s.startsWith('<!DOCTYPE', at)) {
      throw new FacturXError(
        'doctype-forbidden',
        `Factur-X invoice XML must not contain a document type declaration (at offset ${at})`
      );
    } else if (s.startsWith('<!', at)) {
      throw malformed('unexpected declaration', at);
    } else if (s.startsWith('<?', at)) {
      this.processingInstruction(at);
    } else if (s.charCodeAt(at + 1) === 0x2f /* / */) {
      this.endTag(at);
    } else {
      this.startTag(at);
    }
  }

  private processingInstruction(at: number): void {
    const s = this.s;
    const end = s.indexOf('?>', at + 2);
    if (end === -1) throw malformed('unterminated processing instruction', at);
    let i = at + 2;
    while (i < end && !isXmlWhitespace(s.charCodeAt(i))) i++;
    const target = s.slice(at + 2, i);
    if (target === '') throw malformed('processing instruction without a target', at);
    if (target.toLowerCase() === 'xml' && at !== 0) throw malformed('XML declaration not at the start', at);
    this.checkChars(at + 2, end);
    this.pos = end + 2;
  }

  private endTag(at: number): void {
    const s = this.s;
    const nameEnd = this.readName(at + 2);
    const qname = s.slice(at + 2, nameEnd);
    const close = this.skipWhitespace(nameEnd);
    if (s.charCodeAt(close) !== 0x3e /* > */) throw malformed('malformed end tag', at);
    const open = this.stack.pop();
    if (!open) throw malformed(`end tag </${qname}> without a start tag`, at);
    if (open.qname !== qname) throw malformed(`end tag </${qname}> does not close <${open.qname}>`, at);
    this.closed(open);
    this.pos = close + 1;
  }

  private startTag(at: number): void {
    const s = this.s;
    if (this.rootSeen && this.stack.length === 0) throw malformed('content after the root element', at);
    let i = this.readName(at + 1);
    const qname = s.slice(at + 1, i);
    const attributes = new Map<string, string>();
    let selfClosing = false;

    for (;;) {
      const afterSpace = this.skipWhitespace(i);
      const c = s.charCodeAt(afterSpace);
      if (c === 0x3e /* > */) {
        i = afterSpace + 1;
        break;
      }
      if (c === 0x2f /* / */ && s.charCodeAt(afterSpace + 1) === 0x3e) {
        selfClosing = true;
        i = afterSpace + 2;
        break;
      }
      if (afterSpace >= s.length) throw malformed(`unterminated start tag <${qname}>`, at);
      if (afterSpace === i) throw malformed(`attributes of <${qname}> must be separated by whitespace`, afterSpace);
      const nameEnd = this.readName(afterSpace);
      const name = s.slice(afterSpace, nameEnd);
      let j = this.skipWhitespace(nameEnd);
      if (s.charCodeAt(j) !== 0x3d /* = */) throw malformed(`attribute ${name} has no value`, afterSpace);
      j = this.skipWhitespace(j + 1);
      const quote = s.charCodeAt(j);
      if (quote !== 0x22 && quote !== 0x27) throw malformed(`attribute ${name} value is not quoted`, j);
      const valueEnd = s.indexOf(String.fromCharCode(quote), j + 1);
      if (valueEnd === -1) throw malformed(`unterminated value for attribute ${name}`, j);
      const lt = s.indexOf('<', j + 1);
      if (lt !== -1 && lt < valueEnd) throw malformed(`'<' in attribute ${name}`, lt);
      if (attributes.has(name)) throw malformed(`duplicate attribute ${name}`, afterSpace);
      attributes.set(name, this.resolve(j + 1, valueEnd));
      i = valueEnd + 1;
    }

    const parent = this.stack[this.stack.length - 1];
    const namespaces = new Map(parent?.namespaces ?? [['xml', XML_NAMESPACE]]);
    for (const [name, value] of attributes) {
      if (name === 'xmlns') namespaces.set('', value);
      else if (name.startsWith('xmlns:')) {
        if (value === '') throw malformed(`empty namespace declaration ${name}`, at);
        namespaces.set(name.slice(6), value);
      }
    }
    for (const name of attributes.keys()) {
      const colon = name.indexOf(':');
      if (colon === -1) continue;
      const prefix = name.slice(0, colon);
      if (prefix !== 'xmlns' && !namespaces.has(prefix)) throw malformed(`undeclared prefix ${prefix}:`, at);
    }
    const colon = qname.indexOf(':');
    const prefix = colon === -1 ? '' : qname.slice(0, colon);
    const local = colon === -1 ? qname : qname.slice(colon + 1);
    if (prefix !== '' && !namespaces.has(prefix)) throw malformed(`undeclared prefix ${prefix}:`, at);
    const ns = namespaces.get(prefix) || undefined;

    let step = 0;
    if (!parent) {
      this.rootSeen = true;
      this.rootName = local;
      this.rootNamespace = ns;
      step = 1;
    } else if (parent.step === 1 && local === 'ExchangedDocumentContext' && ns === CII_NAMESPACE) step = 2;
    else if (parent.step === 2 && local === 'GuidelineSpecifiedDocumentContextParameter' && ns === RAM_NAMESPACE)
      step = 3;
    else if (parent.step === 3 && local === 'ID' && ns === RAM_NAMESPACE && !this.guidelineFound) step = 4;

    const element: OpenElement = { qname, namespaces, step };
    if (step === 4) {
      this.guidelineFound = true;
      this.capture = '';
    }
    if (selfClosing) this.closed(element);
    else this.stack.push(element);
    this.pos = i;
  }

  private closed(element: OpenElement): void {
    if (element.step === 4) {
      this.guideline = this.capture;
      this.capture = undefined;
    }
  }

  private text(): void {
    const s = this.s;
    const at = this.pos;
    let end = s.indexOf('<', at);
    if (end === -1) end = s.length;
    if (this.stack.length === 0) {
      for (let i = at; i < end; i++) {
        if (!isXmlWhitespace(s.charCodeAt(i))) throw malformed('text outside the root element', i);
      }
    } else {
      const value = this.resolve(at, end);
      const top = this.stack[this.stack.length - 1]!;
      if (this.capture !== undefined && top.step === 4) this.capture += value;
    }
    this.pos = end;
  }

  /** Validates characters and references in `[start, end)` and returns the text with references resolved. */
  private resolve(start: number, end: number): string {
    const s = this.s;
    let out = '';
    let i = start;
    while (i < end) {
      const c = s.charCodeAt(i);
      if (c !== 0x26 /* & */) {
        if (!isCharUnit(c)) throw malformed(`character U+${c.toString(16).toUpperCase().padStart(4, '0')}`, i);
        out += s[i];
        i++;
        continue;
      }
      const semi = s.indexOf(';', i + 1);
      if (semi === -1 || semi >= end) throw malformed("'&' that does not begin a reference", i);
      const body = s.slice(i + 1, semi);
      if (body.startsWith('#')) {
        const hex = body.startsWith('#x');
        const digits = body.slice(hex ? 2 : 1);
        if (digits === '' || !(hex ? /^[0-9a-fA-F]+$/ : /^[0-9]+$/).test(digits) || digits.length > 8) {
          throw malformed(`character reference &${body};`, i);
        }
        const code = Number.parseInt(digits, hex ? 16 : 10);
        if (!isCharCodePoint(code)) throw malformed(`character reference &${body};`, i);
        out += String.fromCodePoint(code);
      } else {
        const value = PREDEFINED[body];
        if (value === undefined) throw malformed(`unknown entity &${body};`, i);
        out += value;
      }
      i = semi + 1;
    }
    return out;
  }

  private checkChars(start: number, end: number): void {
    for (let i = start; i < end; i++) {
      const c = this.s.charCodeAt(i);
      if (!isCharUnit(c)) throw malformed(`character U+${c.toString(16).toUpperCase().padStart(4, '0')}`, i);
    }
  }

  /** Reads a QName starting at `start` and returns the index after it. */
  private readName(start: number): number {
    const s = this.s;
    let i = start;
    while (i < s.length && (isNameChar(s.charCodeAt(i)) || s.charCodeAt(i) === 0x3a)) i++;
    const name = s.slice(start, i);
    const colon = name.indexOf(':');
    if (
      name === '' ||
      !isNameStart(name.charCodeAt(0)) ||
      (colon !== -1 && (colon === name.length - 1 || name.indexOf(':', colon + 1) !== -1))
    ) {
      throw malformed(name === '' ? 'missing name' : `invalid name ${name}`, start);
    }
    return i;
  }

  private skipWhitespace(i: number): number {
    while (i < this.s.length && isXmlWhitespace(this.s.charCodeAt(i))) i++;
    return i;
  }
}
