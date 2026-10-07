/** Entries configuring the document security handler. */
export const Encryption = {
  /** Name of the security handler used to encrypt the document. */
  Handler: '/Filter',

  /** Encryption algorithm version selecting the document's encryption scheme. */
  AlgorithmVersion: '/V',

  /** Revision of the standard security handler. */
  HandlerRevision: '/R',

  /** Owner-password authentication entry in the encryption dictionary. */
  OwnerEntry: '/O',

  /** User-password authentication entry in the encryption dictionary. */
  UserEntry: '/U',

  /** Integer bit field specifying the document's permitted operations. */
  Permissions: '/P',

  /** Length of the encryption key in bits. */
  KeyLength: '/Length',

  /** File encryption key encrypted with the owner-password-derived key for AES-256. */
  OwnerEncryptionEntry: '/OE',

  /** File encryption key encrypted with the user-password-derived key for AES-256. */
  UserEncryptionEntry: '/UE',

  /** Encrypted permissions block used by the AES-256 security handler. */
  EncryptedPermissions: '/Perms',

  /** Dictionary defining the document's named crypt filters. */
  CryptFilters: '/CF',

  /** Name of the default crypt filter for stream data. */
  StreamFilter: '/StmF',

  /** Name of the default crypt filter for strings. */
  StringFilter: '/StrF',

  /** Whether the security handler encrypts document metadata streams. */
  EncryptMetadata: '/EncryptMetadata',
} as const;
