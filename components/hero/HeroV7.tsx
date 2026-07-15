'use client';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getToolInfo } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { promptImageUrl, useFeaturedSlider, type HeroProps } from './sliderShared';

// V7: Carousel Hub
export default function HeroV7({ featuredPosts: featured, settings }: HeroProps) {
  const { current, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;

  return (
    <div className="relative w-full py-12 mb-10 overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
         <div className="flex items-end justify-between mb-8">
           <div className="max-w-2xl">
              <span className="text-primary-500 font-black uppercase tracking-[0.3em] text-xs mb-3 block">EDITOR&apos;S CHOICE</span>
              <h2 className="text-3xl md:text-5xl font-black text-surface-900 dark:text-white tracking-tighter">FEATURED PROMPTS</h2>
           </div>
           <div className="flex gap-2">
              <button onClick={() => goTo(current - 1)} aria-label="Previous featured prompt" className="p-3 rounded-full border border-surface-200 dark:border-surface-800 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"><ChevronLeft className="w-6 h-6"/></button>
              <button onClick={() => goTo(current + 1)} aria-label="Next featured prompt" className="p-3 rounded-full border border-surface-200 dark:border-surface-800 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"><ChevronRight className="w-6 h-6"/></button>
           </div>
         </div>

         <div className="flex gap-4 md:gap-8 overflow-visible">
            {featured.map((p, i) => (
              <div
                key={p.id}
                className={`relative flex-none transition-all duration-500 ${i === current ? 'w-full md:w-[70%] h-[400px] md:h-[550px]' : 'w-20 md:w-40 h-[400px] md:h-[550px] opacity-40 hover:opacity-100 cursor-pointer overflow-hidden'}`}
                onClick={() => i !== current && goTo(i)}
              >
                <div className={`relative h-full w-full rounded-[2.5rem] overflow-hidden ${i === current ? 'shadow-2xl' : 'shadow-lg saturate-0 hover:saturate-100'}`}>
                  <LoadingImage src={promptImageUrl(p)} alt={p.title} fill showSkeleton={showSkeleton} className="object-cover" referrerPolicy="no-referrer" />
                  {i === current && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 md:p-12 flex flex-col justify-end">
                        {(() => {
                          const slideToolInfo = getToolInfo(p.images[0].aiTool, settings?.toolDetails);
                          return (
                            <ToolBadge toolName={p.images[0].aiTool} toolInfo={slideToolInfo} size="sm" className="w-max mb-4" />
                          );
                        })()}
                        <h3 className="text-2xl md:text-4xl font-black text-white mb-4 line-clamp-2 uppercase tracking-wide">{p.title}</h3>
                        <Link href={`/${p.slug || p.id}`} className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black font-black text-xs md:text-sm uppercase tracking-widest w-max hover:bg-primary-500 hover:text-white transition-all">
                           View Details <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
