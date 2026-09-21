export type PrefetchTrigger = 'viewport' | 'intent';

const FRESH_MS = 300_000;
const RETRY_COOLDOWN_MS = 30_000;
const MAX_ENTRIES = 256;
const MAX_VIEWPORT_URLS = 48;

/** Match the deployed lowercase discovery URLs without changing query values. */
export function normalizeDiscoveryHref(href: string): string {
  return href.replace(/^\/(tool|tag)\/([^/?#]+)(?=\/?(?:[?#]|$))/i, (match, kind: string, slug: string) => {
    try {
      return `/${kind.toLowerCase()}/${encodeURIComponent(decodeURIComponent(slug).toLowerCase())}`;
    } catch {
      return match;
    }
  });
}

/** Only warm public, same-origin pages; fragments share their page's cache. */
export function getPrefetchHref(href: string, currentHref: string): string | null {
  try {
    const current = new URL(currentHref);
    const target = new URL(href, current);
    if (!/^https?:$/.test(target.protocol) || target.origin !== current.origin) return null;
    if (/^\/(api|admin|profile|login|submit|user|auth)(\/|$)/i.test(target.pathname)) return null;
    const key = normalizeDiscoveryHref(target.pathname + target.search);
    return key === normalizeDiscoveryHref(current.pathname + current.search) ? null : key;
  } catch {
    return null;
  }
}

/** Shared across every link and route in this browser document. No retry timers. */
export function createPrefetchPolicy() {
  const entries = new Map<string, { at: number; stale: boolean }>();
  const viewportSeen = new Set<string>();
  return {
    claim(href: string, trigger: PrefetchTrigger, now: number) {
      if (trigger === 'viewport' && (viewportSeen.has(href) || viewportSeen.size >= MAX_VIEWPORT_URLS)) return null;
      const previous = entries.get(href);
      if (previous && now - previous.at < (previous.stale ? RETRY_COOLDOWN_MS : FRESH_MS)) return null;
      const entry = { at: now, stale: false };
      entries.delete(href);
      entries.set(href, entry);
      if (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value!);
      if (trigger === 'viewport') viewportSeen.add(href);
      // Invalidation marks stale only. It must never start another request.
      return () => { entry.stale = true; };
    },
  };
}
