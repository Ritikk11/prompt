import type { NavLink, Section, SiteSettings } from './types';
import { getSectionPath } from './sections';

export type HeaderNavItem =
  | { kind: 'builtin'; key: 'submit' | 'home' | 'explore'; navKey: string; label: string; href: string }
  | { kind: 'section'; navKey: string; sectionId: string; label: string; href: string }
  | { kind: 'link'; navKey: string; linkIndex: number; label: string; href: string };

/** Stable key for a custom header link. Prefers the persistent id; falls back to index. */
export function headerLinkKey(link: NavLink, index: number): string {
  return `link:${link.id || `idx-${index}`}`;
}

type HeaderNavSettings = Pick<SiteSettings, 'features' | 'headerLinks' | 'headerNavOrder'>;

/**
 * Builds the ordered list of header navigation items from live data and the
 * saved order. Items missing from `headerNavOrder` keep their natural order and
 * are appended at the end, so newly added sections/links still appear.
 */
export function buildHeaderNavItems(
  settings: HeaderNavSettings,
  headerSections: Section[],
): HeaderNavItem[] {
  const items: HeaderNavItem[] = [];

  if (settings.features?.userSubmissions) {
    items.push({ kind: 'builtin', key: 'submit', navKey: 'submit', label: 'Submit Prompt', href: '/submit' });
  }
  items.push({ kind: 'builtin', key: 'home', navKey: 'home', label: 'Home', href: '/' });
  items.push({ kind: 'builtin', key: 'explore', navKey: 'explore', label: 'Explore', href: '/explore' });

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
