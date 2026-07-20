import type { NavLink, Section, SiteSettings } from './types';
import { getSectionPath } from './sections';

export type HeaderNavItem =
  | { kind: 'builtin'; key: 'submit' | 'home' | 'explore' | 'blog'; navKey: string; label: string; href: string }
  | { kind: 'section'; navKey: string; sectionId: string; label: string; href: string }
  | { kind: 'link'; navKey: string; linkIndex: number; label: string; href: string };

/** Stable key for a custom header link. Prefers the persistent id; falls back to index. */
export function headerLinkKey(link: NavLink, index: number): string {
  return `link:${link.id || `idx-${index}`}`;
}

type HeaderNavSettings = Pick<SiteSettings, 'features' | 'headerLinks' | 'headerNavOrder' | 'headerBuiltins'>;

/**
 * Builds the ordered list of header navigation items from live data and the
 * saved order. Items missing from `headerNavOrder` keep their natural order and
 * are appended at the end, so newly added sections/links still appear.
 *
 * Pass `includeHiddenBuiltins: true` (admin editor) to keep hidden built-ins in
 * the list so they can still be toggled back on; the public header omits them.
 */
export function buildHeaderNavItems(
  settings: HeaderNavSettings,
  headerSections: Section[],
  includeHiddenBuiltins = false,
): HeaderNavItem[] {
  const items: HeaderNavItem[] = [];
  const builtins = settings.headerBuiltins || {};
  const isHidden = (key: 'home' | 'explore' | 'blog' | 'submit') =>
    !includeHiddenBuiltins && Boolean(builtins[key]?.hidden);
  const labelFor = (key: 'home' | 'explore' | 'blog' | 'submit', fallback: string) =>
    builtins[key]?.label?.trim() || fallback;

  if (settings.features?.userSubmissions && !isHidden('submit')) {
    items.push({ kind: 'builtin', key: 'submit', navKey: 'submit', label: labelFor('submit', 'Submit Prompt'), href: '/submit' });
  }
  if (!isHidden('home')) {
    items.push({ kind: 'builtin', key: 'home', navKey: 'home', label: labelFor('home', 'Home'), href: '/' });
  }
  if (!isHidden('explore')) {
    items.push({ kind: 'builtin', key: 'explore', navKey: 'explore', label: labelFor('explore', 'Explore'), href: '/explore' });
  }
  // Built-in Blog item — skipped when the admin already added a custom /blog link.
  const hasCustomBlogLink = (settings.headerLinks || []).some(link => (link.href || '').replace(/\/+$/, '') === '/blog');
  if (!hasCustomBlogLink && !isHidden('blog')) {
    items.push({ kind: 'builtin', key: 'blog', navKey: 'blog', label: labelFor('blog', 'Blog'), href: '/blog' });
  }

  for (const section of headerSections) {
    items.push({
      kind: 'section',
      navKey: `section:${section.id}`,
      sectionId: section.id,
      label: section.name,
      href: getSectionPath(section),
    });
  }

  (settings.headerLinks || []).forEach((link, index) => {
    items.push({
      kind: 'link',
      navKey: headerLinkKey(link, index),
      linkIndex: index,
      label: link.label,
      href: link.href,
    });
  });

  const order = settings.headerNavOrder || [];
  const rank = (navKey: string) => {
    const i = order.indexOf(navKey);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  return items
    .map((item, i) => ({ item, i, r: rank(item.navKey) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(entry => entry.item);
}
