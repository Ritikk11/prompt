export function getAuthRedirectTo(nextPath?: string) {
  if (typeof window === 'undefined') return '/auth/callback';
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const next = nextPath || currentPath || '/';
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function getSafeNextPath(value: string | null) {
  if (!value) return '/';
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return '/';
    const normalized = new URL(decoded, 'https://aipromptmatrix.invalid');
    if (normalized.origin !== 'https://aipromptmatrix.invalid') return '/';
    if (`${normalized.pathname}${normalized.search}${normalized.hash}` !== decoded) return '/';
    return decoded;
  } catch {
    return '/';
  }
}
