'use client';
import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getGridClasses } from '@/lib/utils';
import { Cpu } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import MasonryGrid from '@/components/MasonryGrid';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import { getAllTools, getToolInfo } from '@/lib/constants';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import ScrollReveal from '@/components/ScrollReveal';

const toolHeroCopy: Record<string, string> = {
  chatgpt: 'Image prompts built for strong composition, clear subject control, and reliable GPT Image results.',
  gemini: 'Reference-friendly prompt ideas for Gemini and Nano Banana workflows, from posters to cinematic edits.',
  grok: 'Bold visual prompts for Grok image generation, tuned for dramatic lighting, realistic scenes, and social-ready concepts.',
  qwen: 'Structured Qwen prompts for clean typography, poster layouts, product-style visuals, and polished design outputs.',
  'qwen image': 'Structured Qwen prompts for clean typography, poster layouts, product-style visuals, and polished design outputs.',
};

export default function ToolContent({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  const params = useParams();
  const rawTool = params.tool as string;
  const tool = decodeURIComponent(rawTool || '');
  const normalizedTool = tool.toLowerCase();
  const displayTool = useMemo(() => {
    const fromSettings = Object.keys(settings.toolDetails || {}).find(name => name.toLowerCase() === normalizedTool);
    if (fromSettings) return fromSettings;

    for (const post of posts) {
      const match = getAllTools(post).find(name => name.toLowerCase() === normalizedTool);
      if (match) return match;
    }

    return tool
      .split(/([\s-]+)/)
      .map(part => part.toLowerCase() === 'chatgpt' ? 'ChatGPT' : part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }, [normalizedTool, posts, settings.toolDetails, tool]);
  
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const showTrending = settings.features?.trendingAlgorithm;
  const toolInfo = getToolInfo(displayTool, settings.toolDetails);
  const discovery = settings.discoveryPages || {};
  const useCustomRail = Boolean(discovery.useCustomRailOnTools);
  const railItems = discovery.toolRailItems || [];
  const showCustomRail = useCustomRail && railItems.length > 0;
  // The rail owns sort when it is shown (the standalone toolbar is hidden then).
  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    ...(showTrending ? [{ label: 'Trending', value: 'trending' }] : []),
  ];

  // Filter public posts that include the aiTool (case insensitive)
  const publicPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  let filtered = publicPosts.filter(p => getAllTools(p).some(item => item.toLowerCase() === normalizedTool));
  const toolDetails = settings.toolDetails?.[displayTool] || {};
  const heroCopy = fillDiscoveryTemplate(
    toolDetails.heroDescription || discovery.toolDescriptionTemplate || toolHeroCopy[normalizedTool] || `Browse %count% prompt collections organized for %tool%.`,
    { tool: displayTool, count: filtered.length, site_title: settings.siteTitle || 'AI PromptMatrix' }
  );
  const heroTitle = fillDiscoveryTemplate(
    toolDetails.heroTitle || discovery.toolTitleTemplate || '%tool% Prompts', 
    { tool: displayTool, count: filtered.length, site_title: settings.siteTitle || 'AI PromptMatrix' }
  );
  
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
    <div className="max-w-7xl mx-auto px-2 py-8 md:py-12 fade-in">
      {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-surface-500 mb-6">
          <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-surface-500 dark:text-surface-400">Tools</span>
          <span>/</span>
          <span className="text-surface-900 dark:text-surface-100 font-medium">{displayTool}</span>
        </div>

      <DiscoveryPageHero
        badge={displayTool}
        title={heroTitle}
        description={heroCopy}
        icon={toolInfo.logo ? { logo: toolInfo.logo, label: displayTool, logoScale: toolInfo.logoScale } : <Cpu className="h-4 w-4" />}
        stats={(discovery.showHeroStats ?? true) ? [{ label: 'Prompts', value: filtered.length }] : []}
        variant={discovery.heroStyle || 'container'}
      />

      {/* Filters */}
      {!showCustomRail && (
        <div className="mb-8 flex items-center gap-1.5 flex-wrap">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-surface-400 select-none">Sort:</span>
          <button
            type="button"
            onClick={() => setSortBy('latest')}
            className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
              sortBy === 'latest'
                ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
            }`}
          >
            Latest
          </button>
          <button
            type="button"
            onClick={() => setSortBy('popular')}
            className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
              sortBy === 'popular'
                ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
            }`}
          >
            Popular
          </button>
          {showTrending && (
            <button
              type="button"
              onClick={() => setSortBy('trending')}
              className={`inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out transform-gpu active:scale-[0.98] active:opacity-85 ${
                sortBy === 'trending'
                  ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 shadow-sm'
                  : 'border-white/80 bg-white/60 text-surface-700 backdrop-blur-xl backdrop-saturate-150 hover:border-white/90 hover:bg-white/80 hover:text-surface-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-white/20 dark:hover:bg-white/[0.12] dark:hover:text-white'
              }`}
            >
              Trending
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {showCustomRail ? (
        <ScrollReveal>
          <FilterChipRail
            posts={filtered}
            items={railItems}
            tools={[]}
            tags={[]}
            settings={settings}
            sortValue={sortBy}
            sortOptions={sortOptions}
            onSortChange={value => setSortBy(value as typeof sortBy)}
            renderGrid
            sticky
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <MasonryGrid
            posts={filtered}
            settings={settings}
          />
        </ScrollReveal>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections exclusively for {displayTool} yet.</p>
        </div>
      )}
    </div>
  );
}
