if (typeof navigator === 'undefined') {
  (global as any).navigator = { userAgent: 'Node' };
}
