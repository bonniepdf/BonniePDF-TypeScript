import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Document } from '../../src/Document';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { applyFacturX } from '../../src/EInvoice/FacturX';
import { FacturXError } from '../../src/EInvoice/FacturXError';
import { FacturXProfile } from '../../src/EInvoice/FacturXProfile';
import { BonniePdfError } from '../../src/Core/BonniePdfError';

// Driven by the shared fixture factur-x/xml-check.json (spec 04 §11.4), copied into ./fixtures.
const dir = join(__dirname, 'fixtures/factur-x');

interface Case {
  id: string;
  xml?: string;
  bytes?: string;
  file?: string;
  prefixBom?: boolean;
  statedProfile?: string;
  profile?: string;
  conformanceLevel?: string;
  code?: string;
}

const fixture = JSON.parse(readFileSync(join(dir, 'xml-check.json'), 'utf8')) as {
  _fixture: { profiles: Record<string, string> };
  accepted: Case[];
  rejected: Case[];
};

const PROFILES: Record<string, FacturXProfile> = {
  minimum: FacturXProfile.Minimum,
  basicWl: FacturXProfile.BasicWl,
  basic: FacturXProfile.Basic,
  en16931: FacturXProfile.En16931,
  extended: FacturXProfile.Extended,
  xRechnung: FacturXProfile.XRechnung,
};

function input(c: Case): Uint8Array {
  if (c.file !== undefined) return new Uint8Array(readFileSync(join(dir, c.file)));
  if (c.bytes !== undefined) return new Uint8Array(Buffer.from(c.bytes, 'base64'));
  const text = new TextEncoder().encode(c.xml!);
  if (!c.prefixBom) return text;
  const out = new Uint8Array(text.length + 3);
  out.set([0xef, 0xbb, 0xbf]);
  out.set(text, 3);
  return out;
}

const stated = (c: Case) => (c.statedProfile === undefined ? {} : { profile: PROFILES[c.statedProfile]! });

describe('Factur-X invoice XML check (shared fixture)', () => {
  it('covers every code the specification defines', () => {
    const codes = new Set(fixture.rejected.map(c => c.code));
    for (const code of [
      'unsupported-encoding',
      'malformed-xml',
      'doctype-forbidden',
      'not-cii',
      'guideline-missing',
      'guideline-unrecognized',
      'profile-mismatch',
    ]) {
      expect(codes).toContain(code);
    }
  });

  for (const c of fixture.accepted) {
    it(`accepts ${c.id}`, () => {
      const doc = new Document();
      try {
        applyFacturX(doc, input(c), stated(c));
        expect(doc.settings.facturX?.conformanceLevel).toBe(c.conformanceLevel);
        expect(fixture._fixture.profiles[c.profile!]).toBe(c.conformanceLevel);
      } finally {
        doc.dispose();
      }
    });
  }

  for (const c of fixture.rejected) {
    it(`rejects ${c.id} with ${c.code}`, () => {
      const doc = new Document();
      try {
        let error: unknown;
        try {
          applyFacturX(doc, input(c), stated(c));
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(FacturXError);
        expect(error).toBeInstanceOf(BonniePdfError);
        expect((error as FacturXError).code).toBe(c.code);
        expect((error as FacturXError).message).toContain(`(${c.code})`);
        // The document is left unchanged.
        expect(doc.settings.conformance).toBe(PdfAConformance.None);
        expect(doc.settings.facturX).toBeUndefined();
        expect(doc.attachments).toHaveLength(0);
      } finally {
        doc.dispose();
      }
    });
  }
});
