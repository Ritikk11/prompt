'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getAllTools, getToolInfo } from '@/lib/constants';
import ToolBadge from '@/components/ToolBadge';
import { isNearbySlide, promptImageUrl, useFeaturedSlider, type HeroProps } from '@/components/hero/sliderShared';

/**
 * Featured carousel: text column beside a diagonal card stack, inside one large
 * glass panel.
 *
 * Sits BELOW the landing hero, so it is never the LCP element: every slide image
 * loads lazily and only nearby slides render (isNearbySlide). The single glass
 * panel carries the expensive backdrop blur — one below-fold surface rather than
 * a grid of them.
 *
 * This replaced a picker over nine hero variants (settings.heroStyle, v1–v9),
 * each in its own dynamic chunk. One layout, no chunk indirection.
 */
export default function FeaturedSlider({ featuredPosts: rawFeatured, settings }: HeroProps) {
  const featured = (rawFeatured || []).slice(0, 6);
  const { current, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);

  if (!settings.heroEnabled) return null;
  if (!featured || featured.length === 0) return null;

  const post: Post = featured[current];
  // Stable frosted backdrop: pinned to the FIRST featured image, not the current
  // slide. A per-slide backdrop made the whole panel's background color snap to
  // each new poster on every advance — a large, visible shift (~40 RGB channels).
  // The glow is blurred beyond recognition, so a constant source keeps the look
  // with zero per-slide re-tinting.
  const backdropUrl = promptImageUrl(featured[0]);

  return (
    <div
      /* glass-surface + explicit radius/shadow: glass-card's rounded-2xl is
         unlayered and would win over rounded-3xl here. */
      className="glass-surface relative flex min-h-[500px] w-full items-center justify-center overflow-hidden rounded-3xl px-4 pb-12 pt-6 shadow-lg shadow-slate-900/5 [transition-property:border-color,box-shadow] md:px-10 md:py-12"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Frosted glow bleeding through the glass. Small src (20vw) — it is
          blurred anyway. Eager, NOT lazy: this sits just below the fold, and
          lazy-loading it made the whole panel visibly darken the moment the
          slider scrolled into view. */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backdropUrl}
          alt=""
          fill
          sizes="20vw"
          loading="eager"
          referrerPolicy="no-referrer"
          className="scale-125 object-cover opacity-30 blur-[16px] dark:opacity-25"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-2 md:flex-row md:gap-16 lg:gap-20">
        {/* Text column */}
        <div className="order-2 flex w-full flex-col text-center md:order-1 md:w-1/2 md:text-left">
          <div className="relative min-h-[200px] md:min-h-[290px]">
            {featured.map((p, i) => {
              const slideTools = getAllTools(p);
              return (
                <div
                  key={p.id}
                  /* Asymmetric transition — backdrop-filter (the ToolBadge
                     frost) is not computed while an ancestor's opacity is
                     animating, so the ENTRANCE must not fade: the active slide
                     switches in instantly, and only the EXITING slide fades. */
                  className={
                    i === current
                      ? 'relative z-10 opacity-100'
                      : 'pointer-events-none absolute inset-0 -translate-y-2 opacity-0 transition-all duration-500 ease-out'
                  }
                >
                  <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 md:mb-4 md:justify-start md:gap-2">
                    {slideTools.slice(0, 3).map(tool => (
                      <ToolBadge
                        key={tool}
                        toolName={tool}
                        toolInfo={getToolInfo(tool, settings.toolDetails)}
                        size="md"
                      />
                    ))}
                  </div>

                  <h2 className="line-clamp-2 text-lg font-black tracking-tight text-surface-950 dark:text-white md:text-3xl md:leading-tight lg:text-4xl">
                    {p.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-xs text-surface-600 dark:text-surface-300 md:mt-3 md:text-sm md:leading-relaxed lg:text-base">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 md:justify-start md:gap-4">
            <Link
              href={`/${post.slug || post.id}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-surface-900/85 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 dark:bg-white/85 dark:text-surface-900 md:flex-none md:rounded-2xl md:px-8 md:py-4 md:text-base"
            >
              Get Prompt <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <div className="flex shrink-0 gap-1.5 md:gap-2">
              <button
                onClick={() => goTo(current - 1)}
                aria-label="Previous featured prompt"
                className="rounded-xl border border-white/50 bg-white/40 p-2.5 text-surface-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white/70 active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:p-4"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => goTo(current + 1)}
                aria-label="Next featured prompt"
                className="rounded-xl border border-white/50 bg-white/40 p-2.5 text-surface-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white/70 active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:p-4"
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
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  relativeIdx === 0
                    ? 'z-20 scale-100 opacity-100'
                    : relativeIdx === 1
                      ? 'pointer-events-none z-10 translate-x-6 translate-y-3 scale-95 opacity-50'
                      : 'pointer-events-none z-0 -translate-x-6 -translate-y-3 scale-90 opacity-0'
                }`}
              >
                <div className="group relative block aspect-[4/5] h-full max-h-[360px] overflow-hidden rounded-2xl border border-white/80 bg-surface-900/10 shadow-2xl transition-transform duration-500 hover:scale-[1.02] dark:border-white/15 md:max-h-[380px]">
                  <Image
                    src={promptImageUrl(p)}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 80vw, 40vw"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {featured.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show featured prompt ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-primary-600 dark:bg-primary-300'
                  : 'w-1.5 bg-black/20 hover:bg-black/35 dark:bg-white/25 dark:hover:bg-white/40'
              }`}
            />
          ))}
          <span className="ml-1 text-[11px] font-semibold tabular-nums text-surface-500 dark:text-surface-400">
            {current + 1}/{featured.length}
          </span>
        </div>
      )}
    </div>
  );
}
