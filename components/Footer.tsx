'use client';
import { useState, useEffect } from 'react';
import Link from '@/components/PrefetchLink';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { ChevronUp } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import type { FooterLinkGroup } from '@/lib/types';
import { XLogo, InstagramLogo, YouTubeLogo, FacebookLogo, PinterestLogo } from '@/components/SocialLogos';
import { SiteTitle } from '@/components/Header';

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
  return <FooterContent />;
}

function FooterContent() {
  const { settings } = useData();
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  // The floating scroll-to-top button overlaps admin editors on small screens;
  // the admin has its own navigation, so skip it there.
  const isAdminRoute = pathname?.startsWith('/admin');
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
  const footerLinkClass = 'block w-fit text-sm text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-300 transition-colors';
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
    /* One static glass panel. Never opacity-animate or reveal-wrap it: a
       backdrop-filter surface does not compute its frost while faded.
       backdrop-blur-[14px] rather than -2xl: the 2xl utility is capped at 8px by
       the blur budget in globals.css, which would leave the footer visibly
       flatter than the header bar. */
    <footer className="relative z-10 mt-16 border-t border-white/80 bg-white/50 backdrop-blur-[14px] backdrop-saturate-150 transition-colors duration-300 dark:border-white/10 dark:bg-[#090b1c]/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand: logo, description, then social icons and AI tool chips (no headings) */}
          <div className="lg:col-span-4">
            <Link href="/" prefetch="intent" className="group flex items-center gap-2.5 mb-4 w-fit transition-transform duration-200 active:scale-[0.98]">
              <span className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-105">
                <Image src={settings.siteLogo || '/icon-190x190.webp'} alt={settings.siteTitle || 'Site Logo'} fill sizes="36px" className="object-cover" referrerPolicy="no-referrer" />
              </span>
              <SiteTitle title={settings.siteTitle} className="text-xl sm:text-2xl" />
            </Link>
            <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
              {settings.footerDescription || settings.siteDescription || 'Curated prompts, prompt-writing guides, and model notes for AI image generation.'}
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
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/60 text-surface-600 shadow-sm transition-all duration-200 ease-out hover:scale-110 hover:border-primary-500 hover:bg-primary-500 hover:text-white hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-surface-300 dark:hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:text-white"
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
                  href={`/tool/${encodeURIComponent(tool.toLowerCase())}`}
                  prefetch="intent"
                  className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-xs font-medium text-surface-700 shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/80 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/[0.08] dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/[0.14] dark:hover:text-white"
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
                      <Link key={`${group.title}-${link.href}-${link.label}`} href={link.href || '/'} prefetch="intent" className={footerLinkClass}>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/80 pt-6 dark:border-white/10 sm:flex-row">
          <p className="text-sm text-surface-600 dark:text-surface-300">&copy; {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.</p>
        </div>
      </div>

      {showScrollTop && !isAdminRoute && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full p-1 shadow-xl transition-all fade-in"
          style={{
            background: `conic-gradient(#6366f1 ${scrollProgress * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
          }}
          aria-label="Scroll to top"
        >
          <span className="flex h-full w-full items-center justify-center rounded-full border border-white/60 bg-white/60 text-surface-700 backdrop-blur-md transition-colors hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.10] dark:text-white dark:hover:text-primary-300">
            <ChevronUp className="w-5 h-5" />
          </span>
        </button>
      )}
    </footer>
  );
}
