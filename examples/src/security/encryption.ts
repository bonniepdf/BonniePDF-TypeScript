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
  withEncryptionAes256,
  // withEncryption128,  // 128-bit RC4 alternative
  // withEncryption40,   // 40-bit RC4 (legacy, not recommended)
  // withPassword,       // simple one-liner - defaults to 128-bit RC4
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
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.version = PdfVersion.Pdf17;

  // AES-256 encryption (PDF 1.7 required). Key derivation is async via
  // SubtleCrypto; actual stream encryption happens synchronously during
  // generateBytesAsync().
  withEncryptionAes256(settings, opts =>
    opts.withUserPassword('demo123').withOwnerPassword('demo123').allowPrinting().allowCopying().allowAccessibility()
  );

  // Alternative: 128-bit RC4 (works with generateBytes() and generateBytesAsync())
  // withEncryption128(settings, opts =>
  //   opts.withUserPassword('demo123').withOwnerPassword('demo123').allowPrinting().allowCopying().allowAccessibility()
  // );

  // Alternative: simple one-liner - 128-bit RC4 with a single password
  // withPassword(settings, 'demo123');

  const metadata = new DocumentMetadata();
  metadata.title = 'PDF Encryption';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // ── Page 1: AES-256 password protection ──
  doc.add(pageTitle('AES-256 Password Protection'));
  doc.add(
    body(
      'This document is encrypted with AES-256 encryption (V5, R6). ' + 'You needed to enter the password to open it.'
    )
  );

  const pwd = new TextBlock('Password: demo123');
  pwd.fontSize = 14;
  pwd.textColor = Color.slate700;
  doc.add(pwd);

  doc.add(body('Printing and copying are allowed, but modification and annotation are restricted.'));

  const snippet1 = new TextBlock(
    'API usage:\n' +
      '  withEncryptionAes256(settings, opts =>\n' +
      "    opts.withUserPassword('demo123')\n" +
      "        .withOwnerPassword('demo123')\n" +
      '        .allowPrinting()\n' +
      '        .allowCopying()\n' +
      '        .allowAccessibility()\n' +
      '  );\n\n' +
      '  // Or for 128-bit RC4:\n' +
      '  // withEncryption128(settings, opts => ...)\n\n' +
      '  // Or the simplest form:\n' +
      "  // withPassword(settings, 'demo123');"
  );
  snippet1.fontName = StandardFonts.Courier;
  snippet1.fontSize = 10;
  snippet1.textColor = Color.slate600;
  snippet1.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet1);

  // ── Page 2: User + owner passwords with permissions ──
  doc.addPage();

  doc.add(pageTitle('Permission Restrictions'));
  doc.add(body('Encryption supports granular permission flags via user and owner passwords:'));

  doc.add(bullet('  - Printing: Allowed', true));
  doc.add(bullet('  - Copying: Allowed', true));
  doc.add(bullet('  - Modifying: Denied', false));
  doc.add(bullet('  - Annotations: Denied', false));

  doc.add(label('Passwords:'));
  doc.add(new TextBlock('  User password: user'));
  doc.add(new TextBlock('  Owner password: owner (unlocks all permissions)'));

  const snippet2 = new TextBlock(
    'API usage:\n' +
      '  withEncryptionAes256(settings, opts =>\n' +
      "    opts.withUserPassword('user')\n" +
      "        .withOwnerPassword('owner')\n" +
      '        .allowPrinting()\n' +
      '        .allowCopying()\n' +
      '  );'
  );
  snippet2.fontName = StandardFonts.Courier;
  snippet2.fontSize = 10;
  snippet2.textColor = Color.slate600;
  snippet2.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet2);

  // ── Page 3: Owner password only (restricted actions) ──
  doc.addPage();

  doc.add(pageTitle('Owner-Only Restrictions'));
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
      '  withEncryptionAes256(settings, opts =>\n' +
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
