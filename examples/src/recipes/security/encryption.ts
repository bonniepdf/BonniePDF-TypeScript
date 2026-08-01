import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  StandardFonts,
  withEncryptionAes256,
} from '@bonniepdf/core';

/**
 * AES-256 password protection with granular permissions, authored through the
 * options-object front door.
 *
 * Encryption forces a `DocumentSettings` instance (the preset builder operates
 * on it), so settings use the `DocumentSettings` *options constructor* (tokens,
 * nested `defaultTextStyle` literal) rather than the nested-literal form, and the
 * encryption itself is configured with the `withEncryptionAes256` preset - the
 * recommended encryption API. Elements are options-constructed. PDF/A is
 * intentionally not claimed because archival PDF/A output cannot be encrypted.
 */
export function generate(): Document {
  const settings = new DocumentSettings({
    pageSize: 'a4',
    margin: 60,
    conformance: 'none',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
  });

  // AES-256 encryption (PDF 1.7 required, set by the preset). Key derivation is
  // async via SubtleCrypto; actual stream encryption happens synchronously
  // during generateBytesAsync().
  withEncryptionAes256(settings, opts =>
    opts.withUserPassword('demo123').withOwnerPassword('demo123').allowPrinting().allowCopying().allowAccessibility()
  );

  const doc = new Document(settings, new DocumentMetadata({ title: 'PDF Encryption', author: 'BonniePDF' }));

  // ── Page 1: AES-256 password protection ──
  doc.add(
    new TextBlock('AES-256 Password Protection', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'blue-700',
    })
  );
  doc.add(
    new TextBlock(
      'This document is encrypted with AES-256 encryption (V5, R6). ' + 'You needed to enter the password to open it.',
      { fontSize: 12, margin: { top: 20, bottom: 10 } }
    )
  );

  doc.add(new TextBlock('Password: demo123', { fontSize: 14, textColor: 'slate-700' }));

  doc.add(
    new TextBlock('Printing and copying are allowed, but modification and annotation are restricted.', {
      fontSize: 12,
      margin: { top: 20, bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
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
        "  // withPassword(settings, 'demo123');",
      { fontName: StandardFonts.Courier, fontSize: 10, textColor: 'slate-600', margin: { top: 20 } }
    )
  );

  // ── Page 2: User + owner passwords with permissions ──
  doc.addPage();

  doc.add(
    new TextBlock('Permission Restrictions', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'blue-700',
    })
  );
  doc.add(
    new TextBlock('Encryption supports granular permission flags via user and owner passwords:', {
      fontSize: 12,
      margin: { top: 20, bottom: 10 },
    })
  );

  doc.add(new TextBlock('  - Printing: Allowed', { textColor: 'green-600' }));
  doc.add(new TextBlock('  - Copying: Allowed', { textColor: 'green-600' }));
  doc.add(new TextBlock('  - Modifying: Denied', { textColor: 'red-600' }));
  doc.add(new TextBlock('  - Annotations: Denied', { textColor: 'red-600' }));

  doc.add(new TextBlock('Passwords:', { fontSize: 14, margin: { top: 20, bottom: 5 } }));
  doc.add(new TextBlock('  User password: user'));
  doc.add(new TextBlock('  Owner password: owner (unlocks all permissions)'));

  doc.add(
    new TextBlock(
      'API usage:\n' +
        '  withEncryptionAes256(settings, opts =>\n' +
        "    opts.withUserPassword('user')\n" +
        "        .withOwnerPassword('owner')\n" +
        '        .allowPrinting()\n' +
        '        .allowCopying()\n' +
        '  );',
      { fontName: StandardFonts.Courier, fontSize: 10, textColor: 'slate-600', margin: { top: 20 } }
    )
  );

  // ── Page 3: Owner password only (restricted actions) ──
  doc.addPage();

  doc.add(
    new TextBlock('Owner-Only Restrictions', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'blue-700',
    })
  );
  doc.add(
    new TextBlock(
      'This page demonstrates an owner-password-only document: it opens freely but most actions are restricted.',
      { fontSize: 12, margin: { top: 20, bottom: 10 } }
    )
  );
  doc.add(new TextBlock('Restricted permissions in this scenario:', { fontSize: 12 }));

  doc.add(new TextBlock('  - Low-quality printing: Allowed', { textColor: 'green-600' }));
  doc.add(new TextBlock('  - Accessibility extraction: Allowed', { textColor: 'green-600' }));
  doc.add(new TextBlock('  - Copying text: Denied', { textColor: 'red-600' }));
  doc.add(new TextBlock('  - Modifying: Denied', { textColor: 'red-600' }));
  doc.add(new TextBlock('  - High-quality printing: Denied', { textColor: 'red-600' }));

  doc.add(new TextBlock('Owner password: secret', { fontSize: 14, textColor: 'red-600', margin: { top: 20 } }));

  doc.add(
    new TextBlock(
      'API usage:\n' +
        '  withEncryptionAes256(settings, opts =>\n' +
        "    opts.withOwnerPassword('secret')\n" +
        '        .allowNone()\n' +
        '        .allowPrinting(false)\n' +
        '        .allowAccessibility()\n' +
        '  );',
      { fontName: StandardFonts.Courier, fontSize: 10, textColor: 'slate-600', margin: { top: 20 } }
    )
  );

  return doc;
}
