'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getGridClasses } from '@/lib/utils';
import type { Post, Section, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ScrollReveal from '@/components/ScrollReveal';

interface Props {
  section: Section;
  posts: Post[];
  heroTitle: string;
  heroDescription: string;
  settings: SiteSettings;
}

export default function SectionContent({ section, posts, heroTitle, heroDescription, settings }: Props) {
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [filterTool, setFilterTool] = useState('all');
  const showAdvancedFilters = settings.features?.advancedFiltering;
  const showTrending = settings.features?.trendingAlgorithm;

  // Per-section rail: the toggle + chips saved on the section object itself.
  const useCustomRail = Boolean(section.useCustomRail);
  const railItems = section.railItems || [];
  const showCustomRail = useCustomRail && railItems.length > 0;
  // A section can also carry a lightweight tag rail (filterTags) without the
  // full custom-rail builder. That still counts as a rail, so the sort/filter
  // toolbar stays hidden for it — matching the "rail off = sort UI" contract.
  const showTagRail = !showCustomRail && Boolean(section.filterTags?.length);
  const showRail = showCustomRail || showTagRail;

  let filtered = [...posts];
  const tools = ['all', ...Array.from(new Set(filtered.flatMap(p => p.images.map(i => i.aiTool))))];

  if (!showRail && showAdvancedFilters && filterTool !== 'all') {
    filtered = filtered.filter(p => p.aiTools?.includes(filterTool) || p.images.some(i => i.aiTools ? i.aiTools.includes(filterTool) : i.aiTool === filterTool));
  }

  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (showTrending && sortBy === 'trending') {
    const viewsW = settings.features?.trendingViewsWeight ?? 1;
    const likesW = settings.features?.trendingLikesWeight ?? 2;
    filtered.sort((a, b) => (b.views * viewsW + b.likes * likesW) - (a.views * viewsW + a.likes * likesW));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-8 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-surface-900 dark:text-white">{section.name}</span>
      </nav>

      <DiscoveryPageHero
        badge="Section"
        title={heroTitle}
        description={heroDescription}
        stats={(settings.discoveryPages?.showHeroStats ?? true) ? [{ label: 'Prompts', value: filtered.length }] : []}
      />
      {section.introContent && (
        <div className="max-w-3xl mb-12">
          <MarkdownRenderer>{section.introContent}</MarkdownRenderer>
        </div>
      )}

      {/* Sort/filter toolbar — only when no rail is active. */}
      {!showRail && filtered.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Sort:</span>
            <div className="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'latest' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'popular' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
              >
                Popular
              </button>
              {showTrending && (
                <button
                  onClick={() => setSortBy('trending')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'trending' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
                >
                  Trending
                </button>
              )}
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Tool:</span>
              <select
                value={filterTool}
                onChange={e => setFilterTool(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
              >
                {tools.map(t => <option key={t} value={t}>{t === 'all' ? 'All Tools' : t}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-50 dark:bg-surface-900 rounded-[32px] border border-dashed border-surface-200 dark:border-surface-800">
          <p className="text-surface-500 font-medium">No prompts found in this section yet.</p>
          <Link href="/explore" className="mt-4 inline-block text-primary-500 font-bold hover:underline">
            Explore other prompts
          </Link>
        </div>
      ) : showCustomRail ? (
        <ScrollReveal>
          <FilterChipRail
            posts={filtered}
            items={railItems}
            tools={[]}
            tags={[]}
            settings={settings}
            cardStyleOverride={section.cardStyle}
            renderGrid
          />
        </ScrollReveal>
      ) : showTagRail ? (
        <ScrollReveal>
          <FilterChipRail
            posts={filtered}
            tools={[]}
            tags={section.filterTags || []}
            showTools={false}
            settings={settings}
            cardStyleOverride={section.cardStyle}
            renderGrid
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <div data-reveal-stagger className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
            {filtered.map((post, i) => (
              <React.Fragment key={post.id}>
                <div className="mb-1 inline-block w-full break-inside-avoid">
                  <PostCard post={post} index={i} cardStyleOverride={section.cardStyle} />
                </div>
                <AdSlot placement="inFeed" inFeedIndex={i} className="mb-1 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
              </React.Fragment>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
