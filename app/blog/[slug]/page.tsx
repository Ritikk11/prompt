export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleForSettings, getArticles } from '@/lib/content';
import { fetchSettings } from '@/lib/data';
import ArticlePage from '@/components/ArticlePage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSettings();
  const article = getArticleForSettings(settings, 'blog', slug);
  if (!article) return { title: 'Article Not Found | AI PromptMatrix' };
  return {
    title: `${article.title} | AI PromptMatrix`,
    description: article.description,
    keywords: article.tags,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.datePublished,
      url: `${siteUrl}/blog/${article.slug}`,
      ...(article.thumbnailUrl ? { images: [{ url: article.thumbnailUrl }] } : {}),
    },
  };
}

export default async function BlogArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await fetchSettings();
  const article = getArticleForSettings(settings, 'blog', slug);
  if (!article) notFound();
  return <ArticlePage article={article} siteUrl={siteUrl} settings={settings} />;
}

export function generateStaticParams() {
  return getArticles('blog').map(article => ({ slug: article.slug }));
}
