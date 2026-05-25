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
 * PDF object graph: one object per structure element, a `/ParentTree`
 * number tree for MCID→StructElem reverse lookup, and a
 * `/StructTreeRoot` dictionary that points to both.
 *
 * Each StructElem with MCIDs gets either:
 * - `/K [int int …]` + `/Pg <page-ref>` when all its MCIDs are on the
 *   same page (the common case);
 * - `/K [<</Type /MCR /Pg p1 /MCID m1>> …]` when MCIDs span pages
 *   (an element that page-broke after the page-break fix runs).
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
   * object ID of the `/StructTreeRoot`. Caller wires the ID into
   * `CatalogOptions.structTreeRootId` and also sets `/StructParents`
   * on each page dict to its zero-based page index (matches the keys
   * in `/ParentTree`).
   *
   * @param pageIds Page object IDs in document order. Empty/undefined
   *   when no page-aware output is needed (test fixtures).
   */
  write(builder: StructureTreeBuilder, pageIds?: number[], annotBindings?: AnnotBinding[]): number {
    if (!this._writer) {
      throw new Error('StructureTreeWriter.write: writer is async; call writeAsync().');
    }
    const writer = this._writer;
    const havePages = pageIds != null && pageIds.length > 0;
    const structTreeRootId = writer.getNewId();
    const parentTreeId = havePages ? writer.getNewId() : 0;

    const elementIds = new Map<StructureElement, number>();
    const parentTreeNums = havePages ? buildEmptyParentTreeNums(pageIds!.length) : undefined;

    this.writeSubtree(builder.root, structTreeRootId, elementIds, pageIds, parentTreeNums);

    if (parentTreeId > 0 && parentTreeNums) {
      writer.writeObject(parentTreeId, buildParentTreeDict(parentTreeNums, elementIds, annotBindings));
    }

    writer.writeObject(
      structTreeRootId,
      buildStructTreeRootDict(builder.root, elementIds, parentTreeId, parentTreeNums, annotBindings)
    );

    return structTreeRootId;
  }

  private writeSubtree(
    element: StructureElement,
    parentId: number,
    elementIds: Map<StructureElement, number>,
    pageIds: number[] | undefined,
    parentTreeNums: ParentTreeEntry[][] | undefined
  ): void {
    const writer = this._writer!;
    const id = writer.getNewId();
    elementIds.set(element, id);

    for (const child of element.children) this.writeSubtree(child, id, elementIds, pageIds, parentTreeNums);

    if (parentTreeNums) recordParentTreeContributions(element, parentTreeNums);

    writer.writeObject(id, buildStructElemDict(element, parentId, elementIds, pageIds));
  }

  // ── Async ───────────────────────────────────────────────────────

  /** Async counterpart to {@link write}. */
  async writeAsync(
    builder: StructureTreeBuilder,
    pageIds?: number[],
    annotBindings?: AnnotBinding[],
    _cancellationToken?: AbortSignal
  ): Promise<number> {
    if (!this._asyncWriter) {
      throw new Error('StructureTreeWriter.writeAsync: writer is sync; call write().');
    }
    const writer = this._asyncWriter;
    const havePages = pageIds != null && pageIds.length > 0;
    const structTreeRootId = writer.getNewId();
    const parentTreeId = havePages ? writer.getNewId() : 0;

    const elementIds = new Map<StructureElement, number>();
    const parentTreeNums = havePages ? buildEmptyParentTreeNums(pageIds!.length) : undefined;

    await this.writeSubtreeAsync(builder.root, structTreeRootId, elementIds, pageIds, parentTreeNums);

    if (parentTreeId > 0 && parentTreeNums) {
      await writer.writeObjectAsync(parentTreeId, buildParentTreeDict(parentTreeNums, elementIds, annotBindings));
    }

    await writer.writeObjectAsync(
      structTreeRootId,
      buildStructTreeRootDict(builder.root, elementIds, parentTreeId, parentTreeNums, annotBindings)
    );

    return structTreeRootId;
  }

  private async writeSubtreeAsync(
    element: StructureElement,
    parentId: number,
    elementIds: Map<StructureElement, number>,
    pageIds: number[] | undefined,
    parentTreeNums: ParentTreeEntry[][] | undefined
  ): Promise<void> {
    const writer = this._asyncWriter!;
    const id = writer.getNewId();
    elementIds.set(element, id);

    for (const child of element.children) {
      await this.writeSubtreeAsync(child, id, elementIds, pageIds, parentTreeNums);
    }

    if (parentTreeNums) recordParentTreeContributions(element, parentTreeNums);

    await writer.writeObjectAsync(id, buildStructElemDict(element, parentId, elementIds, pageIds));
  }
}

// ── Shared dict construction ──────────────────────────────────────

interface ParentTreeEntry {
  mcid: number;
  elem: StructureElement;
}

/** annotation binding record for /StructParent + /OBJR wiring. */
interface AnnotBinding {
  structElem: StructureElement;
  annotId: number;
  pageObjectId: number;
  structParentKey: number;
}

function buildStructElemDict(
  element: StructureElement,
  parentObjectId: number,
  elementIds: Map<StructureElement, number>,
  pageIds: number[] | undefined
): Map<string, string> {
  const dict = new Map<string, string>();
  dict.set('/Type', '/StructElem');
  dict.set('/S', '/' + toPdfTag(element.role));
  dict.set('/P', `${parentObjectId} 0 R`);

  const built = buildKidsAndPg(element, elementIds, pageIds);
  if (built.kids !== null) dict.set('/K', built.kids);
  if (built.singlePageObjectId !== undefined) dict.set('/Pg', `${built.singlePageObjectId} 0 R`);

  // PDF text strings: use encodeMetadataString so non-Latin-1 chars
  // (em-dash, smart quotes, CJK, etc.) become a UTF-16BE hex literal
  // <FEFF…> rather than getting byte-truncated by the Latin-1 writer.
  if (element.alt) dict.set('/Alt', PdfSyntax.encodeMetadataString(element.alt));
  if (element.actualText) dict.set('/ActualText', PdfSyntax.encodeMetadataString(element.actualText));
  if (element.lang) dict.set('/Lang', PdfSyntax.encodeMetadataString(element.lang));
  if (element.title) dict.set('/T', PdfSyntax.encodeMetadataString(element.title));

  // /A — attributes dictionary (raw PDF syntax provided by caller).
  // Tables use this for /ColSpan; future stages may use it for
  // /RowSpan and list characteristics.
  if (element.attributes) dict.set('/A', element.attributes);

  return dict;
}

function buildStructTreeRootDict(
  documentRoot: StructureElement,
  elementIds: Map<StructureElement, number>,
  parentTreeId: number,
  parentTreeNums: ParentTreeEntry[][] | undefined,
  annotBindings?: AnnotBinding[]
): Map<string, string> {
  const dict = new Map<string, string>();
  dict.set('/Type', '/StructTreeRoot');
  dict.set('/K', `[ ${elementIds.get(documentRoot)} 0 R ]`);

  if (parentTreeId > 0 && parentTreeNums) {
    dict.set('/ParentTree', `${parentTreeId} 0 R`);
    // /ParentTreeNextKey = max key used + 1.
    // Annotation keys (10_000+) may exceed the page count, so use the
    // max of page count and maxAnnotKey + 1.
    let nextKey = parentTreeNums.length;
    if (annotBindings && annotBindings.length > 0) {
      const maxAnnotKey = Math.max(...annotBindings.map(b => b.structParentKey));
      nextKey = Math.max(nextKey, maxAnnotKey + 1);
    }
    dict.set('/ParentTreeNextKey', nextKey.toString());
  }

  return dict;
}

function buildParentTreeDict(
  parentTreeNums: ParentTreeEntry[][],
  elementIds: Map<StructureElement, number>,
  annotBindings?: AnnotBinding[]
): Map<string, string> {
  const parts: string[] = [];
  for (let pageKey = 0; pageKey < parentTreeNums.length; pageKey++) {
    const entries = parentTreeNums[pageKey];
    parts.push(pageKey.toString());
    if (entries.length === 0) {
      parts.push('[ ]');
      continue;
    }
    let maxMcid = 0;
    for (const e of entries) if (e.mcid > maxMcid) maxMcid = e.mcid;
    const slots: string[] = new Array(maxMcid + 1).fill('null');
    for (const { mcid, elem } of entries) slots[mcid] = `${elementIds.get(elem)} 0 R`;
    parts.push('[ ' + slots.join(' ') + ' ]');
  }

  // Annotation struct parent entries: each link annotation gets its
  // own key mapping directly to its containing Link struct element.
  if (annotBindings) {
    for (const { structElem, structParentKey } of annotBindings) {
      const elemId = elementIds.get(structElem);
      if (elemId !== undefined) {
        parts.push(structParentKey.toString());
        parts.push(`${elemId} 0 R`);
      }
    }
  }

  return new Map<string, string>([['/Nums', '[ ' + parts.join(' ') + ' ]']]);
}

function buildKidsAndPg(
  element: StructureElement,
  elementIds: Map<StructureElement, number>,
  pageIds: number[] | undefined
): { kids: string | null; singlePageObjectId?: number } {
  if (element.children.length === 0 && element.mcIds.length === 0 && element.objrAnnotations.length === 0) {
    return { kids: null };
  }

  const parts: string[] = [];
  for (const child of element.children) parts.push(`${elementIds.get(child)} 0 R`);

  let singlePageObjectId: number | undefined;

  if (element.mcIds.length > 0) {
    let allSamePage = true;
    const firstPage = element.mcIdPages.length > 0 ? element.mcIdPages[0] : 0;
    for (let i = 1; i < element.mcIdPages.length; i++) {
      if (element.mcIdPages[i] !== firstPage) {
        allSamePage = false;
        break;
      }
    }

    if (allSamePage && pageIds && firstPage < pageIds.length) {
      singlePageObjectId = pageIds[firstPage];
      for (const mcid of element.mcIds) parts.push(mcid.toString());
    } else if (pageIds) {
      for (let i = 0; i < element.mcIds.length; i++) {
        const mcid = element.mcIds[i];
        const pageIndex = i < element.mcIdPages.length ? element.mcIdPages[i] : 0;
        if (pageIndex < pageIds.length) {
          parts.push(`<< /Type /MCR /Pg ${pageIds[pageIndex]} 0 R /MCID ${mcid} >>`);
        } else {
          parts.push(mcid.toString());
        }
      }
    } else {
      // Test mode (no page IDs) — bare ints, no /Pg.
      for (const mcid of element.mcIds) parts.push(mcid.toString());
    }
  }

  // /OBJR children for annotation-backed elements.
  for (const { annotId, pageObjectId } of element.objrAnnotations) {
    parts.push(`<< /Type /OBJR /Pg ${pageObjectId} 0 R /Obj ${annotId} 0 R >>`);
  }

  return { kids: '[ ' + parts.join(' ') + ' ]', singlePageObjectId };
}

function buildEmptyParentTreeNums(pageCount: number): ParentTreeEntry[][] {
  const result: ParentTreeEntry[][] = [];
  for (let i = 0; i < pageCount; i++) result.push([]);
  return result;
}

function recordParentTreeContributions(element: StructureElement, parentTreeNums: ParentTreeEntry[][]): void {
  for (let i = 0; i < element.mcIds.length; i++) {
    const mcid = element.mcIds[i];
    const pageIndex = i < element.mcIdPages.length ? element.mcIdPages[i] : 0;
    if (pageIndex < parentTreeNums.length) {
      parentTreeNums[pageIndex].push({ mcid, elem: element });
    }
  }
}
