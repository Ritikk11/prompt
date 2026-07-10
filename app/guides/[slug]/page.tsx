export const revalidate = 3600;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleForSettings, getArticles } from '@/lib/content';
import { fetchSettings } from '@/lib/data';
import ArticlePage from '@/components/ArticlePage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSettings();
  const article = getArticleForSettings(settings, 'guide', slug);
  if (!article) return { title: 'Guide Not Found | AI PromptMatrix' };
  return {
    title: `${article.title} | AI PromptMatrix`,
    description: article.description,
    keywords: article.tags,
    alternates: { canonical: `/guides/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.datePublished,
      url: `${siteUrl}/guides/${article.slug}`,
      ...(article.thumbnailUrl ? { images: [{ url: article.thumbnailUrl }] } : {}),
    },
  };
}

export default async function GuideArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await fetchSettings();
  const article = getArticleForSettings(settings, 'guide', slug);
  if (!article) notFound();
  return <ArticlePage article={article} siteUrl={siteUrl} settings={settings} />;
}

export function generateStaticParams() {
  return getArticles('guide').map(article => ({ slug: article.slug }));
}
