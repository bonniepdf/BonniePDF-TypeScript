import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import { BookmarkItem } from '../../Configuration/BookmarkItem';
import { PdfSyntax } from '../Pdf/PdfSyntax';

interface FlatBookmark {
  item: BookmarkItem;
  id: number;
  parentId: number;
  depth: number;
}


  /**
   * Writes PDF navigation objects (Outlines/Bookmarks) to PDF.
   */
  export class NavigationWriter {
    private readonly writer: IPdfWriter | undefined;
    private readonly asyncWriter: IAsyncPdfWriter | undefined;

    constructor(writer: IPdfWriter | IAsyncPdfWriter) {
      if ('writeObject' in writer) {
        this.writer = writer as IPdfWriter;
        this.asyncWriter = undefined;
      } else {
        this.asyncWriter = writer as IAsyncPdfWriter;
        this.writer = undefined;
      }
    }

    /**
     * Writes the bookmark/outline tree to the PDF document.
     * This enables navigation via the PDF viewer's bookmark pane.
     * @param rootId The object ID for the root Outlines dictionary.
     * @param bookmarks The list of bookmarks.
     * @param pageIds List of object IDs for the document's pages.
     * @returns The root ID if outlines were written, 0 otherwise.
     */
    writeOutlineTree(rootId: number, bookmarks: BookmarkItem[], pageIds: number[]): number {
      if (!this.writer) throw new Error('Sync writer not available');
      if (bookmarks.length === 0) return 0;

      // Flatten the bookmark tree to assign IDs
      const flatList: FlatBookmark[] = [];
      let nextId = rootId + 1; // rootId is reserved for the /Outlines root

      this.flatten(bookmarks, rootId, 0, flatList, nextId);
      nextId = rootId + 1 + flatList.length;

      // Group children by parent
      const childrenByParent = new Map<number, number[]>();
      for (let i = 0; i < flatList.length; i++) {
        const entry = flatList[i];
        if (!childrenByParent.has(entry.parentId)) {
          childrenByParent.set(entry.parentId, []);
        }
        childrenByParent.get(entry.parentId)!.push(i);
      }

      // Count total visible items
      const countVisible = (parentId: number): number => {
        const children = childrenByParent.get(parentId);
        if (!children) return 0;
        let count = 0;
        for (const idx of children) {
          count++;
          count += countVisible(flatList[idx].id);
        }
        return count;
      };

      const totalCount = countVisible(rootId);

      // Write root /Outlines object
      const rootChildren = childrenByParent.get(rootId) ?? [];
      const rootDict = new Map<string, string>();
      rootDict.set('/Type', '/Outlines');
      rootDict.set('/Count', totalCount.toString());

      if (rootChildren.length > 0) {
        rootDict.set('/First', `${flatList[rootChildren[0]].id} 0 R`);
        rootDict.set('/Last', `${flatList[rootChildren[rootChildren.length - 1]].id} 0 R`);
      }
      this.writer.writeObject(rootId, rootDict);

      // Write each bookmark node
      for (let i = 0; i < flatList.length; i++) {
        const { item, id: itemId, parentId } = flatList[i];
        const siblings = childrenByParent.get(parentId) ?? [];
        const siblingIdx = siblings.indexOf(i);

        const dict = new Map<string, string>();
        dict.set('/Title', `(${PdfSyntax.escape(item.title)})`);
        dict.set('/Parent', `${parentId} 0 R`);

        // Destination
        let pageIdx = Math.min(item.pageIndex, pageIds.length - 1);
        pageIdx = Math.max(pageIdx, 0);
        dict.set('/Dest', `[ ${pageIds[pageIdx]} 0 R /Fit ]`);

        // Prev/Next siblings
        if (siblingIdx > 0) {
          dict.set('/Prev', `${flatList[siblings[siblingIdx - 1]].id} 0 R`);
        }
        if (siblingIdx < siblings.length - 1) {
          dict.set('/Next', `${flatList[siblings[siblingIdx + 1]].id} 0 R`);
        }

        // Children
        const myChildren = childrenByParent.get(itemId);
        if (myChildren && myChildren.length > 0) {
          const childCount = countVisible(itemId);
          dict.set('/Count', childCount.toString());
          dict.set('/First', `${flatList[myChildren[0]].id} 0 R`);
          dict.set('/Last', `${flatList[myChildren[myChildren.length - 1]].id} 0 R`);
        }

        this.writer.writeObject(itemId, dict);
      }

      return rootId;
    }

    /**
     * Writes the bookmark/outline tree to the PDF document asynchronously.
     * This enables navigation via the PDF viewer's bookmark pane.
     * @param rootId The object ID for the root Outlines dictionary.
     * @param bookmarks The list of bookmarks.
     * @param pageIds List of object IDs for the document's pages.
     * @param cancellationToken Cancellation token.
     * @returns The root ID if outlines were written, 0 otherwise.
     */
    async writeOutlineTreeAsync(rootId: number, bookmarks: BookmarkItem[], pageIds: number[], cancellationToken?: AbortSignal): Promise<number> {
      if (!this.asyncWriter) throw new Error('Async writer not available');
      if (bookmarks.length === 0) return 0;

      const flatList: FlatBookmark[] = [];
      this.flatten(bookmarks, rootId, 0, flatList, rootId + 1);

      const childrenByParent = new Map<number, number[]>();
      for (let i = 0; i < flatList.length; i++) {
        const entry = flatList[i];
        if (!childrenByParent.has(entry.parentId)) {
          childrenByParent.set(entry.parentId, []);
        }
        childrenByParent.get(entry.parentId)!.push(i);
      }

      const countVisible = (parentId: number): number => {
        const children = childrenByParent.get(parentId);
        if (!children) return 0;
        let count = 0;
        for (const idx of children) {
          count++;
          count += countVisible(flatList[idx].id);
        }
        return count;
      };

      const totalCount = countVisible(rootId);

      const rootChildren = childrenByParent.get(rootId) ?? [];
      const rootDict = new Map<string, string>();
      rootDict.set('/Type', '/Outlines');
      rootDict.set('/Count', totalCount.toString());

      if (rootChildren.length > 0) {
        rootDict.set('/First', `${flatList[rootChildren[0]].id} 0 R`);
        rootDict.set('/Last', `${flatList[rootChildren[rootChildren.length - 1]].id} 0 R`);
      }
      await this.asyncWriter.writeObjectAsync(rootId, rootDict, undefined, cancellationToken);

      for (let i = 0; i < flatList.length; i++) {
        const { item, id: itemId, parentId } = flatList[i];
        const siblings = childrenByParent.get(parentId) ?? [];
        const siblingIdx = siblings.indexOf(i);

        const dict = new Map<string, string>();
        dict.set('/Title', `(${PdfSyntax.escape(item.title)})`);
        dict.set('/Parent', `${parentId} 0 R`);

        let pageIdx = Math.min(item.pageIndex, pageIds.length - 1);
        pageIdx = Math.max(pageIdx, 0);
        dict.set('/Dest', `[ ${pageIds[pageIdx]} 0 R /Fit ]`);

        if (siblingIdx > 0) {
          dict.set('/Prev', `${flatList[siblings[siblingIdx - 1]].id} 0 R`);
        }
        if (siblingIdx < siblings.length - 1) {
          dict.set('/Next', `${flatList[siblings[siblingIdx + 1]].id} 0 R`);
        }

        const myChildren = childrenByParent.get(itemId);
        if (myChildren && myChildren.length > 0) {
          const childCount = countVisible(itemId);
          dict.set('/Count', childCount.toString());
          dict.set('/First', `${flatList[myChildren[0]].id} 0 R`);
          dict.set('/Last', `${flatList[myChildren[myChildren.length - 1]].id} 0 R`);
        }

        await this.asyncWriter.writeObjectAsync(itemId, dict, undefined, cancellationToken);
      }

      return rootId;
    }

    private flatten(
      items: BookmarkItem[],
      parentId: number,
      depth: number,
      flatList: FlatBookmark[],
      nextId: number
    ): void {
      for (const item of items) {
        const itemId = nextId++;
        flatList.push({ item, id: itemId, parentId, depth });
        if (item.children.length > 0) {
          this.flatten(item.children, itemId, depth + 1, flatList, nextId);
        }
      }
    }
  }

  // Constructor overloads
  export namespace NavigationWriter {
    export function create(writer: IPdfWriter): NavigationWriter {
      return new NavigationWriter(writer as any);
    }

    export function createAsync(asyncWriter: IAsyncPdfWriter): NavigationWriter {
      return new NavigationWriter(asyncWriter as any);
    }
  }
