/**
 * XML/SVG string escaping helpers shared by the SVG canvas, the SVG page
 * exporter, and the SVG render pipeline. Kept separate from {@link PdfSyntax}
 * (which escapes PDF string literals, a different grammar).
 */

/** Escapes a string for use as XML text content (`&`, `<`, `>`, `"`, `'`). */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Escapes a string for use inside a double-quoted XML attribute value. */
export function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
