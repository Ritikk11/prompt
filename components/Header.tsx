'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Search, Sun, Moon, Menu, X, Sparkles, Shield, User as UserIcon, LogOut, Plus } from 'lucide-react';
import { useTheme } from '@/components/context/ThemeContext';
import { useData } from '@/components/context/DataContext';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { settings, sections } = useData();
  const headerSections = sections.filter(s => s.location === 'header' && s.visible).sort((a,b) => a.order - b.order);
  const navigate = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 64 && !menuOpen && !searchOpen) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, menuOpen, searchOpen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
          {settings.siteLogo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.siteLogo} alt={settings.siteTitle} className="w-9 h-9 rounded-xl object-cover" />
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
                onChange={e => setQuery(e.target.value)}
                placeholder="Search prompts, categories, AI tools..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-surface-900 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm transition-all shadow-inner focus:shadow-sm"
              />
            </div>
          </form>
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
            <Link key={s.id} href={`/section/${s.slug || s.id}`} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              {s.name}
            </Link>
          ))}
          
          {(settings.features?.userProfiles || settings.features?.userSubmissions) && (
            <div className="flex items-center ml-2 border-l border-surface-200 dark:border-surface-700 pl-4 gap-2">
              {user ? (
                <>
                  <Link href="/profile" className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={() => signOut(auth)} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" title="Logout">
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
        <div className="md:hidden px-4 pb-3 fade-in">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-500 outline-none text-sm"
                autoFocus
              />
            </div>
          </form>
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
              <Link key={s.id} href={`/section/${s.slug || s.id}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800">
                {s.name}
              </Link>
            ))}
            {(settings.features?.userProfiles || settings.features?.userSubmissions) && (
              <div className="pt-2 mt-2 border-t border-surface-100 dark:border-surface-800">
                {user ? (
                   <>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-surface-100 dark:hover:bg-surface-800">
                      <UserIcon className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={() => { signOut(auth); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
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
  );
}
