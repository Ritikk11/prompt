import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { getArticlesForSettings } from '@/lib/content';
import ArticleThumbnail from '@/components/ArticleThumbnail';

export default function HomeBlog({ settings }: { settings?: SiteSettings }) {
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
    <section className="relative w-full overflow-hidden bg-white px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_22%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_18%_18%,rgba(139,92,246,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,250,252,0.98)_100%)] dark:bg-[radial-gradient(circle_at_80%_22%,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_18%_18%,rgba(139,92,246,0.2),transparent_34%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100/80 px-4 py-2 text-xs font-bold text-sky-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
            <Newspaper className="h-4 w-4" />
            {content.badge || 'From the blog'}
          </div>
          <h2 className="text-3xl font-black tracking-normal sm:text-4xl">{content.title || 'Latest From Our Blog'}</h2>
          <p className="mt-4 text-sm leading-7 text-surface-600 dark:text-surface-300">
            {content.description || 'News, prompt trends, and deep dives on getting more out of every AI image tool.'}
          </p>
        </div>
        <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map(article => {
            return (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group overflow-hidden rounded-3xl border border-surface-200 bg-white/85 p-3 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-primary-500/50"
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
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link
            href={content.ctaHref || '/blog'}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-6 text-sm font-bold text-white shadow-[0_16px_36px_rgba(56,189,248,0.28)] transition hover:-translate-y-0.5"
          >
            {content.ctaLabel || 'Read the blog'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
