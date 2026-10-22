/**
 * The writer's view of element state that has no public accessor.
 *
 * `toDefinition` has to know things the code API deliberately hides: which text properties were set
 * (rather than defaulted or inherited from the document's default text style), the spans of a rich
 * text, the weights of a row's children and the column weights and sections of a table. Adding public
 * members for a serializer would widen the API for everyone, so the reads are gathered here, in one
 * file, through TypeScript's bracket escape hatch. Every one is exercised by the round-trip tests.
 */
import type { TextElementBase } from '../Elements/Text/TextElementBase';
import type { RichText } from '../Elements/Text/RichText';
import type { TextSpan } from '../Elements/Text/TextSpan';
import type { TextBlock } from '../Elements/Text/TextBlock';
import type { UnorderedList } from '../Elements/Lists/UnorderedList';
import type { OrderedList } from '../Elements/Lists/OrderedList';
import type { HorizontalStack } from '../Elements/Layout/HorizontalStack';
import type { Table } from '../Elements/Tables/Table';
import type { TableRow } from '../Elements/Tables/TableRow';

/** Which of a text element's cascade-aware properties were set on it. */
export interface ExplicitText {
  /** Any font property (family, name, weight, italic) was assigned. */
  font: boolean;
  fontSize: boolean;
  color: boolean;
  lineHeight: boolean;
  decoration: boolean;
}

export function explicitText(element: TextElementBase): ExplicitText {
  return {
    font: element['_fontExplicit'],
    fontSize: element['_fontSizeExplicit'],
    color: element['_textColorExplicit'],
    lineHeight: element['_lineHeightExplicit'],
    decoration: element['_textDecorationExplicit'],
  };
}

/** True when the font was chosen by family (so `fontFamily` is the name the author gave). */
export function fontChosenByFamily(element: TextElementBase): boolean {
  return element['_fontFamilyExplicit'] && element['_fontFamily'] !== undefined;
}

/** True when the font was named directly (`fontName`), bypassing family resolution. */
export function fontNamed(element: TextElementBase): boolean {
  return element['_fontFamilyExplicit'] && element['_fontFamily'] === undefined;
}

/** True when the weight / italic was assigned, rather than supplied by the default text style. */
export function fontWeightExplicit(element: TextElementBase): boolean {
  return element['_fontWeightExplicit'];
}
export function italicExplicit(element: TextElementBase): boolean {
  return element['_italicExplicit'];
}

/** True when the alignment was assigned; otherwise an enclosing container may supply one. */
export function alignmentExplicit(element: TextBlock | RichText): boolean {
  return (element as unknown as { _alignmentExplicit: boolean })._alignmentExplicit;
}

export function richTextSpans(element: RichText): readonly TextSpan[] {
  return element['spans'];
}

export function listItems(element: OrderedList | UnorderedList): readonly string[] {
  return element.items;
}

/** The weight given to each child of a row, `null` for a child added without one. */
export function stackWeights(element: HorizontalStack): readonly (number | null)[] {
  return element['widths'];
}

export function tableColumns(element: Table): readonly number[] {
  return element['columnWeights'];
}

export function tableSections(element: Table): {
  header: readonly TableRow[];
  rows: readonly TableRow[];
  footer: readonly TableRow[];
} {
  return { header: element['headers'], rows: element.rows, footer: element['footers'] };
}

/** True when the bullet colour was assigned; otherwise the bullets follow the text colour. */
export function bulletColorSet(element: UnorderedList): boolean {
  return (element as unknown as { _bulletColor: unknown })._bulletColor !== undefined;
}
