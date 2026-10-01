import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { EncryptionAlgorithm } from '../../src/Security/Models/EncryptionAlgorithm';
import { fromDefinition, validateDefinition } from '../../src/definition';
import { ELEMENT_DESCRIPTION } from '../../src/Definition/ElementDescription';
import { DEFINITION_FIXTURES } from './fixtures.generated';

/**
 * The cross-key rules of `settings` (spec 15 §5.2): the shared fixtures `document-definition/settings-rules`.
 * A combination the validator refuses must be one generation refuses, and one it accepts must generate and
 * land on the PDF version the fixture names, so the rules in the description cannot drift from behaviour.
 *
 * Mirrors the .NET SettingsRulesTests.
 */

const fixtures = Object.entries(DEFINITION_FIXTURES['settings-rules']);
const ruleText = (id: string) => ELEMENT_DESCRIPTION.settingsRules.rules.find(r => r.id === id)!.text;
const VERSIONS: Record<string, PdfVersion> = {
  'pdf-1.4': PdfVersion.Pdf14,
  'pdf-1.7': PdfVersion.Pdf17,
  'pdf-2.0': PdfVersion.Pdf20,
};
const header = (bytes: Uint8Array) => new TextDecoder().decode(bytes.slice(0, 8));

/** The same settings applied through the code API, which never validates a definition. */
async function documentFrom(settings: Record<string, any>): Promise<Document> {
  const bag: Record<string, unknown> = { ...settings };
  delete bag.pdfVersion;
  delete bag.bookmarks;
  delete bag.encryption;
  if (settings.encryption) {
    const algorithm = {
      'rc4-40': EncryptionAlgorithm.RC4_40,
      'rc4-128': EncryptionAlgorithm.RC4_128,
      'aes-256': EncryptionAlgorithm.AES_256,
    }[settings.encryption.algorithm as 'aes-256'];
    bag.encryption = { ...settings.encryption, algorithm, ownerPassword: 'owner-secret', userPassword: '' };
  }
  if (settings.pdfVersion) bag.version = VERSIONS[settings.pdfVersion];
  const doc = new Document({ settings: bag as never });
  if (settings.bookmarks) doc.settings.bookmarks = settings.bookmarks.map((b: any) => ({ ...b, children: [] }));
  return doc;
}

describe('settings rules (spec 15 §5.2)', () => {
  it('has fixtures for every rule', () => {
    const named = new Set(fixtures.flatMap(([, f]) => (f._expect.rule ? [f._expect.rule] : [])));
    for (const rule of ELEMENT_DESCRIPTION.settingsRules.rules.filter(r => r.outcome === 'error')) {
      expect(named.has(rule.id), rule.id).toBe(true);
    }
  });

  for (const [name, fixture] of fixtures) {
    if (!fixture._expect.valid) {
      it(`${name}: refused on read, and refused by generation`, async () => {
        const result = validateDefinition(fixture);
        expect(result.valid).toBe(false);
        expect(result.errors.map(e => `${e.path} ${e.code}`)).toEqual(['/settings incompatible-settings']);
        expect(result.errors[0].message).toBe(ruleText(fixture._expect.rule));

        const doc = await documentFrom(fixture.settings);
        await expect(doc.generateBytesAsync()).rejects.toThrow();
      });
    } else {
      it(`${name}: accepted, generates as PDF ${fixture._expect.pdfVersion}`, async () => {
        expect(validateDefinition(fixture).valid).toBe(true);
        const doc = await fromDefinition(fixture, { passwords: { owner: 'owner-secret' } });
        const bytes = await doc.generateBytesAsync();
        const expected = fixture._expect.pdfVersion === 'pdf-2.0' ? '%PDF-2.0' : '%PDF-1.7';
        expect(header(bytes)).toBe(expected);
        expect(doc.settings.version).toBe(VERSIONS[fixture._expect.pdfVersion]);
      });
    }
  }
});
