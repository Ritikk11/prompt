export const revalidate = 3600;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeoPageBySlug, fetchPostSummaries, isPublicPost, fetchSettings } from '@/lib/data';
import type { Post } from '@/lib/types';
import SeoPageContent from '@/components/SeoPageContent';
import { generateSeoPageMetadata, formatTitleWithBrand } from '@/lib/seo-helpers';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seoPage = await getSeoPageBySlug(slug);

  const settings = await fetchSettings();
  const siteTitle = settings.siteTitle || 'AI PromptMatrix';

  if (!seoPage) {
    return {
      title: formatTitleWithBrand('Page Not Found', siteTitle),
      description: 'The requested page could not be found.',
    };
  }

  return generateSeoPageMetadata(seoPage, settings);
}

export default async function SeoPublicPage({ params }: Props) {
  const { slug } = await params;
  
  const [seoPage, allPosts, settings] = await Promise.all([
    getSeoPageBySlug(slug),
    fetchPostSummaries(),
    fetchSettings(),
  ]);

  if (!seoPage) {
    notFound();
  }

  return <SeoPageContent seoPage={seoPage} allPosts={allPosts as Post[]} settings={settings} />;
}

// Empty array is required for ISR to actually cache this route per-slug — without it,
// `revalidate` above is silently ignored and every request falls back to full SSR.
export function generateStaticParams() {
  return [];
}
