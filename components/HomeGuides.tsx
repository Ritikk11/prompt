import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { getArticlesForSettings, getFeaturedGuidesForSettings } from '@/lib/content';
import ArticleThumbnail from '@/components/ArticleThumbnail';
import ScrollReveal from '@/components/ScrollReveal';
import SectionHeader from '@/components/SectionHeader';

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

  if (guides.length === 0) return null;

  return (
    <section className="relative w-full overflow-clip px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal slide>
          <SectionHeader
            icon={<BookOpen className="h-4 w-4" />}
            badge={content.badge || 'Learn the craft'}
            title={content.title || 'Step-by-Step Prompt Guides'}
            accentWord="Prompt Guides"
            description={content.description || 'Hands-on tutorials that take you from a blank prompt box to a finished image — trends, edits, and pro techniques included.'}
          />
        </ScrollReveal>

        <ScrollReveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map(guide => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group glass-card overflow-hidden p-3 transition hover:scale-[1.02] hover:border-primary-400/60 hover:shadow-xl dark:hover:border-primary-400/50"
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
          ))}
        </ScrollReveal>

        <ScrollReveal slide delay={200} className="mt-8 text-center">
          <Link
            href={content.ctaHref || '/guides'}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/25 px-6 py-2.5 text-sm font-bold text-surface-800 shadow-sm backdrop-blur-md backdrop-saturate-150 transition hover:scale-105 hover:border-primary-400 hover:text-primary-600 active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-200 dark:hover:border-primary-400/60 dark:hover:text-white"
          >
            {content.ctaLabel || 'Browse all guides'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
