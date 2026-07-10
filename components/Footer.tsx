'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { Sparkles, ChevronUp } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import type { FooterLinkGroup } from '@/lib/types';

const fallbackFooterGroups: FooterLinkGroup[] = [
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'DMCA Notice', href: '/dmca' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Explore', href: '/explore' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export default function Footer() {
  const { settings } = useData();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const footerGroups = settings.footerLinkGroups?.length ? settings.footerLinkGroups : fallbackFooterGroups;
  const footerLinkClass = 'block text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors';

  useEffect(() => {
    let frame: number | null = null;

    const updateScrollTop = () => {
      frame = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;

      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 400);
    };

    const handleScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(updateScrollTop);
    };

    updateScrollTop();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollTop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollTop);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
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
                <Image src={settings.siteLogo} alt={settings.siteTitle} width={36} height={36} className="w-9 h-9 rounded-xl object-cover"  referrerPolicy="no-referrer" />
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

          <div className="grid grid-cols-2 gap-4">
            {footerGroups.slice(0, 4).map((group) => (
              <div key={group.title}>
                <h3 className="font-semibold mb-4 text-surface-900 dark:text-white">{group.title}</h3>
                <div className="space-y-2">
                  {group.links.map((link) => {
                    const isExternal = /^https?:\/\//i.test(link.href);
                    return isExternal ? (
                      <a key={`${group.title}-${link.href}-${link.label}`} href={link.href} target="_blank" rel="noreferrer" className={footerLinkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <Link key={`${group.title}-${link.href}-${link.label}`} href={link.href || '/'} className={footerLinkClass}>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* AI Tools */}
          <div>
            <h3 className="font-semibold mb-4">AI Tools</h3>
            <div className="flex flex-wrap gap-2">
              {(settings.aiTools || []).slice(0, 10).map(tool => (
                <Link
                  key={tool}
                  href={`/tool/${encodeURIComponent(tool)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  {tool}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-600 dark:text-surface-300">&copy; {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.</p>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full p-1 shadow-xl transition-all hover:-translate-y-0.5 fade-in"
          style={{
            background: `conic-gradient(#6366f1 ${scrollProgress * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
          }}
          aria-label="Scroll to top"
        >
          <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-surface-700 shadow-sm transition-colors hover:text-primary-600 dark:bg-surface-900 dark:text-white dark:hover:text-primary-300">
            <ChevronUp className="w-5 h-5" />
          </span>
        </button>
      )}
    </footer>
  );
}
