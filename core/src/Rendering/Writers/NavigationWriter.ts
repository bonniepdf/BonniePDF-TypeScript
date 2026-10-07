import * as PdfKeys from '../Pdf/PdfKeys';
import { PdfSyntax } from '../Pdf/PdfSyntax';
import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import type { BookmarkItem } from '../../Configuration/BookmarkItem';

/**
 * Writes PDF navigation objects (Outlines/Bookmarks) to PDF.
 */
export class NavigationWriter {
  constructor(
    private writer: IPdfWriter,
    private asyncWriter?: IAsyncPdfWriter
  ) {}

  public writeOutlineTree(rootId: number, bookmarks: BookmarkItem[], pageIds: number[]): number {
    if (!bookmarks || bookmarks.length === 0) return 0;

    const flatList: Array<{ item: BookmarkItem; id: number; parentId: number; depth: number }> = [];

    const flatten = (items: BookmarkItem[], parentId: number, depth: number): void => {
      for (const item of items) {
        const itemId = this.writer.getNewId();
        flatList.push({ item, id: itemId, parentId, depth });
        if (item.children.length > 0) flatten(item.children, itemId, depth + 1);
      }
    };
    flatten(bookmarks, rootId, 0);

    const childrenByParent = new Map<number, number[]>();
    for (let i = 0; i < flatList.length; i++) {
      const { parentId } = flatList[i];
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId)!.push(i);
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

    const rootChildren = childrenByParent.get(rootId) ?? [];
    const rootDict = new Map<string, string>([
      [PdfKeys.Common.Type, '/Outlines'],
      [PdfKeys.Outline.Count, countVisible(rootId).toString()],
    ]);
    if (rootChildren.length > 0) {
      rootDict.set(PdfKeys.Outline.First, `${flatList[rootChildren[0]].id} 0 R`);
      rootDict.set(PdfKeys.Outline.Last, `${flatList[rootChildren[rootChildren.length - 1]].id} 0 R`);
    }
    this.writer.writeObject(rootId, rootDict);

    for (let i = 0; i < flatList.length; i++) {
      const { item, id: itemId, parentId } = flatList[i];
      const siblings = childrenByParent.get(parentId)!;
      const siblingIdx = siblings.indexOf(i);

      const dict = new Map<string, string>([
        [PdfKeys.Outline.Title, `(${PdfSyntax.escape(item.title)})`],
        [PdfKeys.Outline.Parent, `${parentId} 0 R`],
        [
          PdfKeys.Outline.Destination,
          `[ ${pageIds[Math.max(0, Math.min(item.pageIndex, pageIds.length - 1))]} 0 R /Fit ]`,
        ],
      ]);
      if (siblingIdx > 0) dict.set(PdfKeys.Outline.Previous, `${flatList[siblings[siblingIdx - 1]].id} 0 R`);
      if (siblingIdx < siblings.length - 1)
        dict.set(PdfKeys.Outline.Next, `${flatList[siblings[siblingIdx + 1]].id} 0 R`);

      const myChildren = childrenByParent.get(itemId);
      if (myChildren && myChildren.length > 0) {
        dict.set(PdfKeys.Outline.Count, countVisible(itemId).toString());
        dict.set(PdfKeys.Outline.First, `${flatList[myChildren[0]].id} 0 R`);
        dict.set(PdfKeys.Outline.Last, `${flatList[myChildren[myChildren.length - 1]].id} 0 R`);
      }
      this.writer.writeObject(itemId, dict);
    }
    return rootId;
  }

  public async writeOutlineTreeAsync(rootId: number, bookmarks: BookmarkItem[], pageIds: number[]): Promise<number> {
    // Delegate synchronously - async path is out of scope
    return this.writeOutlineTree(rootId, bookmarks, pageIds);
  }
}
