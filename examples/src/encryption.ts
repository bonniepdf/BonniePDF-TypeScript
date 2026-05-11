import { Document, DocumentSettings, DocumentMetadata, PdfSize, PdfVersion, TextBlock, Color, Thickness, StandardFonts } from '@bonniepdf/core'

// ── Helpers ───────────────────────────────────────────────────────────────

function pageTitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName  = StandardFonts.HelveticaBold;
  b.fontSize  = 24;
  b.textColor = Color.blue700;
  return b;
}

function body(text: string, margin = true): TextBlock {
  const b = new TextBlock(text);
  b.fontSize = 12;
  if (margin) b.margin = new Thickness(0, 20, 0, 10);
  return b;
}

function bullet(text: string, allowed: boolean): TextBlock {
  const b = new TextBlock(text);
  b.textColor = allowed ? Color.green600 : Color.red600;
  return b;
}

function label(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontSize = 14;
  b.margin   = new Thickness(0, 20, 0, 5);
  return b;
}

// ── Example ───────────────────────────────────────────────────────────────

export function generate(): Document {
  // NOTE: This gallery document is intentionally unencrypted so the viewer
  // can display it. In production code you would call:
  //   withPassword(settings, 'demo123')              — scenario 1
  //   withEncryption128(settings, opts => ...)       — scenarios 2 & 3
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.version = PdfVersion.Pdf17;

  const metadata = new DocumentMetadata();
  metadata.title  = 'PDF Encryption';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Scenario 1: Simple password ──
  doc.add(pageTitle('Password Protected Document'));
  doc.add(body('This PDF is encrypted with 128-bit RC4 encryption.'));

  const pwd = new TextBlock('Password: demo123');
  pwd.fontSize  = 14;
  pwd.textColor = Color.red600;
  doc.add(pwd);

  doc.add(body('Without the correct password, this document cannot be opened.'));

  const snippet1 = new TextBlock(
    'API usage:\n' +
    '  withPassword(settings, \'demo123\');'
  );
  snippet1.fontName  = StandardFonts.Courier;
  snippet1.fontSize  = 11;
  snippet1.textColor = Color.slate600;
  snippet1.margin    = new Thickness(0, 20, 0, 0);
  doc.add(snippet1);

  // ── Scenario 2: User + owner passwords with permissions ──
  doc.addPage();

  doc.add(pageTitle('Document with Permission Restrictions'));
  doc.add(body('This document has restricted permissions:'));

  doc.add(bullet('  - Printing: Allowed',    true));
  doc.add(bullet('  - Copying: Allowed',     true));
  doc.add(bullet('  - Modifying: Denied',    false));
  doc.add(bullet('  - Annotations: Denied',  false));

  doc.add(label('Passwords:'));
  doc.add(new TextBlock('  User password: user'));
  doc.add(new TextBlock('  Owner password: owner (unlocks all permissions)'));

  const snippet2 = new TextBlock(
    'API usage:\n' +
    '  withEncryption128(settings, opts =>\n' +
    '    opts.withUserPassword(\'user\')\n' +
    '        .withOwnerPassword(\'owner\')\n' +
    '        .withPermissions(PdfPermissions.Print | PdfPermissions.Copy)\n' +
    '  );'
  );
  snippet2.fontName  = StandardFonts.Courier;
  snippet2.fontSize  = 10;
  snippet2.textColor = Color.slate600;
  snippet2.margin    = new Thickness(0, 20, 0, 0);
  doc.add(snippet2);

  // ── Scenario 3: Owner password only (restricted actions) ──
  doc.addPage();

  doc.add(pageTitle('Open Without Password (Restricted)'));
  doc.add(body('This document opens without requiring a password.'));
  doc.add(body('However, most actions are restricted:', false));

  doc.add(bullet('  - Low-quality printing: Allowed',      true));
  doc.add(bullet('  - Accessibility extraction: Allowed',  true));
  doc.add(bullet('  - Copying text: Denied',               false));
  doc.add(bullet('  - Modifying: Denied',                  false));
  doc.add(bullet('  - High-quality printing: Denied',      false));

  const ownerPwd = new TextBlock('Owner password: secret');
  ownerPwd.fontSize  = 14;
  ownerPwd.textColor = Color.red600;
  ownerPwd.margin    = new Thickness(0, 20, 0, 0);
  doc.add(ownerPwd);

  const snippet3 = new TextBlock(
    'API usage:\n' +
    '  withEncryption128(settings, opts =>\n' +
    '    opts.withOwnerPassword(\'secret\')\n' +
    '        .allowNone()\n' +
    '        .allowPrinting(false)\n' +
    '        .allowAccessibility()\n' +
    '  );'
  );
  snippet3.fontName  = StandardFonts.Courier;
  snippet3.fontSize  = 10;
  snippet3.textColor = Color.slate600;
  snippet3.margin    = new Thickness(0, 20, 0, 0);
  doc.add(snippet3);

  return doc;
}