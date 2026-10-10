// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { requireInteger, FontError } from '../Api/FontError';
import { joiningType } from '../Unicode/Generated/ArabicData';
import { joiningGroup } from '../Unicode/Generated/LayoutUnicodeData';
/** Character properties for consumer policy; does not choose justification sites. */
export class ArabicJoining {
  static describe(scalar: number) {
    requireInteger(scalar,'scalar',0,0x10ffff);
    if (scalar >= 0xd800 && scalar <= 0xdfff) throw new FontError('ArgumentOutOfRangeException','scalar');
    const type = joiningType(scalar);
    return Object.freeze({ type, group: joiningGroup(scalar), isTatweel: scalar === 0x640,
      joinsBefore: 'DRC'.includes(type), joinsAfter: 'DLC'.includes(type) });
  }
}
