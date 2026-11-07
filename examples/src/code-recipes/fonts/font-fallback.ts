/** An international customer list in Helvetica, with Polish, Greek, Cyrillic, Hebrew, Arabic and maths falling back to fonts that cover them. */
import { Document, Heading, MissingGlyphException, StandardFonts, Table, TextBlock } from '@bonniepdf/core';

/** The fallback fonts this document registers, in the order they are tried. */
const FONTS: [path: string, family: string][] = [
  ['fonts/NotoNaskhArabic-Regular.ttf', 'Noto Naskh Arabic'],
  ['fonts/NotoSansMath-Regular.ttf', 'Noto Sans Math'],
];

/** [customer, city, order total, the font that draws the name] */
const CUSTOMERS: [string, string, string, string][] = [
  ['Zoë Müller', 'Zürich', 'CHF 1,240', 'Helvetica'],
  ['Łukasz Wójcik', 'Łódź', '4 980 zł', 'Liberation Sans, Helvetica’s substitute'],
  ['Αλεξάνδρα Παππά', 'Αθήνα', '€ 2,315', 'Liberation Sans'],
  ['Дмитрий Соколов', 'Санкт-Петербург', '€ 1,870', 'Liberation Sans'],
  ['יעל כהן', 'חיפה', '₪ 3,900', 'Liberation Sans'],
  ['نور حداد', 'عمّان', 'JOD 640', 'Noto Naskh Arabic, registered here'],
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    metadata: { title: 'Font fallback and missing characters' },
    settings: {
      language: 'en-GB',
      // Strict checking: a character no font can draw is an error, not a silent gap.
      missingGlyphs: 'throw',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10.5, color: 'slate-700' },
    },
  });
  for (const [path, family] of FONTS) {
    const bytes = assets.get(path);
    if (!bytes) throw new Error(`Supply ${path}.`);
    doc.fonts.add(bytes, { family });
  }

  doc.add(
    new Heading('International customers', {
      level: 1,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      fontSize: 24,
      color: 'slate-900',
      margin: { bottom: 6 },
    })
  );
  doc.add(
    new TextBlock(
      'Everything here is set in Helvetica. Where a name needs a character Helvetica does not have, that run falls back: first to Liberation Sans, Helvetica’s metric-compatible substitute, then to the fonts this document registers, in order.',
      { lineHeight: 1.45, margin: { bottom: 16 } }
    )
  );

  const table = new Table({
    columns: [2.4, 2.2, 1.3, 2.6],
    cellPadding: 7,
    headerBackgroundColor: 'slate-800',
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    cell('Customer', { bold: true }),
    cell('City', { bold: true }),
    cell('Orders', { bold: true, right: true }),
    cell('Name drawn in', { bold: true })
  );
  for (const [customer, city, total, font] of CUSTOMERS) {
    table.addRow(
      cell(customer, { size: 12 }),
      cell(city, { size: 12 }),
      cell(total, { right: true }),
      cell(font, { muted: true })
    );
  }
  doc.add(table);

  doc.add(
    new Heading('Symbols', {
      level: 2,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      fontSize: 14,
      color: 'slate-900',
      margin: { top: 20, bottom: 6 },
    })
  );
  doc.add(
    new TextBlock('Shipping rule:  ∀ parcel ∈ order:  weight ≤ 30 kg  ⇒  standard rate,  else  rate ⊕ surcharge', {
      fontSize: 12,
    })
  );
  doc.add(
    new TextBlock(
      '∀, ∈, ⇒ and ⊕ come from Noto Sans Math, registered here; ≤ comes from Liberation Sans; the letters stay in Helvetica.',
      {
        fontSize: 9,
        color: 'slate-500',
        margin: { top: 4 },
      }
    )
  );

  doc.add(
    new TextBlock(
      'This document asks for strict glyph checking, so a character that no font covers raises MissingGlyphException instead of silently disappearing.',
      { margin: { top: 20 }, fontSize: 9.5 }
    )
  );
  return doc;
}

/** A deliberate failure suitable for CI; never put the unsupported character in a real invoice. */
export async function verifyMissingCharacter(assets: ReadonlyMap<string, Uint8Array>): Promise<void> {
  const doc = generate(assets);
  try {
    doc.add(new TextBlock(String.fromCodePoint(0x10ffff)));
    try {
      await doc.generateBytesAsync();
    } catch (error) {
      if (error instanceof MissingGlyphException) return;
      throw error;
    }
    throw new Error('The unsupported character should fail strict glyph checking.');
  } finally {
    doc.dispose();
  }
}

// Local helpers used by this document.

/** A table cell: bold, right-aligned, muted or larger on request. */
function cell(
  text: string,
  style: { bold?: boolean; right?: boolean; muted?: boolean; size?: number } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: style.bold ? StandardFonts.HelveticaBold : undefined,
    fontSize: style.size ?? 10,
    alignment: style.right ? 'right' : 'left',
    color: style.muted ? 'slate-500' : undefined,
  });
}
