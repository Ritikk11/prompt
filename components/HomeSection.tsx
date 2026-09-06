'use client';
import React, { useRef } from 'react';
import type { Section, Post, SiteSettings } from '@/lib/types';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import { getSectionPath } from '@/lib/sections';
import FilterChipRail from '@/components/FilterChipRail';
import ScrollReveal from '@/components/ScrollReveal';
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
      <ScrollReveal slide>
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={getSectionPath(section)} className="group flex min-w-0 items-center gap-3">
            <span className="h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-primary-400 via-primary-500 to-primary-700" />
            <h2 className="truncate text-xl font-black tracking-tight text-surface-950 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300 md:text-2xl">
              {section.name}
            </h2>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-semibold text-surface-500 dark:text-surface-400 sm:inline">
              {isLatest ? `${allLatestPosts.length} posts` : `${sectionPosts.length} posts`}
            </span>
            {!isLatest && (
              <Link
                href={getSectionPath(section)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-bold text-surface-700 shadow-sm transition hover:border-primary-400/60 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.12] dark:text-surface-200 dark:hover:text-primary-300"
              >
                View All <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </ScrollReveal>

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
        /* Latest — one batch of the masonry grid. `plain`: the card mats are
           glass, and the default content fade would flash their frost. */
        <ScrollReveal plain>
          <MasonryGrid
            posts={visibleLatest}
            settings={settings}
            cardStyleOverride={section.cardStyle}
          />
        </ScrollReveal>
      ) : (
        /* Other sections — horizontal scroll with glass arrows */
        <div className="group/section relative">
          {/* Arrows — frosted glass pills, same position and reveal behavior on
              every device: half-offset outside the row edge, hidden until the
              section is hovered/focused. (Group-hover works from a touch tap
              too — the first tap reveals them, the second scrolls.) */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border border-white/60 bg-white/40 text-surface-900 shadow-lg backdrop-blur-md backdrop-saturate-[120%] transition-all hover:bg-white/60 active:scale-90 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.10] opacity-0 group-hover/section:opacity-100"
            aria-label={`Scroll ${section.name} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable row. Fade-only stagger: the translateY variant would
              momentarily overflow this overflow-x-auto row vertically and
              flash a scrollbar that shifts the cards. */}
          <ScrollReveal
            ref={scrollRef}
            staggerFade
            className="flex gap-2 overflow-x-auto scroll-smooth pb-2 scrollbar-thin sm:gap-3"
          >
            {sectionPosts.map((post, i) => (
              <React.Fragment key={post.id}>
                <div className="w-56 flex-none pr-1.5 sm:w-72 sm:pr-0 md:w-80 lg:w-96">
                  <PostCard post={post} index={i} aspect="aspect-[3/4]" cardStyleOverride={section.cardStyle} />
                </div>
                <AdSlot placement="inFeed" inFeedIndex={i} className="w-56 flex-none rounded-[18px] bg-black/[0.03] dark:bg-white/[0.04] sm:w-72 md:w-80 lg:w-96" />
              </React.Fragment>
            ))}
          </ScrollReveal>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/60 bg-white/40 text-surface-900 shadow-lg backdrop-blur-md backdrop-saturate-[120%] transition-all hover:bg-white/60 active:scale-90 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.10] opacity-0 group-hover/section:opacity-100"
            aria-label={`Scroll ${section.name} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Latest teaser CTA — the full, infinitely-scrollable feed lives on /explore */}
      {isLatest && (
        <ScrollReveal className="mt-8 flex justify-center">
          <Link
            href="/explore"
            className="group inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-7 py-3 text-sm font-bold text-surface-800 shadow-lg backdrop-blur-md transition hover:scale-[1.03] hover:border-primary-400/60 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:text-primary-300"
          >
            Explore All Prompts
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </ScrollReveal>
      )}
    </section>
  );
}
