// Shared building blocks for the regional invoice showcases (US / UK / EU / Asia).
//
// Each regional invoice differs in its *tax and compliance* story - US sales
// tax, UK VAT, EU reverse-charge / EN 16931, India GST with an IRN + QR - but
// they share the same visual grammar: a header band, a bill-to / details block,
// a line-items table, and a totals stack. This kit captures that grammar so the
// four files stay tight and only carry what actually makes them regional.

import {
  TextBlock,
  TextAlignment,
  StandardFonts,
  Color,
  ColorPalette,
  Thickness,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
} from '@bonniepdf/core';
import type { IElement, TextAlignmentInput } from '@bonniepdf/core';

export const INK = ColorPalette.slate[700];
export const MUTED = ColorPalette.slate[500];
export const FAINT = ColorPalette.slate[400];
export const HEADER_BG = ColorPalette.slate[100];
export const RULE = ColorPalette.slate[200];

export interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: Color;
  /** Text alignment. Accepts the `TextAlignment` enum or a token (`'left'`, `'right'`, …). */
  align?: TextAlignmentInput;
  margin?: Thickness;
}

/** A styled text cell with invoice-friendly defaults (9pt Helvetica, slate ink). */
export function cell(text: string, o: CellOpts = {}): TextBlock {
  const b = new TextBlock(text);
  b.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = o.size ?? 9;
  b.textColor = o.color ?? INK;
  if (o.align) b.alignment = o.align;
  if (o.margin) b.margin = o.margin;
  return b;
}

/** A right-aligned monetary cell using the region's symbol and locale. */
export function money(value: number, symbol: string, locale = 'en-US'): string {
  return symbol + value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A block of plain text lines, e.g. a postal address. A single TextBlock
 * using hard `\n` breaks, so the block tags as one paragraph under PDF/UA. */
export function lines(items: string[], o: CellOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
}

/** A labelled block: a bold eyebrow label over a body stack, returned in a
 * Container so callers can add padding/background to the block. */
export function labelled(label: string, body: IElement, accent: Color): Container {
  const stack = new VerticalStack();
  stack.add(cell(label, { bold: true, size: 8, color: accent, margin: new Thickness(0, 0, 0, 5) }));
  stack.add(body);
  const box = new Container();
  box.child = stack;
  return box;
}

/** A single "label ....... value" totals line, weighted so the value hugs the right edge. */
export function totalLine(
  label: string,
  value: string,
  o: { bold?: boolean; size?: number; color?: Color } = {}
): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 3, 0, 3);
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: TextAlignment.Right }), 2);
  return row;
}

/** A thin horizontal divider used between totals and the grand total. */
export function divider(color: Color = INK, thickness = 0.6): Container {
  const d = new Container();
  d.backgroundColor = color;
  d.padding = new Thickness(0, thickness, 0, 0);
  d.margin = new Thickness(0, 5, 0, 5);
  const spacer = new TextBlock(' ');
  spacer.fontSize = 1;
  d.child = spacer;
  return d;
}

/** A full-width coloured accent bar - the top rule that anchors each invoice. */
export function accentBar(color: Color, height = 5): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.padding = new Thickness(0, height / 2, 0, height / 2);
  const spacer = new TextBlock(' ');
  spacer.fontSize = 1;
  bar.child = spacer;
  return bar;
}

export interface LineItem {
  description: string;
  detail?: string;
  qty: number;
  unitPrice: number;
  /** Region tax hint shown in a dedicated column (e.g. VAT rate, HSN code, tax code). */
  taxNote?: string;
}
