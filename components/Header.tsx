'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Search, Sun, Moon, Menu, X, Sparkles, Shield, User as UserIcon, LogOut, Plus } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/context/ThemeContext';
import { useData } from '@/components/context/DataContext';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { getPostPath, getSectionPath } from '@/lib/sections';
import SmartLink from '@/components/SmartLink';
import { getAuthRedirectTo } from '@/lib/auth-redirect';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { settings, sections, posts } = useData();
  const headerSections = sections.filter(s => s.location === 'header' && s.visible).sort((a,b) => a.order - b.order);
  const headerLinks = settings.headerLinks || [];
  const navigate = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showLiveResults, setShowLiveResults] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const routeTimerRef = useRef<number | null>(null);
  const routeIntervalRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const didMountRef = useRef(false);

  const stopRouteTimers = useCallback(() => {
    if (routeTimerRef.current) window.clearTimeout(routeTimerRef.current);
    if (routeIntervalRef.current) window.clearInterval(routeIntervalRef.current);
    routeTimerRef.current = null;
    routeIntervalRef.current = null;
  }, []);

  const startRouteProgress = useCallback(() => {
    stopRouteTimers();
    setRouteProgress(8);
    routeTimerRef.current = window.setTimeout(() => setRouteProgress(28), 120);
    routeIntervalRef.current = window.setInterval(() => {
      setRouteProgress(prev => (prev > 0 && prev < 88 ? Math.min(prev + 7, 88) : prev));
    }, 450);
  }, [stopRouteTimers]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 48 && !menuOpen && !searchOpen && !showLiveResults) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, menuOpen, searchOpen, showLiveResults]);

  useEffect(() => {
    const showScrollProgress = settings.features?.showScrollProgress !== false;
    if (!showScrollProgress) {
      window.setTimeout(() => setScrollProgress(0), 0);
      return;
    }
    const updateProgress = () => {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
      });
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    };
  }, [settings.features?.showScrollProgress, pathname, searchParams]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    stopRouteTimers();
    window.setTimeout(() => setRouteProgress(100), 0);
    routeTimerRef.current = window.setTimeout(() => setRouteProgress(0), 350);
    return () => {
      stopRouteTimers();
    };
  }, [pathname, searchParams, stopRouteTimers]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;
      startRouteProgress();
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [startRouteProgress]);

  const showScrollProgress = settings.features?.showScrollProgress !== false;
  const loadingProgressWidth = routeProgress;
  const scrollProgressWidth = showScrollProgress ? scrollProgress : 0;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node) && mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowLiveResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      navigate.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
      setShowLiveResults(false);
      setMenuOpen(false);
    }
  };

  const handleLogin = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectTo(),
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
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
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full origin-left bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-[transform,opacity] duration-200 ease-out"
        style={{ transform: `scaleX(${loadingProgressWidth / 100})`, opacity: loadingProgressWidth > 0 ? 1 : 0 }}
      />
    </div>
    <div
      className="fixed inset-x-0 z-[60] h-0.5 bg-transparent pointer-events-none transition-[top] duration-300 ease-in-out"
      style={{ top: isVisible ? '48px' : '0px' }}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-primary-500 via-fuchsia-500 to-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.35)] transition-[transform,opacity] duration-75 ease-out"
        style={{ transform: `scaleX(${scrollProgressWidth / 100})`, opacity: scrollProgressWidth > 0 ? 1 : 0 }}
      />
    </div>
    <header className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
          {settings.siteLogo ? (
            <>
              <div className="w-9 h-9 text-transparent rounded-xl overflow-hidden shrink-0 relative">
                <Image src={settings.siteLogo} alt={settings.siteTitle} fill sizes="36px" className="object-cover" referrerPolicy="no-referrer" />
              </div>
            </>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
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
                  setShowLiveResults(true);
                }}
                onFocus={() => setShowLiveResults(true)}
                placeholder="Search prompts, categories, AI tools..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-surface-900 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm transition-all shadow-inner focus:shadow-sm"
              />
            </div>
          </form>
          {renderLiveResults()}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {settings.features?.userSubmissions && (
             <Link href="/submit" className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
               <Plus className="w-4 h-4 text-primary-500" />
               Submit Prompt
             </Link>
          )}
          <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            Home
          </Link>
          <Link href="/explore" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            Explore
          </Link>
          {headerSections.map(s => (
            <Link key={s.id} href={getSectionPath(s)} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              {s.name}
            </Link>
          ))}
          {headerLinks.map(link => (
            <SmartLink key={`${link.href}-${link.label}`} href={link.href} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              {link.label}
            </SmartLink>
          ))}
          
          {(settings.features?.userProfiles || settings.features?.userSubmissions) && (
            <div className="flex items-center ml-2 border-l border-surface-200 dark:border-surface-700 pl-4 gap-2">
              {user ? (
                <>
                  <Link href="/profile" className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={handleLogout} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button onClick={handleLogin} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                  Sign In
                </button>
              )}
            </div>
          )}

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-surface-600" />}
          </button>
        </nav>

        {/* Mobile buttons */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-surface-600" />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div ref={mobileSearchRef} className="md:hidden px-4 pb-3 fade-in relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowLiveResults(true);
                }}
                onFocus={() => setShowLiveResults(true)}
                placeholder="Search prompts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 outline-none text-sm"
                autoFocus
              />
            </div>
          </form>
          {renderLiveResults()}
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 slide-in">
          <div className="px-4 py-3 space-y-1">
            {settings.features?.userSubmissions && (
              <Link href="/submit" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800">
                <Plus className="w-4 h-4 text-primary-500" />
                Submit Prompt
              </Link>
            )}
            <Link href="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800">
              Home
            </Link>
            <Link href="/explore" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800">
              Explore
            </Link>
            {headerSections.map(s => (
              <Link key={s.id} href={getSectionPath(s)} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800">
                {s.name}
              </Link>
            ))}
            {headerLinks.map(link => (
              <SmartLink key={`${link.href}-${link.label}`} href={link.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800">
                {link.label}
              </SmartLink>
            ))}
            {(settings.features?.userProfiles || settings.features?.userSubmissions) && (
              <div className="pt-2 mt-2 border-t border-surface-100 dark:border-surface-800">
                {user ? (
                   <>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800">
                      <UserIcon className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      Sign Out
                    </button>
                   </>
                ) : (
                  <button onClick={() => { handleLogin(); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
    </>
  );
}
