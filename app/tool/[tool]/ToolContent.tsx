'use client';
import React, { useState } from 'react';
import { useData } from '@/components/context/DataContext';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

const PostCard = dynamic(() => import('@/components/PostCard'), {
  loading: () => <SkeletonPostCard />
});

const AdSlot = dynamic(() => import('@/components/AdSlot'), {
  ssr: false
});

export default function ToolContent() {
  const params = useParams();
  const rawTool = params.tool as string;
  const tool = decodeURIComponent(rawTool || '');
  
  const { posts, settings, loading } = useData();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  // Filter public posts that include the aiTool (case insensitive)
  const publicPosts = posts.filter(p => p.status === 'published' || !p.status);
  let filtered = publicPosts.filter(p => 
    p.images && p.images.some(img => img.aiTool?.toLowerCase() === tool.toLowerCase())
  );
  
  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'trending') {
    filtered.sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-6">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-primary-500 transition-colors">Explore</Link>
        <span>/</span>
        <span className="text-surface-900 dark:text-surface-100 font-medium capitalize">{tool}</span>
      </div>

      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 capitalize">
          {tool} <span className="text-surface-400 font-medium">Prompts</span>
        </h1>
        <p className="text-lg text-surface-600 dark:text-surface-400">
          Discover the top {filtered.length} curated prompts and templates specifically designed for {tool}. Unlock its full potential with proven patterns.
        </p>
      </div>

      {/* Filters */}
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
            {settings.features?.trendingAlgorithm && (
              <button
                onClick={() => setSortBy('trending')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'trending' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
              >
                Trending
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
        {filtered.map((post, i) => (
          <React.Fragment key={post.id}>
            <div className="mb-4 sm:mb-6 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
            <AdSlot placement="inFeed" inFeedIndex={i} className="mb-4 sm:mb-6 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
          </React.Fragment>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections exclusively for {tool} yet.</p>
        </div>
      )}
    </div>
  );
}
