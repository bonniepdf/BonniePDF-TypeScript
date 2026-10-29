import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { EncryptionSettings } from '../../src/Security/Models/EncryptionSettings';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { EncryptionAlgorithm } from '../../src/Security/Models/EncryptionAlgorithm';
import { PdfEncryptor } from '../../src/Security/Encryption/PdfEncryptor';

/**
 * End-to-end checks that written streams really carry `/FlateDecode` and that a
 * standard inflater can read them back.
 *
 * The unit tests in `deflate.test.ts` pin the encoder; these pin the *writer* —
 * that the filter is declared, that compression happens before encryption (PDF
 * decodes in the opposite order), and that turning compression on did not
 * quietly stop shrinking anything.
 */

/** Byte ranges between `stream\n` and `endstream`, in file order. */
function rawStreams(bytes: Uint8Array): Uint8Array[] {
  const text = new TextDecoder('latin1').decode(bytes);
  const out: Uint8Array[] = [];
  const marker = 'stream\n';
  let index = text.indexOf(marker);
  while (index >= 0) {
    const start = index + marker.length;
    const end = text.indexOf('endstream', start);
    if (end < 0) break;
    out.push(bytes.subarray(start, end));
    index = text.indexOf(marker, end + 'endstream'.length);
  }
  return out;
}

function bodyText(): string {
  return 'The quick brown fox jumps over the lazy dog. '.repeat(40);
}

describe('FlateDecode stream writing', () => {
  it('declares the filter and inflates back to the original operators', () => {
    const doc = new Document();
    doc.add(new TextBlock(bodyText()));
    const bytes = doc.generateBytes();

    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('/Filter /FlateDecode');

    const inflated = rawStreams(bytes)
      .map(s => {
        try {
          return new TextDecoder('latin1').decode(inflateSync(Buffer.from(s)));
        } catch {
          return '';
        }
      })
      .join('\n');

    // The text operators are only reachable after inflating, which is the point.
    expect(inflated).toContain('BT');
    expect(inflated).toContain('ET');
    expect(inflated).toContain('Tj');
  });

  it('materially shrinks a repetitive document', () => {
    const doc = new Document();
    for (let i = 0; i < 40; i++) doc.add(new TextBlock(bodyText()));
    const bytes = doc.generateBytes();

    const compressedTotal = rawStreams(bytes).reduce((sum, s) => sum + s.length, 0);
    const inflatedTotal = rawStreams(bytes).reduce((sum, s) => {
      try {
        return sum + inflateSync(Buffer.from(s)).length;
      } catch {
        return sum + s.length;
      }
    }, 0);

    expect(inflatedTotal).toBeGreaterThan(0);
    expect(compressedTotal).toBeLessThan(inflatedTotal / 2);
  });

  it('compresses before encrypting, so an encrypted stream is not inflatable as-is', async () => {
    const settings = new DocumentSettings();
    const encryption = new EncryptionSettings();
    encryption.userPassword = 'demo';
    encryption.ownerPassword = 'owner';
    settings.encryption = encryption;

    const doc = new Document(settings);
    doc.add(new TextBlock(bodyText()));
    const bytes = await doc.generateBytesAsync();

    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('/Filter /FlateDecode');
    expect(text).toContain('/Encrypt');

    // PDF applies stream filters on top of the raw bytes and encrypts the
    // result, so a reader decrypts first and inflates second. A consumer that
    // skipped decryption must therefore fail to inflate - if any content
    // stream inflated cleanly here, the two steps would be in the wrong order
    // and every reader would reject the file.
    const contentInflatedWithoutDecrypting = rawStreams(bytes).some(s => {
      try {
        const out = inflateSync(Buffer.from(s)).toString('latin1');
        return out.includes('BT') && out.includes('Tj');
      } catch {
        return false;
      }
    });
    expect(contentInflatedWithoutDecrypting).toBe(false);
  });

  it('produces the same bytes on every run, so a document is reproducible', () => {
    const build = (): Uint8Array => {
      const doc = new Document();
      doc.add(new TextBlock(bodyText()));
      return doc.generateBytes();
    };

    // Compression must not introduce any run-to-run variation of its own. PDF
    // output still differs between runs overall (creation timestamp, random
    // font-subset tag), so compare the compressed stream bodies rather than
    // whole files - those are purely a function of the content.
    const first = rawStreams(build()).map(s => Buffer.from(s).toString('hex'));
    const second = rawStreams(build()).map(s => Buffer.from(s).toString('hex'));
    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  it('round-trips an RC4 stream: decrypt then inflate returns the operators', () => {
    const settings = new DocumentSettings();
    const encryption = new EncryptionSettings();
    encryption.algorithm = EncryptionAlgorithm.RC4_128;
    encryption.userPassword = 'demo';
    encryption.ownerPassword = 'owner';
    settings.encryption = encryption;

    const doc = new Document(settings);
    doc.add(new TextBlock(bodyText()));
    const bytes = doc.generateBytes();

    // RC4 is symmetric, so running the encryptor over the ciphertext with the
    // same key recovers the plaintext. That makes a genuine decrypt-then-inflate
    // round-trip possible here, which is the strongest available check that the
    // writer put the two steps in the order a reader expects.
    const documentId = extractDocumentId(bytes);
    const encryptor = new PdfEncryptor(encryption, documentId);

    const recovered = rawStreams(bytes)
      .map((stream, index) => {
        // Object numbers start at 1 and streams appear in object order; try a
        // small window rather than parsing the xref for this assertion.
        for (let objectNumber = 1; objectNumber <= index + 12; objectNumber++) {
          try {
            const plain = encryptor.encryptData(stream, objectNumber);
            return inflateSync(Buffer.from(plain)).toString('latin1');
          } catch {
            // Wrong object number for this stream; keep trying.
          }
        }
        return '';
      })
      .join('\n');

    expect(recovered).toContain('BT');
    expect(recovered).toContain('Tj');
    expect(recovered).toContain('The quick brown fox');
  });
});

/** The first half of the trailer `/ID`, which the RC4 key derivation needs. */
function extractDocumentId(bytes: Uint8Array): Uint8Array {
  const text = new TextDecoder('latin1').decode(bytes);
  const match = /\/ID\s*\[\s*<([0-9A-Fa-f]+)>/.exec(text);
  if (!match) return new Uint8Array(0);
  const hex = match[1]!;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
