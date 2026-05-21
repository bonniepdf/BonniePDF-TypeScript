// IPdfWriter / IAsyncPdfWriter live alongside their implementations in
// PdfWriter.ts — the standalone `./IPdfWriter` / `./IAsyncPdfWriter`
// files are shadow definitions that drift from the real ones, so this
// module imports from the kitchen-sink file the serializer also uses.
import type { IPdfWriter, IAsyncPdfWriter } from './PdfWriter';
import { StructureElement } from '../Tagging/StructureElement';
import { StructureTreeBuilder } from '../Tagging/StructureTreeBuilder';
import { toPdfTag } from '../Tagging/SemanticRole';
import { PdfSyntax } from '../Pdf/PdfSyntax';

/**
 * Translates the in-memory {@link StructureTreeBuilder} tree into the
 * PDF object graph: one object per structure element plus a
 * `/StructTreeRoot` dictionary that points to the document element.
 *
 * Object IDs are allocated via the writer's `getNewId`; emission is
 * post-order (leaf-first) so each parent already knows its children's
 * IDs when its `/K` array is written.
 *
 * this feature scope: emits the tree skeleton (roles, parent/child refs,
 * optional `/Alt /ActualText /Lang /T` metadata, MCID arrays). Per-MCID
 * page references (`/Pg`) and the `/ParentTree` auxiliary structure
 * are deferred — they arrive once the canvas starts emitting
 * marked-content and once annotations participate in tagging
 *.
 */
export class StructureTreeWriter {
  private readonly _writer?: IPdfWriter;
  private readonly _asyncWriter?: IAsyncPdfWriter;

  /** Creates a structure-tree writer that emits synchronously. */
  constructor(writer: IPdfWriter);
  /** Creates a structure-tree writer that emits asynchronously. */
  constructor(asyncWriter: IAsyncPdfWriter, asyncMarker: true);
  constructor(writer: IPdfWriter | IAsyncPdfWriter, asyncMarker?: true) {
    if (asyncMarker === true) {
      this._asyncWriter = writer as IAsyncPdfWriter;
    } else {
      this._writer = writer as IPdfWriter;
    }
  }

  // ── Sync ────────────────────────────────────────────────────────

  /**
   * Emit the structure tree contained in `builder` and return the
   * object ID of the `/StructTreeRoot`. The caller is responsible for
   * wiring that ID into `CatalogOptions.structTreeRootId`.
   */
  write(builder: StructureTreeBuilder): number {
    if (!this._writer) {
      throw new Error('StructureTreeWriter.write: writer is async; call writeAsync().');
    }
    const writer = this._writer;
    const structTreeRootId = writer.getNewId();
    const elementIds = new Map<StructureElement, number>();

    this.writeSubtree(builder.root, structTreeRootId, elementIds);
    writer.writeObject(structTreeRootId, StructureTreeWriter.buildStructTreeRootDict(builder.root, elementIds));

    return structTreeRootId;
  }

  private writeSubtree(element: StructureElement, parentId: number, elementIds: Map<StructureElement, number>): void {
    const writer = this._writer!;
    const id = writer.getNewId();
    elementIds.set(element, id);

    for (const child of element.children) this.writeSubtree(child, id, elementIds);

    writer.writeObject(id, StructureTreeWriter.buildStructElemDict(element, parentId, elementIds));
  }

  // ── Async ───────────────────────────────────────────────────────

  /** Async counterpart to {@link write}. */
  async writeAsync(builder: StructureTreeBuilder, cancellationToken?: AbortSignal): Promise<number> {
    if (!this._asyncWriter) {
      throw new Error('StructureTreeWriter.writeAsync: writer is sync; call write().');
    }
    const writer = this._asyncWriter;
    const structTreeRootId = writer.getNewId();
    const elementIds = new Map<StructureElement, number>();

    await this.writeSubtreeAsync(builder.root, structTreeRootId, elementIds, cancellationToken);
    await writer.writeObjectAsync(
      structTreeRootId,
      StructureTreeWriter.buildStructTreeRootDict(builder.root, elementIds)
    );

    return structTreeRootId;
  }

  private async writeSubtreeAsync(
    element: StructureElement,
    parentId: number,
    elementIds: Map<StructureElement, number>,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    const writer = this._asyncWriter!;
    const id = writer.getNewId();
    elementIds.set(element, id);

    for (const child of element.children) {
      await this.writeSubtreeAsync(child, id, elementIds, cancellationToken);
    }

    await writer.writeObjectAsync(id, StructureTreeWriter.buildStructElemDict(element, parentId, elementIds));
  }

  // ── Shared dict construction ────────────────────────────────────

  private static buildStructElemDict(
    element: StructureElement,
    parentObjectId: number,
    elementIds: Map<StructureElement, number>
  ): Map<string, string> {
    const dict = new Map<string, string>();
    dict.set('/Type', '/StructElem');
    dict.set('/S', '/' + toPdfTag(element.role));
    dict.set('/P', `${parentObjectId} 0 R`);

    const kids = StructureTreeWriter.buildKidsArray(element, elementIds);
    if (kids !== null) dict.set('/K', kids);

    if (element.alt) dict.set('/Alt', `(${PdfSyntax.escape(element.alt)})`);
    if (element.actualText) dict.set('/ActualText', `(${PdfSyntax.escape(element.actualText)})`);
    if (element.lang) dict.set('/Lang', `(${PdfSyntax.escape(element.lang)})`);
    if (element.title) dict.set('/T', `(${PdfSyntax.escape(element.title)})`);

    return dict;
  }

  private static buildStructTreeRootDict(
    documentRoot: StructureElement,
    elementIds: Map<StructureElement, number>
  ): Map<string, string> {
    const dict = new Map<string, string>();
    dict.set('/Type', '/StructTreeRoot');
    // /K references the document StructElem (the in-memory root).
    dict.set('/K', `[ ${elementIds.get(documentRoot)} 0 R ]`);
    // /ParentTree and /ParentTreeNextKey are deferred until the canvas
    // wires MCIDs through. Without them VeraPDF still sees
    // "structure tree present" but can't resolve MCID→StructElem ownership
    // for content that has MCIDs.
    return dict;
  }

  /**
   * Build the `/K` array string for an element: child structure
   * element references first, then bare MCIDs. Returns `null` when
   * the element has neither children nor MCIDs (the spec allows /K to
   * be absent on a leaf without content).
   */
  private static buildKidsArray(element: StructureElement, ids: Map<StructureElement, number>): string | null {
    if (element.children.length === 0 && element.mcIds.length === 0) return null;

    const parts: string[] = [];
    for (const child of element.children) parts.push(`${ids.get(child)} 0 R`);
    for (const mcid of element.mcIds) parts.push(mcid.toString());

    return '[ ' + parts.join(' ') + ' ]';
  }
}
