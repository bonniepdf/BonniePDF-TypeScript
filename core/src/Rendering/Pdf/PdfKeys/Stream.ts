/** Entries describing encoded or embedded stream data. */
export const Stream = {
  /** Decoding filter or filter array applied to the encoded stream bytes. */
  Filter: '/Filter',

  /** Length of decoded data or its first segment, as recorded for embedded streams. */
  DecodedLength: '/Length1',
} as const;
