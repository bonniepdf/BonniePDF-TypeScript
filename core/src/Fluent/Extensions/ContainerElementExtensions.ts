import { Color } from '../../Core/Color';
import { IElement } from '../../Elements/IElement';
import { Container } from '../../Elements/Layout/Container';
import { Spacer } from '../../Elements/Layout/Spacer';
import { PageBreak } from '../../Elements/Layout/PageBreak';
import { VerticalStack } from '../../Elements/Layout/VerticalStack';
import { HorizontalStack } from '../../Elements/Layout/HorizontalStack';
import { Table } from '../../Elements/Tables/Table';
import { Image } from '../../Elements/Media/Image';
import { Ellipse } from '../../Elements/Shapes/Ellipse';
import { Line } from '../../Elements/Shapes/Line';
import { QRCode } from '../../Elements/Shapes/QRCode';
import { Barcode } from '../../Elements/Shapes/Barcode';
import { BarcodeSymbology } from '../../Elements/Shapes/BarcodeSymbology';
import { DataMatrix } from '../../Elements/Shapes/DataMatrix';
import { TextBlock } from '../../Elements/Text/TextBlock';
import { RichText } from '../../Elements/Text/RichText';
import { IContentContainer } from '../IContentContainer';
import { IComponent } from '../IComponent';
import { ColumnDescriptor } from '../Descriptors/ColumnDescriptor';
import { RowDescriptor } from '../Descriptors/RowDescriptor';
import { TableDescriptor } from '../Descriptors/TableDescriptor';
import { TextDescriptor } from '../Descriptors/TextDescriptor';
import { ContainerBridgeExtensions } from './ContainerBridgeExtensions';

/**
 * Fluent extension methods for adding content elements to containers.
 * These are typically terminal methods - they create an element and end the chain,
 * or return the concrete element type for element-specific styling.
 */
export class ContainerElementExtensions {
  // --- Text ---

  /**
   * Adds a simple text element. Returns the TextBlock for further styling
   * via existing TextBlockExtensions (.Bold(), .FontSize(), .AlignCenter(), etc.).
   */
  static text(c: IContentContainer, text: string): TextBlock {
    const textBlock = new TextBlock();
    textBlock.text = text;
    return ContainerBridgeExtensions.elementTyped(c, textBlock);
  }

  /**
   * Adds rich text with multiple styled spans.
   * Use the TextDescriptor to configure spans, page numbers, and formatting.
   */
  static textWithHandler(c: IContentContainer, handler: (desc: TextDescriptor) => void): void {
    const descriptor = new TextDescriptor();
    handler(descriptor);
    ContainerBridgeExtensions.elementTyped(c, descriptor.richText);
  }

  // --- Empty ---

  /**
   * Adds an empty block to the container, which terminates the chain.
   * Useful for colored spacer blocks or drawing backgrounds without content.
   */
  static empty(c: IContentContainer): void {
    ContainerBridgeExtensions.element(c, new Container());
  }

  /**
   * Adds an invisible spacer that reserves the specified vertical space in points.
   */
  static spacer(c: IContentContainer, height: number): void {
    ContainerBridgeExtensions.element(c, new Spacer(height));
  }

  /**
   * Forces a page break. The next element after this will start at the top of a new page.
   * Has no effect if the current position is already at the top of a page.
   */
  static pageBreak(c: IContentContainer): void {
    ContainerBridgeExtensions.element(c, new PageBreak());
  }

  // --- Layout ---

  /**
   * Adds a vertical column layout. Items are stacked top to bottom with automatic pagination.
   */
  static column(c: IContentContainer, handler: (desc: ColumnDescriptor) => void): void {
    const descriptor = new ColumnDescriptor();
    handler(descriptor);
    ContainerBridgeExtensions.elementTyped(c, descriptor.stack);
  }

  /**
   * Adds a horizontal row layout. Items are placed side by side.
   */
  static row(c: IContentContainer, handler: (desc: RowDescriptor) => void): void {
    const descriptor = new RowDescriptor();
    handler(descriptor);

    // If the container has an explicit height, transfer it to the stack
    // so that vertical alignment (AlignItems) works correctly within that height.
    if (c instanceof Container && c.height !== undefined) {
      descriptor.stack.height = c.height - c.padding.top - c.padding.bottom - c.border.verticalWidth;
    }

    ContainerBridgeExtensions.elementTyped(c, descriptor.stack);
  }

  /**
   * Adds a table layout with columns, headers, footers, and auto-flowing cells.
   */
  static table(c: IContentContainer, handler: (desc: TableDescriptor) => void): void {
    const descriptor = new TableDescriptor();
    handler(descriptor);
    ContainerBridgeExtensions.elementTyped(c, descriptor.build());
  }

  // --- Media ---

  /**
   * Adds an image from a file path. Returns the Image for further styling
   * via existing ImageExtensions (.WithWidth(), .WithFitMode(), etc.).
   */
  static image(c: IContentContainer, path: string): Image {
    const image = new Image();
    image.filePath = path;
    return ContainerBridgeExtensions.elementTyped(c, image);
  }

  /**
   * Adds an image from raw byte data.
   */
  static imageFromBytes(c: IContentContainer, data: Uint8Array): Image {
    const image = new Image();
    image.imageData = data;
    return ContainerBridgeExtensions.elementTyped(c, image);
  }

  // --- Shapes ---

  /**
   * Adds a horizontal line.
   */
  static line(c: IContentContainer, thickness: number = 1): Line {
    const line = new Line();
    line.thickness = thickness;
    return ContainerBridgeExtensions.elementTyped(c, line);
  }

  /**
   * Adds a horizontal line with color.
   */
  static lineWithColor(c: IContentContainer, thickness: number, color: Color): Line {
    const line = new Line();
    line.thickness = thickness;
    line.color = color;
    return ContainerBridgeExtensions.elementTyped(c, line);
  }

  /**
   * Adds a filled ellipse.
   */
  static ellipse(c: IContentContainer, width: number, height: number, color?: Color): Ellipse {
    const el = new Ellipse();
    el.width = width;
    el.height = height;
    if (color) el.fillColor = color;
    return ContainerBridgeExtensions.elementTyped(c, el);
  }

  /**
   * Adds a QR code element.
   */
  static qrCode(c: IContentContainer, data: string, size: number = 100): QRCode {
    const qr = new QRCode();
    qr.data = data;
    qr.size = size;
    return ContainerBridgeExtensions.elementTyped(c, qr);
  }

  /**
   * Adds a 1D barcode element (Code 128 by default).
   */
  static barcode(c: IContentContainer, value: string, symbology: BarcodeSymbology = BarcodeSymbology.Code128): Barcode {
    const barcode = new Barcode();
    barcode.value = value;
    barcode.symbology = symbology;
    return ContainerBridgeExtensions.elementTyped(c, barcode);
  }

  /**
   * Adds a Data Matrix (ECC200) element.
   */
  static dataMatrix(c: IContentContainer, data: string, size: number = 100): DataMatrix {
    const dm = new DataMatrix();
    dm.data = data;
    dm.size = size;
    return ContainerBridgeExtensions.elementTyped(c, dm);
  }

  // --- Raw Element Escape Hatch ---

  /**
   * Inserts any raw IElement into the fluent tree.
   * Use this to integrate elements from the standard API (charts, custom elements, etc.).
   */
  static rawElement(c: IContentContainer, element: IElement): void {
    ContainerBridgeExtensions.element(c, element);
  }

  // --- Component ---

  /**
   * Composes a reusable component into this container.
   */
  static component(c: IContentContainer, comp: IComponent): void {
    comp.compose(c);
  }
}

/**
 * Shortcut functions for ContainerElementExtensions
 */
export function text(c: IContentContainer, textStr: string): TextBlock {
  return ContainerElementExtensions.text(c, textStr);
}

export function textWithHandler(c: IContentContainer, handler: (desc: TextDescriptor) => void): void {
  return ContainerElementExtensions.textWithHandler(c, handler);
}

export function empty(c: IContentContainer): void {
  ContainerElementExtensions.empty(c);
}

export function spacer(c: IContentContainer, height: number): void {
  ContainerElementExtensions.spacer(c, height);
}

export function pageBreak(c: IContentContainer): void {
  ContainerElementExtensions.pageBreak(c);
}

export function column(c: IContentContainer, handler: (desc: ColumnDescriptor) => void): void {
  ContainerElementExtensions.column(c, handler);
}

export function row(c: IContentContainer, handler: (desc: RowDescriptor) => void): void {
  ContainerElementExtensions.row(c, handler);
}

export function table(c: IContentContainer, handler: (desc: TableDescriptor) => void): void {
  ContainerElementExtensions.table(c, handler);
}

export function image(c: IContentContainer, path: string): Image {
  return ContainerElementExtensions.image(c, path);
}

export function imageFromBytes(c: IContentContainer, data: Uint8Array): Image {
  return ContainerElementExtensions.imageFromBytes(c, data);
}

export function line(c: IContentContainer, thickness?: number): Line {
  return ContainerElementExtensions.line(c, thickness);
}

export function lineWithColor(c: IContentContainer, thickness: number, color: Color): Line {
  return ContainerElementExtensions.lineWithColor(c, thickness, color);
}

export function ellipse(c: IContentContainer, width: number, height: number, color?: Color): Ellipse {
  return ContainerElementExtensions.ellipse(c, width, height, color);
}

export function qrCode(c: IContentContainer, data: string, size?: number): QRCode {
  return ContainerElementExtensions.qrCode(c, data, size);
}

export function barcode(c: IContentContainer, value: string, symbology?: BarcodeSymbology): Barcode {
  return ContainerElementExtensions.barcode(c, value, symbology);
}

export function dataMatrix(c: IContentContainer, data: string, size?: number): DataMatrix {
  return ContainerElementExtensions.dataMatrix(c, data, size);
}

export function rawElement(c: IContentContainer, element: IElement): void {
  ContainerElementExtensions.rawElement(c, element);
}

export function component(c: IContentContainer, comp: IComponent): void {
  ContainerElementExtensions.component(c, comp);
}
