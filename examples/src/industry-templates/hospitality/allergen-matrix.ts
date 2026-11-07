/** A kitchen allergen guide on landscape A4: every dish against the 14 allergens named in UK food law, marked contains or may contain, as a table screen readers can navigate. */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  StandardFonts,
  Table,
  TableCell,
  TextBlock,
  type ColorInput,
} from '@bonniepdf/core';

/** The 14 allergens UK food law requires a business to declare, in the order the Food Standards Agency lists them. */
const ALLERGENS = [
  'Celery',
  'Cereals with gluten',
  'Crustaceans',
  'Eggs',
  'Fish',
  'Lupin',
  'Milk',
  'Molluscs',
  'Mustard',
  'Tree nuts',
  'Peanuts',
  'Sesame',
  'Soya',
  'Sulphites',
];

/** The menu, by course: each dish with the allergens it contains and those it may contain traces of. */
const COURSES: [string, [string, string[], string[]][]][] = [
  [
    'Small plates',
    [
      ['Roast squash soup', ['Celery', 'Cereals with gluten', 'Milk'], ['Sesame']],
      ['Cured trout', ['Cereals with gluten', 'Fish', 'Milk', 'Mustard'], []],
      ['Crispy cauliflower', ['Milk'], ['Sesame']],
    ],
  ],
  [
    'Mains',
    [
      ['Braised beef cheek', ['Celery', 'Milk', 'Sulphites'], []],
      ['Hake, mussels & cider', ['Celery', 'Fish', 'Milk', 'Molluscs', 'Sulphites'], ['Crustaceans']],
      ['Wild mushroom risotto', ['Celery', 'Milk', 'Sulphites'], []],
      ['Spiced chickpea stew', ['Celery', 'Cereals with gluten', 'Sesame'], ['Mustard']],
    ],
  ],
  [
    'Puddings',
    [
      ['Sticky toffee pudding', ['Cereals with gluten', 'Eggs', 'Milk', 'Sulphites'], ['Tree nuts']],
      ['Dark chocolate tart', ['Cereals with gluten', 'Eggs', 'Milk', 'Soya'], ['Tree nuts', 'Peanuts']],
      ['Poached pear', [], ['Tree nuts']],
    ],
  ],
];

/** How each answer is shown: its word, the cell's fill and the word's colour. */
const CONTAINS: [string, ColorInput | undefined, ColorInput] = ['Yes', 'rose-100', 'rose-800'];
const TRACE: [string, ColorInput | undefined, ColorInput] = ['Trace', 'amber-100', 'amber-900'];
const ABSENT: [string, ColorInput | undefined, ColorInput] = ['No', undefined, 'stone-500'];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 30,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: 'stone-700' },
    },
    metadata: {
      title: 'The Larder: allergen guide',
      author: 'The Larder',
      subject: 'Allergens in every dish on the dinner menu',
    },
  });
  const bytes = assets.get('fonts/SourceSerif4-Regular.ttf');
  if (!bytes) throw new Error('Supply fonts/SourceSerif4-Regular.ttf.');
  const serif = doc.fonts.add(bytes).fontName;

  // ── Title and review line ──
  const top = new HorizontalStack({ widthDistribution: 'equal', margin: { bottom: 12 } });
  top.add(new Heading('Allergen guide', { level: 1, fontName: serif, fontSize: 24, color: 'stone-900' }));
  top.add(
    new TextBlock('The Larder  ·  Dinner menu\nReviewed 5 November 2026 by the head chef', {
      alignment: 'right',
      color: 'stone-500',
    })
  );
  doc.add(top);

  // ── The matrix: one row per dish, one column per allergen ──
  const matrix = new Table({
    columns: [3.2, ...ALLERGENS.map(() => 1)],
    cellPadding: 7,
    border: { width: 0.5, color: 'stone-300' },
    headerBackgroundColor: 'stone-900',
    headerTextColor: '#ffffff',
    margin: { bottom: 12 },
  });
  matrix.addHeader([
    new TableCell({ content: new TextBlock('Dish', { fontName: StandardFonts.HelveticaBold, fontSize: 8 }) }),
    ...ALLERGENS.map(
      name =>
        new TableCell({
          padding: [2, 7],
          content: new TextBlock(name, { fontName: StandardFonts.HelveticaBold, fontSize: 7, alignment: 'center' }),
        })
    ),
  ]);
  for (const [course, dishes] of COURSES) {
    matrix.addRow([
      new TableCell({
        columnSpan: ALLERGENS.length + 1,
        backgroundColor: 'amber-50',
        content: new TextBlock(course, { fontName: serif, fontSize: 11, color: 'amber-800' }),
      }),
    ]);
    for (const [dish, contains, traces] of dishes)
      matrix.addRow([
        new TableCell({ content: new TextBlock(dish, { fontName: serif, fontSize: 11, color: 'stone-900' }) }),
        ...ALLERGENS.map(name => answer(contains.includes(name) ? CONTAINS : traces.includes(name) ? TRACE : ABSENT)),
      ]);
  }
  doc.add(matrix);

  // ── Key and kitchen note ──
  const key = new HorizontalStack({ widthDistribution: 'auto', spacing: 6, margin: { bottom: 8 } });
  key.add(swatch(CONTAINS));
  key.add(new TextBlock('The dish contains this allergen as an ingredient.', { fontSize: 8, margin: { right: 14 } }));
  key.add(swatch(TRACE));
  key.add(new TextBlock('Made in a kitchen that handles it; traces are possible.', { fontSize: 8 }));
  doc.add(key);
  doc.add(
    new TextBlock(
      'Recipes and suppliers change. Please tell your server about any allergy before you order, and ask to see the recipe sheet for a dish; we cannot guarantee that any dish is free of an allergen.',
      { fontSize: 8, color: 'stone-500' }
    )
  );
  return doc;
}

// Local helpers used by this document.

/** One cell of the matrix: the answer as a word, on a tinted chip that shows it at a glance. */
function answer([word, fill, ink]: [string, ColorInput | undefined, ColorInput]): TableCell {
  return new TableCell({
    padding: 3,
    content: new Container({
      backgroundColor: fill,
      cornerRadius: 3,
      padding: 4,
      child: new TextBlock(word, {
        fontName: word === 'No' ? StandardFonts.Helvetica : StandardFonts.HelveticaBold,
        fontSize: 7.5,
        color: ink,
        alignment: 'center',
      }),
    }),
  });
}

/** The key's sample of an answer cell. */
function swatch([word, fill, ink]: [string, ColorInput | undefined, ColorInput]): Container {
  return new Container({
    backgroundColor: fill,
    cornerRadius: 3,
    padding: [6, 2],
    child: new TextBlock(word, { fontName: StandardFonts.HelveticaBold, fontSize: 7.5, color: ink }),
  });
}
