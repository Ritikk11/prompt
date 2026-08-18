'use client';
import React, { useRef } from 'react';
import type { Section, Post, SiteSettings } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getGridClasses } from '@/lib/utils';
import AdSlot from '@/components/AdSlot';
import { getSectionPath } from '@/lib/sections';
import FilterChipRail from '@/components/FilterChipRail';
import MasonryGrid from './MasonryGrid';

import PostCard from './PostCard';

export default function HomeSection({ section, initialPosts, settings }: { section: Section, initialPosts: Post[], settings: SiteSettings }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLatest = section.type === 'latest';

  // For latest: show ALL posts passed down
  const allLatestPosts = isLatest ? initialPosts : [];

  // For other sections: use passed posts
  const sectionPosts = !isLatest ? initialPosts : [];

  // Latest is a fixed-size teaser: one batch of cards, then a CTA to /explore
  // (it used to keep expanding in place via a Load More button).
  const displayLimit = section.limit || 12;
  const visibleLatest = allLatestPosts.slice(0, displayLimit);
  const sectionFilterTags = section.filterTags || [];

  // Don't render empty sections
  if (!isLatest && sectionPosts.length === 0) return null;
  if (isLatest && allLatestPosts.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section id={`section-${section.id}`} className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link href={getSectionPath(section)} className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {section.name}
          </h2>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-surface-400 hidden sm:inline-block">
            {isLatest ? `${allLatestPosts.length} posts` : `${sectionPosts.length} posts`}
          </span>
          {!isLatest && (
            <Link 
              href={getSectionPath(section)} 
              className="btn-glow group flex items-center gap-1 text-sm font-semibold text-surface-700 dark:text-surface-200 transition-colors border border-surface-300 dark:border-white/15 px-3 py-1.5 rounded-full"
            >
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {sectionFilterTags.length > 0 ? (
        <FilterChipRail
          posts={isLatest ? allLatestPosts : sectionPosts}
          tools={[]}
          tags={sectionFilterTags}
          showTools={false}
          settings={settings}
          cardStyleOverride={section.cardStyle}
          gridLimit={isLatest ? displayLimit : undefined}
          renderGrid
        />
      ) : isLatest ? (
        /* Latest — one batch of the masonry grid */
        <MasonryGrid
          posts={visibleLatest}
          settings={settings}
          cardStyleOverride={section.cardStyle}
        />
      ) : (
        /* Other sections — Horizontal scroll */
        <div className="relative group/section">
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full bg-surface-800/80 dark:bg-surface-200/80 text-white dark:text-surface-900 flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
            aria-label={`Scroll ${section.name} left`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {/* Scrollable row. Fade-only stagger: the translateY variant would
              momentarily overflow this overflow-x-auto row vertically and
              flash a scrollbar that shifts the cards. */}
          <div
            ref={scrollRef}
            data-reveal-stagger="fade"
            className="flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
              {sectionPosts.map((post, i) => (
                <React.Fragment key={post.id}>
                  <div className="flex-none w-56 sm:w-72 md:w-80 lg:w-96">
                    <PostCard post={post} index={i} aspect="aspect-[3/4]" cardStyleOverride={section.cardStyle} />
                  </div>
                  <AdSlot placement="inFeed" inFeedIndex={i} className="flex-none w-56 sm:w-72 md:w-80 lg:w-96 bg-surface-50 dark:bg-surface-800/30 rounded-[18px]" />
                </React.Fragment>
              ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full bg-surface-800/80 dark:bg-surface-200/80 text-white dark:text-surface-900 flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
            aria-label={`Scroll ${section.name} right`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Latest teaser CTA — the full, infinitely-scrollable feed lives on /explore */}
      {isLatest && (
        <div className="flex justify-center mt-8">
          <Link
            href="/explore"
            className="btn-glow group inline-flex items-center gap-2 rounded-full border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-800 transition-colors dark:border-white/15 dark:text-surface-200"
          >
            Explore All Prompts
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </section>
  );
}
