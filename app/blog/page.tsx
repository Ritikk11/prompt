export const revalidate = 43200;

import type { Metadata } from 'next';
import { getArticlesForSettings } from '@/lib/content';
import { fetchSettings } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'AI Prompting Blog | AI PromptMatrix',
  description: 'Practical articles on writing better AI image prompts — techniques, tool comparisons, trends, and how image generation actually works.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const settings = await fetchSettings();
  const posts = getArticlesForSettings(settings, 'blog');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Blog</p>
      <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-5xl">The AI Prompting Blog</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
        Techniques, comparisons, and plain-English explanations that make your AI images better — written for creators, not researchers.
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
