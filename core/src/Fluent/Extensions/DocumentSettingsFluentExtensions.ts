import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { IContentContainer } from '../IContentContainer';
import { ContentSlot } from '../ContentSlot';
import { TextBlock } from '../../Elements/Text/TextBlock';

/**
 * Fluent extension methods for DocumentSettings.
 */
export class DocumentSettingsFluentExtensions {
  /**
   * Configures a header template using the fluent builder API.
   * The action receives the 1-based page number and a container to build the header content.
   */
  static header(settings: DocumentSettings, builder: (pageNumber: number, container: IContentContainer) => void): void {
    settings.headerTemplate = (pageNumber: number) => {
      const slot = new ContentSlot();
      builder(pageNumber, slot);
      return slot.child ?? new TextBlock();
    };
  }

  /**
   * Configures a footer template using the fluent builder API.
   * The action receives the 1-based page number and a container to build the footer content.
   */
  static footer(settings: DocumentSettings, builder: (pageNumber: number, container: IContentContainer) => void): void {
    settings.footerTemplate = (pageNumber: number) => {
      const slot = new ContentSlot();
      builder(pageNumber, slot);
      return slot.child ?? new TextBlock();
    };
  }
}

/**
 * Shortcut functions for DocumentSettingsFluentExtensions
 */
export function header(
  settings: DocumentSettings,
  builder: (pageNumber: number, container: IContentContainer) => void
): void {
  DocumentSettingsFluentExtensions.header(settings, builder);
}

export function footer(
  settings: DocumentSettings,
  builder: (pageNumber: number, container: IContentContainer) => void
): void {
  DocumentSettingsFluentExtensions.footer(settings, builder);
}
