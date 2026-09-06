'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post, Section, SiteSettings } from '@/lib/types';
import { getSectionPath } from '@/lib/sections';
import PostCard from '@/components/PostCard';
import GlmReveal from './GlmReveal';
import GlmMasonry from './GlmMasonry';

/*
 * Adaptation of the main-site HomeSection for the /test redesign.
 *
 * Cards are the main-site PostCard, untouched (admin cardStyle and the
 * per-section cardStyleOverride apply exactly like production). The GLM
 * adaptation is only the thumbnail frame on each card — a glass rim with a
 * transparent card body — applied via scoped CSS in TestClient through the
 * .glm-post-card wrapper class (see the "PostCard glass-frame adaptation"
 * styles there). No big section panel behind the cards.
 *
 * Content rules match main: `latest` is a capped masonry teaser with an
 * /explore CTA, every other section is a horizontal scroll row, and
 * filterTags sections fall back to a masonry grid for now (the interactive
 * chip rail is a follow-up). No AdSlot — the sandbox is ad-free.
 */

type GlmPromptSectionProps = {
  section: Section;
  posts: Post[];
  settings?: SiteSettings;
};

export default function GlmPromptSection({ section, posts, settings }: GlmPromptSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLatest = section.type === 'latest';
  const displayLimit = section.limit || 12;
  const visiblePosts = isLatest ? posts.slice(0, displayLimit) : posts;
  const hasFilterTags = (section.filterTags || []).length > 0;

  // Don't render empty sections (matches main)
  if (!posts || posts.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const sectionPath = getSectionPath(section);

  return (
    <section id={`section-${section.id}`} className="mx-auto w-full max-w-7xl px-1 pb-10 pt-6">
      {/* Header */}
      <GlmReveal slide>
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={sectionPath} className="group flex min-w-0 items-center gap-3">
            <span className="h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-primary-400 via-primary-500 to-primary-700" />
            <h2 className="truncate text-xl font-black tracking-tight text-surface-950 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300 sm:text-2xl">
              {section.name}
            </h2>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-semibold text-surface-500 dark:text-surface-400 sm:inline">
              {posts.length} prompts
            </span>
            {!isLatest && (
              <Link
                href={sectionPath}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-bold text-surface-700 shadow-sm transition hover:border-primary-400/60 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.12] dark:text-surface-200 dark:hover:text-primary-300"
              >
                View All
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </GlmReveal>

      {hasFilterTags ? (
        /* filterTags section — masonry grid for now; the interactive chip
           rail from main is a follow-up. plain: the post-card mats are glass,
           so nothing inside may fade. */
        <GlmReveal plain>
          <GlmMasonry
            posts={visiblePosts.slice(0, displayLimit)}
            settings={settings}
            cardStyleOverride={section.cardStyle}
          />
        </GlmReveal>
      ) : isLatest ? (
        /* Latest — one masonry batch, then a CTA to /explore */
        <>
          <GlmReveal plain>
            <GlmMasonry posts={visiblePosts} settings={settings} cardStyleOverride={section.cardStyle} />
          </GlmReveal>
          <GlmReveal className="mt-8 flex justify-center">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/40 px-7 py-3 text-sm font-bold text-surface-800 shadow-lg backdrop-blur-md transition hover:scale-[1.03] hover:border-primary-400/60 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:text-primary-300"
            >
              Explore All Prompts
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </GlmReveal>
        </>
      ) : (
        /* Other sections — horizontal scroll row with glass arrows */
        <div className="group/section relative">
          <button
            onClick={() => scroll('left')}
            aria-label={`Scroll ${section.name} left`}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/40 text-surface-800 shadow-lg backdrop-blur-md transition hover:bg-white/80 dark:border-white/10 dark:bg-surface-900/60 dark:text-white lg:opacity-0 lg:group-hover/section:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Fade-only stagger: a translateY variant would momentarily
              overflow this overflow-x-auto row vertically and flash a
              scrollbar. */}
          <GlmReveal
            ref={scrollRef}
            staggerFade
            className="flex gap-2 overflow-x-auto scroll-smooth pb-2 scrollbar-thin sm:gap-3"
          >
            {visiblePosts.map((post, i) => (
              <div key={post.id} className="glm-post-card w-56 flex-none sm:w-72 md:w-80 lg:w-96">
                <PostCard post={post} index={i} aspect="aspect-[3/4]" cardStyleOverride={section.cardStyle} />
              </div>
            ))}
          </GlmReveal>

          <button
            onClick={() => scroll('right')}
            aria-label={`Scroll ${section.name} right`}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 translate-x-2 items-center justify-center rounded-full border border-white/60 bg-white/40 text-surface-800 shadow-lg backdrop-blur-md transition hover:bg-white/80 dark:border-white/10 dark:bg-surface-900/60 dark:text-white lg:opacity-0 lg:group-hover/section:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
