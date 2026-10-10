// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError } from '../Api/FontError';
export class UnicodeText {
  readonly points: readonly number[];
  readonly offsets: readonly number[];
  constructor(readonly text: string, maxTextLength = 65536) {
    if (typeof text !== 'string') throw new FontError('ArgumentNullException', 'Text is required.');
    if (!Number.isInteger(maxTextLength) || maxTextLength < 1 || maxTextLength > 2147483647 || text.length > maxTextLength) throw new FontError('ArgumentException', 'Unicode text length limit exceeded.');
    const points: number[] = [], offsets: number[] = [];
    for (let i = 0; i < text.length; i++) {
      offsets.push(i); let cp = text.charCodeAt(i);
      if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < text.length && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) cp = (cp - 0xd800) * 1024 + text.charCodeAt(++i) - 0xdc00 + 0x10000;
      else if (cp >= 0xd800 && cp <= 0xdfff) throw new FontError('ArgumentException', 'Text contains an unpaired surrogate.');
      points.push(cp);
    }
    offsets.push(text.length); this.points = Object.freeze(points); this.offsets = Object.freeze(offsets); Object.freeze(this);
  }
}
