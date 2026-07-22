'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { Sparkles, ChevronUp } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import type { FooterLinkGroup } from '@/lib/types';
import { XLogo, InstagramLogo, YouTubeLogo, FacebookLogo, PinterestLogo } from '@/components/SocialLogos';

const fallbackFooterGroups: FooterLinkGroup[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Explore', href: '/explore' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'DMCA Notice', href: '/dmca' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
];

export default function Footer() {
  const { settings } = useData();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const footerGroups = settings.footerLinkGroups?.length ? settings.footerLinkGroups : fallbackFooterGroups;
  // Built-in content links (Blog / Guides) — shown automatically unless the
  // admin already added them to a custom footer group.
  const existingHrefs = new Set(
    footerGroups.flatMap(group => group.links.map(link => (link.href || '').replace(/\/+$/, '') || '/'))
  );
  const contentLinks = [
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
  ].filter(link => !existingHrefs.has(link.href));
  const displayGroups: FooterLinkGroup[] = contentLinks.length
    ? [...footerGroups, { title: 'Content', links: contentLinks }]
    : footerGroups;
  // Tools configured in settings always render a page (empty state when no
  // posts yet), so link them all.
  const footerTools = (settings.aiTools || []).slice(0, 10);
  // w-fit keeps the clickable area on the text only, not the whole column width.
  const footerLinkClass = 'block w-fit text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors';
  const social = settings.socialLinks || {};
  const socialItems = [
    { key: 'twitter', href: social.twitter, label: 'X (Twitter)', icon: <XLogo className="h-4 w-4" /> },
    { key: 'instagram', href: social.instagram, label: 'Instagram', icon: <InstagramLogo className="h-4 w-4" /> },
    { key: 'youtube', href: social.youtube, label: 'YouTube', icon: <YouTubeLogo className="h-4 w-4" /> },
    { key: 'facebook', href: social.facebook, label: 'Facebook', icon: <FacebookLogo className="h-4 w-4" /> },
    { key: 'pinterest', href: social.pinterest, label: 'Pinterest', icon: <PinterestLogo className="h-4 w-4" /> },
  ].filter(item => (item.href || '').trim());

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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand: logo, description, then social icons and AI tool chips (no headings) */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-9 h-9 shrink-0 relative">
                <Image src={settings.siteLogo || '/icon-256x256.png'} alt={settings.siteTitle} fill sizes="36px" className="object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="text-xl font-bold gradient-text">{settings.siteTitle}</span>
            </Link>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              {settings.siteDescription}
            </p>
            {socialItems.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {socialItems.map(item => (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-surface-500 hover:bg-primary-500 hover:text-white dark:bg-surface-800 dark:text-surface-300 press-anim"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {footerTools.map(tool => (
                <Link
                  key={tool}
                  href={`/tool/${encodeURIComponent(tool)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 press-anim"
                >
                  {tool}
                </Link>
              ))}
            </div>
          </div>

          {/* Link groups spread across the remaining width */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {displayGroups.slice(0, 6).map((group) => (
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
