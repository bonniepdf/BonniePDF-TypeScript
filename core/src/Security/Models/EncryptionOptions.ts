import { EncryptionSettings } from './EncryptionSettings';
import { EncryptionAlgorithm } from './EncryptionAlgorithm';
import { PdfPermissions } from '../Permissions/PdfPermissions';

/**
 * Fluent builder for configuring PDF encryption options.
 */
export class EncryptionOptions {
  private readonly settings: EncryptionSettings;

  /**
   * Creates a new EncryptionOptions builder with default settings.
   */
  constructor();
  /**
   * Creates a new EncryptionOptions builder with the specified algorithm.
   * @param algorithm - The encryption algorithm to use
   */
  constructor(algorithm: EncryptionAlgorithm);
  constructor(algorithm?: EncryptionAlgorithm) {
    this.settings = new EncryptionSettings();
    if (algorithm) {
      this.settings.algorithm = algorithm;
    }
  }

  /**
   * Sets the user password (open password).
   * @param password - The user password
   * @returns This builder for method chaining
   */
  withUserPassword(password: string): EncryptionOptions {
    this.settings.userPassword = password ?? '';
    return this;
  }

  /**
   * Sets the owner password (permissions password).
   * @param password - The owner password
   * @returns This builder for method chaining
   */
  withOwnerPassword(password: string): EncryptionOptions {
    this.settings.ownerPassword = password ?? '';
    return this;
  }

  /**
   * Sets both the user and the owner password to the same value.
   * @param password - The password to use for both
   * @returns This builder for method chaining
   */
  withPassword(password: string): EncryptionOptions {
    this.settings.userPassword = password ?? '';
    this.settings.ownerPassword = password ?? '';
    return this;
  }

  /**
   * Sets the document permissions.
   * @param permissions - The permissions to set
   * @returns This builder for method chaining
   */
  withPermissions(permissions: PdfPermissions): EncryptionOptions {
    this.settings.permissions = permissions;
    return this;
  }

  /**
   * Allows printing of the document.
   * @param highQuality - Whether to also allow high-quality printing (default true)
   * @returns This builder for method chaining
   */
  allowPrinting(highQuality: boolean = true): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.Print;
    if (highQuality) {
      this.settings.permissions |= PdfPermissions.PrintHighQuality;
    }
    return this;
  }

  /**
   * Allows copying of text and graphics from the document.
   * @returns This builder for method chaining
   */
  allowCopying(): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.Copy;
    return this;
  }

  /**
   * Allows modification of the document.
   * @returns This builder for method chaining
   */
  allowModification(): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.Modify;
    return this;
  }

  /**
   * Allows adding and modifying annotations and filling forms.
   * @returns This builder for method chaining
   */
  allowAnnotations(): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.AnnotateAndFillForms;
    return this;
  }

  /**
   * Allows filling of interactive form fields.
   * @returns This builder for method chaining
   */
  allowFormFilling(): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.FillForms;
    return this;
  }

  /**
   * Allows document assembly (inserting, rotating and deleting pages).
   * @returns This builder for method chaining
   */
  allowAssembly(): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.Assemble;
    return this;
  }

  /**
   * Allows text extraction for accessibility.
   * @returns This builder for method chaining
   */
  allowAccessibility(): EncryptionOptions {
    this.settings.permissions |= PdfPermissions.ExtractForAccessibility;
    return this;
  }

  /**
   * Denies all permissions (most restrictive). Grant back what is needed with the `allow*` methods.
   * @returns This builder for method chaining
   */
  denyAll(): EncryptionOptions {
    this.settings.permissions = PdfPermissions.None;
    return this;
  }

  /**
   * Grants all permissions (least restrictive, the default).
   * @returns This builder for method chaining
   */
  allowAll(): EncryptionOptions {
    this.settings.permissions = PdfPermissions.All;
    return this;
  }

  /**
   * Sets whether to encrypt document metadata.
   * @param encrypt - Whether to encrypt metadata
   * @returns This builder for method chaining
   */
  encryptMetadata(encrypt: boolean = true): EncryptionOptions {
    this.settings.encryptMetadata = encrypt;
    return this;
  }

  /**
   * Builds and returns the EncryptionSettings.
   * @returns The encryption settings
   */
  build(): EncryptionSettings {
    return this.settings.clone();
  }
}
