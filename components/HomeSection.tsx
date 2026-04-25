'use client';
import { useState, useRef } from 'react';
import { useData } from '@/components/context/DataContext';
import PostCard from './PostCard';
import type { Section } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

export default function HomeSection({ section }: { section: Section }) {
  const { posts, getFilteredPosts } = useData();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLatest = section.type === 'latest';

  // For latest: show ALL posts sorted by date with load more
  const allLatestPosts = isLatest
    ? [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  // For other sections: use filtered posts with limit
  const sectionPosts = !isLatest ? getFilteredPosts(section) : [];

  // Load more state for latest
  const [showCount, setShowCount] = useState(8);
  const BATCH = 8;

  const visibleLatest = allLatestPosts.slice(0, showCount);
  const hasMore = allLatestPosts.length > showCount;

  // Don't render empty sections
  if (!isLatest && sectionPosts.length === 0) return null;
  if (isLatest && allLatestPosts.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold">{section.name}</h2>
        <span className="text-xs font-medium text-surface-400">
          {isLatest ? `${allLatestPosts.length} posts` : `${sectionPosts.length} posts`}
        </span>
      </div>

      {isLatest ? (
        /* Latest — Masonry grid with Load More */
        <div>
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 md:gap-4 px-0">
            {visibleLatest.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowCount(prev => prev + BATCH)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm font-semibold transition-all border border-surface-200 dark:border-surface-700 hover:shadow-md"
              >
                <ChevronDown className="w-4 h-4" />
                Load More ({allLatestPosts.length - showCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Other sections — Horizontal scroll */
        <div className="relative group/section">
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full bg-surface-800/80 dark:bg-surface-200/80 text-white dark:text-surface-900 flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {sectionPosts.map((post, i) => (
              <div key={post.id} className="flex-none w-44 sm:w-48 md:w-52">
                <PostCard post={post} index={i} aspect="aspect-[3/4]" />
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full bg-surface-800/80 dark:bg-surface-200/80 text-white dark:text-surface-900 flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
