'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { matchesTag, matchesCategory, matchesTool } from '@/lib/sections';
import { isPublicPost } from '@/lib/data';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ScrollReveal from '@/components/ScrollReveal';
import FilterChipRail from '@/components/FilterChipRail';
import MasonryGrid from '@/components/MasonryGrid';
import PostCard from '@/components/PostCard';
import { stringifyJsonLd } from '@/lib/json-ld';

interface SeoPageContentProps {
  seoPage: any;
  allPosts: Post[];
  settings: SiteSettings;
}

export default function SeoPageContent({ seoPage, allPosts, settings }: SeoPageContentProps) {
  const { tags = [], categories = [], aiTools = [] } = seoPage;

  // Filter posts that match page matching rules
  const basePosts = useMemo(() => {
    return allPosts.filter(candidate => {
      if (!isPublicPost(candidate)) return false;

      if (tags.length > 0 && !tags.every((tag: string) => matchesTag(candidate, tag))) return false;
      if (categories.length > 0 && !categories.every((category: string) => matchesCategory(candidate, category))) return false;
      if (aiTools.length > 0 && !aiTools.every((tool: string) => matchesTool(candidate, tool))) return false;

      return true;
    });
  }, [allPosts, tags, categories, aiTools]);

  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const showTrending = settings.features?.trendingAlgorithm ?? true;

  const sortOptions = useMemo(() => [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    ...(showTrending ? [{ label: 'Trending', value: 'trending' }] : []),
  ], [showTrending]);

  // Deterministic sorting with "Latest" (newest createdAt first) as default
  const sortedPosts = useMemo(() => {
    const list = [...basePosts];
    if (sortBy === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'trending') {
      const viewsW = settings.features?.trendingViewsWeight ?? 1;
      const likesW = settings.features?.trendingLikesWeight ?? 2;
      list.sort((a, b) => ((b.views || 0) * viewsW + (b.likes || 0) * likesW) - ((a.views || 0) * viewsW + (a.likes || 0) * likesW));
    }
    return list;
  }, [basePosts, sortBy, settings]);

  const heroTitle = seoPage.heroTitle || seoPage.title;
  const heroDescription = seoPage.heroDescription || seoPage.seoDescription || `Discover a curated collection of AI prompts for ${seoPage.title}.`;
  const heroBadge = seoPage.heroBadge || 'Collection';

  // Site URL and clean slug for structured data
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in').replace(/\/$/, '');
  const cleanSlug = String(seoPage.slug || '').replace(/^\/+|\/+$/g, '');
  const pageUrl = `${siteUrl}/${cleanSlug}`;

  // JSON-LD structured data for Google Search (CollectionPage + BreadcrumbList + ItemList)
  const jsonLd = useMemo(() => {
    const pageTitle = seoPage.seoTitle || heroTitle;
    const primaryImg = sortedPosts[0]?.images?.[0]?.url || sortedPosts[0]?.thumbnailUrl;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: pageTitle,
          headline: pageTitle,
          description: seoPage.seoDescription || heroDescription,
          ...(primaryImg ? {
            primaryImageOfPage: {
              '@type': 'ImageObject',
              '@id': `${pageUrl}#primaryimage`,
              url: primaryImg,
              contentUrl: primaryImg,
            },
            image: primaryImg,
          } : {}),
          isPartOf: {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            name: settings.siteTitle || 'AI PromptMatrix',
            url: siteUrl,
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: siteUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: heroTitle,
              item: pageUrl,
            },
          ],
        },
        {
          '@type': 'ItemList',
          name: pageTitle,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          numberOfItems: sortedPosts.length,
          itemListElement: sortedPosts.slice(0, 30).map((post, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: post.title,
            url: `${siteUrl}/${post.slug || post.id}`,
            image: post.images?.[0]?.url || post.thumbnailUrl,
          })),
        },
      ],
    };
  }, [pageUrl, siteUrl, heroTitle, heroDescription, seoPage.seoTitle, seoPage.seoDescription, settings.siteTitle, sortedPosts]);

  const hasFilterTags = Boolean(seoPage.filterTags?.length);

  const heroVariant: 'container' | 'simple' = seoPage.heroStyle === 'simple' ? 'simple' : 'container';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-8 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-surface-900 dark:text-white truncate max-w-xs sm:max-w-md">{heroTitle}</span>
      </nav>

      {/* Discovery Page Hero with toggleable variant (container box vs simple centered) */}
      <DiscoveryPageHero
        badge={heroBadge}
        title={heroTitle}
        description={heroDescription}
        stats={[{ label: 'Prompts', value: sortedPosts.length }]}
        variant={heroVariant}
      />

      {/* Optional Markdown Intro Content */}
      {seoPage.introContent && (
        <div className="max-w-3xl mb-10 prose dark:prose-invert">
          <MarkdownRenderer>{seoPage.introContent}</MarkdownRenderer>
        </div>
      )}

      {/* Main Content Area */}
      {sortedPosts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-surface-200 dark:border-surface-800">
          <p className="text-surface-500">No prompts found matching this collection yet.</p>
        </div>
      ) : hasFilterTags ? (
        <ScrollReveal>
          <FilterChipRail
            posts={sortedPosts}
            tags={seoPage.filterTags}
            tools={[]}
            showTools={false}
            settings={settings}
            cardStyleOverride={seoPage.cardStyle}
            renderGrid
            sticky
            sortValue={sortBy}
            sortOptions={sortOptions}
            onSortChange={(val) => setSortBy(val as any)}
          />
        </ScrollReveal>
      ) : (
        <div>
          {/* Standalone Sort Toolbar when no filter rail is configured */}
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-surface-400 select-none">Sort:</span>
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value as any)}
                  className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                    sortBy === opt.value
                      ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                      : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Masonry Grid for aesthetic layout without gaps */}
          <ScrollReveal>
            <MasonryGrid
              posts={sortedPosts}
              settings={settings}
              cardStyleOverride={seoPage.cardStyle}
            />
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
