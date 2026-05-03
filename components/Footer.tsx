'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { Sparkles, Heart, ChevronUp } from 'lucide-react';
import { useData } from '@/components/context/DataContext';

export default function Footer() {
  const { settings } = useData();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 mt-16 relative">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              {settings.siteLogo ? (
                <Image src={settings.siteLogo} alt={settings.siteTitle} width={36} height={36} unoptimized className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-xl font-bold gradient-text">{settings.siteTitle}</span>
            </Link>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              {settings.siteDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-4 text-surface-900 dark:text-white">Legal</h3>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Cookies Policy</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-surface-900 dark:text-white">Platform</h3>
              <div className="space-y-2">
                <Link href="/explore" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Explore</Link>
                <Link href="/about" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">About Us</Link>
                <Link href="/contact" className="block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors">Contact</Link>
              </div>
            </div>
          </div>

          {/* AI Tools */}
          <div>
            <h3 className="font-semibold mb-4">AI Tools</h3>
            <div className="flex flex-wrap gap-2">
              {(settings.aiTools || []).slice(0, 10).map(tool => (
                <Link
                  key={tool}
                  href={`/search?q=${encodeURIComponent(tool)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  {tool}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-400">© {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.</p>
          <div className="flex items-center gap-1 text-sm text-surface-400">
            Made with <Heart className="w-3.5 h-3.5 text-red-400 mx-0.5 fill-red-400" /> for AI enthusiasts
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-all z-50 fade-in"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
}
