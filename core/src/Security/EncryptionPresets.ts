import { DocumentSettings } from '../Configuration/DocumentSettings';
import { EncryptionSettings } from './Models/EncryptionSettings';
import { EncryptionOptions } from './Models/EncryptionOptions';
import { EncryptionAlgorithm } from './Models/EncryptionAlgorithm';
import { PdfPermissions } from './Permissions/PdfPermissions';
import { PdfVersion } from '../Configuration/PdfVersion';

/**
 * Presets for configuring document encryption on {@link DocumentSettings}.
 *
 * Each builds a validated {@link EncryptionSettings} and assigns it to
 * `settings.encryption`; AES-256 additionally forces the PDF version, since the
 * algorithm requires PDF 1.7.
 */

/** Configures 40-bit RC4 encryption (legacy, not recommended for new documents). */
export function withEncryption40(
  settings: DocumentSettings,
  configure: (options: EncryptionOptions) => void
): DocumentSettings {
  const options = new EncryptionOptions(EncryptionAlgorithm.RC4_40);
  configure(options);
  settings.encryption = options.build();
  return settings;
}

/** Configures 128-bit RC4 encryption (standard for PDF 1.4). */
export function withEncryption128(
  settings: DocumentSettings,
  configure: (options: EncryptionOptions) => void
): DocumentSettings {
  const options = new EncryptionOptions(EncryptionAlgorithm.RC4_128);
  configure(options);
  settings.encryption = options.build();
  return settings;
}

/** Configures encryption with the specified settings. */
export function withEncryption(settings: DocumentSettings, encryptionSettings: EncryptionSettings): DocumentSettings {
  encryptionSettings.validate();
  settings.encryption = encryptionSettings.clone();
  return settings;
}

/** Configures encryption with a simple user password (128-bit RC4, all permissions). */
export function withPassword(settings: DocumentSettings, userPassword: string): DocumentSettings {
  const encryption = new EncryptionSettings();
  encryption.algorithm = EncryptionAlgorithm.RC4_128;
  encryption.userPassword = userPassword ?? '';
  encryption.ownerPassword = userPassword ?? '';
  encryption.permissions = PdfPermissions.All;
  settings.encryption = encryption;
  return settings;
}

/**
 * Configures encryption with user and owner passwords (128-bit RC4).
 * @param userPassword The password required to open the document
 * @param ownerPassword The password required to change permissions
 */
export function withPasswords(
  settings: DocumentSettings,
  userPassword: string,
  ownerPassword: string,
  permissions: PdfPermissions = PdfPermissions.All
): DocumentSettings {
  const encryption = new EncryptionSettings();
  encryption.algorithm = EncryptionAlgorithm.RC4_128;
  encryption.userPassword = userPassword ?? '';
  encryption.ownerPassword = ownerPassword ?? '';
  encryption.permissions = permissions;
  settings.encryption = encryption;
  return settings;
}

/** Configures AES-256 encryption. Automatically sets the version to PDF 1.7. */
export function withEncryptionAes256(
  settings: DocumentSettings,
  configure: (options: EncryptionOptions) => void
): DocumentSettings {
  settings.version = PdfVersion.Pdf17;
  const options = new EncryptionOptions(EncryptionAlgorithm.AES_256);
  configure(options);
  settings.encryption = options.build();
  return settings;
}

/** Removes encryption from the document settings. */
export function withoutEncryption(settings: DocumentSettings): DocumentSettings {
  settings.encryption = undefined;
  return settings;
}
