import { DocumentSettings } from '../Configuration/DocumentSettings';
import { DocumentMetadata } from '../Configuration/DocumentMetadata';
import { PageDescriptor } from './Descriptors/PageDescriptor';
import { TextStyle } from '../Elements/Text/TextStyle';
import { Document } from '../Document';
import { PdfSize } from '../Configuration/PdfSize';
import { PageOrientation } from '../Core/PageOrientation';
import { IElement } from '../Elements/IElement';
import { FileAttachment } from '../Attachments/FileAttachment';

export class PdfBuilder {
  private readonly pageDescriptors: PageDescriptor[] = [];
  private readonly attachments: FileAttachment[] = [];
  private metadataAction?: (metadata: DocumentMetadata) => void;
  private settingsAction?: (settings: DocumentSettings) => void;
  private documentDefaultStyle?: TextStyle;

  public withDefaultTextStyle(configure: (style: TextStyle) => void): PdfBuilder {
    this.documentDefaultStyle = new TextStyle();
    configure(this.documentDefaultStyle);
    return this;
  }

  public page(handler: (descriptor: PageDescriptor) => void): void {
    const descriptor = new PageDescriptor();
    handler(descriptor);
    this.pageDescriptors.push(descriptor);
  }

  public withMetadata(configure: (metadata: DocumentMetadata) => void): PdfBuilder {
    this.metadataAction = configure;
    return this;
  }

  public withSettings(configure: (settings: DocumentSettings) => void): PdfBuilder {
    this.settingsAction = configure;
    return this;
  }

  /**
   * Embeds a file into the document as an associated file (PDF/A-3 /
   * ZUGFeRD). See {@link Document.attachments} for the conformance rules that
   * govern when the file is actually written.
   */
  public attach(attachment: FileAttachment): PdfBuilder {
    this.attachments.push(attachment);
    return this;
  }

  public save(path: string): void {
    const doc = this.build();
    doc.save(path);
  }

  public generateBytes(): Uint8Array {
    const doc = this.build();
    return doc.generateBytes();
  }

  public build(): Document {
    if (this.pageDescriptors.length === 0) {
      throw new Error('At least one page must be defined. Call .page() in the document builder.');
    }

    const firstPage = this.pageDescriptors[0];
    const settings = new DocumentSettings();
    settings.pageSize = firstPage.pageSize;
    settings.orientation = firstPage.pageOrientation;
    settings.margin = firstPage.pageMargin;

    this.settingsAction?.(settings);

    // Wire the first page's slots into the document settings so they render on
    // every page, mirroring the .NET PdfBuilder.
    if (firstPage.headerSlot.child) {
      const headerElement = firstPage.headerSlot.child;
      settings.headerTemplate = () => headerElement;
    }

    if (firstPage.footerSlot.child) {
      const footerElement = firstPage.footerSlot.child;
      settings.footerTemplate = () => footerElement;
    }

    // full-page background / foreground slots.
    if (firstPage.backgroundSlot.child) {
      const backgroundElement = firstPage.backgroundSlot.child;
      settings.pageBackground = () => backgroundElement;
    }

    if (firstPage.foregroundSlot.child) {
      const foregroundElement = firstPage.foregroundSlot.child;
      settings.pageForeground = () => foregroundElement;
    }

    const doc = new Document(settings);

    this.metadataAction?.(doc.metadata);

    for (const attachment of this.attachments) {
      doc.attach(attachment);
    }

    if (firstPage.contentSlot.child) {
      doc.add(firstPage.contentSlot.child);
    }

    for (let i = 1; i < this.pageDescriptors.length; i++) {
      const pageDesc = this.pageDescriptors[i];
      const orientedSize = pageDesc.pageSize.getOrientedSize(pageDesc.pageOrientation);
      doc.addPage(orientedSize, pageDesc.pageMargin);

      if (pageDesc.contentSlot.child) {
        doc.add(pageDesc.contentSlot.child);
      }
    }

    return doc;
  }
}
