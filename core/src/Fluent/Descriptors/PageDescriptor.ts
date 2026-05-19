import { PdfSize } from '../../Configuration/PdfSize';
import { PageOrientation } from '../../Core/PageOrientation';
import { TextStyle } from '../../Elements/Text/TextStyle';
import { TextElementBase } from '../../Elements/Text/TextElementBase';
import { ContentSlot } from '../ContentSlot';
import { IContentContainer } from '../IContentContainer';

/**
 * Describes a page's configuration and structure.
 * Provides scoped methods for page size, margins, headers, content, and footers.
 */
export class PageDescriptor {
  pageSize: PdfSize = PdfSize.a4;
  pageMargin: number = 50;
  pageOrientation: PageOrientation = PageOrientation.Portrait;
  headerSlot: ContentSlot = new ContentSlot();
  contentSlot: ContentSlot = new ContentSlot();
  footerSlot: ContentSlot = new ContentSlot();
  defaultStyle: TextStyle | undefined;

  /**
   * Sets the page size.
   */
  size(size: PdfSize): void {
    this.pageSize = size;
  }

  /**
   * Sets the page margin in points.
   */
  margin(margin: number): void {
    this.pageMargin = margin;
  }

  /**
   * Sets the page orientation.
   */
  orientation(orientation: PageOrientation): void {
    this.pageOrientation = orientation;
  }

  /**
   * Configures the default text style for all text on this page.
   * Overrides any document-level default set via PdfBuilder.WithDefaultTextStyle.
   * Text elements created after this call will inherit these defaults.
   */
  defaultTextStyle(configure: (style: TextStyle) => void): void {
    this.defaultStyle = new TextStyle();
    configure(this.defaultStyle);

    // Note: ambient style propagation requires runtime injection; stored in defaultStyle
  }

  /**
   * Returns a container for the page header.
   * Content placed here appears at the top of every page.
   */
  header(): IContentContainer {
    return this.headerSlot;
  }

  /**
   * Returns a container for the main page content.
   * This is where the bulk of the document content goes.
   */
  content(): IContentContainer {
    return this.contentSlot;
  }

  /**
   * Returns a container for the page footer.
   * Content placed here appears at the bottom of every page.
   */
  footer(): IContentContainer {
    return this.footerSlot;
  }
}
