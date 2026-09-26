// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { IDENTITY, multiply, rotation, scaling, skewX, skewY, translation, type Matrix } from '../Geometry/Matrix';
import { NumberScanner, SvgParseError } from './Tokens';

/**
 * Parse a `transform` attribute into a single matrix.
 *
 * SVG composes left to right: `transform="translate(a) rotate(b)"` means
 * translate the already-rotated content, i.e. the leftmost function is the
 * outermost. Getting this backwards is the classic transform bug, and it only
 * shows up once two non-commuting functions appear together - which is why
 * `12-group-transform.svg` pairs rotate with a non-uniform scale.
 */
export function parseTransform(input: string): Matrix {
  const text = input.trim();
  if (text === '') return IDENTITY;

  let result = IDENTITY;
  const pattern = /([a-zA-Z]+)[ \t\n\r\f]*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  let consumed = 0;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1]!.toLowerCase();
    const args = readNumbers(match[2]!, text, match.index);
    result = multiply(result, toMatrix(name, args, text, match.index));
    consumed = match.index + match[0].length;
  }

  // Trailing junk means the attribute was malformed; silently ignoring it hides
  // a transform that was meant to apply.
  if (text.slice(consumed).trim() !== '') {
    throw new SvgParseError('unparsed text in transform attribute', consumed, text);
  }

  return result;
}

function readNumbers(body: string, source: string, offset: number): number[] {
  const scanner = new NumberScanner(body);
  const values: number[] = [];
  try {
    while (!scanner.atEnd()) values.push(scanner.number());
  } catch {
    throw new SvgParseError('malformed transform arguments', offset, source);
  }
  return values;
}

function toMatrix(name: string, args: number[], source: string, offset: number): Matrix {
  const need = (count: number): void => {
    if (args.length < count) {
      throw new SvgParseError(`${name}() needs ${count} argument(s)`, offset, source);
    }
  };

  switch (name) {
    case 'translate':
      need(1);
      // A one-argument translate leaves y at 0.
      return translation(args[0]!, args[1] ?? 0);
    case 'scale':
      need(1);
      // A one-argument scale is uniform.
      return scaling(args[0]!, args[1] ?? args[0]!);
    case 'rotate': {
      need(1);
      const angle = args[0]!;
      if (args.length >= 3) {
        // Rotation about a point: translate to it, rotate, translate back.
        const cx = args[1]!;
        const cy = args[2]!;
        return multiply(multiply(translation(cx, cy), rotation(angle)), translation(-cx, -cy));
      }
      return rotation(angle);
    }
    case 'skewx':
      need(1);
      return skewX(args[0]!);
    case 'skewy':
      need(1);
      return skewY(args[0]!);
    case 'matrix':
      need(6);
      return { a: args[0]!, b: args[1]!, c: args[2]!, d: args[3]!, e: args[4]!, f: args[5]! };
    default:
      throw new SvgParseError(`unknown transform function "${name}"`, offset, source);
  }
}
