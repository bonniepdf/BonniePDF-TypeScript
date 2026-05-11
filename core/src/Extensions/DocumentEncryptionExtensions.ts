import { DocumentSettings } from '../Configuration/DocumentSettings';
import { EncryptionSettings } from '../Security/Models/EncryptionSettings';
import { EncryptionOptions } from '../Security/Models/EncryptionOptions';
import { EncryptionAlgorithm } from '../Security/Models/EncryptionAlgorithm';
import { PdfPermissions } from '../Security/Permissions/PdfPermissions';
import { PdfVersion } from '../Configuration/PdfVersion';



  /**
   * Extension methods for configuring PDF document encryption.
   */
  export class DocumentEncryptionExtensions {
    /**
     * Configures 40-bit RC4 encryption (legacy, not recommended for new documents).
     * @param settings The document settings
     * @param configure Function to configure encryption options
     * @returns The document settings for method chaining
     */
    static withEncryption40(settings: DocumentSettings, configure: (options: EncryptionOptions) => void): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');
      if (configure === null) throw new Error('configure cannot be null');

      const options = new EncryptionOptions(EncryptionAlgorithm.RC4_40);
      configure(options);
      settings.encryption = options.build();
      return settings;
    }

    /**
     * Configures 128-bit RC4 encryption (standard for PDF 1.4).
     * @param settings The document settings
     * @param configure Function to configure encryption options
     * @returns The document settings for method chaining
     */
    static withEncryption128(settings: DocumentSettings, configure: (options: EncryptionOptions) => void): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');
      if (configure === null) throw new Error('configure cannot be null');

      const options = new EncryptionOptions(EncryptionAlgorithm.RC4_128);
      configure(options);
      settings.encryption = options.build();
      return settings;
    }

    /**
     * Configures encryption with the specified settings.
     * @param settings The document settings
     * @param encryptionSettings The encryption settings to use
     * @returns The document settings for method chaining
     */
    static withEncryption(settings: DocumentSettings, encryptionSettings: EncryptionSettings): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');
      if (encryptionSettings === null) throw new Error('encryptionSettings cannot be null');

      encryptionSettings.validate();
      settings.encryption = encryptionSettings.clone();
      return settings;
    }

    /**
     * Configures encryption with a simple user password (128-bit RC4, all permissions).
     * @param settings The document settings
     * @param userPassword The password required to open the document
     * @returns The document settings for method chaining
     */
    static withPassword(settings: DocumentSettings, userPassword: string): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');

      const encryption = new EncryptionSettings();
      encryption.algorithm = EncryptionAlgorithm.RC4_128;
      encryption.userPassword = userPassword ?? "";
      encryption.ownerPassword = userPassword ?? "";
      encryption.permissions = PdfPermissions.All;
      settings.encryption = encryption;
      return settings;
    }

    /**
     * Configures encryption with user and owner passwords (128-bit RC4).
     * @param settings The document settings
     * @param userPassword The password required to open the document
     * @param ownerPassword The password required to change permissions
     * @param permissions The permissions to grant
     * @returns The document settings for method chaining
     */
    static withPasswords(
      settings: DocumentSettings,
      userPassword: string,
      ownerPassword: string,
      permissions: PdfPermissions = PdfPermissions.All
    ): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');

      const encryption = new EncryptionSettings();
      encryption.algorithm = EncryptionAlgorithm.RC4_128;
      encryption.userPassword = userPassword ?? "";
      encryption.ownerPassword = ownerPassword ?? "";
      encryption.permissions = permissions;
      settings.encryption = encryption;
      return settings;
    }

    /**
     * Configures AES-256 encryption (PDF 1.7 required).
     * Automatically sets Version to Pdf17.
     * @param settings The document settings
     * @param configure Function to configure encryption options
     * @returns The document settings for method chaining
     */
    static withEncryptionAes256(settings: DocumentSettings, configure: (options: EncryptionOptions) => void): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');
      if (configure === null) throw new Error('configure cannot be null');

      settings.version = PdfVersion.Pdf17;
      const options = new EncryptionOptions(EncryptionAlgorithm.AES_256);
      configure(options);
      settings.encryption = options.build();
      return settings;
    }

    /**
     * Removes encryption from the document settings.
     * @param settings The document settings
     * @returns The document settings for method chaining
     */
    static withoutEncryption(settings: DocumentSettings): DocumentSettings {
      if (settings === null) throw new Error('settings cannot be null');

      settings.encryption = undefined;
      return settings;
    }
  }

  /**
   * Shortcut functions for DocumentEncryptionExtensions
   */
  export function withEncryption40(settings: DocumentSettings, configure: (options: EncryptionOptions) => void): DocumentSettings {
    return DocumentEncryptionExtensions.withEncryption40(settings, configure);
  }

  export function withEncryption128(settings: DocumentSettings, configure: (options: EncryptionOptions) => void): DocumentSettings {
    return DocumentEncryptionExtensions.withEncryption128(settings, configure);
  }

  export function withEncryption(settings: DocumentSettings, encryptionSettings: EncryptionSettings): DocumentSettings {
    return DocumentEncryptionExtensions.withEncryption(settings, encryptionSettings);
  }

  export function withPassword(settings: DocumentSettings, userPassword: string): DocumentSettings {
    return DocumentEncryptionExtensions.withPassword(settings, userPassword);
  }

  export function withPasswords(
    settings: DocumentSettings,
    userPassword: string,
    ownerPassword: string,
    permissions?: PdfPermissions
  ): DocumentSettings {
    return DocumentEncryptionExtensions.withPasswords(settings, userPassword, ownerPassword, permissions);
  }

  export function withEncryptionAes256(settings: DocumentSettings, configure: (options: EncryptionOptions) => void): DocumentSettings {
    return DocumentEncryptionExtensions.withEncryptionAes256(settings, configure);
  }

  export function withoutEncryption(settings: DocumentSettings): DocumentSettings {
    return DocumentEncryptionExtensions.withoutEncryption(settings);
  }
