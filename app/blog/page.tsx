export const revalidate = 2592000;

import type { Metadata } from 'next';
import { getArticlesForSettings } from '@/lib/content';
import { fetchSettings } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import ScrollReveal from '@/components/ScrollReveal';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const siteTitle = settings.siteTitle || 'PromptSoul';

  const rawTitle = (discovery.blogSeoTitle || 'AI Prompting Blog')
    .replace(/\s*(?:\||-|–|—)\s*(?:%site_title%|PromptSoul|AI PromptMatrix)$/i, '')
    .trim();
  const description = discovery.blogSeoDescription || 'Practical articles on writing better AI image prompts — techniques, tool comparisons, trends, and how image generation actually works.';
  const ogImage = discovery.blogOgImage || settings.seoSettings?.defaultOgImage;

  return {
    title: rawTitle,
    description,
    alternates: { canonical: '/blog' },
    openGraph: {
      title: `${rawTitle} | ${siteTitle}`,
      description,
      siteName: siteTitle,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in'}/blog`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function BlogPage() {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const posts = getArticlesForSettings(settings, 'blog');

  const badge = discovery.blogBadge || 'Blog';
  const heading = discovery.blogTitle || 'The AI Prompting Blog';
  const subtitle = discovery.blogDescription || 'Techniques, comparisons, and plain-English explanations that make your AI images better — written for creators, not researchers.';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">{badge}</p>
      <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">{heading}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
        {subtitle}
      </p>

      <ScrollReveal>
        <div data-reveal-stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <ArticleCard key={post.slug} article={post} />
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
