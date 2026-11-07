/** A bistro dinner menu on a tall custom page: a serif masthead, courses with dotted leaders to right-aligned prices, and dietary marks with a key. */
import {
  CanvasElement,
  ColorPalette,
  Container,
  Document,
  Heading,
  HorizontalStack,
  PdfSize,
  StandardFonts,
  TextBlock,
  VerticalStack,
  type ColorInput,
} from '@bonniepdf/core';

const INK = 'stone-900';
const BODY = 'stone-600';
const ACCENT = 'amber-800';

/** A tall menu card, about two thirds of A4 wide. */
const MENU = new PdfSize(397, 700, 'Menu card');

/** Dietary marks: each mark's letters, its meaning, and the colour of its badge. */
const MARKS: Record<string, [string, ColorInput, ColorInput]> = {
  V: ['Vegetarian', 'emerald-100', 'emerald-800'],
  VG: ['Vegan', 'lime-100', 'lime-800'],
  GF: ['Gluten\u00a0free', 'amber-100', 'amber-900'],
};

/** The menu, by course: dish, description, price in pounds, and its dietary marks. */
const COURSES: [string, [string, string, string, string[]][]][] = [
  [
    'Small plates',
    [
      ['Roast squash soup', 'Sage brown butter, toasted seeds, sourdough', '7.50', ['V']],
      ['Cured trout', 'Pickled cucumber, dill crème fraîche, rye crisp', '9.50', ['GF']],
      ['Crispy cauliflower', 'Harissa, preserved lemon, herb yoghurt', '8.00', ['V', 'GF']],
    ],
  ],
  [
    'Mains',
    [
      ['Braised beef cheek', 'Celeriac purée, glazed shallots, red wine jus', '24.00', ['GF']],
      ['Hake, mussels & cider', 'Leeks, samphire, new potatoes', '22.50', []],
      ['Wild mushroom risotto', 'Aged parmesan, truffle oil, rocket', '18.00', ['V', 'GF']],
      ['Spiced chickpea stew', 'Charred flatbread, tahini, pomegranate', '16.50', ['VG']],
    ],
  ],
  [
    'Puddings',
    [
      ['Sticky toffee pudding', 'Salted caramel, clotted cream', '8.00', ['V']],
      ['Dark chocolate tart', 'Blood orange, crème fraîche', '8.50', ['V']],
      ['Poached pear', 'Spiced syrup, oat crumble, coconut sorbet', '7.50', ['VG', 'GF']],
    ],
  ],
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      pageSize: MENU,
      margin: 34,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: BODY },
    },
    metadata: { title: 'The Larder: dinner menu', author: 'The Larder', subject: 'Dinner menu with dietary marks' },
  });
  const bytes = assets.get('fonts/SourceSerif4-Regular.ttf');
  if (!bytes) throw new Error('Supply fonts/SourceSerif4-Regular.ttf.');
  const serif = doc.fonts.add(bytes).fontName;

  // ── Masthead ──
  doc.add(
    new Container({
      backgroundColor: 'stone-900',
      padding: [20, 18],
      margin: { bottom: 18 },
      child: new VerticalStack({
        spacing: 4,
        children: [
          new Heading('The Larder', { level: 1, fontName: serif, fontSize: 30, color: '#ffffff', alignment: 'center' }),
          new TextBlock('DINNER  ·  FROM 6PM', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 7.5,
            letterSpacing: 2,
            color: 'amber-300',
            alignment: 'center',
          }),
        ],
      }),
    })
  );

  // ── Courses ──
  for (const [course, dishes] of COURSES) {
    doc.add(
      new Heading(course, {
        level: 2,
        fontName: serif,
        fontSize: 17,
        color: ACCENT,
        alignment: 'center',
        margin: { top: 6, bottom: 8 },
      })
    );
    for (const [dish, description, price, marks] of dishes) doc.add(menuItem(serif, dish, description, price, marks));
  }

  // ── Dietary key ──
  const key = new HorizontalStack({ widthDistribution: 'auto', spacing: 12, margin: { top: 10 } });
  for (const [mark, [meaning, fill, ink]] of Object.entries(MARKS))
    key.add(
      new HorizontalStack({
        widthDistribution: 'auto',
        spacing: 4,
        children: [badge(mark, fill, ink), new TextBlock(meaning, { fontSize: 7.5 })],
      })
    );
  doc.add(new Container({ border: { top: 0.75, color: 'stone-300' }, padding: { top: 4 }, child: key }));
  doc.add(
    new TextBlock('Please tell us about any allergies before you order; our allergen guide lists every dish.', {
      fontSize: 7.5,
      color: 'stone-500',
      margin: { top: 6 },
    })
  );
  return doc;
}

// Local helpers used by this document.

/** One dish: its name, dotted leaders and price on the first line; its description and dietary marks beneath. */
function menuItem(serif: string, dish: string, description: string, price: string, marks: string[]): VerticalStack {
  const line = new HorizontalStack({ widthDistribution: 'weighted', spacing: 4 });
  // The name and price keep their own widths; the leaders take the rest.
  line.add(new TextBlock(dish, { fontName: serif, fontSize: 12, color: INK }));
  line.add(leaders(), 1);
  line.add(new TextBlock(price, { fontName: serif, fontSize: 12, color: INK }));
  const detail = new HorizontalStack({ widthDistribution: 'auto', spacing: 5 });
  detail.add(new TextBlock(description, { fontSize: 8.5 }));
  for (const mark of marks) detail.add(badge(mark, MARKS[mark][1], MARKS[mark][2]));
  return new VerticalStack({ spacing: 2, margin: { bottom: 10 }, children: [line, detail] });
}

/** A row of small dots from the dish to its price, drawn as decoration so screen readers skip it. */
function leaders(): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      for (let x = 2; x < size.width - 2; x += 4) canvas.fillCircle(x, size.height - 3, 0.6, ColorPalette.stone[400]);
    },
    { drawWidth: 0, drawHeight: 13, isDecorative: true }
  );
}

/** A dietary mark as a small rounded badge. */
function badge(mark: string, fill: ColorInput, ink: ColorInput): Container {
  return new Container({
    backgroundColor: fill,
    cornerRadius: 3,
    padding: [3, 1],
    child: new TextBlock(mark, { fontName: StandardFonts.HelveticaBold, fontSize: 6.5, color: ink }),
  });
}
