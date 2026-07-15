'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { promptImageUrl, useFeaturedSlider, type HeroProps } from './sliderShared';

// V3: Diagonal Cards (Stacked)
export default function HeroV3({ featuredPosts: featured, settings }: HeroProps) {
  const { current, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const post: Post = featured[current];
  const currentImageUrl = promptImageUrl(post);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden py-6 px-4 md:py-12 md:px-10 shadow-inner flex items-center justify-center min-h-[500px]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Blurred Background */}
      <div className="absolute inset-0 z-0">
        <Image src={currentImageUrl} alt="" fill sizes="20vw" className="object-cover opacity-30 dark:opacity-20 blur-3xl scale-125"  referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-6 md:flex-row md:gap-16">
        {/* Text Content */}
        <div className="order-2 flex w-full flex-col text-center md:order-1 md:w-1/2 md:text-left">
          <div className="relative min-h-[230px] md:min-h-[290px]">
            {featured.map((p, i) => {
              const slideTools = getAllTools(p);
              return (
                <div
                  key={p.id}
                  className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-out ${
                    i === current
                      ? 'translate-y-0 opacity-100 blur-0'
                      : 'pointer-events-none translate-y-3 opacity-0 blur-[1px]'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap justify-center gap-2 md:mb-4 md:justify-start">
                    {slideTools.map(tool => {
                      const info = getToolInfo(tool, settings?.toolDetails);
                      return (
                        <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />
                      );
                    })}
                  </div>
                  <h2 className="mb-2 text-xl font-black leading-[1.1] text-surface-900 dark:text-white md:mb-6 md:text-5xl">{p.title}</h2>
                  <p className="line-clamp-2 text-xs font-medium text-surface-700 dark:text-surface-300 md:line-clamp-3 md:text-lg">{p.description}</p>
                </div>
              );
            })}
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 md:justify-start md:gap-4">
            <Link href={`/${post.slug || post.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 dark:bg-white dark:text-surface-900 md:flex-none md:rounded-2xl md:px-8 md:py-4 md:text-base">
              Get Prompt <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <div className="flex shrink-0 gap-1.5 md:gap-2">
              <button onClick={() => goTo(current - 1)} aria-label="Previous featured prompt" className="rounded-xl bg-white/50 p-2.5 text-surface-900 shadow-sm backdrop-blur transition-all hover:bg-white dark:bg-black/50 dark:text-white dark:hover:bg-surface-800 md:p-4"><ChevronLeft className="h-4 w-4 md:h-5 md:w-5"/></button>
              <button onClick={() => goTo(current + 1)} aria-label="Next featured prompt" className="rounded-xl bg-white/50 p-2.5 text-surface-900 shadow-sm backdrop-blur transition-all hover:bg-white dark:bg-black/50 dark:text-white dark:hover:bg-surface-800 md:p-4"><ChevronRight className="h-4 w-4 md:h-5 md:w-5"/></button>
            </div>
          </div>
        </div>
        {/* Image Content */}
        <div className="perspective-1000 order-1 relative h-[300px] w-full md:order-2 md:h-[400px] md:w-1/2">
           {featured.map((p, i) => {
             const offset = i - current;
             const isVisible = Math.abs(offset) <= 1 || (i === 0 && current === featured.length - 1) || (i === featured.length - 1 && current === 0);
             const relativeIdx = offset === 0 ? 0 : (offset === 1 || (i === 0 && current === featured.length - 1)) ? 1 : -1;

             if (!isVisible) return null;

             return (
               <div
                 key={p.id}
                 className="absolute inset-0 overflow-hidden rounded-2xl border border-white/20 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                 style={{
                   transform: `translateX(${relativeIdx * 25}px) translateZ(${relativeIdx === 0 ? 0 : -100}px) rotateY(${relativeIdx * -15}deg) scale(${relativeIdx === 0 ? 1 : 0.85})`,
                   opacity: relativeIdx === 0 ? 1 : 0.4,
                   zIndex: relativeIdx === 0 ? 30 : 20,
                 }}
               >
                 <Image src={promptImageUrl(p)} alt={`bg-${p.title}`} fill sizes="20vw" className="scale-125 object-cover opacity-50 blur-xl" loading={relativeIdx === 0 ? 'eager' : 'lazy'} referrerPolicy="no-referrer" />
                 <LoadingImage
                   src={promptImageUrl(p)}
                   alt={p.title}
                   fill
                   priority={relativeIdx === 0}
                   sizes="(max-width: 768px) 100vw, 50vw"
                   showSkeleton={showSkeleton}
                   className="object-contain transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                   referrerPolicy="no-referrer"
                 />
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}
