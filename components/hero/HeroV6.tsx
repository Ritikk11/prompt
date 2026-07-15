'use client';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import LoadingImage from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { promptImageUrl, useFeaturedSlider, type HeroProps } from './sliderShared';

// V6: Parallax Stack
export default function HeroV6({ featuredPosts: featured, settings }: HeroProps) {
  const { current, goTo, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useFeaturedSlider(featured, settings.heroAutoPlay ?? true);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const post: Post = featured[current];
  const allTools = post ? getAllTools(post) : [];

  return (
    <div className="relative w-full min-h-[500px] md:min-h-[600px] rounded-[3rem] overflow-hidden bg-surface-100 dark:bg-surface-800 flex items-center justify-center p-6 md:p-12 mb-10" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-pink-500/10" />
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div key={post.id} className="animate-in slide-in-from-left-12 duration-700">
             <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
               {allTools.map(tool => {
                 const info = getToolInfo(tool, settings?.toolDetails);
                 return (
                   <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />
                 );
               })}
             </div>
             <h2 className="text-4xl md:text-7xl font-black text-surface-900 dark:text-white mb-6 uppercase tracking-tight leading-[0.9]">
               {post.title}
             </h2>
             <p className="text-surface-600 dark:text-surface-400 text-lg md:text-xl font-medium mb-10 max-w-lg leading-relaxed">
               {post.description}
             </p>
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                <Link href={`/${post.slug || post.id}`} className="px-8 py-4 rounded-2xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                  View Prompt
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => goTo(current - 1)} aria-label="Previous featured prompt" className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm hover:translate-y-[-2px] transition-all"><ChevronLeft className="w-5 h-5"/></button>
                  <button onClick={() => goTo(current + 1)} aria-label="Next featured prompt" className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm hover:translate-y-[-2px] transition-all"><ChevronRight className="w-5 h-5"/></button>
                </div>
             </div>
          </div>
        </div>
        <div className="relative order-1 lg:order-2 h-[350px] md:h-[500px] flex items-center justify-center">
           {featured.map((p, i) => {
             const idx = i - current;
             const absIdx = Math.abs(idx);
             if (absIdx > 2) return null;
             return (
               <div
                 key={p.id}
                 className="absolute inset-0 transition-all duration-700 ease-out"
                 style={{
                   transform: `translateX(${idx * 40}px) translateY(${absIdx * 20}px) scale(${1 - absIdx * 0.1}) skewY(${idx * 2}deg)`,
                   opacity: 1 - absIdx * 0.4,
                   zIndex: 10 - absIdx,
                 }}
               >
                 <div className="w-full h-full rounded-[40px] overflow-hidden shadow-2xl border-4 border-white dark:border-surface-700">
                    <LoadingImage src={promptImageUrl(p)} alt="" fill showSkeleton={showSkeleton} className="object-cover" referrerPolicy="no-referrer" />
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}
