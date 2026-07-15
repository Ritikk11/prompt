'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingImage from '@/components/LoadingImage';
import { promptImageUrl, isNearbySlide, useFeaturedSlider, type HeroProps } from './sliderShared';

// V8: Cinematic Edge
export default function HeroV8({ featuredPosts: featured, settings }: HeroProps) {
  const { current, goTo } = useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;

  return (
    <div className="relative w-full h-[600px] md:h-[750px] mb-12 flex items-center justify-center p-4">
      {featured.map((p, i) => (
        <div key={p.id} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === current ? 'opacity-100 z-10' : 'opacity-0 scale-105 blur-sm z-0'}`}>
          {isNearbySlide(i, current, featured.length) ? (
            <Image src={promptImageUrl(p)} alt="" fill className="object-cover scale-105 blur-2xl opacity-20" loading={i === current ? 'eager' : 'lazy'} referrerPolicy="no-referrer" />
          ) : null}
          <div className="relative h-full w-full max-w-6xl mx-auto rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 mt-4 h-full md:h-[90%]">
             {isNearbySlide(i, current, featured.length) ? (
               <LoadingImage src={promptImageUrl(p)} alt={p.title} fill showSkeleton={showSkeleton} className="object-cover" referrerPolicy="no-referrer" priority={i === current} />
             ) : null}
             <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-8 md:p-20 flex flex-col justify-end md:justify-center">
                <div className="max-w-2xl animate-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-3 mb-6">
                     <span className="w-12 h-[2px] bg-primary-500" />
                     <span className="text-white text-xs font-black tracking-[0.4em] uppercase">{p.images[0].aiTool} MASTERPIECE</span>
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight leading-none drop-shadow-2xl">
                    {p.title}
                  </h2>
                  <p className="text-white/60 text-lg md:text-xl font-medium mb-12 line-clamp-3 md:line-clamp-none">
                    {p.description}
                  </p>
                  <div className="flex flex-row items-center gap-6">
                      <Link href={`/${p.slug || p.id}`} className="px-10 py-4 rounded-full bg-primary-500 text-white font-black text-sm uppercase tracking-widest hover:bg-primary-400 transition-all shadow-xl shadow-primary-500/30">
                        PROMPT DETAILS
                      </Link>
                      <div className="flex gap-4">
                         <button onClick={() => goTo(current - 1)} aria-label="Previous featured prompt" className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"><ChevronLeft className="w-6 h-6"/></button>
                         <button onClick={() => goTo(current + 1)} aria-label="Next featured prompt" className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"><ChevronRight className="w-6 h-6"/></button>
                      </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      ))}
      {/* Play Progress Dot Bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
         {featured.map((_, i) => (
           <button key={i} onClick={() => goTo(i)} aria-label={`Show featured prompt ${i + 1}`} className={`h-2.5 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-primary-500' : 'w-2.5 bg-white/30 hover:bg-white/50'}`} />
         ))}
      </div>
    </div>
  );
}
