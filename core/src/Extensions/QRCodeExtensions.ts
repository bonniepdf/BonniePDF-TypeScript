import { Color } from '../Core/Color';
import { QRCode } from '../Elements/Shapes/QRCode';
import { QrEcc } from '../Elements/Shapes/QrEcc';



  /**
   * Fluent extension methods for QR codes.
   */
  export class QRCodeExtensions {
    /**
     * Sets the foreground color of the QR code modules.
     */
    static foregroundColor(qr: QRCode, color: Color): QRCode {
      qr.foregroundColor = color;
      return qr;
    }

    /**
     * Sets the background color of the QR code.
     */
    static backgroundColor(qr: QRCode, color: Color): QRCode {
      qr.backgroundColor = color;
      return qr;
    }

    /**
     * Toggles the drawing of the QR code background.
     */
    static drawBackground(qr: QRCode, draw: boolean): QRCode {
      qr.drawBackground = draw;
      return qr;
    }

    /**
     * Sets the error correction level for the QR code.
     */
    static errorCorrection(qr: QRCode, level: QrEcc): QRCode {
      qr.errorCorrection = level;
      return qr;
    }

    /**
     * Sets the number of quiet zone modules around the QR code.
     */
    static quietZone(qr: QRCode, modules: number): QRCode {
      qr.quietZone = modules;
      return qr;
    }
  }

  /**
   * Shortcut functions for QRCodeExtensions
   */
  export function qrForegroundColor(qr: QRCode, color: Color): QRCode {
    return QRCodeExtensions.foregroundColor(qr, color);
  }

  export function qrBackgroundColor(qr: QRCode, color: Color): QRCode {
    return QRCodeExtensions.backgroundColor(qr, color);
  }

  export function qrDrawBackground(qr: QRCode, draw: boolean): QRCode {
    return QRCodeExtensions.drawBackground(qr, draw);
  }

  export function qrErrorCorrection(qr: QRCode, level: QrEcc): QRCode {
    return QRCodeExtensions.errorCorrection(qr, level);
  }

  export function qrQuietZone(qr: QRCode, modules: number): QRCode {
    return QRCodeExtensions.quietZone(qr, modules);
  }
