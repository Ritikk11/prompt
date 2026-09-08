import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';
import type { Metadata } from 'next';


// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 43200;

import { formatTitleWithBrand } from '@/lib/seo-helpers';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const siteTitle = settings.siteTitle || 'AI PromptMatrix';
  const rawTitle = (discovery.exploreSeoTitle || discovery.exploreTitle || `Explore AI Image Prompts`);
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const description = (discovery.exploreSeoDescription || discovery.exploreDescription || settings.seoSettings?.defaultMetaDescription || settings.siteDescription || '')
    .replace(/%site_title%/g, siteTitle);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

  const ogImage = discovery.exploreOgImage || settings.seoSettings?.defaultOgImage;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${siteUrl}/explore` },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'website',
      url: `${siteUrl}/explore`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

interface Props {
  searchParams?: Promise<{ category?: string }>;
}

export default async function ExplorePage({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : {};
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return (
    <ExploreClient
      posts={posts}
      settings={settings}
      initialCategory={resolved.category ? decodeURIComponent(resolved.category) : undefined}
    />
  );
}
