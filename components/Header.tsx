'use client';
import { useState, useRef, useEffect, useCallback, Suspense, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Search, Sun, Moon, X, User as UserIcon, LogOut, Plus, ChevronRight, ChevronDown, Compass, ArrowRight, Wand2 } from 'lucide-react';
import { useTheme } from '@/components/context/ThemeContext';
import { useData } from '@/components/context/DataContext';
import { getSupabaseClient } from '@/lib/supabase-lazy';
import type { User } from '@supabase/supabase-js';
import type { Post } from '@/lib/types';
import { getPostPath } from '@/lib/sections';
import { getToolInfo } from '@/lib/constants';
import { buildHeaderNavItems } from '@/lib/header-nav';
import SmartLink from '@/components/SmartLink';

/* Shared chrome recipes. Module scope so they are not rebuilt per render. */

/** 36px circular glass chip — search / theme / hamburger. */
const iconChip =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-black/[0.04] text-surface-700 transition-all duration-200 hover:border-primary-500/50 hover:bg-black/[0.08] hover:text-surface-900 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-surface-200 dark:hover:bg-white/[0.12] dark:hover:text-white';

/** Desktop nav pill: no border until hover, then an accent hairline. */
const navPill =
  'rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-surface-700 transition-all duration-150 hover:border-primary-500/40 hover:bg-black/5 hover:text-primary-600 dark:text-surface-200 dark:hover:bg-white/10 dark:hover:text-white';

const navPillActive =
  'rounded-full border border-primary-500/40 bg-primary-500/10 px-3.5 py-1.5 text-sm font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-300';

/** Tool chip in the mega menu / mobile accordion. */
const toolChip =
  'flex items-center gap-2 rounded-full border border-black/5 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-surface-700 transition-all duration-200 hover:border-primary-500/50 hover:bg-black/[0.06] hover:text-surface-900 dark:border-white/5 dark:bg-white/[0.05] dark:text-surface-300 dark:hover:bg-white/10 dark:hover:text-white';

const toolChipActive =
  'flex items-center gap-2 rounded-full border border-primary-500/40 bg-primary-500/[0.15] px-3 py-1.5 text-xs font-semibold text-surface-900 transition-all duration-200 dark:text-white';

/** Full-width row in the mobile accordion. */
const mobileRow =
  'flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-surface-700 transition-all duration-200 hover:border-primary-500/40 hover:bg-black/5 hover:text-surface-900 dark:text-surface-200 dark:hover:bg-white/10 dark:hover:text-white';

const mobileRowActive =
  'flex items-center justify-between rounded-2xl border border-primary-500/40 bg-primary-500/[0.15] px-4 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-300';

/* Collapsible panel wrapper — grid-rows 0fr→1fr, the /test header's glide.
   The panel animates at its ACTUAL content height, so a 60px search panel
   glides over the full 300ms instead of finishing in the first 5% of it the
   way a max-height→80vh cap does. Requires the grid's single child to be the
   overflow-hidden wrapper (each call site below has it); with that child
   present, an `fr` row resolves to the child's max-content height. */
const panelShell = 'grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
const panelOpen = 'grid-rows-[1fr] opacity-100 border-t border-black/5 dark:border-white/10';
/* border-t-0, not border-transparent: three collapsed panels would otherwise add
   3px to the fixed header's box, leaving an invisible strip across the top of
   the page that swallows clicks. */
const panelClosed = 'grid-rows-[0fr] opacity-0 border-t-0 pointer-events-none';

/* useSearchParams() forces everything up to the nearest <Suspense> boundary
   into client-only rendering — with the whole Header inside that hook's
   component, the server HTML had no header at all and the page jumped down
   by the header height once React mounted it. Isolate the hook in a
   render-nothing child so the header itself stays in the server HTML. */
function RouteChangeComplete({ onRouteChange }: { onRouteChange: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    onRouteChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

/** "Tools Prompts" → "Tools": the menu chips show the bare brand name. */
const toolBrandName = (label: string) => label.replace(/Prompts/gi, '').trim() || label;

/**
 * Two-tone brand lockup: the title in solid ink with its final segment in the
 * blue gradient. Derived from settings.siteTitle rather than hardcoded, so a
 * rename in admin still reads correctly — the accent is the last CamelCase
 * segment of the last word when there is one ("AI PromptMatrix" → "Matrix"),
 * otherwise the whole last word.
 *
 * Exported for the footer, which shows the same lockup.
 */
export function SiteTitle({ title, className = '' }: { title?: string; className?: string }) {
  const text = (title || 'AI PromptMatrix').trim();
  const lastSpace = text.lastIndexOf(' ');
  const lastWord = text.slice(lastSpace + 1);
  // Last capital inside the final word, e.g. the "M" of "PromptMatrix".
  let splitAt = -1;
  for (let i = lastWord.length - 1; i > 0; i -= 1) {
    const ch = lastWord[i];
    if (ch >= 'A' && ch <= 'Z') { splitAt = i; break; }
  }
  const head = splitAt > 0 ? text.slice(0, lastSpace + 1 + splitAt) : text.slice(0, lastSpace + 1);
  const accent = splitAt > 0 ? lastWord.slice(splitAt) : lastWord;

  return (
    <span className={`whitespace-nowrap font-bold tracking-tight text-surface-900 dark:text-white ${className}`}>
      {head}
      <span className="bg-gradient-to-r from-[#1a73e8] to-google-blue bg-clip-text text-transparent dark:from-[#669df6] dark:to-[#aecbfa]">
        {accent}
      </span>
    </span>
  );
}

// Pathname-based early return must live in a wrapper so the real header's
// hook order stays identical on every route (Rules of Hooks).
export default function Header() {
  const pathname = usePathname();
  if (pathname === '/test' || pathname?.startsWith('/test/')) {
    return null;
  }
  return <SiteHeader />;
}

function SiteHeader() {
  const { theme, toggleTheme } = useTheme();
  const { settings, sections, posts, ensurePostsLoaded } = useData();
  const navigate = useRouter();
  const pathname = usePathname();

  const accountFeaturesEnabled = Boolean(settings.features?.userProfiles);
  const submissionsEnabled = Boolean(settings.features?.userProfiles && settings.features?.userSubmissions);

  const [isVisible, setIsVisible] = useState(true);
  // Frost only once the page has moved: at the very top the bar is transparent
  // so the hero reads as full-bleed. Driven by the same rAF scroll pass below,
  // so it costs no extra listener.
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showLiveResults, setShowLiveResults] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  // ThemeProvider starts at 'light' and only reads localStorage after mount, so
  // on dark pages the toggle would flash the wrong icon for a frame. Hide both
  // icons until the stored theme has hydrated.
  const [themeMounted, setThemeMounted] = useState(false);

  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const routeTimerRef = useRef<number | null>(null);
  const routeIntervalRef = useRef<number | null>(null);
  const routeFallbackRef = useRef<number | null>(null);
  // On mobile, a tap on the theme toggle can land while a scroll gesture is
  // still settling (rubber-band/momentum). That produces a stray `scroll` event
  // right after the tap, which the visibility logic reads as "user scrolled
  // down" and hides the header immediately after it was shown — a
  // hide-then-reappear flicker unrelated to the theme repaint. Suppress
  // scroll-driven hiding for a short window around a deliberate toggle tap.
  const suppressHideRef = useRef(false);
  const suppressHideTimeoutRef = useRef<number | null>(null);

  const isAnyDesktopMenuOpen = activeMenuId !== null;
  const isHomepage = pathname === '/';
  // The homepage hero owns a search bar of its own, so the header chip only
  // appears once that hero has scrolled away. Every other route shows it.
  const showSearchIcon = scrolled || !isHomepage || searchOpen;
  const barExpanded = scrolled || menuOpen || searchOpen || isAnyDesktopMenuOpen;

  const headerSections = sections.filter(s => s.location === 'header' && s.visible).sort((a, b) => a.order - b.order);
  // Single ordered nav list (built-ins + sections + custom links), honoring the
  // saved header order and built-in hide/rename overrides.
  const navItems = buildHeaderNavItems(settings, headerSections);
  // Header dropdown menus: chosen nav items collapse behind labeled triggers so
  // the bar never overflows. Auto mode (no saved setting) groups all header
  // sections under "Tools"; admin overrides come from settings.
  const menuDefs = (() => {
    const saved = settings.headerMenus;
    if (saved) {
      return saved.map((m, i) => ({ id: m.id || `menu-${i}`, label: m.label?.trim() || 'Menu', keys: m.itemNavKeys || [] }));
    }
    const legacy = settings.headerToolsMenu;
    if (legacy) {
      return legacy.enabled === false
        ? []
        : [{ id: 'legacy-tools', label: legacy.label?.trim() || 'Tools', keys: legacy.itemNavKeys ?? navItems.filter(i => i.kind === 'section').map(i => i.navKey) }];
    }
    return [{ id: 'auto-tools', label: 'Tools', keys: navItems.filter(i => i.kind === 'section').map(i => i.navKey) }];
  })();
  const menuKeyUnion = new Set(menuDefs.flatMap(def => def.keys));
  const inlineNavItems = navItems.filter(i => !menuKeyUnion.has(i.navKey));
  const headerMenus = menuDefs
    .map(def => {
      const keySet = new Set(def.keys);
      return { ...def, items: navItems.filter(i => keySet.has(i.navKey)) };
    })
    .filter(m => m.items.length > 0);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const stopRouteTimers = useCallback(() => {
    if (routeTimerRef.current) window.clearTimeout(routeTimerRef.current);
    if (routeIntervalRef.current) window.clearInterval(routeIntervalRef.current);
    if (routeFallbackRef.current) window.clearTimeout(routeFallbackRef.current);
    routeTimerRef.current = null;
    routeIntervalRef.current = null;
    routeFallbackRef.current = null;
  }, []);

  const startRouteProgress = useCallback((targetHref?: string) => {
    stopRouteTimers();
    setRouteProgress(10);
    routeTimerRef.current = window.setTimeout(() => setRouteProgress(34), 120);
    routeIntervalRef.current = window.setInterval(() => {
      setRouteProgress(prev => (prev > 0 && prev < 88 ? Math.min(prev + 8, 88) : prev));
    }, 420);
    // Soft-navigation rescue: on flaky mobile networks (or a stale build after a
    // deploy) the router's RSC fetch can hang or reject, leaving the bar stuck
    // and the page never changing. If the route hasn't changed after 8s, fall
    // back to a full browser navigation, which always works.
    if (targetHref) {
      const from = window.location.pathname + window.location.search;
      routeFallbackRef.current = window.setTimeout(() => {
        const now = window.location.pathname + window.location.search;
        if (now === from) window.location.assign(targetHref);
      }, 8000);
    }
  }, [stopRouteTimers]);

  const finishRouteProgress = useCallback(() => {
    stopRouteTimers();
    setRouteProgress(100);
    routeTimerRef.current = window.setTimeout(() => setRouteProgress(0), 320);
  }, [stopRouteTimers]);

  useEffect(() => {
    const updateHeaderAndProgress = () => {
      scrollFrameRef.current = null;
      const currentScrollY = window.scrollY;

      const isPastTop = currentScrollY > 15;
      setScrolled(prev => (prev !== isPastTop ? isPastTop : prev));

      const isAdmin = pathname?.startsWith('/admin');
      const delta = currentScrollY - lastScrollYRef.current;
      const shouldHide = !isAdmin && delta > 4 && currentScrollY > 64 && !menuOpen && !searchOpen && !showLiveResults && !suppressHideRef.current;
      const shouldShow = isAdmin || delta < -4 || currentScrollY <= 16 || menuOpen || searchOpen || showLiveResults;
      if (shouldHide) {
        setIsVisible(false);
      } else if (shouldShow) {
        setIsVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(updateHeaderAndProgress);
    };

    updateHeaderAndProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeaderAndProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeaderAndProgress);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [menuOpen, searchOpen, showLiveResults]);

  useEffect(() => () => {
    if (suppressHideTimeoutRef.current) window.clearTimeout(suppressHideTimeoutRef.current);
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setIsVisible(true);
    suppressHideRef.current = true;
    if (suppressHideTimeoutRef.current) window.clearTimeout(suppressHideTimeoutRef.current);
    suppressHideTimeoutRef.current = window.setTimeout(() => {
      suppressHideRef.current = false;
      suppressHideTimeoutRef.current = null;
    }, 500);
    toggleTheme();
  }, [toggleTheme]);

  // Any in-app anchor click starts the progress bar, not just the header's own
  // links — the bar is the site-wide navigation indicator.
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      startRouteProgress(nextUrl.pathname + nextUrl.search);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [startRouteProgress]);

  useEffect(() => stopRouteTimers, [stopRouteTimers]);

  // Close both panels on route change.
  useEffect(() => {
    setMenuOpen(false);
    setActiveMenuId(null);
    setSearchOpen(false);
    setShowLiveResults(false);
  }, [pathname]);

  useEffect(() => {
    // Skip loading the Supabase auth client entirely when accounts are off.
    if (!accountFeaturesEnabled) return;

    let subscription: { unsubscribe: () => void } | undefined;
    let cancelled = false;

    const initAuth = () => {
      getSupabaseClient().then(supabase => {
        if (cancelled) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });
        ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        }));
      });
    };

    // Deferred so it never blocks hydration.
    const timeoutId = window.setTimeout(initAuth, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [accountFeaturesEnabled]);

  // Search: post summaries load on demand the first time search is used.
  const activateSearch = useCallback(() => {
    setShowLiveResults(true);
    if (posts.length === 0) {
      setPostsLoading(true);
      ensurePostsLoaded().finally(() => setPostsLoading(false));
    }
  }, [posts.length, ensurePostsLoaded]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setActiveMenuId(null);
    setMenuOpen(false);
    activateSearch();
  }, [activateSearch]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setShowLiveResults(false);
    setQuery('');
  }, []);

  // Outside click / Escape closes the search panel.
  useEffect(() => {
    if (!searchOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchPanelRef.current?.contains(target)) return;
      if (searchButtonRef.current?.contains(target)) return;
      closeSearch();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [searchOpen, closeSearch]);

  // Focus the input only once the panel has finished expanding — focusing a
  // still-collapsed input gets dropped by the browser.
  useEffect(() => {
    if (!searchOpen) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 320);
    return () => window.clearTimeout(t);
  }, [searchOpen]);

  const liveResults = (() => {
    if (!searchOpen || !query.trim()) return [];
    const q = query.toLowerCase();
    return posts
      .filter(p => {
        if ((p.status && p.status !== 'published') || p.visibility === 'private') return false;
        return (
          p.title.toLowerCase().includes(q) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.aiTools && p.aiTools.some(t => t.toLowerCase().includes(q))) ||
          (p.images && p.images.some(img => img.aiTool?.toLowerCase().includes(q)))
        );
      })
      .slice(0, 5);
  })();

  // Per-result context line: prefer whichever field actually matched the query,
  // and fall back to general context so the line is never empty.
  const resultMeta = (post: Post) => {
    const q = query.trim().toLowerCase();
    if (!q) return '';
    const parts: string[] = [];
    if (post.category && post.category.toLowerCase().includes(q)) parts.push(post.category);
    const tool =
      post.aiTools?.find(t => t.toLowerCase().includes(q)) ||
      post.images?.find(img => img.aiTool?.toLowerCase().includes(q))?.aiTool;
    if (tool) parts.push(tool);
    const tag = post.tags?.find(t => t.toLowerCase().includes(q));
    if (tag) parts.push(`#${tag}`);
    if (parts.length === 0) {
      if (post.category) parts.push(post.category);
      const anyTool = post.aiTools?.[0] || post.images?.find(img => img.aiTool)?.aiTool;
      if (anyTool && anyTool !== post.category) parts.push(anyTool);
    }
    return parts.slice(0, 3).join(' · ');
  };

  const submitSearch = () => {
    if (!query.trim()) return;
    const target = `/search?q=${encodeURIComponent(query.trim())}`;
    startRouteProgress(target);
    navigate.push(target);
    closeSearch();
    setMenuOpen(false);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  const handleLogin = () => {
    navigate.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
  };

  const handleLogout = async () => {
    try {
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  /** Tool chips shared by the desktop mega menu and the mobile accordion. */
  const renderToolChip = (item: (typeof navItems)[number], onNavigate: () => void) => {
    const isActive = pathname === item.href;
    // Stripped name is for the LOGO LOOKUP only ("ChatGPT Prompts" → "ChatGPT");
    // the visible label stays exactly as configured in admin.
    const toolName = toolBrandName(item.label);
    const info = getToolInfo(toolName, settings.toolDetails);
    const inner = (
      <>
        {info?.logo && (
          <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-md">
            <Image
              src={info.logo}
              alt=""
              fill
              sizes="16px"
              className={`object-contain ${toolName.toLowerCase().includes('chatgpt') ? 'dark:invert' : ''}`}
              referrerPolicy="no-referrer"
            />
          </span>
        )}
        <span className="truncate">{item.label}</span>
      </>
    );
    const cls = isActive ? toolChipActive : toolChip;
    return item.kind === 'link' ? (
      <SmartLink key={item.navKey} href={item.href} onClick={onNavigate} className={cls}>{inner}</SmartLink>
    ) : (
      <Link key={item.navKey} href={item.href} prefetch={false} onClick={onNavigate} className={cls}>{inner}</Link>
    );
  };

  return (
    <>
      <Suspense fallback={null}>
        <RouteChangeComplete onRouteChange={finishRouteProgress} />
      </Suspense>

      {/* Route-change indicator */}
      <div className="fixed inset-x-0 top-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full origin-left bg-gradient-to-r from-google-blue via-[#669df6] to-primary-500 shadow-[0_0_12px_rgba(66,133,244,0.55)] transition-[transform,opacity] duration-200 ease-out"
          style={{ transform: `scaleX(${routeProgress / 100})`, opacity: routeProgress > 0 ? 1 : 0 }}
        />
      </div>

      {/* Fixed, not sticky: the search / mobile / mega panels expand INSIDE the
          bar, and in normal flow that growth would shove the page down instead
          of overlaying it. The h-14 spacer in app/layout.tsx reserves the row. */}
      <header
        className={`fixed inset-x-0 top-0 z-50 w-full transition-[transform,background-color,border-color,box-shadow] duration-300 ease-in-out will-change-transform ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${
          barExpanded ? 'glass-bar shadow-md shadow-black/5 dark:shadow-black/40' : 'border-b border-transparent bg-transparent shadow-none'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3.5 sm:px-6">
          {/* Brand */}
          <Link href="/" prefetch={false} className="flex shrink-0 items-center gap-2" onClick={() => setMenuOpen(false)}>
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl sm:h-9 sm:w-9">
              <Image src={settings.siteLogo || '/icon-190x190.jpg'} alt={settings.siteTitle || 'Site Logo'} fill sizes="36px" className="object-cover" referrerPolicy="no-referrer" priority />
            </span>
            <SiteTitle title={settings.siteTitle} className="text-base sm:text-xl" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {inlineNavItems.map(item => {
              const isActive = pathname === item.href;
              const pill = isActive ? navPillActive : navPill;
              if (item.kind === 'builtin' && item.key === 'submit') {
                if (!submissionsEnabled) return null;
                return (
                  <Link key={item.navKey} href={item.href} prefetch={false} className={`inline-flex items-center gap-1.5 ${pill}`}>
                    <Plus className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              }
              return item.kind === 'link' ? (
                <SmartLink key={item.navKey} href={item.href} className={pill}>{item.label}</SmartLink>
              ) : (
                <Link key={item.navKey} href={item.href} prefetch={false} className={pill}>{item.label}</Link>
              );
            })}

            {headerMenus.map(menu => {
              const isOpen = activeMenuId === menu.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setActiveMenuId(isOpen ? null : menu.id)}
                  onMouseEnter={() => {
                    if (searchOpen) return;
                    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
                    setActiveMenuId(menu.id);
                  }}
                  onMouseLeave={() => {
                    hoverTimerRef.current = window.setTimeout(() => setActiveMenuId(null), 150);
                  }}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1.5 ${isOpen ? navPillActive : navPill}`}
                >
                  <span>{menu.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {/* No backdrop-blur on this chip on purpose: it fades in and out,
                and a frosted surface cannot be opacity-animated without
                flashing its raw backdrop for a frame. */}
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              tabIndex={showSearchIcon ? 0 : -1}
              aria-hidden={!showSearchIcon}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
              className={`${iconChip} ${showSearchIcon ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'} ${
                searchOpen ? '!border-primary-500/50 !bg-primary-500/10 !text-primary-600 dark:!text-primary-300' : ''
              }`}
            >
              <span className="relative block h-4 w-4">
                <Search className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-200 ${searchOpen ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                <X className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-200 ${searchOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
              </span>
            </button>

            <button type="button" onClick={handleThemeToggle} className={iconChip} aria-label="Toggle theme">
              <span className={`relative block h-4 w-4 transition-opacity duration-200 ${themeMounted ? 'opacity-100' : 'opacity-0'}`}>
                <Sun className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-200 ${theme === 'dark' ? 'rotate-0 scale-100 text-amber-400 opacity-100' : 'rotate-90 scale-50 opacity-0'}`} />
                <Moon className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-200 ${theme === 'dark' ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 text-surface-700 opacity-100'}`} />
              </span>
            </button>

            {accountFeaturesEnabled && (
              <div className="ml-0.5 hidden items-center gap-1.5 border-l border-black/10 pl-2 dark:border-white/10 sm:ml-1 sm:pl-2.5 md:flex">
                {user ? (
                  <>
                    <Link href="/profile" prefetch={false} className={`inline-flex h-9 items-center gap-1.5 ${navPill}`}>
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Log out"
                      aria-label="Log out"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-surface-500 transition-all duration-150 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500 dark:text-surface-400 dark:hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleLogin} className="grad-shift inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/40 active:scale-[0.98]">
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Primary CTA — only once the full row actually fits */}
            <Link
              href="/explore"
              prefetch={false}
              className="grad-shift group relative hidden items-center gap-1.5 overflow-hidden rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/40 active:scale-[0.98] sm:px-5 min-[1080px]:inline-flex"
            >
              <span className="relative z-10">Browse Prompts</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            {/* Morphing hamburger */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(!menuOpen);
                if (searchOpen) closeSearch();
              }}
              className={`relative lg:hidden ${iconChip}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span className="relative flex h-3.5 w-4 flex-col items-center justify-between">
                <span className={`h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
                <span className={`h-0.5 w-full rounded-full bg-current transition-all duration-200 ${menuOpen ? 'scale-x-0 opacity-0' : 'opacity-100'}`} />
                <span className={`h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Search panel. The panel itself carries no backdrop-filter — it
            inherits the bar's frost, so its open/close fade can never flash. */}
        <div ref={searchPanelRef} className={`${panelShell} ${searchOpen ? panelOpen : panelClosed}`}>
          <div className="overflow-hidden">
            <div className="mx-auto w-full max-w-2xl px-3.5 py-3.5 sm:px-6 sm:py-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="group/search relative flex items-center">
                  <Search className="pointer-events-none absolute left-4 h-4 w-4 text-surface-400 transition-colors group-focus-within/search:text-primary-600 dark:text-surface-500 dark:group-focus-within/search:text-primary-300" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value);
                      activateSearch();
                    }}
                    onFocus={activateSearch}
                    placeholder="Search prompts, tools, categories…"
                    aria-label="Search prompts"
                    className="h-11 w-full rounded-full border border-black/10 bg-white/70 pl-10 pr-24 text-sm text-surface-900 outline-none transition-all duration-200 placeholder:text-surface-400 focus:border-primary-500/60 focus:bg-white/90 focus:shadow-lg focus:shadow-primary-500/10 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-surface-500 dark:focus:bg-white/[0.12]"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className="grad-shift absolute right-1.5 inline-flex h-8 items-center rounded-full px-3.5 text-xs font-semibold text-white shadow-sm shadow-primary-500/25 hover:shadow-md hover:shadow-primary-500/40 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
                  >
                    Search
                  </button>
                </div>
              </form>

              {showLiveResults && query.trim() && (
                <div className="mt-2.5 overflow-hidden rounded-2xl border border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="max-h-[45vh] overflow-y-auto">
                    {liveResults.length > 0 ? (
                      liveResults.map(post => (
                        <Link
                          key={post.id}
                          href={getPostPath(post)}
                          onClick={closeSearch}
                          className="group/result flex items-center gap-3 border-b border-black/5 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-black/[0.05] dark:border-white/5 dark:hover:bg-white/[0.08]"
                        >
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.06]">
                            {post.thumbnailUrl || post.images?.[0]?.url ? (
                              <Image
                                src={post.thumbnailUrl || post.images[0].url}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover transition-transform duration-300 ease-out group-hover/result:scale-[1.08]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-surface-400 dark:text-surface-500">
                                <Wand2 className="h-4 w-4" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-surface-800 dark:text-surface-100">{post.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-surface-400 dark:text-surface-500">{resultMeta(post) || 'Prompt'}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-all duration-200 group-hover/result:translate-x-0.5 group-hover/result:text-primary-600 dark:text-surface-600 dark:group-hover/result:text-primary-300" />
                        </Link>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
                        {postsLoading ? 'Loading prompts…' : 'No matching prompts found.'}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={submitSearch}
                    className="flex w-full items-center justify-between gap-2 border-t border-black/5 bg-black/[0.02] px-4 py-2.5 text-left text-xs font-semibold text-primary-600 transition-colors hover:bg-black/[0.05] dark:border-white/5 dark:bg-white/[0.03] dark:text-primary-300 dark:hover:bg-white/[0.08]"
                  >
                    <span className="truncate">See all results for &ldquo;{query.trim()}&rdquo;</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile accordion menu */}
        <div className={`lg:hidden ${panelShell} ${menuOpen ? panelOpen : panelClosed}`}>
          <div className="overflow-hidden">
            <div className="flex max-h-[calc(100vh-56px)] flex-col gap-2 overflow-y-auto px-4 pb-5 pt-3">
              <div className="flex flex-col gap-1">
                {inlineNavItems.map(item => {
                  if (item.kind === 'builtin' && item.key === 'submit' && !submissionsEnabled) return null;
                  const isActive = pathname === item.href;
                  const cls = `${isActive ? mobileRowActive : mobileRow} ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`;
                  const inner = (
                    <>
                      <span className="flex items-center gap-2">
                        {item.kind === 'builtin' && item.key === 'submit' && <Plus className="h-4 w-4 text-primary-500" />}
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </>
                  );
                  return item.kind === 'link' ? (
                    <SmartLink key={item.navKey} href={item.href} onClick={() => setMenuOpen(false)} className={cls}>{inner}</SmartLink>
                  ) : (
                    <Link key={item.navKey} href={item.href} prefetch={false} onClick={() => setMenuOpen(false)} className={cls}>{inner}</Link>
                  );
                })}
              </div>

              {headerMenus.map(menu => (
                <div key={menu.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setMobileAccordion(prev => ({ ...prev, [menu.id]: !prev[menu.id] }))}
                    aria-expanded={Boolean(mobileAccordion[menu.id])}
                    className={mobileRow}
                  >
                    <span>{menu.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileAccordion[menu.id] ? 'rotate-180 text-primary-500' : 'text-surface-400'}`} />
                  </button>
                  <div className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileAccordion[menu.id] ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-1.5 px-1 py-1">
                        {menu.items.map(item => renderToolChip(item, () => setMenuOpen(false)))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {accountFeaturesEnabled && (
                <div className={`flex flex-col gap-1 pt-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                  {user ? (
                    <>
                      <Link href="/profile" prefetch={false} onClick={() => setMenuOpen(false)} className={mobileRow}>
                        <span className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Profile</span>
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-left text-sm font-medium text-surface-700 transition-all duration-200 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500 dark:text-surface-200 dark:hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); handleLogin(); }}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-primary-500/30 bg-primary-500/10 px-4 py-2.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-500/[0.15] dark:text-primary-300"
                    >
                      <UserIcon className="h-4 w-4" /> Sign In
                    </button>
                  )}
                </div>
              )}

              <div className={`pt-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                <Link
                  href="/explore"
                  prefetch={false}
                  onClick={() => setMenuOpen(false)}
                  className="grad-shift flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 active:scale-[0.98]"
                >
                  <span>Browse All Prompts</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop mega menu */}
        <div
          onMouseEnter={() => {
            if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
          }}
          onMouseLeave={() => {
            hoverTimerRef.current = window.setTimeout(() => setActiveMenuId(null), 150);
          }}
          className={`hidden lg:grid ${panelShell} ${isAnyDesktopMenuOpen ? panelOpen : panelClosed}`}
        >
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6">
              {headerMenus.map(menu => (
                <div key={menu.id} className={`w-full flex-col items-center transition-all duration-300 ${activeMenuId === menu.id ? 'flex opacity-100' : 'hidden'}`}>
                  <div className="flex w-full max-w-4xl flex-wrap justify-center gap-2">
                    {menu.items.map(item => renderToolChip(item, () => setActiveMenuId(null)))}
                  </div>
                  <div className="mt-4 flex w-full justify-center border-t border-black/5 pt-3 dark:border-white/10">
                    <Link
                      href="/explore"
                      prefetch={false}
                      onClick={() => setActiveMenuId(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold text-primary-600 transition-colors hover:bg-black/[0.04] hover:text-primary-700 dark:text-primary-300 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Explore all prompts</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specular hairline along the bottom edge */}
        {barExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent dark:via-primary-500/40" />
        )}
      </header>
    </>
  );
}




