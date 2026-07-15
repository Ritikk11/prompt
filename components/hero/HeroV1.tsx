'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { promptImageUrl, isNearbySlide, useFeaturedSlider, SliderProgress, type HeroProps } from './sliderShared';

// V1: Classic Slider (Previous Default)
export default function HeroV1({ featuredPosts: featured, settings }: HeroProps) {
  const { current, playing, setPlaying, progress, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const post: Post = featured[current];
  const allTools = post ? getAllTools(post) : [];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface-900 group shadow-2xl">
      <div
        className="relative w-full min-h-[500px] md:min-h-[400px] md:max-h-[520px]"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      >
        {featured.map((p, i) => (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {isNearbySlide(i, current, featured.length) ? (
              <>
                <Image
                  src={promptImageUrl(p, 'https://picsum.photos/seed/placeholder/1200/800')} alt={`bg-${p.title}`} fill
                  className="object-cover blur-xl scale-125 opacity-40 dark:opacity-30" sizes="100vw"
                  loading={i === current ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer" />
                <LoadingImage
                  src={promptImageUrl(p, 'https://picsum.photos/seed/placeholder/1200/800')} alt={p.title} fill priority={i === current}
                  showSkeleton={showSkeleton}
                  className="object-contain object-center" sizes="100vw"
                  referrerPolicy="no-referrer" />
              </>
            ) : null}
          </div>
        ))}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10">
          <div className="max-w-2xl relative z-30">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {allTools.map(tool => {
                  const info = getToolInfo(tool, settings?.toolDetails);
                  return (
                    <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />
                  );
                })}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">⭐ Featured</span>
              </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-lg">{post.title}</h2>
            <p className="text-white/70 text-sm md:text-base mb-4 line-clamp-2 drop-shadow">{post.description}</p>
            <Link href={`/${post.slug || post.id}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary-500/25">
              View Prompts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <button onClick={() => goTo(current - 1)} aria-label="Previous featured prompt" className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => goTo(current + 1)} aria-label="Next featured prompt" className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg"><ChevronRight className="w-5 h-5" /></button>
      </div>
      <SliderProgress featured={featured} current={current} progress={progress} playing={playing} goTo={goTo} setPlaying={setPlaying} />
    </div>
  );
}
