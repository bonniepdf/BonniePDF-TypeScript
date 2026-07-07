/**
 * Structured, non-throwing report of a recoverable issue encountered while
 * generating a PDF - most commonly a font that couldn't be loaded, an image
 * that failed to decode, or a subset operation that fell back to embedding
 * the full font. Callers retrieve the collected diagnostics from
 * `Document.diagnostics` after `generateBytes` / `generateBytesAsync`
 * returns and decide how to surface them (log, display, ignore, throw).
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export type DiagnosticCategory =
  | 'font'
  | 'font-subset'
  | 'image'
  | 'encryption'
  | 'compression'
  | 'tagging'
  | 'platform'
  | 'render'
  | 'attachment';

export interface IDiagnostic {
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  message: string;
  /** Optional identifier of what the diagnostic is about (e.g. a font path). */
  source?: string;
  /** The underlying error, if any. Preserved so callers can stringify or rethrow. */
  cause?: unknown;
}

/**
 * Collects diagnostics during PDF generation. The Document owns one instance
 * for the lifetime of a `generateBytes*()` call; subsystems push diagnostics
 * into it instead of calling `console.warn` directly so the library never
 * writes to a global sink the caller did not opt into.
 */
export class DiagnosticsCollector {
  private readonly entries: IDiagnostic[] = [];

  public add(d: IDiagnostic): void {
    this.entries.push(d);
  }

  public addError(category: DiagnosticCategory, message: string, source?: string, cause?: unknown): void {
    this.add({ severity: 'error', category, message, source, cause });
  }

  public addWarning(category: DiagnosticCategory, message: string, source?: string, cause?: unknown): void {
    this.add({ severity: 'warning', category, message, source, cause });
  }

  public addInfo(category: DiagnosticCategory, message: string, source?: string): void {
    this.add({ severity: 'info', category, message, source });
  }

  public get all(): readonly IDiagnostic[] {
    return this.entries;
  }

  public get count(): number {
    return this.entries.length;
  }

  public hasErrors(): boolean {
    return this.entries.some(e => e.severity === 'error');
  }

  public hasWarnings(): boolean {
    return this.entries.some(e => e.severity === 'warning');
  }

  public clear(): void {
    this.entries.length = 0;
  }

  /**
   * Writes each collected diagnostic to the appropriate console method
   * (`console.error` / `console.warn` / `console.info`). This is a convenience
   * for callers who just want the messages surfaced; library code never
   * calls this implicitly.
   */
  public print(): void {
    for (const d of this.entries) {
      const prefix = `[BonniePDF/${d.category}]`;
      const tail = d.source ? ` (source: ${d.source})` : '';
      const line = `${prefix} ${d.message}${tail}`;
      switch (d.severity) {
        case 'error':
          if (d.cause !== undefined) console.error(line, d.cause);
          else console.error(line);
          break;
        case 'warning':
          if (d.cause !== undefined) console.warn(line, d.cause);
          else console.warn(line);
          break;
        case 'info':
          console.info(line);
          break;
      }
    }
  }
}
