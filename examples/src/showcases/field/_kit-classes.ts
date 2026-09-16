// Shared building blocks for the field & site showcases — class API.
//
// The construct-then-mutate mirror of `_kit.ts`, for the `*-classes.ts`
// companions. Every helper here builds the same element tree as its
// options-object twin, one property assignment at a time and with the enum
// members rather than their string literals.
//
// Keep the two kits in step. A change to `_kit.ts` that is not mirrored here
// shows up as an equivalence failure, not as a silent divergence.

import {
  TextBlock,
  Heading,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  StandardFonts,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────

export const INK = ColorPalette.slate[700];
/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
export const MUTED = ColorPalette.slate[600];
export const HEADING = ColorPalette.slate[800];
export const ACCENT = ColorPalette.indigo[700];
export const RULE = ColorPalette.slate[200];
export const PANEL = ColorPalette.slate[50];

export const STATUS = {
  critical: ColorPalette.rose[700],
  high: ColorPalette.amber[700],
  medium: ColorPalette.blue[700],
  low: ColorPalette.slate[600],
  done: ColorPalette.emerald[700],
} as const;

// ── Text ─────────────────────────────────────────────────────────────────────

export function eyebrow(text: string, color: Color = ACCENT): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.HelveticaBold;
  block.fontSize = 8.5;
  block.textColor = color;
  block.margin = new Thickness(0, 0, 0, 4);
  return block;
}

export function h1(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 21;
  heading.textColor = HEADING;
  heading.margin = new Thickness(0, 0, 0, 6);
  return heading;
}

export function h2(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.textColor = ACCENT;
  heading.margin = new Thickness(0, 14, 0, 8);
  return heading;
}

export function h3(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 3;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 10.5;
  heading.textColor = HEADING;
  heading.margin = new Thickness(0, 8, 0, 5);
  return heading;
}

export function body(text: string, opts: { color?: Color; mb?: number; mt?: number; size?: number } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.Helvetica;
  block.fontSize = opts.size ?? 9.5;
  block.textColor = opts.color ?? INK;
  block.margin = new Thickness(0, opts.mt ?? 0, 0, opts.mb ?? 8);
  return block;
}

/** Table header cell — white on the accent header band. */
export function th(text: string): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.HelveticaBold;
  block.fontSize = 8.5;
  block.textColor = Color.white;
  return block;
}

/** Table body cell. */
export function td(text: string, opts: { color?: Color; bold?: boolean; size?: number } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = opts.size ?? 8.5;
  block.textColor = opts.color ?? INK;
  return block;
}

// ── Structure ────────────────────────────────────────────────────────────────

export function accentBar(color: Color = ACCENT, height = 3): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

/** One label/value pair in the metadata grid. */
export function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();

  const key = new TextBlock(label.toUpperCase());
  key.fontName = StandardFonts.HelveticaBold;
  key.fontSize = 6.5;
  key.textColor = MUTED;
  key.margin = new Thickness(0, 0, 0, 2);
  stack.add(key);

  const val = new TextBlock(value);
  val.fontName = StandardFonts.Helvetica;
  val.fontSize = 9.5;
  val.textColor = INK;
  stack.add(val);

  return stack;
}

export function fieldRow(fields: IElement[], opts: { mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 14;
  row.margin = new Thickness(0, 2, 0, opts.mb ?? 14);
  for (const f of fields) row.add(f, 1);
  return row;
}

export function panel(title: string, children: IElement[], opts: { accent?: Color } = {}): Container {
  const stack = new VerticalStack();
  stack.spacing = 4;

  const caption = new TextBlock(title);
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 9.5;
  caption.textColor = opts.accent ?? ACCENT;
  caption.margin = new Thickness(0, 0, 0, 4);
  stack.add(caption);
  for (const child of children) stack.add(child);

  const box = new Container();
  box.backgroundColor = PANEL;
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.margin = new Thickness(0, 0, 0, 12);
  box.child = stack;
  return box;
}

/** A coloured status/severity pill for a table cell. */
export function statusCell(text: string, color: Color): Container {
  const label = new TextBlock(text);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 8;
  label.textColor = color;

  const box = new Container();
  box.child = label;
  return box;
}

// ── Signature blocks ─────────────────────────────────────────────────────────

export function signatureSlot(role: string, name: string, opts: { dated?: string } = {}): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 0;

  const caption = new TextBlock(role.toUpperCase());
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 6.5;
  caption.textColor = MUTED;
  caption.margin = new Thickness(0, 0, 0, 18);
  stack.add(caption);

  // The rule people actually sign on.
  const rule = new Container();
  rule.backgroundColor = ColorPalette.slate[400];
  rule.height = 0.75;
  rule.margin = new Thickness(0, 0, 0, 5);
  stack.add(rule);

  const who = new TextBlock(name);
  who.fontName = StandardFonts.Helvetica;
  who.fontSize = 9;
  who.textColor = INK;
  stack.add(who);

  const when = new TextBlock(opts.dated ? `Date: ${opts.dated}` : 'Date:');
  when.fontName = StandardFonts.Helvetica;
  when.fontSize = 8;
  when.textColor = MUTED;
  when.margin = new Thickness(0, 3, 0, 0);
  stack.add(when);

  return stack;
}

export function signatureRow(slots: IElement[]): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 22;
  row.margin = new Thickness(0, 10, 0, 4);
  for (const s of slots) row.add(s, 1);
  return row;
}

// ── Formatting ───────────────────────────────────────────────────────────────

const GB_DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const GB_TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function shortDate(d: Date): string {
  return GB_DATE.format(d);
}

export function clockTime(d: Date): string {
  return GB_TIME.format(d);
}

/** Sterling, to two places. */
export function gbp(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

/** Decimal hours, as engineers record them: 1.5, 0.75. */
export function hours(value: number): string {
  return `${value.toFixed(2)} h`;
}
