import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { getArticlesForSettings } from '@/lib/content';
import ArticleThumbnail from '@/components/ArticleThumbnail';
import { GlmSectionHeader, glassCard } from './GlmSection';
import GlmReveal from './GlmReveal';

export default function GlmBlog({ settings }: { settings?: SiteSettings }) {
  const content = settings?.homepageContent?.blog || {};
  const selectedSlugs = content.selectedBlogSlugs?.filter(Boolean) || [];
  const allPosts = getArticlesForSettings(settings, 'blog');
  const selectedPosts = selectedSlugs
    .map(slug => allPosts.find(article => article.slug === slug))
    .filter(Boolean) as typeof allPosts;
  const fallbackPosts = allPosts.filter(article => !selectedSlugs.includes(article.slug));
  const articles = [...selectedPosts, ...fallbackPosts].slice(0, 4);

  if (articles.length === 0) return null;

  return (
    <section className="relative w-full overflow-clip px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <GlmReveal slide>
          <GlmSectionHeader
            icon={<Newspaper className="h-4 w-4" />}
            badge={content.badge || 'From the blog'}
            title={content.title || 'Latest From Our Blog'}
            accentWord="Our Blog"
            description={content.description || 'News, prompt trends, and deep dives on getting more out of every AI image tool.'}
          />
        </GlmReveal>

        <GlmReveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map(article => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className={`group overflow-hidden ${glassCard} p-3 transition hover:scale-[1.02] hover:border-primary-400/60 hover:shadow-xl dark:hover:border-primary-400/50`}
            >
              <ArticleThumbnail article={article} compact />
              <div className="p-2 pt-4">
                <h3 className="text-base font-black leading-snug text-surface-950 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs leading-6 text-surface-600 dark:text-surface-400">{article.description}</p>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  {article.readMinutes} min read
                </p>
              </div>
            </Link>
          ))}
        </GlmReveal>

        <GlmReveal slide delay={200} className="mt-8 text-center">
          <Link
            href={content.ctaHref || '/blog'}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/40 px-6 py-2.5 text-sm font-bold text-surface-800 shadow-sm backdrop-blur-md transition hover:scale-105 hover:border-primary-400 hover:text-primary-600 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-surface-200 dark:hover:border-primary-400/60 dark:hover:text-white"
          >
            {content.ctaLabel || 'Read the blog'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </GlmReveal>
      </div>
    </section>
  );
}
