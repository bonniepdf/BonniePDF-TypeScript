import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

// ── Helpers ───────────────────────────────────────────────────────────────

function pageTitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 24;
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
  b.margin = new Thickness(0, 20, 0, 5);
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
  metadata.title = 'PDF Encryption';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // ── Scenario 1: Simple password ──
  doc.add(pageTitle('Scenario 1: Password Protection'));
  doc.add(
    body(
      'This page demonstrates the API for password-protecting a PDF with 128-bit RC4 ' +
        'encryption. The viewer below can display this document because encryption has not ' +
        'been applied here — see the note at the bottom of the page.'
    )
  );

  const pwd = new TextBlock('Example password: demo123');
  pwd.fontSize = 14;
  pwd.textColor = Color.slate700;
  doc.add(pwd);

  doc.add(body('When encryption is active, the document cannot be opened without the correct password.'));

  const snippet1 = new TextBlock('API usage:\n' + "  withPassword(settings, 'demo123');");
  snippet1.fontName = StandardFonts.Courier;
  snippet1.fontSize = 11;
  snippet1.textColor = Color.slate600;
  snippet1.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet1);

  const note1 = new TextBlock(
    'Note: This demo document is intentionally unencrypted so it can be displayed ' +
      'in the browser viewer. In a real application, calling withPassword() produces a ' +
      'fully encrypted PDF that requires the password to open.'
  );
  note1.fontSize = 10;
  note1.textColor = Color.slate500;
  note1.margin = new Thickness(0, 24, 0, 0);
  doc.add(note1);

  // ── Scenario 2: User + owner passwords with permissions ──
  doc.addPage();

  doc.add(pageTitle('Scenario 2: Permission Restrictions'));
  doc.add(body('This page demonstrates encrypting with granular permission flags:'));

  doc.add(bullet('  - Printing: Allowed', true));
  doc.add(bullet('  - Copying: Allowed', true));
  doc.add(bullet('  - Modifying: Denied', false));
  doc.add(bullet('  - Annotations: Denied', false));

  doc.add(label('Passwords:'));
  doc.add(new TextBlock('  User password: user'));
  doc.add(new TextBlock('  Owner password: owner (unlocks all permissions)'));

  const snippet2 = new TextBlock(
    'API usage:\n' +
      '  withEncryption128(settings, opts =>\n' +
      "    opts.withUserPassword('user')\n" +
      "        .withOwnerPassword('owner')\n" +
      '        .withPermissions(PdfPermissions.Print | PdfPermissions.Copy)\n' +
      '  );'
  );
  snippet2.fontName = StandardFonts.Courier;
  snippet2.fontSize = 10;
  snippet2.textColor = Color.slate600;
  snippet2.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet2);

  // ── Scenario 3: Owner password only (restricted actions) ──
  doc.addPage();

  doc.add(pageTitle('Scenario 3: Owner-Only Restrictions'));
  doc.add(
    body('This page demonstrates an owner-password-only document: it opens freely but most actions are restricted.')
  );
  doc.add(body('Restricted permissions in this scenario:', false));

  doc.add(bullet('  - Low-quality printing: Allowed', true));
  doc.add(bullet('  - Accessibility extraction: Allowed', true));
  doc.add(bullet('  - Copying text: Denied', false));
  doc.add(bullet('  - Modifying: Denied', false));
  doc.add(bullet('  - High-quality printing: Denied', false));

  const ownerPwd = new TextBlock('Owner password: secret');
  ownerPwd.fontSize = 14;
  ownerPwd.textColor = Color.red600;
  ownerPwd.margin = new Thickness(0, 20, 0, 0);
  doc.add(ownerPwd);

  const snippet3 = new TextBlock(
    'API usage:\n' +
      '  withEncryption128(settings, opts =>\n' +
      "    opts.withOwnerPassword('secret')\n" +
      '        .allowNone()\n' +
      '        .allowPrinting(false)\n' +
      '        .allowAccessibility()\n' +
      '  );'
  );
  snippet3.fontName = StandardFonts.Courier;
  snippet3.fontSize = 10;
  snippet3.textColor = Color.slate600;
  snippet3.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet3);

  return doc;
}
