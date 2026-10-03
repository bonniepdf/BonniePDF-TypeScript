// Shared building blocks for the field & site showcases.
//
// A job sheet, a site inspection report, and a permit to work are different
// documents with different jobs, but they are the same *kind* of document: raised
// on site, about a physical asset, structured as a register of items, and
// finished by someone signing it. They share a visual grammar — a reference
// band, a fielded metadata grid, item registers with a severity or status
// column, and signature blocks — so that grammar lives here and each document
// carries only what makes it itself.
//
// Everything is authored through the options-object front door.

import {
  TextBlock,
  Heading,
  Container,
  EnsureSpace,
  VerticalStack,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type ColorInput,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────
// Slate ink with an indigo accent, per the shared example design tokens.

export const INK = ColorPalette.slate[700];
/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
export const MUTED = ColorPalette.slate[600];
export const HEADING = ColorPalette.slate[800];
export const ACCENT = ColorPalette.indigo[700];
export const RULE = ColorPalette.slate[200];
export const PANEL = ColorPalette.slate[50];

/**
 * Status ramp shared by all three documents.
 *
 * Deliberately not the traffic-light set a designer would reach for first: the
 * amber is 700 and the emerald 700 because 500/600 fall below 4.5:1 as small
 * text on white, and every one of these appears as a table cell.
 */
export const STATUS = {
  critical: ColorPalette.rose[700],
  high: ColorPalette.amber[700],
  medium: ColorPalette.blue[700],
  low: ColorPalette.slate[600],
  done: ColorPalette.emerald[700],
} as const;

// ── Text ─────────────────────────────────────────────────────────────────────

/** Small caps-style label above a title — the document's own classification. */
export function eyebrow(text: string, color: ColorInput = ACCENT): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 8.5,
    color: color,
    margin: { bottom: 4 },
  });
}

export function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 6 },
  });
}

export function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: ACCENT,
    margin: { top: 14, bottom: 8 },
  });
}

export function h3(text: string): Heading {
  return new Heading(text, {
    level: 3,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 10.5,
    color: HEADING,
    margin: { top: 8, bottom: 5 },
  });
}

export function body(
  text: string,
  opts: { color?: ColorInput; mb?: number; mt?: number; size?: number } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: opts.size ?? 9.5,
    color: opts.color ?? INK,
    margin: { top: opts.mt ?? 0, bottom: opts.mb ?? 8 },
  });
}

/** Table header cell — white on the accent header band. */
export function th(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 8.5,
    color: '#ffffff',
  });
}

/** Table body cell. */
export function td(text: string, opts: { color?: ColorInput; bold?: boolean; size?: number } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: opts.size ?? 8.5,
    color: opts.color ?? INK,
  });
}

// ── Structure ────────────────────────────────────────────────────────────────

/**
 * Keeps a heading with the start of whatever it introduces: the heading moves to the next page
 * unless `minHeight` points of room remain below it.
 */
export function keepWithNext(heading: Heading, minHeight = 120): EnsureSpace {
  return new EnsureSpace({ minHeight, child: heading });
}

/** A full-width accent rule; the visual top of every one of these documents. */
export function accentBar(color: ColorInput = ACCENT, height = 3): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** One label/value pair in the metadata grid. */
export function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [
      new TextBlock(label.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 6.5,
        color: MUTED,
        margin: { bottom: 2 },
      }),
      new TextBlock(value, { fontName: StandardFonts.Helvetica, fontSize: 9.5, color: INK }),
    ],
  });
}

/**
 * A row of label/value fields, evenly weighted.
 *
 * Field documents are read by someone standing up holding a clipboard or a
 * phone, so the reference data goes in a scannable grid at the top rather than
 * in prose.
 */
export function fieldRow(fields: IElement[], opts: { mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 14,
    margin: { top: 2, bottom: opts.mb ?? 14 },
  });
  for (const f of fields) row.add(f, 1);
  return row;
}

/** A bordered panel with a heading — used for notes, scope, and declarations. */
export function panel(title: string, children: IElement[], opts: { accent?: ColorInput } = {}): Container {
  return new Container({
    backgroundColor: PANEL,
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { bottom: 12 },
    child: new VerticalStack({
      spacing: 4,
      children: [
        new TextBlock(title, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 9.5,
          color: opts.accent ?? ACCENT,
          margin: { bottom: 4 },
        }),
        ...children,
      ],
    }),
  });
}

/** A coloured status/severity pill for a table cell. */
export function statusCell(text: string, color: ColorInput): Container {
  return new Container({
    child: new TextBlock(text, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 8,
      color: color,
    }),
  });
}

// ── Signature blocks ─────────────────────────────────────────────────────────

/**
 * A single ruled signature slot: name, role, a rule to sign on, and a date.
 *
 * This is drawn, not cryptographic. A drawn signature block is what these
 * documents carry in the field — the customer signs the engineer's tablet or
 * the printed sheet. Digital signing is a separate, separately-licensed concern
 * and nothing here should be read as claiming it.
 */
export function signatureSlot(role: string, name: string, opts: { dated?: string } = {}): VerticalStack {
  return new VerticalStack({
    spacing: 0,
    children: [
      new TextBlock(role.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 6.5,
        color: MUTED,
        margin: { bottom: 18 },
      }),
      // The rule people actually sign on.
      new Container({ backgroundColor: ColorPalette.slate[400], height: 0.75, margin: { bottom: 5 } }),
      new TextBlock(name, { fontName: StandardFonts.Helvetica, fontSize: 9, color: INK }),
      new TextBlock(opts.dated ? `Date: ${opts.dated}` : 'Date:', {
        fontName: StandardFonts.Helvetica,
        fontSize: 8,
        color: MUTED,
        margin: { top: 3 },
      }),
    ],
  });
}

/** A row of signature slots, evenly weighted. */
export function signatureRow(slots: IElement[]): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 22,
    margin: { top: 10, bottom: 4 },
    // A signature row is never split between pages.
    breakAllowed: false,
  });
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
