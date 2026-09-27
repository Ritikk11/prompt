// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 43200;

import { Metadata } from 'next';
import { getSectionBySlug, fetchSections, fetchPostSummaries, fetchSettings } from '@/lib/data';
import type { Post, Section } from '@/lib/types';
import { notFound } from 'next/navigation';
import { filterPostsForSection } from '@/lib/sections';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import { formatTitleWithBrand, generateCollectionJsonLd } from '@/lib/seo-helpers';
import { stringifyJsonLd } from '@/lib/json-ld';
import SectionContent from './SectionContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [section, allPosts, settings] = await Promise.all([
    getSectionBySlug(slug),
    fetchPostSummaries() as Promise<Post[]>,
    fetchSettings(),
  ]);

  const siteTitle = settings.siteTitle || 'PromptSoul';

  if (!section) {
    return {
      title: formatTitleWithBrand('Section Not Found', siteTitle),
    };
  }
  const filteredPosts = filterPostsForSection(section, allPosts, settings, false);
  const discovery = settings.discoveryPages || {};
  const rawTitle = section.seoTitle || section.heroTitle || fillDiscoveryTemplate(
    discovery.sectionSeoTitleTemplate || '%section% Prompts',
    { section: section.name, count: filteredPosts.length, site_title: siteTitle }
  );
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const description = section.seoDescription || section.heroDescription || fillDiscoveryTemplate(
    discovery.sectionSeoDescriptionTemplate || discovery.sectionDescriptionTemplate || 'Explore prompts from the %section% collection.',
    { section: section.name, count: filteredPosts.length, site_title: siteTitle }
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${siteUrl}/section/${encodeURIComponent(slug)}` },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'website',
      url: `${siteUrl}/section/${encodeURIComponent(slug)}`,
      ...(settings.seoSettings?.defaultOgImage ? { images: [{ url: settings.seoSettings.defaultOgImage }] } : {}),
    },
  };
}

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const [section, allPosts, settings] = await Promise.all([
    getSectionBySlug(slug) as Promise<Section | null>,
    fetchPostSummaries() as Promise<Post[]>,
    fetchSettings(),
  ]);

  if (!section) {
    notFound();
  }

  const filteredPosts = filterPostsForSection(section, allPosts, settings, false);
  const discovery = settings.discoveryPages || {};
  const heroTitle = section.heroTitle || section.name;
  const heroDescription = section.heroDescription || fillDiscoveryTemplate(
    discovery.sectionDescriptionTemplate || 'Discover a curated collection of %count% prompts.',
    { count: filteredPosts.length, section: section.name }
  );
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';

  const jsonLd = generateCollectionJsonLd({
    title: section.seoTitle || heroTitle,
    description: section.seoDescription || heroDescription,
    url: `${siteUrl}/section/${encodeURIComponent(slug)}`,
    posts: filteredPosts,
    siteTitle,
    siteUrl,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <SectionContent
        section={section}
        posts={filteredPosts}
        heroTitle={heroTitle}
        heroDescription={heroDescription}
        settings={settings}
      />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const sections = await fetchSections();
    return (sections || [])
      .filter(s => s.visible !== false)
      .map(s => ({ slug: s.slug || s.id }))
      .filter(s => Boolean(s.slug));
  } catch (error) {
    console.error('generateStaticParams error in section:', error);
    return [];
  }
}
