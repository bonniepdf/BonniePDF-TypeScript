import type { TextElementBase } from './TextElementBase';
import type { ColorInput } from '../../Normalize/toColor';
import type { TextDecorationInput, DecorationStyleInput, FontWeightInput } from '../../Normalize/toEnum';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';

/**
 * Settable properties declared by {@link TextElementBase} itself - not counting
 * those inherited from `ElementBase`, which {@link ELEMENT_OPTION_KEYS} covers.
 */
export const TEXT_ELEMENT_OWN_OPTION_KEYS = [
  'fontName',
  'fontFamily',
  'fontWeight',
  'italic',
  'fontSize',
  'textColor',
  'textDecoration',
  'decorationColor',
  'decorationThickness',
  'decorationStyle',
  'letterSpacing',
  'wordSpacing',
  'lineHeight',
] as const;

/** The full settable surface of a text element, base included. */
export const TEXT_ELEMENT_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...TEXT_ELEMENT_OWN_OPTION_KEYS] as const;

type TextElementOwnKey = (typeof TEXT_ELEMENT_OWN_OPTION_KEYS)[number];

/** Keys whose accepted input is wider than the stored type (asymmetric accessor). */
type TextElementWidenedKey = 'fontWeight' | 'textColor' | 'textDecoration' | 'decorationColor' | 'decorationStyle';

/**
 * Options shared by every text element (`TextBlock`, `Heading`, `PageNumberOf`,
 * the list types). Intersects {@link ElementOptions}, mirroring the real
 * inheritance chain - get this layer right and five concrete types inherit
 * their options correctly.
 *
 * Note `fontName`, `fontFamily`, `fontWeight` and `italic` interact: setting
 * family/weight/italic triggers font re-resolution, so order of application
 * matters. `applyOptions` iterates in the object's own key order, which means a
 * caller who specifies both `fontName` and `fontFamily` gets whichever they
 * listed last - the same outcome as writing the two assignments in that order.
 */
export type TextElementOptions = ElementOptions &
  Partial<Omit<Pick<TextElementBase, TextElementOwnKey>, TextElementWidenedKey>> & {
    /** Font weight. Accepts `'bold'`, `'semi-bold'`, … or the numeric value. */
    fontWeight?: FontWeightInput;
    /** Text colour. Accepts a palette token (`'slate-800'`) or hex (`'#ff00aa'`). */
    textColor?: ColorInput;
    /** Decoration. Accepts one token or a list: `['underline', 'overline']`. */
    textDecoration?: TextDecorationInput;
    /** Decoration line colour. Accepts a palette token or hex. */
    decorationColor?: ColorInput;
    /** Decoration line style. Accepts `'solid' | 'wavy' | 'dashed' | 'dotted'`. */
    decorationStyle?: DecorationStyleInput;
  };
