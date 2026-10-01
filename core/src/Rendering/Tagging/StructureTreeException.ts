import { BonniePdfError } from '../../Core/BonniePdfError';

/**
 * Thrown when the structure-tree builder is asked to perform an
 * operation that would produce an invalid tree (e.g. closing a node
 * that wasn't opened, ending past the document root).
 */
export class StructureTreeException extends BonniePdfError {
  constructor(message: string) {
    super(message);
    this.name = 'StructureTreeException';
  }
}
