if (typeof navigator === 'undefined') {
  (globalThis as any).navigator = {
    userAgent: 'Cloudflare',
    product: 'ReactNative', // Sometimes needed by Firebase
  };
}
