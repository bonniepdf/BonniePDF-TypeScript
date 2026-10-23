/** The colour model of a decoded image. */
export enum ImageColorSpace {
  DeviceRGB = 'DeviceRGB',
  DeviceCMYK = 'DeviceCMYK',
  DeviceGray = 'DeviceGray',
  Indexed = 'Indexed',
}

/** The file format an image was loaded from. */
export enum ImageFormat {
  Jpeg = 'Jpeg',
  Png = 'Png',
}

/** Contains decoded image metadata and the byte streams needed for PDF embedding. */
export class ImageInfo {
  /** @internal Decodes graphics discovered during layout before resource serialization. */
  public prepareDeferred?: () => Promise<void>;
  /** The image data as written to the PDF stream: the JPEG file itself, or the decoded pixels of a PNG. */
  public data: Uint8Array = new Uint8Array();
  /** The image file exactly as it was supplied. */
  public originalData: Uint8Array = new Uint8Array();
  /** Pixel dimensions as stored in the bitstream - the values that go into the PDF XObject's /Width and /Height. */
  public width: number = 0;
  /** Pixel height as stored in the bitstream. */
  public height: number = 0;
  /** The format the image was loaded from. */
  public format: ImageFormat = ImageFormat.Png;
  /** The colour model of the pixel data. */
  public colorSpace: ImageColorSpace = ImageColorSpace.DeviceRGB;
  /** Bits used for each colour component, normally 8. */
  public bitsPerComponent: number = 8;
  /** Number of colour components per pixel (1, 3 or 4). */
  public components: number = 3;
  /** `true` when the image has transparency. */
  public hasAlpha: boolean = false;
  /** The transparency channel, one value per pixel, when {@link hasAlpha} is set. */
  public alphaData: Uint8Array = new Uint8Array();
  /** The colour table, for indexed-colour images. */
  public palette: Uint8Array = new Uint8Array();

  /**
   * EXIF orientation (1–8) read from JPEG APP1 metadata.  1 is "natural" (no
   * transform); 5–8 are rotations / flips that swap width and height for
   * display.  PNGs and JPEGs without EXIF default to 1.
   */
  public orientation: number = 1;

  /**
   * Set by the placing element: embed this image at its source resolution, whatever the
   * document's resolution cap. Not part of the decoded image.
   */
  public keepResolution: boolean = false;

  /**
   * True for Photoshop-exported CMYK JPEGs (Adobe APP14 marker with
   * transform=0), where ink values are stored inverted.  The writer maps
   * this to PDF `/Decode [1 0 1 0 1 0 1 0]` so the colours render correctly.
   */
  public invertCmykColors: boolean = false;

  /**
   * Embedded ICC colour profile, uncompressed.  Populated from JPEG APP2
   * `ICC_PROFILE\0` segments (sync path) and from PNG `iCCP` chunks (async
   * path only - the iCCP profile is itself zlib-compressed and requires
   * `DecompressionStream`).  When non-empty, the writer emits a PDF
   * `/ICCBased` colour space referencing a dedicated stream object so the
   * image renders with its captured colour transform instead of falling
   * back to the device colour space.
   */
  public iccProfile: Uint8Array = new Uint8Array();

  /**
   * Horizontal pixel density, in pixels per inch.  Populated from JPEG
   * JFIF APP0 (when units = 1 or 2) and from PNG `pHYs` chunks.  Zero when
   * the source carries no density information; the layout engine then
   * treats one source pixel as one PDF point (the historical default).
   * @internal
   */
  public dpiX: number = 0;

  /**
   * Vertical pixel density, in pixels per inch.  See {@link dpiX}.
   * @internal
   */
  public dpiY: number = 0;

  /**
   * Width of the image as it should appear on the page, accounting for EXIF
   * orientation.  For orientations 5–8 (90°/270° rotations) this is the
   * stored height, since the image was captured rotated.
   */
  public get displayWidth(): number {
    return this.orientation >= 5 && this.orientation <= 8 ? this.height : this.width;
  }

  /**
   * Height of the image as it should appear on the page, accounting for EXIF
   * orientation.  Mirror of {@link displayWidth}.
   */
  public get displayHeight(): number {
    return this.orientation >= 5 && this.orientation <= 8 ? this.width : this.height;
  }
}
