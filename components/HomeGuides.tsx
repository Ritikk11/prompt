import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { getArticlesForSettings, getFeaturedGuidesForSettings } from '@/lib/content';
import ArticleThumbnail from '@/components/ArticleThumbnail';

export default function HomeGuides({ settings }: { settings?: SiteSettings }) {
  const content = settings?.homepageContent?.guides || {};
  const selectedSlugs = content.selectedGuideSlugs?.filter(Boolean) || [];
  const allGuides = getArticlesForSettings(settings, 'guide');
  const selectedGuides = selectedSlugs
    .map(slug => allGuides.find(guide => guide.slug === slug))
    .filter(Boolean) as typeof allGuides;
  const fallbackGuides = getFeaturedGuidesForSettings(settings, 4)
    .filter(guide => !selectedSlugs.includes(guide.slug));
  const guides = [...selectedGuides, ...fallbackGuides].slice(0, 4);

  return (
    <section className="relative w-full overflow-clip bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.23),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.1),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-100/80 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-violet-100">
            <BookOpen className="h-4 w-4" />
            {content.badge || 'Learn the craft'}
          </div>
          <h2 className="text-3xl font-black tracking-normal sm:text-4xl">{content.title || 'Step-by-Step Prompt Guides'}</h2>
          <p className="mt-4 text-sm leading-7 text-surface-600 dark:text-surface-300">
            {content.description || 'Hands-on tutorials that take you from a blank prompt box to a finished image — trends, edits, and pro techniques included.'}
          </p>
        </div>
        <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map(guide => {
            return (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group overflow-hidden rounded-3xl border border-surface-200 bg-white/85 p-3 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-primary-500/50"
              >
                <ArticleThumbnail article={guide} compact />
                <div className="p-2 pt-4">
                  <h3 className="text-base font-black leading-snug text-surface-950 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300">
                    {guide.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-6 text-surface-600 dark:text-surface-400">{guide.description}</p>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    {guide.readMinutes} min read
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link
            href={content.ctaHref || '/guides'}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-6 text-sm font-bold text-white shadow-[0_16px_36px_rgba(168,85,247,0.28)] transition hover:-translate-y-0.5"
          >
            {content.ctaLabel || 'Browse all guides'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
