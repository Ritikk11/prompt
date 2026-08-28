'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Sun, Moon, Wand2, Compass, ArrowRight, Search, X, User as UserIcon, LogOut, Plus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useData } from '@/components/context/DataContext';
import { useTheme } from '@/components/context/ThemeContext';
import { buildHeaderNavItems, type HeaderNavItem } from '@/lib/header-nav';
import { getToolInfo } from '@/lib/constants';
import { getSupabaseClient } from '@/lib/supabase-lazy';
import { getPostPath } from '@/lib/sections';
import SmartLink from '@/components/SmartLink';
import type { Post } from '@/lib/types';

const getToolBrandName = (itemLabel: string) => {
  const cleaned = itemLabel.replace(/Prompts/gi, '').trim();
  return cleaned || itemLabel;
};

export function Logo({ siteLogo, siteTitle }: { siteLogo?: string; siteTitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 relative overflow-hidden rounded-xl">
        <Image
          src={siteLogo || '/icon-190x190.jpg'}
          alt={siteTitle || 'Logo'}
          fill
          sizes="36px"
          className="object-cover"
          priority
        />
      </div>
      <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans whitespace-nowrap">
        AI Prompt<span className="bg-gradient-to-r from-[#1a73e8] to-[#4285f4] dark:from-[#669df6] dark:to-[#aecbfa] bg-clip-text text-transparent">Matrix</span>
      </span>
    </span>
  );
}

export default function GlmHeader() {
  const { settings, sections, posts, ensurePostsLoaded } = useData();
  const { theme, toggleTheme } = useTheme();
  const navigate = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLiveResults, setShowLiveResults] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  // ThemeProvider starts at 'light' and only reads localStorage after mount,
  // so on dark pages the toggle would flash the wrong icon for a frame. Hide
  // both icons until the stored theme has hydrated.
  const [themeMounted, setThemeMounted] = useState(false);

  const isAnyDesktopMenuOpen = activeMenuId !== null;

  const pathname = usePathname();
  // Production gates the account cluster behind settings.features.userProfiles
  // (currently disabled in live settings). The sandbox preview shows it
  // regardless so the design can be reviewed — re-apply the flag gate when this
  // gets ported into main:
  //   Boolean(settings?.features?.userProfiles)
  const accountFeaturesEnabled = true;
  const isHomepage = pathname === '/' || pathname === '/test';
  // Hidden at the top of the homepage (the hero has its own search bar);
  // appears once scrolled and on every non-homepage route.
  const showSearchIcon = scrolled || !isHomepage || searchOpen;

  const lastScrollYRef = useRef(0);
  const suppressHideRef = useRef(false);
  const suppressHideTimeoutRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll visibility behavior: transparent at top, frosted glass on scroll
  useEffect(() => {
    let ticking = false;

    const updateHeader = () => {
      ticking = false;
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);

      const delta = currentScrollY - lastScrollYRef.current;
      const shouldHide =
        delta > 4 &&
        currentScrollY > 64 &&
        !mobileMenuOpen &&
        !searchOpen &&
        !suppressHideRef.current;
      const shouldShow =
        delta < -4 ||
        currentScrollY <= 16 ||
        mobileMenuOpen ||
        searchOpen;

      if (shouldHide) {
        setIsVisible(false);
      } else if (shouldShow) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    updateHeader();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mobileMenuOpen, searchOpen]);

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

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  // Account auth (mirrors the production header): Supabase client loads lazily
  // and only after a delay so hydration is never blocked; skipped entirely when
  // the userProfiles feature is off.
  useEffect(() => {
    if (!accountFeaturesEnabled) return;

    let subscription: { unsubscribe: () => void } | undefined;
    let cancelled = false;

    const initAuth = () => {
      getSupabaseClient().then((supabase) => {
        if (cancelled) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });
        ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        }));
      });
    };

    const timeoutId = window.setTimeout(initAuth, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
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
    setMobileMenuOpen(false);
    activateSearch();
  }, [activateSearch]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setShowLiveResults(false);
    setQuery('');
  }, []);

  const getLiveResults = () => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return posts
      .filter((p) => {
        if ((p.status && p.status !== 'published') || p.visibility === 'private') return false;
        return (
          p.title.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.aiTools && p.aiTools.some((t) => t.toLowerCase().includes(q))) ||
          (p.images && p.images.some((img) => img.aiTool?.toLowerCase().includes(q)))
        );
      })
      .slice(0, 5);
  };

  const submitSearch = () => {
    if (!query.trim()) return;
    navigate.push(`/search?q=${encodeURIComponent(query.trim())}`);
    closeSearch();
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
    } catch (err) {
      console.error(err);
    }
  };

  // Close the search panel on outside click or Escape.
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

  // Autofocus the input once the panel has finished expanding (focusing a
  // still-collapsed input gets dropped by the browser).
  useEffect(() => {
    if (!searchOpen) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 320);
    return () => window.clearTimeout(t);
  }, [searchOpen]);

  // Dynamic Navigation Setup
  const headerSections = (sections || [])
    .filter((s) => s.location === 'header' && s.visible)
    .sort((a, b) => a.order - b.order);

  const navItems = buildHeaderNavItems(settings, headerSections);

  const menuDefs = (() => {
    const saved = settings?.headerMenus;
    if (saved) {
      return saved.map((m, i) => ({
        id: m.id || `menu-${i}`,
        label: m.label?.trim() || 'Menu',
        keys: m.itemNavKeys || [],
      }));
    }
    const legacy = settings?.headerToolsMenu;
    if (legacy) {
      return legacy.enabled === false
        ? []
        : [
          {
            id: 'legacy-tools',
            label: legacy.label?.trim() || 'Tools',
            keys: legacy.itemNavKeys ?? navItems.filter((i) => i.kind === 'section').map((i) => i.navKey),
          },
        ];
    }
    return [
      {
        id: 'auto-tools',
        label: 'Tools',
        keys: navItems.filter((i) => i.kind === 'section').map((i) => i.navKey),
      },
    ];
  })();

  const menuKeyUnion = new Set(menuDefs.flatMap((def) => def.keys));
  const inlineNavItems = navItems.filter((i) => !menuKeyUnion.has(i.navKey));
  const headerMenus = menuDefs
    .map((def) => {
      const keySet = new Set(def.keys);
      return { ...def, items: navItems.filter((i) => keySet.has(i.navKey)) };
    })
    .filter((m) => m.items.length > 0);

  const liveResults = searchOpen ? getLiveResults() : [];

  // Submit pill preview: production only supplies this item via
  // buildHeaderNavItems when userSubmissions is enabled (currently off in
  // live settings, like userProfiles). The sandbox shows it regardless so the
  // design can be reviewed — and hides the preview automatically if the real
  // nav item ever appears, so it can never double up.
  const showSubmitPreview = !inlineNavItems.some(
    (i) => i.kind === 'builtin' && i.key === 'submit'
  );

  // Per-result context line: prefer the field(s) that actually matched the
  // query (category / tool / tag), fall back to general context.
  const getResultMeta = (post: Post, qRaw: string) => {
    const q = qRaw.trim().toLowerCase();
    if (!q) return '';
    const parts: string[] = [];
    if (post.category && post.category.toLowerCase().includes(q)) parts.push(post.category);
    const tool =
      post.aiTools?.find((t) => t.toLowerCase().includes(q)) ||
      post.images?.find((img) => img.aiTool?.toLowerCase().includes(q))?.aiTool;
    if (tool) parts.push(tool);
    const tag = post.tags?.find((t) => t.toLowerCase().includes(q));
    if (tag) parts.push(`#${tag}`);
    if (parts.length === 0) {
      if (post.category) parts.push(post.category);
      const anyTool = post.aiTools?.[0] || post.images?.find((img) => img.aiTool)?.aiTool;
      if (anyTool && anyTool !== post.category) parts.push(anyTool);
    }
    return parts.slice(0, 3).join(' · ');
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${scrolled || mobileMenuOpen || isAnyDesktopMenuOpen || searchOpen
          ? 'glass-bar shadow-md shadow-black/5 dark:shadow-black/40'
          : 'bg-transparent border-b border-transparent shadow-none'
        }`}
    >
      {/* Top Navbar Row */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3.5 sm:px-6 gap-2">
        {/* Brand Logo */}
        <Link href="/test" className="shrink-0 flex items-center">
          <Logo siteLogo={settings?.siteLogo} siteTitle={settings?.siteTitle} />
        </Link>

        {/* Center Desktop Navigation Links (Pill Shapes with Accent Border on Hover) */}
        <nav className="hidden lg:flex items-center gap-1">
          {inlineNavItems.map((item) => {
            const isActive = pathname === item.href;
            const linkClass = `rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 border ${isActive
              ? 'text-[#1a73e8] dark:text-[#669df6] bg-blue-500/10 dark:bg-blue-500/20 font-semibold border-[#4285f4]/40'
              : 'border-transparent hover:border-[#4285f4]/40 text-slate-700 dark:text-slate-200 hover:text-[#1a73e8] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`;

            if (item.kind === 'link') {
              return (
                <SmartLink key={item.navKey} href={item.href} className={linkClass}>
                  {item.label}
                </SmartLink>
              );
            }
            return (
              <Link key={item.navKey} href={item.href} prefetch={false} className={linkClass}>
                {item.label}
              </Link>
            );
          })}

          {/* Desktop Dropdown Menus */}
          {headerMenus.map((menu) => {
            const isOpen = activeMenuId === menu.id;
            return (
              <button
                key={menu.id}
                onMouseEnter={() => {
                  if (searchOpen) return;
                  if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
                  setActiveMenuId(menu.id);
                }}
                onMouseLeave={() => {
                  hoverTimerRef.current = window.setTimeout(() => setActiveMenuId(null), 150);
                }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors duration-200 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border ${isOpen
                    ? 'text-[#1a73e8] dark:text-[#669df6] bg-blue-500/10 dark:bg-blue-500/20 border-[#4285f4]/50'
                    : 'border-transparent hover:border-[#4285f4]/40 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
              >
                <span>{menu.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1a73e8] dark:text-[#669df6]' : 'text-slate-400 dark:text-slate-400'}`} />
              </button>
            );
          })}

          {/* Submit Prompt — sandbox preview (see showSubmitPreview note) */}
          {showSubmitPreview && (
            <Link
              href="/submit"
              prefetch={false}
              className="ml-1 flex items-center gap-1.5 rounded-full border border-[#4285f4]/40 bg-blue-500/10 px-3.5 py-1.5 text-sm font-semibold text-[#1a73e8] transition-all duration-150 hover:border-[#4285f4]/60 hover:bg-blue-500/15 dark:border-[#4285f4]/30 dark:bg-blue-500/15 dark:text-[#669df6] dark:hover:bg-blue-500/25 dark:hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit Prompt
            </Link>
          )}
        </nav>

        {/* Right Actions: Search Icon + Theme Toggle + Account + CTA Button (Desktop) + Morphing Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Search Icon — hidden at the top of the homepage (the hero has its
              own search bar); appears once scrolled and on other pages. No
              backdrop-blur on this chip on purpose: it fades in/out, and a
              frosted surface can't be opacity-animated without flashing. */}
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => (searchOpen ? closeSearch() : openSearch())}
            tabIndex={showSearchIcon ? 0 : -1}
            aria-hidden={!showSearchIcon}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            aria-expanded={searchOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${showSearchIcon
                ? 'scale-100 opacity-100 pointer-events-auto'
                : 'scale-75 opacity-0 pointer-events-none'
              } ${searchOpen
                ? 'border-[#4285f4]/50 bg-blue-500/10 text-[#1a73e8] dark:bg-blue-500/20 dark:text-[#669df6]'
                : 'border-black/[0.06] bg-black/[0.04] text-slate-700 hover:border-[#4285f4]/50 hover:bg-black/[0.08] hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.12] dark:hover:text-white'
              }`}
          >
            <span className="relative block h-4 w-4">
              <Search
                className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-200 ${searchOpen ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
              />
              <X
                className={`absolute inset-0 h-4 w-4 transform-gpu transition-all duration-200 ${searchOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
              />
            </span>
          </button>

          {/* Light / Dark Mode Toggle (Pill / Circle with Accent Border Hover) */}
          <button
            onClick={handleThemeToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#4285f4]/50 transition-all backdrop-blur-md"
            aria-label="Toggle theme"
          >
            <span className={`relative block w-4 h-4 transition-opacity duration-200 ${themeMounted ? 'opacity-100' : 'opacity-0'}`}>
              <Sun
                className={`absolute inset-0 w-4 h-4 transition-all duration-300 transform-gpu ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
                  }`}
              />
              <Moon
                className={`absolute inset-0 w-4 h-4 transition-all duration-300 transform-gpu ${theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                  }`}
              />
            </span>
          </button>

          {/* Account Cluster (gated by the userProfiles feature flag) */}
          {accountFeaturesEnabled && (
            <div className="hidden md:flex items-center gap-1.5 border-l border-black/10 dark:border-white/10 ml-0.5 sm:ml-1 pl-2 sm:pl-2.5">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    prefetch={false}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-transparent px-3.5 text-sm font-medium text-slate-700 transition-all duration-150 hover:border-[#4285f4]/40 hover:bg-black/5 hover:text-[#1a73e8] dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Log out"
                    aria-label="Log out"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-500 transition-all duration-150 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="glm-grad-shift inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/40 active:scale-[0.98]"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* Primary CTA Button — shown only when the full row actually fits */}
          <Link
            href="/explore"
            className="glm-grad-shift hidden min-[1080px]:inline-flex group relative items-center gap-1.5 overflow-hidden rounded-full px-4 sm:px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10">Browse Prompts</span>
            <svg
              className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>

          {/* Morphing Hamburger / Close Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (searchOpen) closeSearch();
            }}
            className="inline-flex lg:hidden relative items-center justify-center h-9 w-9 rounded-full text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-transparent hover:border-[#4285f4]/40 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="w-4 h-3.5 relative flex flex-col justify-between items-center">
              <span
                className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
                  }`}
              />
              <span
                className={`w-full h-0.5 bg-current rounded-full transition-all duration-200 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                  }`}
              />
              <span
                className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Search Panel — opens from the header search icon. Collapses via
          grid-rows like the mega menu; the panel itself carries no
          backdrop-filter so its open/close fade can never flash frost. */}
      <div
        ref={searchPanelRef}
        className={`grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${searchOpen
            ? 'grid-rows-[1fr] opacity-100 border-t border-black/5 dark:border-white/10'
            : 'grid-rows-[0fr] opacity-0 border-t border-transparent pointer-events-none'
          }`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto w-full max-w-2xl px-3.5 sm:px-6 py-3.5 sm:py-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="group/search relative flex items-center">
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400 transition-colors group-focus-within/search:text-[#1a73e8] dark:text-slate-500 dark:group-focus-within/search:text-[#669df6]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    activateSearch();
                  }}
                  onFocus={activateSearch}
                  placeholder="Search prompts, tools, categories…"
                  aria-label="Search prompts"
                  className="h-11 w-full rounded-full border border-black/10 bg-white/70 pl-10 pr-24 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#4285f4]/60 focus:bg-white/90 focus:shadow-lg focus:shadow-primary-500/10 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-white/[0.12]"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="glm-grad-shift absolute right-1.5 inline-flex h-8 items-center rounded-full px-3.5 text-xs font-semibold text-white shadow-sm shadow-primary-500/25 hover:shadow-md hover:shadow-primary-500/40 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
                >
                  Search
                </button>
              </div>
            </form>

            {showLiveResults && query.trim() && (
              <div className="mt-2.5 overflow-hidden rounded-2xl border border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]">
                <div className="max-h-[45vh] overflow-y-auto">
                  {liveResults.length > 0 ? (
                    liveResults.map((post) => {
                      const meta = getResultMeta(post, query);
                      return (
                        <Link
                          key={post.id}
                          href={getPostPath(post)}
                          onClick={closeSearch}
                          className="group/result flex items-center gap-3 border-b border-black/5 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-black/[0.05] dark:border-white/5 dark:hover:bg-white/[0.08]"
                        >
                          {/* Thumbnail */}
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.06]">
                            {post.thumbnailUrl ? (
                              <Image
                                src={post.thumbnailUrl}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover transition-transform duration-300 ease-out group-hover/result:scale-[1.08]"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                <Wand2 className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          {/* Title + match context */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{post.title}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{meta || 'Prompt'}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover/result:translate-x-0.5 group-hover/result:text-[#1a73e8] dark:text-slate-600 dark:group-hover/result:text-[#669df6]" />
                        </Link>
                      );
                    })
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {postsLoading ? 'Loading prompts…' : 'No matching prompts found.'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={submitSearch}
                  className="flex w-full items-center justify-between gap-2 border-t border-black/5 bg-black/[0.02] px-4 py-2.5 text-left text-xs font-semibold text-[#1a73e8] transition-colors hover:bg-black/[0.05] dark:border-white/5 dark:bg-white/[0.03] dark:text-[#669df6] dark:hover:bg-white/[0.08]"
                >
                  <span className="truncate">See all results for “{query.trim()}”</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smooth Animated Slide-Down Accordion Mobile Menu */}
      <div
        className={`lg:hidden grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen
          ? 'grid-rows-[1fr] opacity-100 border-t border-black/5 dark:border-white/10'
          : 'grid-rows-[0fr] opacity-0 border-t border-transparent pointer-events-none'
          }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pt-3 pb-5 flex flex-col gap-2 max-h-[calc(100vh-50px)] overflow-y-auto">
            {/* Staggered Navigation Links with Accent Border on Hover */}
            <div className="flex flex-col gap-1">
              {inlineNavItems.map((item, idx) => {
                const isActive = pathname === item.href;
                const linkClass = `flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border ${isActive
                  ? 'bg-[#4285f4]/15 text-[#1a73e8] dark:text-[#669df6] font-semibold border-[#4285f4]/40'
                  : 'border-transparent hover:border-[#4285f4]/40 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  } ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`;

                if (item.kind === 'link') {
                  return (
                    <SmartLink
                      key={item.navKey}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={linkClass}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </SmartLink>
                  );
                }
                return (
                  <Link
                    key={item.navKey}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={linkClass}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                );
              })}
            </div>

            {/* Smooth Tools Collapsible Accordion */}
            {headerMenus.map((menu) => (
              <div key={menu.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setMobileAccordion((prev) => ({ ...prev, [menu.id]: !prev[menu.id] }))}
                  className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 border border-transparent hover:border-[#4285f4]/40 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <span>{menu.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileAccordion[menu.id] ? 'rotate-180 text-[#4285f4]' : 'text-slate-400'
                      }`}
                  />
                </button>

                {/* Submenu Height Collapse/Expand Grid */}
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileAccordion[menu.id] ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-1.5 pt-1 pb-1 px-1">
                      {menu.items.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        const toolName = getToolBrandName(sub.label);
                        const info = getToolInfo(toolName, settings?.toolDetails);
                        return (
                          <Link
                            key={sub.navKey}
                            href={sub.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${isSubActive
                              ? 'bg-[#4285f4]/15 border-[#4285f4]/40 text-slate-900 dark:text-white font-semibold'
                              : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/5 dark:border-white/5 hover:border-[#4285f4]/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/10'
                              }`}
                          >
                            {info?.logo && (
                              <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={info.logo}
                                  alt={toolName}
                                  fill
                                  sizes="16px"
                                  className={`object-contain ${toolName.toLowerCase().includes('chatgpt') ? 'dark:invert' : ''}`}
                                />
                              </div>
                            )}
                            <span className="truncate">{toolName}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Submit Prompt (sandbox preview — production gates this behind
                userSubmissions; see showSubmitPreview note) */}
            {showSubmitPreview && (
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-2xl border border-[#4285f4]/30 bg-[#4285f4]/10 px-4 py-2.5 text-sm font-semibold text-[#1a73e8] transition-all duration-200 hover:bg-[#4285f4]/15 dark:text-[#669df6] ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Submit Prompt
                </span>
                <ChevronRight className="h-4 w-4 opacity-40" />
              </Link>
            )}

            {/* Account Links (gated by the userProfiles feature flag) */}
            {accountFeaturesEnabled && (
              <div
                className={`flex flex-col gap-1 pt-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                  }`}
              >
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-[#4285f4]/40 hover:bg-black/5 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" /> Profile
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500 dark:text-slate-200 dark:hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogin();
                    }}
                    className="glm-grad-shift flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 active:scale-[0.98]"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Full-width Blue Pill CTA Button with Spring Entrance */}
            <div
              className={`pt-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
            >
              <Link
                href="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="glm-grad-shift flex items-center justify-center gap-2 w-full rounded-full py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 active:scale-[0.98]"
              >
                <span>Browse All Prompts</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Dropdown Mega Menu (Turn 1 style) */}
      <div
        onMouseEnter={() => {
          if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
        }}
        onMouseLeave={() => {
          hoverTimerRef.current = window.setTimeout(() => setActiveMenuId(null), 150);
        }}
        className={`hidden lg:grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isAnyDesktopMenuOpen ? 'grid-rows-[1fr] opacity-100 border-t border-black/5 dark:border-white/10' : 'grid-rows-[0fr] opacity-0 border-transparent pointer-events-none'
          }`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 py-4">
            {headerMenus.map((menu) => (
              <div
                key={menu.id}
                className={`transition-all duration-300 flex flex-col items-center w-full ${activeMenuId === menu.id ? 'opacity-100' : 'hidden'
                  }`}
              >
                <div className="flex flex-wrap justify-center gap-2 w-full max-w-4xl">
                  {menu.items.map(item => {
                    const isActive = pathname === item.href;
                    const toolName = getToolBrandName(item.label);
                    const info = getToolInfo(toolName, settings?.toolDetails);

                    const rowClass = `flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${isActive
                        ? 'bg-[#4285f4]/15 border-[#4285f4]/40 text-slate-900 dark:text-white font-semibold'
                        : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/5 dark:border-white/5 hover:border-[#4285f4]/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/10'
                      }`;

                    const inner = (
                      <>
                        {info?.logo && (
                          <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={info.logo}
                              alt={toolName}
                              fill
                              sizes="16px"
                              className={`object-contain ${toolName.toLowerCase().includes('chatgpt') ? 'dark:invert' : ''}`}
                            />
                          </div>
                        )}
                        <span className="truncate">{toolName}</span>
                      </>
                    );

                    return item.kind === 'link' ? (
                      <SmartLink key={item.navKey} href={item.href} onClick={() => setActiveMenuId(null)} className={rowClass}>
                        {inner}
                      </SmartLink>
                    ) : (
                      <Link key={item.navKey} href={item.href} prefetch={false} onClick={() => setActiveMenuId(null)} className={rowClass}>
                        {inner}
                      </Link>
                    );
                  })}
                </div>

                <div className="w-full mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex justify-center">
                  <Link
                    href="/explore"
                    onClick={() => setActiveMenuId(null)}
                    className="inline-flex items-center gap-1.5 rounded-xl py-1 px-3 text-xs font-bold text-[#1a73e8] dark:text-[#669df6] hover:text-[#174ea6] dark:hover:text-white transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore all prompts</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom specular gradient highlight */}
      {(scrolled || mobileMenuOpen || isAnyDesktopMenuOpen || searchOpen) && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#4285f4]/30 dark:via-[#4285f4]/40 to-transparent pointer-events-none" />
      )}

      {/* Glass Bar CSS */}
      <style jsx global>{`
        .glass-bar {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        .dark .glass-bar {
          background: rgba(9, 11, 28, 0.5);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }
        @keyframes dropdownItemIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Gradient-shift hover for the blue CTA pills: instead of darkening,
           a lighter blue band sweeps across the pill on hover. The class owns
           the whole transition so Tailwind's transition-all can't fight it. */
        .glm-grad-shift {
          background-image: linear-gradient(100deg, #1a73e8 0%, #4285f4 40%, #669df6 50%, #4285f4 60%, #1a73e8 100%);
          background-size: 250% auto;
          background-position: 0% center;
          transition: background-position 0.55s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.2s ease, box-shadow 0.25s ease;
        }
        .glm-grad-shift:hover {
          background-position: 100% center;
        }
      `}</style>
    </header>
  );
}