/** One order-confirmation letter in French, Greek, Arabic and Hebrew: the same letterhead and layout, mirrored for right-to-left Arabic and Hebrew. Each letter is set in a font for its script; digits the Hebrew face lacks come from the document's Latin font. */
import {
  Container,
  Document,
  HorizontalStack,
  Heading,
  PageBreak,
  StandardFonts,
  Table,
  TextBlock,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';

interface Letter {
  font: string;
  rtl: boolean;
  title: string;
  address: string;
  date: string;
  body: string;
  columns: [string, string, string];
  items: [string, string, string][];
  total: [string, string];
  signOff: string;
}

const LETTERS: Letter[] = [
  {
    font: 'NotoSans-Regular.ttf',
    rtl: false,
    title: 'Confirmation de votre commande',
    address: 'Madame Zoë Martin\n18 rue des Écoles\n75005 Paris',
    date: '25 octobre 2026',
    body: 'Merci pour votre commande. Elle est confirmée et sera livrée à votre adresse sous cinq jours ouvrés. Vous en trouverez le détail ci-dessous ; merci de conserver cette lettre.',
    columns: ['Article', 'Qté', 'Prix'],
    items: [
      ['Lampe de lecture en laiton', '1', '120,00 €'],
      ['Plaid en lin', '1', '54,00 €'],
    ],
    total: ['Total', '174,00 €'],
    signOff: 'Cordialement,\nLe service client',
  },
  {
    font: 'NotoSans-Regular.ttf',
    rtl: false,
    title: 'Επιβεβαίωση παραγγελίας',
    address: 'Κυρία Ελένη Παπαδοπούλου\nΟδός Ερμού 24\n105 63 Αθήνα',
    date: '25 Οκτωβρίου 2026',
    body: 'Σας ευχαριστούμε για την παραγγελία σας. Επιβεβαιώθηκε και θα παραδοθεί στη διεύθυνσή σας μέσα σε πέντε εργάσιμες ημέρες. Θα βρείτε τις λεπτομέρειες παρακάτω· παρακαλούμε κρατήστε αυτή την επιστολή.',
    columns: ['Προϊόν', 'Ποσ.', 'Τιμή'],
    items: [
      ['Ορειχάλκινο φωτιστικό ανάγνωσης', '1', '120,00 €'],
      ['Λινό ριχτάρι', '1', '54,00 €'],
    ],
    total: ['Σύνολο', '174,00 €'],
    signOff: 'Με εκτίμηση,\nΕξυπηρέτηση πελατών',
  },
  {
    font: 'NotoNaskhArabic-Regular.ttf',
    rtl: true,
    title: 'تأكيد الطلب',
    address: 'السيدة مريم العتيبي\nحي العليا، الرياض 12214',
    date: '25 أكتوبر 2026',
    body: 'شكراً لطلبكم. تم تأكيد الطلب وسيصل إلى عنوانكم خلال خمسة أيام عمل. يرجى مراجعة تفاصيل الطلب أدناه والاحتفاظ بهذه الرسالة.',
    columns: ['المنتج', 'الكمية', 'السعر'],
    items: [
      ['مصباح قراءة نحاسي', '1', '450.00 ر.س'],
      ['غطاء من الكتان', '1', '205.00 ر.س'],
    ],
    total: ['المجموع', '655.00 ر.س'],
    signOff: 'مع أطيب التحيات،\nخدمة العملاء',
  },
  {
    // The Hebrew face has no digits: they fall back to the Latin font added for the French letter.
    font: 'NotoSerifHebrew-Regular.ttf',
    rtl: true,
    title: 'אישור הזמנה',
    address: 'גב׳ מרים לוי\nרחוב הרצל 12\nתל אביב 6578210',
    date: '25 באוקטובר 2026',
    body: 'תודה על הזמנתכם. ההזמנה אושרה ותגיע לכתובתכם בתוך חמישה ימי עסקים. פרטי ההזמנה מופיעים להלן; נא לשמור מכתב זה.',
    columns: ['מוצר', 'כמות', 'מחיר'],
    items: [
      ['מנורת קריאה מפליז', '1', '480.00 ₪'],
      ['שמיכת פשתן', '1', '215.00 ₪'],
    ],
    total: ['סה״כ', '695.00 ₪'],
    signOff: 'בברכה,\nשירות הלקוחות',
  },
];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    metadata: { title: 'Multilingual customer letter' },
    settings: {
      language: 'en-GB',
      margin: 48,
      footerTemplate: pageTemplate({
        default: new TextBlock('Atlas Homewares Ltd  ·  12 Exmouth Market, London EC1R 4QE  ·  atlas.example', {
          fontSize: 8,
          color: 'slate-500',
          alignment: 'center',
        }),
      }),
    },
  });

  // Each font is added once, however many letters use it.
  const faces = new Map<string, ReturnType<typeof doc.fonts.add>>();
  const addFace = (file: string) => {
    const bytes = assets.get(`fonts/${file}`);
    if (!bytes) throw new Error(`Supply fonts/${file}.`);
    const face = doc.fonts.add(bytes);
    faces.set(file, face);
    return face;
  };

  LETTERS.forEach((letter, index) => {
    if (index) doc.add(new PageBreak());
    const face = faces.get(letter.font) ?? addFace(letter.font);
    const body = (
      text: string,
      extra: { size?: number; color?: 'slate-500' | 'slate-900' | '#ffffff'; align?: 'start' | 'end' } = {}
    ) =>
      new TextBlock(text, {
        fontName: face.fontName,
        fontSize: extra.size ?? 11,
        color: extra.color ?? 'slate-700',
        alignment: extra.align ?? 'start',
        lineHeight: 1.5,
      });

    // The letterhead is the same on every page, in the brand's own (Latin) lettering.
    doc.add(
      new Container({
        border: { bottom: 2, color: 'teal-600' },
        padding: { bottom: 10 },
        margin: { bottom: 28 },
        child: new HorizontalStack({
          widthDistribution: 'equal',
          children: [
            new TextBlock('ATLAS HOMEWARES', {
              fontName: StandardFonts.HelveticaBold,
              fontSize: 16,
              letterSpacing: 2,
              color: 'teal-700',
            }),
            new TextBlock('London  ·  Paris  ·  Athens  ·  Riyadh', {
              fontSize: 9,
              color: 'slate-500',
              alignment: 'right',
            }),
          ],
        }),
      })
    );

    // Everything below follows the letter's direction: start is the right edge in Arabic and Hebrew, and
    // the order table's columns mirror.
    const table = new Table({
      columns: [4, 1, 1.6],
      cellPadding: 7,
      headerBackgroundColor: 'teal-700',
      headerTextColor: '#ffffff',
      border: { width: 0.5, color: 'slate-200' },
    });
    table.addHeader(
      ...letter.columns.map((c, i) => body(c, { size: 10, color: '#ffffff', align: i === 2 ? 'end' : 'start' }))
    );
    for (const [item, quantity, price] of letter.items)
      table.addRow(body(item), body(quantity), body(price, { align: 'end' }));
    table.addRow(
      body(letter.total[0], { color: 'slate-900' }),
      body(''),
      body(letter.total[1], { color: 'slate-900', align: 'end' })
    );

    doc.add(
      new VerticalStack({
        contentDirection: letter.rtl ? 'rightToLeft' : 'leftToRight',
        spacing: 16,
        children: [
          new HorizontalStack({
            widthDistribution: 'equal',
            children: [body(letter.address), body(letter.date, { color: 'slate-500', align: 'end' })],
          }),
          new Heading(letter.title, {
            level: index ? 2 : 1,
            fontName: face.fontName,
            fontSize: 22,
            color: 'slate-900',
            alignment: 'start',
            margin: { top: 12 },
          }),
          body(letter.body),
          table,
          body(letter.signOff, { color: 'slate-900' }),
        ],
      })
    );
  });
  return doc;
}
