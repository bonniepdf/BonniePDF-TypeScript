/** A localized customer letter using real Arabic and Hebrew fonts and plain RTL text. */
import { Document, Heading, TextBlock, PageBreak } from '@bonniepdf/core';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    metadata: { title: 'Multilingual customer letter' },
    settings: { language: 'en-GB', margin: 48 },
  });
  const sections = [
    {
      language: 'fr-FR',
      font: 'NotoSans-Regular.ttf',
      title: 'Confirmation de votre commande',
      address: 'Madame Zoë Martin\n18 rue des Écoles\n75005 Paris',
      body: 'Votre commande est confirmée. La livraison est prévue à votre adresse. Merci de vérifier les coordonnées et de conserver cette lettre.',
      date: '25 octobre 2026',
      amount: '1 234,50 EUR',
      rtl: false,
    },
    {
      language: 'ar',
      font: 'NotoNaskhArabic-Regular.ttf',
      title: 'تأكيد الطلب',
      address: 'السيدة مريم\nالرياض',
      body: 'تم تأكيد طلبكم. يرجى مراجعة العنوان والاحتفاظ بهذه الرسالة. شكراً لكم.',
      date: '25 أكتوبر 2026',
      amount: '1,234.50 SAR',
      rtl: true,
    },
    {
      language: 'he',
      font: 'NotoSerifHebrew-Regular.ttf',
      title: 'אישור הזמנה',
      address: 'גב׳ מרים לוי\nתל אביב',
      body: 'ההזמנה שלכם אושרה. נא לבדוק את הכתובת ולשמור את המכתב. תודה רבה.',
      date: '25 באוקטובר 2026',
      amount: '1,234.50 ILS',
      rtl: true,
    },
  ];
  sections.forEach((section, index) => {
    if (index) doc.add(new PageBreak());
    const bytes = assets.get(`fonts/${section.font}`);
    if (!bytes) throw new Error(`Supply fonts/${section.font}.`);
    const face = doc.fonts.add(bytes);
    const style = {
      fontName: face.fontName,
      fontSize: 14,
      contentDirection: section.rtl ? ('rightToLeft' as const) : ('leftToRight' as const),
      alignment: section.rtl ? ('right' as const) : ('left' as const),
      margin: { bottom: 20 },
    };
    doc.add(new Heading(section.title, { ...style, level: index ? 2 : 1, fontSize: 26 }));
    doc.add(new TextBlock(section.address, style));
    doc.add(new TextBlock(section.date, style));
    doc.add(new TextBlock(section.body, style));
    doc.add(new TextBlock(section.amount, { ...style, contentDirection: 'leftToRight' }));
  });
  // Each page supplies its own localized text; plain blocks avoid unsupported styled RTL spans.
  return doc;
}
