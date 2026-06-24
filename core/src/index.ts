export * from './Core/Unit';
export * from './Core/Units';
export * from './Core/Size';
export * from './Core/Point';
export * from './Core/Color';
export * from './Core/ColorPalette';
export * from './Core/Diagnostics';
export * from './Core/Border';
export * from './Core/BorderStyle';
export * from './Core/BorderColors';
export * from './Core/Thickness';
export * from './Core/HorizontalAlignment';
export * from './Core/Hyperlink';

export * from './Configuration/PdfSize';
export * from './Core/PageOrientation';
export * from './Configuration/PdfVersion';
export * from './Configuration/PageMode';
export * from './Configuration/ZoomLevel';
export * from './Configuration/BookmarkItem';
export * from './Configuration/WatermarkSettings';
export * from './Configuration/DocumentMetadata';
export * from './Configuration/DocumentSettings';
export * from './Configuration/AccessibilityMode';
export * from './Configuration/PdfAConformance';
export * from './Configuration/InternalConfiguration';

export * from './Rendering/Tagging/SemanticRole';
export * from './Rendering/Tagging/StructureElement';
export * from './Rendering/Tagging/IStructureVisitor';
export * from './Rendering/Tagging/StructureTreeBuilder';
export * from './Rendering/Tagging/StructureTreeException';
export * from './Rendering/Tagging/TaggingContext';
export * from './Rendering/Tagging/IRoleProvider';
export * from './Rendering/Tagging/IAltTextProvider';
export * from './Rendering/Writers/StructureTreeWriter';
export * from './Metadata/XmpConformanceBlock';

export * from './Security/Models/EncryptionAlgorithm';
export * from './Security/Models/EncryptionSettings';
export * from './Security/Models/EncryptionOptions';
export * from './Security/Permissions/PdfPermissions';
export * from './Security/Permissions/PermissionEncoder';
export * from './Security/Encryption/md5';
export * from './Security/Encryption/rc4Cipher';
export * from './Security/Encryption/aesCipher';
export * from './Security/Encryption/pdfEncryptionKey';
export * from './Security/Encryption/aes256EncryptionKey';
export * from './Security/Encryption/pdfEncryptor';

export type { IElement, IStatefulElement } from './Elements/IElement';
export { RenderStatus } from './Elements/IElement';
export * from './Elements/IMargin';
export * from './Elements/ElementBase';
export * from './Elements/StatefulElementBase';
// RenderStatus is exported from ./Elements/IElement to avoid duplicate

export * from './Elements/Layout/Page';
export * from './Elements/Layout/Spacer';
export * from './Elements/Layout/WidthDistribution';
export * from './Elements/Layout/PageBreak';
export * from './Elements/Layout/IBackgroundColor';
export * from './Elements/Layout/BorderedElementBase';
export * from './Elements/Layout/Container';
export * from './Elements/Layout/HorizontalStack';
export * from './Elements/Layout/Layers';
export * from './Elements/Layout/SemanticGroup';
export * from './Elements/Layout/VerticalStack';

export * from './Elements/Media/Image';
export * from './Elements/Media/ImageFitMode';

export * from './Elements/Text/TextDecoration';
export * from './Elements/Text/TextAlignment';
export * from './Elements/Text/TextStyle';
export * from './Elements/Text/TextElementBase';
export * from './Elements/Text/TextSpan';
export * from './Elements/Text/TextBlock';
export * from './Elements/Text/RichText';
export * from './Elements/Text/Heading';
export * from './Elements/Text/VisualToc';

export * from './Elements/Tables/TableCell';
export * from './Elements/Tables/TableRow';
export * from './Elements/Tables/Table';

export * from './Elements/Lists/BulletStyle';
export * from './Elements/Lists/ListElementBase';
export * from './Elements/Lists/NumberFormat';
export { NumberFormat as ListNumberFormat } from './Elements/Lists/NumberFormat';
export { OrderedList } from './Elements/Lists/OrderedList';
export * from './Elements/Lists/UnorderedList';

export * from './Elements/Shapes/QrEcc';
export * from './Elements/Shapes/QrSegment';
export * from './Elements/Shapes/QrCodeEncoder';
export * from './Elements/Shapes/Circle';
export * from './Elements/Shapes/Ellipse';
export * from './Elements/Shapes/Line';
export * from './Elements/Shapes/QRCode';
export * from './Elements/Shapes/BarcodeSymbology';
export * from './Elements/Shapes/BarcodeEncoder';
export * from './Elements/Shapes/Barcode';
export * from './Elements/Shapes/DataMatrixEncoder';
export * from './Elements/Shapes/DataMatrix';
export * from './Charts/Models/ChartDataPoint';
export * from './Charts/Models/ChartSeries';
export * from './Charts/Models/ChartData';
export * from './Charts/Models/AxisOptions';
export * from './Charts/ChartOrientation';
export * from './Charts/ChartBase';
export * from './Charts/CartesianChartBase';
export * from './Charts/ChartElement';
export * from './Charts/BarChart';
export * from './Charts/AreaChart';
export * from './Charts/LineChart';
export * from './Charts/DotPlotChart';
export * from './Charts/LollipopChart';
export * from './Charts/GroupedBarChart';
export * from './Charts/GroupedBarChartElement';
export * from './Charts/PieChart';

export * from './Fluent/IContentContainer';
export * from './Fluent/IComponent';
export * from './Fluent/ContentSlot';
export * from './Fluent/Pdf';
export * from './Fluent/PdfBuilder';

export * from './Fluent/Descriptors/PageDescriptor';
export * from './Fluent/Descriptors/LayersDescriptor';
export * from './Fluent/Descriptors/ColumnDescriptor';
export * from './Fluent/Descriptors/RowDescriptor';
export * from './Fluent/Descriptors/TableDescriptor';
export * from './Fluent/Descriptors/TableRowDescriptor';
export * from './Fluent/Descriptors/TextDescriptor';
export * from './Fluent/Descriptors/TextSpanDescriptor';

export * from './Fluent/Extensions/ContainerBridgeExtensions';
export * from './Fluent/Extensions/ContainerElementExtensions';
export * from './Fluent/Extensions/ContainerStyleExtensions';
export * from './Fluent/Extensions/DocumentSettingsFluentExtensions';

export * from './Document';

export * from './Typography/StandardFonts';
export * from './Typography/FontWeight';
export * from './Typography/FontMetrics';
export * from './Typography/FontManager';
export * from './Typography/loadFontFromUrl';
export * from './Typography/EmbeddedFontInfo';
export * from './Typography/FontFamilyResolver';
export * from './Typography/GlyphUsageTracker';
export * from './Typography/TrueType/TtfFont';
export * from './Typography/TrueType/TtfSubsetter';
export * from './Typography/TrueType/ToUnicodeCMapBuilder';

export * from './Metadata/SRgbIccProfile';
export * from './Metadata/XmpMetadataWriter';

export * from './Drawing/ICanvas';
export * from './Drawing/PdfCanvas';
export * from './Drawing/SvgCanvas';

// Vector drawing surface
export * from './Drawing/Paint/Paint';
export * from './Drawing/StrokeStyle';
export * from './Drawing/Shapes';
export * from './Elements/Drawing/CanvasElement';

// SVG page export
export * from './Export/SvgPageExportOptions';
export * from './Rendering/SvgRenderPipeline';
export { exportSvgPagesAsync, exportSvgDocumentAsync } from './Export/SvgPageExporter';
export type { SvgDocumentExport } from './Export/SvgPageExporter';

// Extensions (non-Fluent) - some omitted to avoid name conflicts with Fluent API
export * from './Extensions/DocumentEncryptionExtensions';
export * from './Extensions/DocumentSettingsExtensions';
export * from './Extensions/HorizontalStackExtensions';
export * from './Extensions/ImageExtensions';
export * from './Extensions/QRCodeExtensions';
export * from './Extensions/BarcodeExtensions';
export * from './Extensions/DataMatrixExtensions';
export * from './Extensions/SvgExportExtensions';
export * from './Extensions/TableCellExtensions';
export * from './Extensions/VerticalStackExtensions';
// TextBlockExtensions omitted - alignLeft/alignCenter/alignRight conflict with ContainerStyleExtensions

export * from './Rendering/RenderContext';
export * from './Rendering/PageDimensions';
export * from './Rendering/PdfRenderPipeline';
export * from './Rendering/PdfDocumentSerializer';
export * from './Rendering/PdfResourceRegistry';
export * from './Rendering/Pdf/PdfSyntax';
export * from './Rendering/Pdf/PdfOperators';
export * from './Rendering/Pdf/PdfDrawing';
export * from './Rendering/Images/ImageInfo';
export * from './Rendering/Images/BigEndianReader';
export * from './Rendering/Images/ImageLoader';
export * from './Rendering/Images/ImageWriter';
// Writers: one type per file, mirroring the .NET Rendering/Writers layout.
export * from './Rendering/Writers/CatalogOptions';
export * from './Rendering/Writers/IPdfWriter';
export * from './Rendering/Writers/IAsyncPdfWriter';
export * from './Rendering/Writers/PdfWriter';
export * from './Rendering/Writers/AsyncPdfWriter';
export * from './Rendering/Writers/FontWriter';
export * from './Rendering/Writers/MetadataWriter';
export * from './Rendering/Writers/NavigationWriter';
export * from './Rendering/Writers/ComplianceWriter';

export * from './Platform/PlatformIO';
export * from './Platform/BrowserPlatformIO';

export * from './Prototyping/Placeholders';
