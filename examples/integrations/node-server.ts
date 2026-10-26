/** Run: pnpm --filter @bonniepdf/examples exec tsx integrations/node-server.ts */
import { createServer, type Server } from 'node:http';
import { pathToFileURL } from 'node:url';
import { settings } from '@bonniepdf/core';
import { buildInvoice, type InvoiceLine } from '../src/industry-templates/invoices/large-order-invoice';

// The Node entry configures platform IO and bundled fonts. Declare your tier once.
settings.license ??= 'evaluation';

export function createPdfServer(): Server {
  return createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/invoice') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const controller = new AbortController();
    response.once('close', () => {
      if (!response.writableEnded) controller.abort();
    });
    let document: ReturnType<typeof buildInvoice> | undefined;
    try {
      const chunks: Buffer[] = [];
      let bodyLength = 0;
      for await (const chunk of request) {
        bodyLength += chunk.length;
        if (bodyLength > 64 * 1024) {
          response.writeHead(413);
          response.end('Request exceeds 64 KiB');
          return;
        }
        chunks.push(Buffer.from(chunk));
      }
      let lines: InvoiceLine[];
      try {
        const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (
          !Array.isArray(data) ||
          data.length > 200 ||
          !data.every(
            line =>
              line &&
              typeof line.description === 'string' &&
              line.description.length > 0 &&
              line.description.length <= 2000
          )
        )
          throw new Error('Expected an array of up to 200 invoice lines.');
        lines = data;
        document = buildInvoice(lines);
      } catch {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Invalid invoice data');
        return;
      }
      const bytes = await document.generateBytesAsync({ signal: controller.signal });
      if (document.diagnostics.some(d => d.severity === 'error' || d.severity === 'warning'))
        throw new Error('PDF reported a problem.');
      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="invoice.pdf"',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store',
      });
      response.end(Buffer.from(bytes));
    } catch {
      if (!response.destroyed) {
        response.writeHead(500);
        response.end('PDF generation failed');
      }
    } finally {
      document?.dispose();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createPdfServer().listen(2099, '127.0.0.1', () => console.log('POST invoice lines to http://127.0.0.1:2099/invoice'));
}
