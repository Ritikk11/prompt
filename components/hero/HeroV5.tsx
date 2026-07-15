'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { promptImageUrl, isNearbySlide, useFeaturedSlider, type HeroProps } from './sliderShared';

// V5: Minimal & Large (Typography focused)
export default function HeroV5({ featuredPosts: featured, settings }: HeroProps) {
  const { current, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const post: Post = featured[current];
  const allTools = post ? getAllTools(post) : [];

  return (
    <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-surface-950 group" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="relative w-full h-[600px]">
        {featured.map((p, i) => (
          <div key={p.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {isNearbySlide(i, current, featured.length) ? (
              <>
                <Image
                  src={promptImageUrl(p)} alt={`bg-${p.title}`} fill
                  className="object-cover object-center blur-2xl scale-125 opacity-30" sizes="100vw"
                  loading={i === current ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer" />
                <LoadingImage
                  src={promptImageUrl(p)} alt={p.title} fill priority={i === current}
                  showSkeleton={showSkeleton}
                  className="object-contain object-center opacity-80" sizes="100vw"
                  referrerPolicy="no-referrer" />
              </>
            ) : null}
          </div>
        ))}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-surface-950/20 via-transparent to-surface-950/80 pointer-events-none" />

        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-700" key={post.id}>
             <div className="flex flex-wrap gap-2 mb-6 justify-center">
               {allTools.map(tool => {
                 const info = getToolInfo(tool, settings?.toolDetails);
                 return (
                   <ToolBadge key={tool} toolName={tool} toolInfo={info} size="lg" />
                 );
               })}
             </div>
             <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-2xl font-serif">
               {post.title}
             </h2>
             <p className="text-white/80 text-lg md:text-2xl font-medium max-w-2xl mb-10 drop-shadow-lg">
               {post.description}
             </p>
             <Link href={`/${post.slug || post.id}`} className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-surface-950 font-bold text-lg transition-transform hover:scale-105 shadow-2xl hover:shadow-white/20">
               Explore Now
               <span className="bg-surface-100 p-2 rounded-full group-hover/btn:bg-primary-100 transition-colors">
                 <ArrowRight className="w-5 h-5 text-primary-600" />
               </span>
             </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-8 left-0 w-full z-40 flex justify-center items-center gap-6 px-6">
           <button onClick={() => goTo(current - 1)} aria-label="Previous featured prompt" className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur"><ChevronLeft className="w-6 h-6" /></button>
           <div className="flex gap-2">
             {featured.map((_, i) => (
               <button key={i} onClick={() => goTo(i)} aria-label={`Show featured prompt ${i + 1}`} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8' : 'border border-white/30 bg-transparent w-2'}`} />
             ))}
           </div>
           <button onClick={() => goTo(current + 1)} aria-label="Next featured prompt" className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur"><ChevronRight className="w-6 h-6" /></button>
        </div>
      </div>
    </div>
  );
}
