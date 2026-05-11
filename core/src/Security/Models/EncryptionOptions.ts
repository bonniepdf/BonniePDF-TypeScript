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
   * Sets the document permissions.
   * @param permissions - The permissions to set
   * @returns This builder for method chaining
   */
  withPermissions(permissions: PdfPermissions): EncryptionOptions {
    this.settings.permissions = permissions;
    return this;
  }

  /**
   * Allows or disallows printing.
   * @param allow - Whether to allow printing
   * @param highQuality - Whether to allow high-quality printing
   * @returns This builder for method chaining
   */
  allowPrinting(allow: boolean = true, highQuality: boolean = false): EncryptionOptions {
    if (allow) {
      this.settings.permissions |= PdfPermissions.Print;
      if (highQuality) {
        this.settings.permissions |= PdfPermissions.PrintHighQuality;
      }
    } else {
      this.settings.permissions &= ~PdfPermissions.Print;
      this.settings.permissions &= ~PdfPermissions.PrintHighQuality;
    }
    return this;
  }

  /**
   * Allows or disallows document modification.
   * @param allow - Whether to allow modification
   * @returns This builder for method chaining
   */
  allowModification(allow: boolean = true): EncryptionOptions {
    if (allow) {
      this.settings.permissions |= PdfPermissions.Modify;
    } else {
      this.settings.permissions &= ~PdfPermissions.Modify;
    }
    return this;
  }

  /**
   * Allows or disallows copying text and graphics.
   * @param allow - Whether to allow copying
   * @returns This builder for method chaining
   */
  allowCopying(allow: boolean = true): EncryptionOptions {
    if (allow) {
      this.settings.permissions |= PdfPermissions.Copy;
    } else {
      this.settings.permissions &= ~PdfPermissions.Copy;
    }
    return this;
  }

  /**
   * Allows or disallows adding annotations and filling form fields.
   * @param allow - Whether to allow annotations and form filling
   * @returns This builder for method chaining
   */
  allowAnnotations(allow: boolean = true): EncryptionOptions {
    if (allow) {
      this.settings.permissions |= PdfPermissions.AnnotateAndFillForms;
    } else {
      this.settings.permissions &= ~PdfPermissions.AnnotateAndFillForms;
    }
    return this;
  }

  /**
   * Allows or disallows filling form fields.
   * @param allow - Whether to allow form filling
   * @returns This builder for method chaining
   */
  allowFormFilling(allow: boolean = true): EncryptionOptions {
    if (allow) {
      this.settings.permissions |= PdfPermissions.FillForms;
    } else {
      this.settings.permissions &= ~PdfPermissions.FillForms;
    }
    return this;
  }

  /**
   * Allows or disallows text extraction for accessibility.
   * @param allow - Whether to allow accessibility extraction
   * @returns This builder for method chaining
   */
  allowAccessibility(allow: boolean = true): EncryptionOptions {
    if (allow) {
      this.settings.permissions |= PdfPermissions.ExtractForAccessibility;
    } else {
      this.settings.permissions &= ~PdfPermissions.ExtractForAccessibility;
    }
    return this;
  }

  /**
   * Allows all permissions.
   * @returns This builder for method chaining
   */
  allowAll(): EncryptionOptions {
    this.settings.permissions = PdfPermissions.All;
    return this;
  }

  /**
   * Disallows all permissions.
   * @returns This builder for method chaining
   */
  allowNone(): EncryptionOptions {
    this.settings.permissions = PdfPermissions.None;
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
