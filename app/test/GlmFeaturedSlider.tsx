'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getAllTools, getToolInfo } from '@/lib/constants';
import ToolBadge from '@/components/ToolBadge';
import { isNearbySlide, promptImageUrl, useFeaturedSlider } from '@/components/hero/sliderShared';
import { glassCard } from './GlmSection';

/*
 * Glassmorphic featured carousel for the /test redesign — the HeroV3
 * "diagonal cards" layout restyled in glass, reusing the main-site slider
 * brain (useFeaturedSlider timing, promptImageUrl sizing) so autoplay and
 * swipe behavior stay identical.
 *
 * Sits BELOW the search hero on /test, so it is never the LCP element:
 * every slide image (including the first) loads lazily, and only nearby
 * slides are rendered (isNearbySlide). The one big glass panel carries the
 * expensive backdrop blur — a single below-fold surface, not a grid of them.
 */

export default function GlmFeaturedSlider({
  featuredPosts: featured,
  settings,
}: {
  featuredPosts: Post[];
  settings?: SiteSettings;
}) {
  const { current, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured || [], settings?.heroAutoPlay ?? true);

  if (!featured || featured.length === 0) return null;

  const post: Post = featured[current];
  // Stable frosted backdrop: pinned to the first featured image instead of the
  // current slide. A per-slide backdrop made the entire glass panel's background
  // color snap to each new poster on every advance — a large, visible "bg shift"
  // (measured ~40 RGB channels). The glow is blurred beyond recognition, so a
  // constant source keeps the frosted-glass look with zero per-slide re-tinting.
  const backdropUrl = promptImageUrl(featured[0]);

  return (
    <section className="mx-auto w-full max-w-7xl px-1 py-8">
      <div
        className={`relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-3xl px-4 pb-12 pt-6 md:px-10 md:py-12 ${glassCard}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Frosted glow bleeding through the glass (small src — it is blurred
            anyway, so a 20vw asset is plenty). Pinned to a single image so the
            panel background does not re-tint on every slide change. */}
        <div className="absolute inset-0 z-0">
          {/* Eager (not lazy): this sits just below the fold, and lazy-loading
              it made the whole glass panel visibly darken/pop the moment the
              user scrolled the slider into view. It is a small 20vw asset. */}
          <Image
            src={backdropUrl}
            alt=""
            fill
            sizes="20vw"
            loading="eager"
            referrerPolicy="no-referrer"
            className="scale-125 object-cover opacity-30 blur-2xl dark:opacity-25"
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-2 md:flex-row md:gap-16 lg:gap-20">
          {/* Text content */}
          <div className="order-2 flex w-full flex-col text-center md:order-1 md:w-1/2 md:text-left">
            <div className="relative min-h-[200px] md:min-h-[290px]">
              {featured.map((p, i) => {
                const slideTools = getAllTools(p);
                return (
                  <div
                    key={p.id}
                    /* Asymmetric transition — backdrop-filter (the ToolBadge
                       frost) is not computed while an ancestor's opacity is
                       animating, so the ENTRANCE must not fade: the active
                       state transitions transform only (opacity snaps on,
                       the translateY glide carries the motion). The EXIT may
                       fade, since the outgoing slide is disappearing. */
                    className={`absolute inset-0 flex flex-col justify-center ease-out ${
                      i === current
                        ? 'translate-y-0 opacity-100 transition-[transform] duration-500'
                        : 'pointer-events-none translate-y-3 opacity-0 transition-[transform,opacity] duration-500'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap justify-center gap-2 md:mb-4 md:justify-start">
                      {slideTools.map(tool => (
                        <ToolBadge key={tool} toolName={tool} toolInfo={getToolInfo(tool, settings?.toolDetails)} size="md" />
                      ))}
                    </div>
                    <h2 className="mb-2 text-xl font-black leading-[1.1] text-surface-900 dark:text-white md:mb-6 md:text-5xl">
                      {p.title}
                    </h2>
                    <p className="line-clamp-2 text-xs font-medium text-surface-700 dark:text-surface-300 md:line-clamp-3 md:text-lg">
                      {p.description}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex w-full flex-row items-center justify-center gap-2 md:justify-start md:gap-4">
              <Link
                href={`/${post.slug || post.id}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-surface-900/85 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 dark:bg-white/85 dark:text-surface-900 md:flex-none md:rounded-2xl md:px-8 md:py-4 md:text-base"
              >
                Get Prompt <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
              <div className="flex shrink-0 gap-1.5 md:gap-2">
                <button
                  onClick={() => goTo(current - 1)}
                  aria-label="Previous featured prompt"
                  className="rounded-xl border border-white/50 bg-white/40 p-2.5 text-surface-900 shadow-lg backdrop-blur-xl transition-all hover:bg-white/70 active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:p-4"
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={() => goTo(current + 1)}
                  aria-label="Next featured prompt"
                  className="rounded-xl border border-white/50 bg-white/40 p-2.5 text-surface-900 shadow-lg backdrop-blur-xl transition-all hover:bg-white/70 active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:p-4"
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Diagonal card stack */}
          <div className="perspective-1000 order-1 relative h-[300px] w-full md:order-2 md:h-[400px] md:w-1/2">
            {featured.map((p, i) => {
              if (!isNearbySlide(i, current, featured.length)) return null;
              const offset = i - current;
              const relativeIdx = offset === 0 ? 0 : (offset === 1 || (i === 0 && current === featured.length - 1)) ? 1 : -1;

              return (
                <div
                  key={p.id}
                  className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-white/50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] dark:border-white/10"
                  style={{
                    transform: `translateX(${relativeIdx * 25}px) translateZ(${relativeIdx === 0 ? 0 : -100}px) rotateY(${relativeIdx * -15}deg) scale(${relativeIdx === 0 ? 1 : 0.85})`,
                    opacity: relativeIdx === 0 ? 1 : 0.6,
                    zIndex: relativeIdx === 0 ? 30 : 20,
                  }}
                >
                  <Image
                    src={promptImageUrl(p)}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="object-contain transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dot pagination + counter */}
        {featured.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:bottom-4">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Show featured prompt ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 bg-surface-900 dark:bg-white'
                    : 'w-1.5 bg-surface-400/60 hover:bg-surface-500 dark:bg-surface-600 dark:hover:bg-surface-500'
                }`}
              />
            ))}
            <span className="ml-1 text-[11px] font-semibold tabular-nums text-surface-500 dark:text-surface-400">
              {current + 1}/{featured.length}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
