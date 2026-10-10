// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError, unsupported } from '../../Api/FontError';
export function scalars(text: string, hebrew = false, arabic = false): number[] {
  const result: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < text.length && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) cp = (cp - 0xd800) * 1024 + text.charCodeAt(++i) - 0xdc00 + 0x10000;
    else if (cp >= 0xd800 && cp <= 0xdfff) throw new FontError('ArgumentException', 'Text contains an unpaired surrogate.');
    if (cp < 32 || (cp >= 127 && cp <= 159)) unsupported('Only one printable text line is supported.');
    if ((!hebrew && cp >= 0x590 && cp <= 0x5ff) || (cp >= 0x600 && cp <= 0x8ff && !(arabic && (cp <= 0x6ff || (cp >= 0x750 && cp <= 0x77f) || cp >= 0x870))) || (cp >= 0x900 && cp <= 0x109f) || (!hebrew && ((cp >= 0x200e && cp <= 0x200f) || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069)))) unsupported('Complex-script and bidirectional layout are not implemented in the independent emoji shaper.');
    result.push(cp);
  }
  return result;
}
