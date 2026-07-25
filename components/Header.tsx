'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Search, Sun, Moon, Menu, X, Sparkles, Shield, User as UserIcon, LogOut, Plus, ChevronRight, Home, Compass, BookOpen, MessageSquare, Hash, Zap, LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/context/ThemeContext';
import { useData } from '@/components/context/DataContext';
import { getSupabaseClient } from '@/lib/supabase-lazy';
import type { User } from '@supabase/supabase-js';
import { getPostPath } from '@/lib/sections';
import { buildHeaderNavItems } from '@/lib/header-nav';
import SmartLink from '@/components/SmartLink';

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

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { settings, sections, posts, ensurePostsLoaded } = useData();
  const accountFeaturesEnabled = Boolean(settings.features?.userProfiles);
  const submissionsEnabled = Boolean(settings.features?.userProfiles && settings.features?.userSubmissions);
  const headerSections = sections.filter(s => s.location === 'header' && s.visible).sort((a,b) => a.order - b.order);
  // Single ordered nav list (built-ins + sections + custom links), honoring the
  // saved header order and built-in hide/rename overrides. The Submit item is
  // rendered with its Plus icon; everything else is a plain link.
  const navItems = buildHeaderNavItems(settings, headerSections);
  const navigate = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showLiveResults, setShowLiveResults] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const routeTimerRef = useRef<number | null>(null);
  const routeIntervalRef = useRef<number | null>(null);
  const routeFallbackRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [routeProgress, setRouteProgress] = useState(0);

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
    // Soft-navigation rescue: on flaky mobile networks (or a stale build after
    // a deploy) the router's RSC fetch can hang or reject, leaving the bar
    // stuck and the page never changing. If the route hasn't changed after 8s,
    // fall back to a full browser navigation, which always works.
    if (targetHref) {
      const from = window.location.pathname + window.location.search;
      routeFallbackRef.current = window.setTimeout(() => {
        const now = window.location.pathname + window.location.search;
        if (now === from) window.location.assign(targetHref);
      }, 8000);
    }
  }, [stopRouteTimers]);

  useEffect(() => {
    const updateHeaderAndProgress = () => {
      scrollFrameRef.current = null;
      const currentScrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(100, Math.max(0, (currentScrollY / max) * 100)) : 0;

      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${progress}%`;
      }

      const delta = currentScrollY - lastScrollYRef.current;
      const shouldHide = delta > 4 && currentScrollY > 64 && !menuOpen && !searchOpen && !showLiveResults;
      const shouldShow = delta < -4 || currentScrollY <= 16 || menuOpen || searchOpen || showLiveResults;
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

  const finishRouteProgress = useCallback(() => {
    stopRouteTimers();
    setRouteProgress(100);
    routeTimerRef.current = window.setTimeout(() => setRouteProgress(0), 320);
  }, [stopRouteTimers]);

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

  useEffect(() => {
    // Globally skip loading Supabase auth client on every page if the feature is disabled
    if (!accountFeaturesEnabled) return;

    let subscription: { unsubscribe: () => void } | undefined;
    let cancelled = false;
    let timeoutId: number;

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

    // Defer initialization to avoid blocking the main thread during hydration globally
    timeoutId = window.setTimeout(initAuth, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [accountFeaturesEnabled]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node) && mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowLiveResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Post summaries load on demand the first time the search is used.
  const [postsLoading, setPostsLoading] = useState(false);
  const activateSearch = useCallback(() => {
    setShowLiveResults(true);
    if (posts.length === 0) {
      setPostsLoading(true);
      ensurePostsLoaded().finally(() => setPostsLoading(false));
    }
  }, [posts.length, ensurePostsLoaded]);

  const getLiveResults = () => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return posts.filter(p => {
      if ((p.status && p.status !== 'published') || p.visibility === 'private') return false;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.images && p.images.some(img => img.aiTool?.toLowerCase().includes(q)))
      );
    }).slice(0, 5);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const target = `/search?q=${encodeURIComponent(query.trim())}`;
      startRouteProgress(target);
      navigate.push(target);
      setQuery('');
      setSearchOpen(false);
      setShowLiveResults(false);
      setMenuOpen(false);
    }
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

  const renderLiveResults = () => {
    const results = getLiveResults();
    if (!query.trim() || !showLiveResults) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-lg overflow-hidden fade-in max-h-[60vh] overflow-y-auto z-50">
        {results.length > 0 ? (
          <div className="flex flex-col">
            {results.map(post => (
              <Link
                key={post.id}
                href={getPostPath(post)}
                onClick={() => {
                  setShowLiveResults(false);
                  setSearchOpen(false);
                  setQuery('');
                }}
                className="flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border-b border-surface-100 dark:border-surface-800 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-800 relative">
                  <Image src={post.images?.[0]?.url || ''} alt="" fill sizes="40px" className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{post.title}</h4>
                  <div className="flex items-center mt-1">
                    {post.images?.[0]?.aiTool && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                        {post.images[0].aiTool}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : postsLoading ? (
          <div className="p-4 flex items-center justify-center gap-2 text-sm text-surface-500">
            <span className="w-4 h-4 rounded-full border-2 border-surface-300 border-t-primary-500 animate-spin" />
            Searching…
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-surface-500">
            No matches found for &quot;{query}&quot;
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <Suspense fallback={null}>
      <RouteChangeComplete onRouteChange={finishRouteProgress} />
    </Suspense>
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full origin-left bg-gradient-to-r from-primary-500 via-fuchsia-500 to-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.55)] transition-[transform,opacity] duration-200 ease-out"
        style={{ transform: `scaleX(${routeProgress / 100})`, opacity: routeProgress > 0 ? 1 : 0 }}
      />
    </div>
    <div
      className="fixed inset-x-0 z-[60] h-[6px] overflow-hidden rounded-b border-y border-surface-200 bg-surface-50 pointer-events-none transition-[top] duration-300 ease-in-out dark:border-surface-800 dark:bg-surface-900"
      style={{ top: isVisible ? '48px' : '0px' }}
    >
      <div
        ref={progressFillRef}
        className="relative h-1 rounded-full bg-gradient-to-r from-primary-500 via-fuchsia-500 to-purple-500 transition-[width] duration-150 ease-linear after:absolute after:inset-0 after:bg-[linear-gradient(-45deg,rgba(255,255,255,.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.22)_50%,rgba(255,255,255,.22)_75%,transparent_75%,transparent)] after:bg-[length:50px_50px] after:content-[''] after:animate-[movePgrs_2s_linear_infinite]"
        style={{ width: '0%' }}
      />
    </div>
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" prefetch={false} className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
          <div className="w-9 h-9 shrink-0 relative overflow-hidden rounded-xl">
            <Image src={settings.siteLogo || '/icon-190x190.jpg'} alt={settings.siteTitle} fill sizes="36px" className="object-contain" referrerPolicy="no-referrer" priority />
          </div>
          <span className="text-xl font-bold gradient-text">{settings.siteTitle}</span>
        </Link>

        {/* Desktop Search */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl relative">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  activateSearch();
                }}
                onFocus={activateSearch}
                placeholder="Search prompts, categories, AI tools..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-surface-900 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm transition-all shadow-inner focus:shadow-sm"
              />
            </div>
          </form>
          {renderLiveResults()}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item, index) => {
            const elements = [];
            if (index > 0) {
              elements.push(<div key={`div-${item.navKey}`} className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1" />);
            }

            if (item.kind === 'builtin' && item.key === 'submit') {
              if (submissionsEnabled) {
                elements.push(
                  <Link key={item.navKey} href={item.href} prefetch={false} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 press-anim">
                    <Plus className="w-4 h-4 text-primary-500" />
                    {item.label}
                  </Link>
                );
              }
            } else if (item.kind === 'link') {
              elements.push(
                <SmartLink key={item.navKey} href={item.href} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 press-anim">
                  {item.label}
                </SmartLink>
              );
            } else {
              elements.push(
                <Link key={item.navKey} href={item.href} prefetch={false} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 press-anim">
                  {item.label}
                </Link>
              );
            }
            return elements;
          })}

          {accountFeaturesEnabled && (
            <div className="flex items-center ml-2 border-l border-surface-200 dark:border-surface-700 pl-4 gap-2">
              {user ? (
                <>
                  <Link href="/profile" prefetch={false} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 press-anim">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={handleLogout} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-surface-100 dark:hover:bg-surface-800 press-anim" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button onClick={handleLogin} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 press-anim">
                  Sign In
                </button>
              )}
            </div>
          )}

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 press-anim"
            aria-label="Toggle theme"
          >
            <span className="relative block w-5 h-5">
              <Sun className={`absolute inset-0 w-5 h-5 text-yellow-400 transition-all duration-300 ease-out ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
              <Moon className={`absolute inset-0 w-5 h-5 text-surface-600 transition-all duration-300 ease-out ${theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
            </span>
          </button>
        </nav>

        {/* Mobile buttons */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 press-anim"
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            aria-expanded={searchOpen}
          >
            <span className="relative block w-5 h-5">
              <Search className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-out ${searchOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-out ${searchOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 press-anim"
            aria-label="Toggle theme"
          >
            <span className="relative block w-5 h-5">
              <Sun className={`absolute inset-0 w-5 h-5 text-yellow-400 transition-all duration-300 ease-out ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
              <Moon className={`absolute inset-0 w-5 h-5 text-surface-600 transition-all duration-300 ease-out ${theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
            </span>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 press-anim"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="relative block w-5 h-5">
              <Menu className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-out ${menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-out ${menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div ref={mobileSearchRef} className="absolute top-full left-0 right-0 z-50 md:hidden px-4 py-3 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 shadow-xl fade-in">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  activateSearch();
                }}
                onFocus={activateSearch}
                placeholder="Search prompts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 outline-none text-sm"
                autoFocus
              />
            </div>
          </form>
          {renderLiveResults()}
        </div>
      )}

      {/* Mobile search bar */}
    </header>

    {/* Mobile menu sidebar */}
    {menuOpen && (
      <div className="fixed inset-0 z-[100] md:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-surface-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in-overlay" 
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Minimalist Sidebar Panel */}
        <nav className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white dark:bg-surface-950 shadow-2xl flex flex-col animate-slide-in-right border-l border-surface-200 dark:border-surface-800">
          
          {/* Sidebar Header */}
          <div className="px-5 h-16 flex items-center justify-between border-b border-surface-100 dark:border-surface-800/50 shrink-0">
            <Link href="/" prefetch={false} className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <div className="w-8 h-8 shrink-0 relative overflow-hidden rounded-xl">
                <Image src={settings.siteLogo || '/icon-190x190.jpg'} alt={settings.siteTitle} fill sizes="32px" className="object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-white">{settings.siteTitle}</span>
            </Link>
            <button 
              onClick={() => setMenuOpen(false)}
              className="p-2 -mr-2 rounded-full text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Sidebar Links */}
          <div className="flex-1 overflow-y-auto py-4">
            {navItems.map((item, index) => {
              if (item.kind === 'builtin' && item.key === 'submit' && !submissionsEnabled) {
                return null;
              }

              const isActive = pathname === item.href;
              const activeClass = isActive 
                ? "text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-500/5"
                : "text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-900/50 hover:text-surface-900 dark:hover:text-white";
              
              return (
                <div key={item.navKey} className="flex flex-col">
                  {index > 0 && <div className="h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent mx-6 my-1" />}
                  <Link 
                    href={item.href} 
                    prefetch={false} 
                    onClick={() => setMenuOpen(false)} 
                    className={`flex items-center gap-4 px-6 py-3 text-[15px] font-medium transition-colors relative ${activeClass}`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                    )}
                    {item.label}
                  </Link>
                </div>
              );
            })}

            {accountFeaturesEnabled && (
              <div className="mt-6 border-t border-surface-100 dark:border-surface-800">
                {user ? (
                   <div className="py-2">
                    <Link href="/profile" prefetch={false} onClick={() => setMenuOpen(false)} className="flex items-center gap-4 px-6 py-3 text-[15px] font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-900/50 hover:text-surface-900 dark:hover:text-white transition-colors">
                      <UserIcon className="w-5 h-5 opacity-70" />
                      Profile
                    </Link>
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-4 px-6 py-3 text-[15px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-5 h-5 opacity-70" />
                      Sign Out
                    </button>
                   </div>
                ) : (
                  <div className="p-5">
                    <button onClick={() => { handleLogin(); setMenuOpen(false); }} className="w-full text-center px-4 py-2.5 rounded-xl text-[15px] font-medium bg-surface-900 dark:bg-white text-white dark:text-surface-900 hover:opacity-90 active:scale-[0.98] transition-all">
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    )}
    </>
  );
}
