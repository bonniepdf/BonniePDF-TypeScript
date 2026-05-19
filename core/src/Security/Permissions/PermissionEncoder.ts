import { PdfPermissions } from './PdfPermissions';

/**
 * Encodes PDF permissions into the integer format required by the /P entry
 * in the encryption dictionary, following PDF Reference 1.4 specifications.
 */
export class PermissionEncoder {
  /**
   * Reserved bits that must always be set to 1 in the permissions value.
   * Bits 1-2, 7-8, and 13-32 are reserved and must be 1 for PDF 1.4+.
   */
  private static readonly RESERVED_BITS = 0xfffff0c0;

  /**
   * Encodes the permission flags into the signed 32-bit integer format
   * required by the /P entry in the encryption dictionary.
   * @param permissions The permission flags to encode
   * @returns The encoded permissions as a signed 32-bit integer
   */
  public static encode(permissions: PdfPermissions): number {
    // Start with all reserved bits set to 1
    let result = PermissionEncoder.RESERVED_BITS;

    // Set the permission bits based on the flags
    if ((permissions & PdfPermissions.Print) !== 0) {
      result |= 1 << 2; // Bit 3
    }

    if ((permissions & PdfPermissions.Modify) !== 0) {
      result |= 1 << 3; // Bit 4
    }

    if ((permissions & PdfPermissions.Copy) !== 0) {
      result |= 1 << 4; // Bit 5
    }

    if ((permissions & PdfPermissions.AnnotateAndFillForms) !== 0) {
      result |= 1 << 5; // Bit 6
    }

    if ((permissions & PdfPermissions.FillForms) !== 0) {
      result |= 1 << 8; // Bit 9
    }

    if ((permissions & PdfPermissions.ExtractForAccessibility) !== 0) {
      result |= 1 << 9; // Bit 10
    }

    if ((permissions & PdfPermissions.Assemble) !== 0) {
      result |= 1 << 10; // Bit 11
    }

    if ((permissions & PdfPermissions.PrintHighQuality) !== 0) {
      result |= 1 << 11; // Bit 12
    }

    return result;
  }
}
