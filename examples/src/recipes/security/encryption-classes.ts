import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  withEncryptionAes256,
  // withEncryption128,  // 128-bit RC4 alternative
  // withEncryption40,   // 40-bit RC4 (legacy, not recommended)
  // withPassword,       // simple one-liner - defaults to 128-bit RC4
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

// ── Example ───────────────────────────────────────────────────────────────

/**
 * The **class / construct-then-mutate** companion to `encryption.ts`.
 *
 * Same AES-256 encrypted document, authored the long way: positional
 * `DocumentSettings(PdfSize.a4, 60)` + property mutation, `new` each element and
 * assign properties. Encryption itself uses the same `withEncryptionAes256`
 * preset builder in both variants (the recommended encryption API). This is the
 * escape hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style `encryption.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.version = PdfVersion.Pdf17;
  settings.conformance = PdfAConformance.None;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);
  // PDF/A is intentionally not claimed because archival PDF/A output cannot be encrypted.

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

  // ── Page 1: AES-256 password protection ──
  const aesPasswordProtectionText = new TextBlock('AES-256 Password Protection');
  aesPasswordProtectionText.fontName = StandardFonts.HelveticaBold;
  aesPasswordProtectionText.fontSize = 24;
  aesPasswordProtectionText.textColor = ColorPalette.blue[700];
  doc.add(aesPasswordProtectionText);
  const documentIsEncryptedAesText = new TextBlock(
    'This document is encrypted with AES-256 encryption (V5, R6). ' + 'You needed to enter the password to open it.'
  );
  documentIsEncryptedAesText.fontSize = 12;
  documentIsEncryptedAesText.margin = new Thickness(0, 20, 0, 10);
  doc.add(documentIsEncryptedAesText);

  const pwd = new TextBlock('Password: demo123');
  pwd.fontSize = 14;
  pwd.textColor = ColorPalette.slate[700];
  doc.add(pwd);

  const printingCopyingAllowedButModificationText = new TextBlock(
    'Printing and copying are allowed, but modification and annotation are restricted.'
  );
  printingCopyingAllowedButModificationText.fontSize = 12;
  printingCopyingAllowedButModificationText.margin = new Thickness(0, 20, 0, 10);
  doc.add(printingCopyingAllowedButModificationText);

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
  snippet1.textColor = ColorPalette.slate[600];
  snippet1.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet1);

  // ── Page 2: User + owner passwords with permissions ──
  doc.addPage();

  const permissionRestrictionsText = new TextBlock('Permission Restrictions');
  permissionRestrictionsText.fontName = StandardFonts.HelveticaBold;
  permissionRestrictionsText.fontSize = 24;
  permissionRestrictionsText.textColor = ColorPalette.blue[700];
  doc.add(permissionRestrictionsText);
  const encryptionSupportsGranularPermissionFlagsText = new TextBlock(
    'Encryption supports granular permission flags via user and owner passwords:'
  );
  encryptionSupportsGranularPermissionFlagsText.fontSize = 12;
  encryptionSupportsGranularPermissionFlagsText.margin = new Thickness(0, 20, 0, 10);
  doc.add(encryptionSupportsGranularPermissionFlagsText);

  const printingAllowedText = new TextBlock('  - Printing: Allowed');
  printingAllowedText.textColor = ColorPalette.green[700];
  doc.add(printingAllowedText);
  const copyingAllowedText = new TextBlock('  - Copying: Allowed');
  copyingAllowedText.textColor = ColorPalette.green[700];
  doc.add(copyingAllowedText);
  const modifyingDeniedText = new TextBlock('  - Modifying: Denied');
  modifyingDeniedText.textColor = ColorPalette.red[600];
  doc.add(modifyingDeniedText);
  const annotationsDeniedText = new TextBlock('  - Annotations: Denied');
  annotationsDeniedText.textColor = ColorPalette.red[600];
  doc.add(annotationsDeniedText);

  const passwordsText = new TextBlock('Passwords:');
  passwordsText.fontSize = 14;
  passwordsText.margin = new Thickness(0, 20, 0, 5);
  doc.add(passwordsText);
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
  snippet2.textColor = ColorPalette.slate[600];
  snippet2.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet2);

  // ── Page 3: Owner password only (restricted actions) ──
  doc.addPage();

  const ownerOnlyRestrictionsText = new TextBlock('Owner-Only Restrictions');
  ownerOnlyRestrictionsText.fontName = StandardFonts.HelveticaBold;
  ownerOnlyRestrictionsText.fontSize = 24;
  ownerOnlyRestrictionsText.textColor = ColorPalette.blue[700];
  doc.add(ownerOnlyRestrictionsText);
  const pageDemonstratesAnOwnerPasswordText = new TextBlock(
    'This page demonstrates an owner-password-only document: it opens freely but most actions are restricted.'
  );
  pageDemonstratesAnOwnerPasswordText.fontSize = 12;
  pageDemonstratesAnOwnerPasswordText.margin = new Thickness(0, 20, 0, 10);
  doc.add(pageDemonstratesAnOwnerPasswordText);
  const restrictedPermissionsInScenarioText = new TextBlock('Restricted permissions in this scenario:');
  restrictedPermissionsInScenarioText.fontSize = 12;
  doc.add(restrictedPermissionsInScenarioText);

  const lowQualityPrintingAllowedText = new TextBlock('  - Low-quality printing: Allowed');
  lowQualityPrintingAllowedText.textColor = ColorPalette.green[700];
  doc.add(lowQualityPrintingAllowedText);
  const accessibilityExtractionAllowedText = new TextBlock('  - Accessibility extraction: Allowed');
  accessibilityExtractionAllowedText.textColor = ColorPalette.green[700];
  doc.add(accessibilityExtractionAllowedText);
  const copyingTextDeniedText = new TextBlock('  - Copying text: Denied');
  copyingTextDeniedText.textColor = ColorPalette.red[600];
  doc.add(copyingTextDeniedText);
  const ownerModifyingDeniedText = new TextBlock('  - Modifying: Denied');
  ownerModifyingDeniedText.textColor = ColorPalette.red[600];
  doc.add(ownerModifyingDeniedText);
  const highQualityPrintingDeniedText = new TextBlock('  - High-quality printing: Denied');
  highQualityPrintingDeniedText.textColor = ColorPalette.red[600];
  doc.add(highQualityPrintingDeniedText);

  const ownerPwd = new TextBlock('Owner password: secret');
  ownerPwd.fontSize = 14;
  ownerPwd.textColor = ColorPalette.red[600];
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
  snippet3.textColor = ColorPalette.slate[600];
  snippet3.margin = new Thickness(0, 20, 0, 0);
  doc.add(snippet3);

  return doc;
}
