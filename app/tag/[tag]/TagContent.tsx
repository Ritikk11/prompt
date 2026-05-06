'use client';
import React, { useState } from 'react';
import { useData } from '@/components/context/DataContext';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';

const PostCard = dynamic(() => import('@/components/PostCard'), {
  loading: () => <SkeletonPostCard />
});

const AdSlot = dynamic(() => import('@/components/AdSlot'), {
  ssr: false
});

export default function TagContent() {
  const params = useParams();
  const rawTag = params.tag as string;
  const tag = decodeURIComponent(rawTag || '');
  
  const { posts, settings, loading } = useData();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [filterTool, setFilterTool] = useState('all');

  // Filter public posts that include the tag (case insensitive)
  const publicPosts = posts.filter(p => p.status === 'published' || !p.status);
  let filtered = publicPosts.filter(p => 
    p.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  const tools = ['all', ...Array.from(new Set(filtered.flatMap(p => p.images.map(i => i.aiTool))))];

  if (filterTool !== 'all') {
    filtered = filtered.filter(p => p.images.some(i => i.aiTool === filterTool));
  }
  
  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'trending') {
    filtered.sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2));
  }

  return (
    <div className="max-w-7xl mx-auto px-1 py-6 sm:py-8 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-6">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-primary-500 transition-colors">Explore</Link>
        <span>/</span>
        <span className="text-surface-900 dark:text-surface-100 font-medium capitalize">Tag: {tag}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 capitalize">
          {tag} <span className="text-surface-400 font-medium">Prompts</span>
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          Showing {filtered.length} {filtered.length === 1 ? 'collection' : 'collections'} tagged with &quot;{tag}&quot;
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
          </div>
        </div>

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
      </div>

      {/* Grid */}
      <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
        {filtered.map((post, i) => (
          <React.Fragment key={post.id}>
            <div className="mb-1 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
            <AdSlot placement="inFeed" inFeedIndex={i} className="mb-1 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
          </React.Fragment>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">There are no collections with the tag &quot;{tag}&quot; yet.</p>
        </div>
      )}
    </div>
  );
}
