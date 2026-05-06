'use client';
import React, { useState, useRef } from 'react';
import { useData } from '@/components/context/DataContext';
import dynamic from 'next/dynamic';
import SkeletonPostCard from './SkeletonPostCard';
import type { Section } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getGridClasses } from '@/lib/utils';

const PostCard = dynamic(() => import('./PostCard'), {
  loading: () => <SkeletonPostCard />
});

const AdSlot = dynamic(() => import('@/components/AdSlot'), {
  ssr: false
});

export default function HomeSection({ section }: { section: Section }) {
  const { posts, getFilteredPosts, loading, settings } = useData();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLatest = section.type === 'latest';

  // For latest: show ALL posts sorted by date with load more
  const allLatestPosts = isLatest
    ? [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  // For other sections: use filtered posts with limit
  const allSectionPosts = !isLatest ? getFilteredPosts(section) : [];
  const sectionPosts = allSectionPosts.slice(0, section.limit || 12);

  // Load more state for latest
  const [showCount, setShowCount] = useState(section.limit || 12);
  const BATCH = section.limit || 12;

  const visibleLatest = allLatestPosts.slice(0, showCount);
  const hasMore = allLatestPosts.length > showCount;

  // Don't render empty sections
  if (!loading && !isLatest && sectionPosts.length === 0) return null;
  if (!loading && isLatest && allLatestPosts.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section id={`section-${section.id}`} className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link href={`/section/${section.slug || section.id}`} className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {section.name}
          </h2>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-surface-400 hidden sm:inline-block">
            {isLatest ? `${allLatestPosts.length} posts` : `${allSectionPosts.length} posts`}
          </span>
          {!isLatest && (
            <Link 
              href={`/section/${section.slug || section.id}`} 
              className="group flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-full"
            >
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {isLatest ? (
        /* Latest — Masonry grid with Load More */
        <div>
          {loading ? (
             <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
               {Array.from({ length: BATCH }).map((_, i) => (
                 <div key={i} className="mb-1 inline-block w-full break-inside-avoid">
                   <SkeletonPostCard />
                 </div>
               ))}
             </div>
          ) : (
            <>
              <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                {visibleLatest.map((post, i) => (
                  <React.Fragment key={post.id}>
                    <div className="mb-1 inline-block w-full break-inside-avoid">
                      <PostCard post={post} index={i} />
                    </div>
                    <AdSlot placement="inFeed" inFeedIndex={i} className="mb-1 inline-block w-full break-inside-avoid bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
                  </React.Fragment>
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
            </>
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
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-none w-56 sm:w-72 md:w-80 lg:w-96">
                  <SkeletonPostCard />
                </div>
              ))
            ) : (
              sectionPosts.map((post, i) => (
                <React.Fragment key={post.id}>
                  <div className="flex-none w-56 sm:w-72 md:w-80 lg:w-96">
                    <PostCard post={post} index={i} aspect="aspect-[3/4]" />
                  </div>
                  <AdSlot placement="inFeed" inFeedIndex={i} className="flex-none w-56 sm:w-72 md:w-80 lg:w-96 bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
                </React.Fragment>
              ))
            )}
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
