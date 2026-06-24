'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getGridClasses } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import AdSlot from '@/components/AdSlot';
import { getAllTools, getToolInfo } from '@/lib/constants';

import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import DiscoveryPageHero from '@/components/DiscoveryPageHero';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';

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
  
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const showTrending = settings.features?.trendingAlgorithm;
  const toolInfo = getToolInfo(tool, settings.toolDetails);
  const discovery = settings.discoveryPages || {};
  const useCustomRail = Boolean(discovery.useCustomRailOnTools);
  const railItems = discovery.toolRailItems || [];
  const showCustomRail = useCustomRail && railItems.length > 0;

  // Filter public posts that include the aiTool (case insensitive)
  const publicPosts = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  let filtered = publicPosts.filter(p => getAllTools(p).some(item => item.toLowerCase() === tool.toLowerCase()));
  const heroCopy = fillDiscoveryTemplate(
    discovery.toolDescriptionTemplate || toolHeroCopy[tool.toLowerCase()] || `Browse %count% prompt collections organized for %tool%.`,
    { tool, count: filtered.length }
  );
  const heroTitle = fillDiscoveryTemplate(discovery.toolTitleTemplate || '%tool% Prompts', { tool, count: filtered.length });
  
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
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 fade-in">
      {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-surface-500 mb-6">
          <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-surface-500 dark:text-surface-400">Tools</span>
          <span>/</span>
          <span className="text-surface-900 dark:text-surface-100 font-medium capitalize">{tool}</span>
        </div>

      <DiscoveryPageHero
        badge={tool}
        title={heroTitle}
        description={heroCopy}
        icon={toolInfo.logo ? { logo: toolInfo.logo, label: tool, logoScale: toolInfo.logoScale } : <Sparkles className="h-4 w-4" />}
        stats={(discovery.showHeroStats ?? true) ? [{ label: 'Prompts', value: filtered.length }] : []}
      />

      {/* Filters */}
      {!showCustomRail && <div className="mb-8 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl overflow-hidden border border-surface-200 bg-surface-50 p-1 dark:border-surface-800 dark:bg-surface-900">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${sortBy === 'latest' ? 'bg-primary-500 text-white' : 'text-surface-600 hover:bg-white dark:text-surface-300 dark:hover:bg-surface-800'}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${sortBy === 'popular' ? 'bg-primary-500 text-white' : 'text-surface-600 hover:bg-white dark:text-surface-300 dark:hover:bg-surface-800'}`}
            >
              Popular
            </button>
            {showTrending && (
              <button
                onClick={() => setSortBy('trending')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${sortBy === 'trending' ? 'bg-primary-500 text-white' : 'text-surface-600 hover:bg-white dark:text-surface-300 dark:hover:bg-surface-800'}`}
              >
                Trending
              </button>
            )}
          </div>
        </div>
      </div>}

      {/* Grid */}
      {showCustomRail ? (
        <FilterChipRail
          posts={filtered}
          items={railItems}
          tools={[]}
          tags={[]}
          settings={settings}
          renderGrid
        />
      ) : <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
        {filtered.map((post, i) => (
          <React.Fragment key={post.id}>
            <div className="mb-4 sm:mb-6 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
            <AdSlot placement="inFeed" inFeedIndex={i} className="mb-4 sm:mb-6 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
          </React.Fragment>
        ))}
      </div>}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections exclusively for {tool} yet.</p>
        </div>
      )}
    </div>
  );
}
