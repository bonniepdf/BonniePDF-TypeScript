// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/**
 * A minimal XML reader for the SVG subset, hand-rolled because the engine
 * carries no dependencies and the browser's DOMParser is not available in
 * every target runtime.
 *
 * Security posture, which is the main reason not to reach for something
 * general: DOCTYPE and entity declarations are rejected outright rather than
 * processed. External entity expansion is the classic XXE vector, and an SVG
 * importer is exactly the kind of thing that gets pointed at untrusted input.
 * Only the five predefined entities and numeric character references are
 * resolved.
 */

export type XmlEvent =
  | { readonly kind: 'start'; readonly name: string; readonly attributes: ReadonlyMap<string, string>; readonly selfClosing: boolean }
  | { readonly kind: 'end'; readonly name: string }
  | { readonly kind: 'text'; readonly text: string };

export class SvgXmlError extends Error {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(`${message} (at offset ${offset})`);
    this.name = 'SvgXmlError';
    this.offset = offset;
  }
}

const PREDEFINED: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

export function resolveEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? safeFromCodePoint(code, whole) : whole;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? safeFromCodePoint(code, whole) : whole;
    }
    // An unknown named entity is left as written rather than dropped: it may be
    // literal text, and silently deleting content is worse than passing it on.
    return PREDEFINED[body] ?? whole;
  });
}

function safeFromCodePoint(code: number, fallback: string): string {
  // Surrogates and out-of-range values would throw; a malformed reference
  // should not take down the parse.
  if (code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return fallback;
  return String.fromCodePoint(code);
}

/** Read an SVG document as a flat event stream. No DOM is built. */
export function* readXml(source: string): Generator<XmlEvent> {
  let index = 0;

  while (index < source.length) {
    const open = source.indexOf('<', index);

    if (open === -1) {
      const trailing = source.slice(index);
      if (trailing.trim() !== '') yield { kind: 'text', text: resolveEntities(trailing) };
      return;
    }

    if (open > index) {
      const text = source.slice(index, open);
      if (text.trim() !== '') yield { kind: 'text', text: resolveEntities(text) };
    }

    // Comments, CDATA, processing instructions and declarations.
    if (source.startsWith('<!--', open)) {
      const close = source.indexOf('-->', open + 4);
      if (close === -1) throw new SvgXmlError('unterminated comment', open);
      index = close + 3;
      continue;
    }
    if (source.startsWith('<![CDATA[', open)) {
      const close = source.indexOf(']]>', open + 9);
      if (close === -1) throw new SvgXmlError('unterminated CDATA section', open);
      const text = source.slice(open + 9, close);
      // CDATA is literal: entities inside it are not references.
      if (text.trim() !== '') yield { kind: 'text', text };
      index = close + 3;
      continue;
    }
    if (source.startsWith('<?', open)) {
      const close = source.indexOf('?>', open + 2);
      if (close === -1) throw new SvgXmlError('unterminated processing instruction', open);
      index = close + 2;
      continue;
    }
    if (source.startsWith('<!', open)) {
      const declaration = source.slice(open + 2, open + 9).toUpperCase();
      if (declaration.startsWith('DOCTYPE') || declaration.startsWith('ENTITY')) {
        throw new SvgXmlError(
          'DOCTYPE and ENTITY declarations are refused: external entity expansion is an ' +
            'injection vector and this parser will not process them',
          open
        );
      }
      const close = source.indexOf('>', open);
      if (close === -1) throw new SvgXmlError('unterminated declaration', open);
      index = close + 1;
      continue;
    }

    if (source[open + 1] === '/') {
      const close = source.indexOf('>', open);
      if (close === -1) throw new SvgXmlError('unterminated end tag', open);
      yield { kind: 'end', name: localName(source.slice(open + 2, close).trim()) };
      index = close + 1;
      continue;
    }

    const tagEnd = findTagEnd(source, open);
    const raw = source.slice(open + 1, tagEnd.end);
    const selfClosing = raw.endsWith('/');
    const body = selfClosing ? raw.slice(0, -1) : raw;

    const nameMatch = /^([^ \t\n\r\f/>]+)/.exec(body);
    if (!nameMatch) throw new SvgXmlError('element has no name', open);

    yield {
      kind: 'start',
      name: localName(nameMatch[1]!),
      attributes: parseAttributes(body.slice(nameMatch[1]!.length), open),
      selfClosing,
    };
    index = tagEnd.end + 1;
  }
}

/**
 * Find the `>` that closes a start tag, ignoring any inside quoted attribute
 * values - a `>` in a quoted value is legal and scanning for the first one
 * truncates the tag.
 */
function findTagEnd(source: string, open: number): { end: number } {
  let quote: string | null = null;
  for (let i = open + 1; i < source.length; i++) {
    const ch = source[i]!;
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return { end: i };
    }
  }
  throw new SvgXmlError('unterminated start tag', open);
}

/**
 * Strip any namespace prefix.
 *
 * Real-world SVG is inconsistent about prefixes - Inkscape and Illustrator
 * exports carry `svg:` prefixes, `xlink:href` and plain `href` both appear -
 * and this engine's supported profile has no element whose meaning depends on
 * its namespace. Comparing local names is what makes those files work.
 */
function localName(name: string): string {
  const colon = name.indexOf(':');
  return colon === -1 ? name : name.slice(colon + 1);
}

function parseAttributes(text: string, offset: number): Map<string, string> {
  const attributes = new Map<string, string>();
  const pattern = /([^ \t\n\r\f=/>]+)[ \t\n\r\f]*=[ \t\n\r\f]*("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const value = match[3] ?? match[4] ?? '';
    // A prefixed namespace declaration means nothing once every prefix is
    // stripped, and its local name - `xmlns:xlink` becomes `xlink` - would read
    // as an attribute. A plain `xmlns` is kept: HTML inside <foreignObject>
    // needs it if that subtree is ever handed to a rasterizer.
    if (match[1]!.startsWith('xmlns:')) continue;
    // Local name, so `svg:width` and `width` are the same attribute - except
    // for xlink:href, whose local name `href` is what callers look for anyway.
    attributes.set(localName(match[1]!), resolveEntities(value));
  }

  // A bare attribute with no value is not valid XML; catching it here surfaces
  // corrupt input rather than silently dropping a property.
  const leftover = text.replace(pattern, '').trim();
  if (leftover !== '' && !/^[/ \t\n\r\f]*$/.test(leftover)) {
    throw new SvgXmlError(`malformed attributes: "${leftover}"`, offset);
  }

  return attributes;
}
