import { SemanticRole } from './SemanticRole';

/**
 * False for the PDF 1.7 types the PDF 2.0 standard structure namespace dropped
 * (ISO 32000-2 §14.8.6); those stay in the default PDF 1.7 namespace.
 */
export function inPdf20Namespace(role: SemanticRole): boolean {
  switch (role) {
    case SemanticRole.Art:
    case SemanticRole.BlockQuote:
    case SemanticRole.TOC:
    case SemanticRole.TOCI:
    case SemanticRole.Index:
    case SemanticRole.Quote:
    case SemanticRole.Note:
    case SemanticRole.Reference:
    case SemanticRole.BibEntry:
    case SemanticRole.Code:
      return false;
    default:
      return true;
  }
}
