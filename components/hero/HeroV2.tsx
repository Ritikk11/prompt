'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { promptImageUrl, isNearbySlide, useFeaturedSlider, SliderProgress, type HeroProps } from './sliderShared';

// V2: Split Screen
export default function HeroV2({ featuredPosts: featured, settings }: HeroProps) {
  const { current, playing, setPlaying, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const post: Post = featured[current];
  const allTools = post ? getAllTools(post) : [];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl group">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {/* Content Side */}
        <div className="flex flex-col justify-center p-8 md:p-12 order-2 md:order-1 relative z-20">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {allTools.map(tool => {
              const info = getToolInfo(tool, settings?.toolDetails);
              return (
                <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />
              );
            })}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300">⭐ Featured</span>
          </div>
          {/* Animated Title/Desc Wrapper */}
          <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 leading-tight">{post.title}</h2>
            <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg mb-8 line-clamp-3">{post.description}</p>
            <Link href={`/${post.slug || post.id}`} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all shadow-lg shadow-primary-500/25">
              Explore Prompt <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        {/* Image Side */}
        <div className="relative order-1 md:order-2 h-64 md:h-auto min-h-64">
           {featured.map((p, i) => (
              <div
                key={p.id}
                className={`absolute inset-0 transition-all duration-700 ease-out ${i === current ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'}`}
              >
                {isNearbySlide(i, current, featured.length) ? (
                  <>
                    <Image
                      src={promptImageUrl(p)} alt={`bg-${p.title}`} fill
                      className="object-cover blur-3xl scale-125 opacity-30 dark:opacity-20" sizes="50vw"
                      loading={i === current ? 'eager' : 'lazy'}
                      referrerPolicy="no-referrer" />
                    <LoadingImage
                      src={promptImageUrl(p)} alt={p.title} fill priority={i === current}
                      showSkeleton={showSkeleton}
                      className="object-contain" sizes="50vw"
                      referrerPolicy="no-referrer" />
                  </>
                ) : null}
              </div>
            ))}
        </div>
      </div>
      <SliderProgress featured={featured} current={current} playing={playing} goTo={goTo} setPlaying={setPlaying} />
    </div>
  );
}
