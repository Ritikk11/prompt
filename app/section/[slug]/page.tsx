// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 3600;

import { Metadata } from 'next';
import { getSectionBySlug, fetchPostSummaries, fetchSettings } from '@/lib/data';
import type { Post, Section } from '@/lib/types';
import { notFound } from 'next/navigation';
import { filterPostsForSection } from '@/lib/sections';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import { formatTitleWithBrand } from '@/lib/seo-helpers';
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

  const siteTitle = settings.siteTitle || 'AI PromptMatrix';

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

  return {
    title: { absolute: title },
    description,
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
  // Hero fields are independent of SEO fields (Explore-page pattern):
  // heroTitle/heroDescription drive the visible hero, seoTitle/seoDescription
  // drive metadata (see generateMetadata above).
  const heroTitle = section.heroTitle || section.name;
  const heroDescription = section.heroDescription || fillDiscoveryTemplate(
    discovery.sectionDescriptionTemplate || 'Discover a curated collection of %count% prompts.',
    { count: filteredPosts.length, section: section.name }
  );

  return (
    <SectionContent
      section={section}
      posts={filteredPosts}
      heroTitle={heroTitle}
      heroDescription={heroDescription}
      settings={settings}
    />
  );
}

// Empty array is required for ISR to actually cache this route per-slug — without it,
// `revalidate` above is silently ignored and every request falls back to full SSR.
export function generateStaticParams() {
  return [];
}
