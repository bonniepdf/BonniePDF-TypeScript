import { applyOptions } from '../../Core/applyOptions';
import { PdfPermissions } from '../Permissions/PdfPermissions';
import { EncryptionAlgorithm } from './EncryptionAlgorithm';

/**
 * Settings for PDF document encryption.
 */
/** Settable properties of {@link EncryptionSettings}. */
export const ENCRYPTION_SETTINGS_OPTION_KEYS = [
  'algorithm',
  'userPassword',
  'ownerPassword',
  'permissions',
  'encryptMetadata',
] as const;

/** Options for {@link EncryptionSettings}. */
export type EncryptionSettingsOptions = Partial<
  Pick<EncryptionSettings, (typeof ENCRYPTION_SETTINGS_OPTION_KEYS)[number]>
>;

/** Contains validated passwords, permissions, and algorithm choices for PDF encryption. */
export class EncryptionSettings {
  /**
   * Gets or sets the encryption algorithm to use.
   */
  public algorithm: EncryptionAlgorithm;

  /**
   * Gets or sets the user password (open password).
   * If set to empty string, no user password is required.
   */
  public userPassword: string;

  /**
   * Gets or sets the owner password (permissions password).
   * Required for encryption. Controls access to change permissions and passwords.
   */
  public ownerPassword: string;

  /**
   * Gets or sets the document permissions.
   * Default is All (no restrictions).
   */
  public permissions: PdfPermissions;

  /**
   * Whether AES-256 encrypts the XMP metadata stream.
   * When false, XMP remains readable without a password; other PDF strings stay encrypted.
   * Legacy RC4 always encrypts metadata. Defaults to true.
   */
  public encryptMetadata: boolean;

  /** Creates encryption settings, optionally configured in one expression. */
  constructor(options?: EncryptionSettingsOptions) {
    this.algorithm = EncryptionAlgorithm.RC4_128;
    this.userPassword = '';
    this.ownerPassword = '';
    this.permissions = PdfPermissions.All;
    this.encryptMetadata = true;
    applyOptions(this, options);
  }

  /**
   * Gets the encryption key length in bits.
   */
  public get keyLengthBits(): number {
    return this.keyLengthValue();
  }

  /**
   * Gets the encryption key length in bytes.
   */
  public get keyLengthBytes(): number {
    return Math.floor(this.keyLengthBits / 8);
  }

  /**
   * Gets the PDF version value for the encryption algorithm.
   */
  public get revisionValue(): number {
    return this.revisionValueInner();
  }

  /**
   * Validates the encryption settings.
   * @throws Error if settings are invalid
   */
  public validate(): void {
    if (this.algorithm === undefined || this.algorithm === null) {
      throw new Error('Encryption algorithm must be specified');
    }
    if (this.ownerPassword === undefined) {
      throw new Error('Owner password must be specified');
    }
    if (this.userPassword === undefined) {
      throw new Error('User password must be specified');
    }
  }

  /**
   * Gets the encryption key length in bits based on the algorithm.
   * @internal
   */
  public keyLengthValue(): number {
    switch (this.algorithm) {
      case EncryptionAlgorithm.RC4_40:
        return 40;
      case EncryptionAlgorithm.RC4_128:
        return 128;
      case EncryptionAlgorithm.AES_256:
        return 256;
      default:
        return 128;
    }
  }

  /**
   * Gets the PDF version value for the encryption algorithm.
   */
  public versionValue(): number {
    switch (this.algorithm) {
      case EncryptionAlgorithm.RC4_40:
        return 1;
      case EncryptionAlgorithm.RC4_128:
        return 2;
      case EncryptionAlgorithm.AES_256:
        return 5;
      default:
        return 2;
    }
  }

  /**
   * Gets the revision value for the encryption algorithm.
   */
  private revisionValueInner(): number {
    switch (this.algorithm) {
      case EncryptionAlgorithm.RC4_40:
        return 2;
      case EncryptionAlgorithm.RC4_128:
        return 3;
      case EncryptionAlgorithm.AES_256:
        return 6;
      default:
        return 3;
    }
  }

  /**
   * Creates a clone of this EncryptionSettings.
   */
  public clone(): EncryptionSettings {
    const cloned = new EncryptionSettings();
    cloned.algorithm = this.algorithm;
    cloned.userPassword = this.userPassword;
    cloned.ownerPassword = this.ownerPassword;
    cloned.permissions = this.permissions;
    cloned.encryptMetadata = this.encryptMetadata;
    return cloned;
  }
}
