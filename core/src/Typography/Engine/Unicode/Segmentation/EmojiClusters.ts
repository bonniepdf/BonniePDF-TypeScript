// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import * as Emoji from '../Generated/EmojiData';
import * as Unicode from '../Generated/UnicodeData';
import type { ScalarCluster } from './ScalarCluster';

export { scalars } from './TextScalars';

export function split(points: readonly number[], joinLeading = true): ScalarCluster[] {
  const bounds = [0]; let regional = points.length && Emoji.isRegional(points[0]) ? 1 : 0;
  let lastPictographic = points.length > 0 && Emoji.isExtendedPictographic(points[0]), pictographicBeforeJoiner = false;
  for (let i = 1; i < points.length; i++) {
    const cp = points[i], prior = points[i - 1], extend = Emoji.isExtend(cp);
    const joined = prior === 0x200d && ((pictographicBeforeJoiner && Emoji.isExtendedPictographic(cp)) || (joinLeading && i === 1));
    const attaches = extend || Emoji.isSpacingMark(cp) || Unicode.isMark(cp) || cp === 0x200d || joined || (Emoji.isRegional(cp) && Emoji.isRegional(prior) && regional % 2 === 1);
    if (!attaches) bounds.push(i);
    if (cp === 0x200d) pictographicBeforeJoiner = lastPictographic;
    if (!extend) lastPictographic = Emoji.isExtendedPictographic(cp);
    regional = Emoji.isRegional(cp) ? regional + 1 : 0;
  }
  if (points.length) bounds.push(points.length);
  const result: ScalarCluster[] = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const start = bounds[i], end = bounds[i + 1]; let emoji = false, textPresentation = false;
    for (let j = start; j < end; j++) { const cp = points[j]; emoji ||= Emoji.isPresentation(cp) || (cp === 0xfe0f && j > start && Emoji.isEmoji(points[j - 1])); textPresentation ||= cp === 0xfe0e; }
    const sequenceKind = Emoji.sequenceKind(points, start, end); emoji = (emoji || sequenceKind !== 0) && !textPresentation;
    result.push({ start, end, emoji, textPresentation, sequenceKind });
  }
  return result;
}
