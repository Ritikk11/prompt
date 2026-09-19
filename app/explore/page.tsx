import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import ExploreClient from './ExploreClient';
import type { Metadata } from 'next';
import { stringifyJsonLd } from '@/lib/json-ld';
import { formatTitleWithBrand, generateCollectionJsonLd } from '@/lib/seo-helpers';

// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const discovery = settings.discoveryPages || {};
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const rawTitle = (discovery.exploreSeoTitle || discovery.exploreTitle || `Explore AI Image Prompts`);
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const description = (discovery.exploreSeoDescription || discovery.exploreDescription || settings.seoSettings?.defaultMetaDescription || settings.siteDescription || '')
    .replace(/%site_title%/g, siteTitle);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';

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

import { Suspense } from 'react';

export default async function ExplorePage() {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const discovery = settings.discoveryPages || {};
  const pageTitle = (discovery.exploreSeoTitle || discovery.exploreTitle || `Explore AI Image Prompts`);
  const description = (discovery.exploreSeoDescription || discovery.exploreDescription || `Browse thousands of tested AI prompts with images.`);

  const jsonLd = generateCollectionJsonLd({
    title: pageTitle,
    description,
    url: `${siteUrl}/explore`,
    posts,
    siteTitle,
    siteUrl,
  });
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen" />}>
        <ExploreClient
          posts={posts}
          settings={settings}
        />
      </Suspense>
    </>
  );
}

