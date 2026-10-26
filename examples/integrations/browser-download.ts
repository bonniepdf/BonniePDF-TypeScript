/** Copy this host and its document builder into a browser application using @bonniepdf/core. */
import { BrowserPlatformIO, configurePlatform, settings } from '@bonniepdf/core';
import { generate } from '../src/code-recipes/getting-started/browser-download';

// Configure once at startup. Choose the licence tier applicable to your application.
configurePlatform(new BrowserPlatformIO());
settings.license ??= 'evaluation';

export async function downloadPdf(assetBaseUrl: string, signal?: AbortSignal): Promise<void> {
  const paths = ['fonts/NotoSans-Regular.ttf', 'images/products/terracotta-planter.jpg'];
  const assets = new Map(
    await Promise.all(
      paths.map(async path => {
        const response = await fetch(`${assetBaseUrl.replace(/\/$/, '')}/${path}`, { signal });
        if (!response.ok) throw new Error(`Could not load ${path}: HTTP ${response.status}.`);
        return [path, new Uint8Array(await response.arrayBuffer())] as const;
      })
    )
  );
  signal?.throwIfAborted();
  const document = generate(assets);
  try {
    const bytes = await document.generateBytesAsync({ signal });
    if (document.diagnostics.some(d => d.severity === 'error' || d.severity === 'warning'))
      throw new Error('The PDF reported a problem. Check its fonts and images before downloading.');
    signal?.throwIfAborted();
    const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/pdf' }));
    const link = window.document.createElement('a');
    try {
      link.href = url;
      link.download = 'browser-download.pdf';
      window.document.body.append(link);
      link.click();
    } finally {
      link.remove();
      // Allow the browser to consume the download URL before revoking it.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } finally {
    document.dispose();
  }
}
