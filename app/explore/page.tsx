'use client';
import { useState } from 'react';
import { useData } from '@/components/context/DataContext';
import PostCard from '@/components/PostCard';

export default function Explore() {
  const { posts } = useData();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [filterTool, setFilterTool] = useState('all');

  const tools = ['all', ...Array.from(new Set(posts.flatMap(p => p.images.map(i => i.aiTool))))];

  let filtered = [...posts];
  if (filterTool !== 'all') {
    filtered = filtered.filter(p => p.images.some(i => i.aiTool === filterTool));
  }
  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    filtered.sort((a, b) => b.views - a.views);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Explore All Prompts</h1>
      <p className="text-surface-500 dark:text-surface-400 mb-6">Discover {posts.length} curated prompt collections</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        {/* Sort */}
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

        {/* AI Tool filter */}
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

      {/* Masonry layout like Pinterest */}
      <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 md:gap-4 px-0">
        {filtered.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-surface-400">No prompts found</p>
          <p className="text-sm text-surface-400 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
