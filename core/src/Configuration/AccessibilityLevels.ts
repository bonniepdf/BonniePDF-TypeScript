import { AccessibilityMode } from './AccessibilityMode';

/** True for either PDF/UA level: the document is tagged and claims PDF/UA. */
export function isTagged(mode: AccessibilityMode): boolean {
  return mode === AccessibilityMode.PdfUa1 || mode === AccessibilityMode.PdfUa2;
}

/** The claim's spec token: `pdf/ua-1` or `pdf/ua-2`. */
export function pdfUaClaimToken(mode: AccessibilityMode): string {
  return mode === AccessibilityMode.PdfUa2 ? 'pdf/ua-2' : 'pdf/ua-1';
}
