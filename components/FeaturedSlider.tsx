'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { ChevronLeft, ChevronRight, Play, Pause, Eye, Heart, ArrowRight } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import type { Post } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';

export default function FeaturedSlider() {
  const { posts, settings, loading } = useData();
  const featured = posts.filter(p => p.featured);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(settings.heroAutoPlay ?? true);
  const [progress, setProgress] = useState(0);
  
  const heroStyle = settings.heroStyle || 'v1';

  const goTo = useCallback((i: number) => {
    if (featured.length === 0) return;
    setCurrent(((i % featured.length) + featured.length) % featured.length);
    setProgress(0);
  }, [featured.length]);

  useEffect(() => {
    if (!playing || featured.length === 0) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goTo(current + 1);
          return 0;
        }
        return prev + 1.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, current, goTo, featured.length]);

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) goTo(current + 1);
    if (distance < -50) goTo(current - 1);
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (loading && settings.features?.skeletonLoaders) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-200 dark:bg-surface-800 animate-pulse min-h-[500px] md:min-h-[400px] shadow-2xl">
      </div>
    );
  }

  if (!settings.heroEnabled) return null;
  if (loading && featured.length === 0) {
    return <div className="w-full h-[400px] lg:h-[500px] bg-surface-200 dark:bg-surface-800 rounded-2xl animate-pulse" />;
  }
  if (featured.length === 0) return null;

  const post: Post = featured[current];
  const toolName = post?.images[0]?.aiTool || '';
  const toolInfo = getToolInfo(toolName);

  // Common Nav & Progress Controls
  const renderProgress = (
    <div className="relative z-30">
      <div className="h-1 bg-surface-200 dark:bg-surface-800">
        <div className="h-full bg-primary-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between px-5 py-2.5 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'bg-primary-500 w-8' : 'bg-surface-300 dark:bg-surface-700 hover:bg-surface-400 w-3'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-surface-500 text-xs">
            {current + 1} / {featured.length}
          </span>
          <button
            onClick={() => setPlaying(!playing)}
            className="p-1.5 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  // V1: Classic Slider (Previous Default)
  if (heroStyle === 'v1') {
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
              <Image
                src={p.images[0]?.url || 'https://picsum.photos/seed/placeholder/1200/800'} alt={`bg-${p.title}`} fill
                className="object-cover blur-xl scale-125 opacity-40 dark:opacity-30" sizes="100vw"
               referrerPolicy="no-referrer" />
              <Image
                src={p.images[0]?.url || 'https://picsum.photos/seed/placeholder/1200/800'} alt={p.title} fill priority={i === 0}
                className="object-contain object-center" sizes="100vw"
               referrerPolicy="no-referrer" />
            </div>
          ))}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10">
            <div className="max-w-2xl relative z-30">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${toolInfo.color}`}>{toolName}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">⭐ Featured</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-lg">{post.title}</h2>
              <p className="text-white/70 text-sm md:text-base mb-4 line-clamp-2 drop-shadow">{post.description}</p>
              <Link href={`/post/${post.slug || post.id}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary-500/25">
                View Prompts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <button onClick={() => goTo(current - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => goTo(current + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
        {renderProgress}
      </div>
    );
  }

  // V2: Split Screen
  if (heroStyle === 'v2') {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl group">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {/* Content Side */}
          <div className="flex flex-col justify-center p-8 md:p-12 order-2 md:order-1 relative z-20">
            <div className="flex flex-wrap items-center gap-2 mb-4">
               <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${toolInfo.color}`}>{toolName}</span>
               <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300">⭐ Featured</span>
            </div>
            {/* Animated Title/Desc Wrapper */}
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 leading-tight">{post.title}</h2>
              <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg mb-8 line-clamp-3">{post.description}</p>
              <Link href={`/post/${post.slug || post.id}`} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all shadow-lg shadow-primary-500/25">
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
                  <Image
                    src={p.images[0]?.url || 'https://picsum.photos/seed/placeholder/1200/800'} alt={`bg-${p.title}`} fill
                    className="object-cover blur-3xl scale-125 opacity-30 dark:opacity-20" sizes="50vw"
                   referrerPolicy="no-referrer" />
                  <Image
                    src={p.images[0]?.url || 'https://picsum.photos/seed/placeholder/1200/800'} alt={p.title} fill priority={i === 0}
                    className="object-contain" sizes="50vw"
                   referrerPolicy="no-referrer" />
                </div>
              ))}
          </div>
        </div>
        {renderProgress}
      </div>
    );
  }

  // V3: Diagonal Cards (Stacked)
  if (heroStyle === 'v3') {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden py-6 px-4 md:py-12 md:px-10 shadow-inner flex items-center justify-center min-h-[500px]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {/* Blurred Background */}
        <div className="absolute inset-0 z-0">
          <Image src={post.images[0]?.url || ''} alt="" fill sizes="20vw" className="object-cover opacity-30 dark:opacity-20 blur-3xl scale-125"  referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md" />
        </div>
        
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-16">
          {/* Text Content */}
          <div className="w-full md:w-1/2 flex flex-col text-center md:text-left animate-in slide-in-from-left-8 duration-700 order-2 md:order-1">
            <span className={`inline-block self-center md:self-start mb-2 md:mb-4 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white shadow-lg ${toolInfo.color}`}>{toolName}</span>
            <h2 className="text-xl md:text-5xl font-black text-surface-900 dark:text-white mb-2 md:mb-6 leading-[1.1]">{post.title}</h2>
            <p className="text-surface-700 dark:text-surface-300 text-xs md:text-lg mb-4 md:mb-8 line-clamp-2 md:line-clamp-3 font-medium">{post.description}</p>
            <div className="flex flex-row items-center justify-center md:justify-start gap-2 md:gap-4 w-full">
              <Link href={`/post/${post.slug || post.id}`} className="inline-flex flex-1 md:flex-none justify-center items-center gap-1.5 px-4 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 text-xs md:text-base font-bold hover:scale-105 transition-transform shadow-xl">
                Get Prompt <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <div className="flex gap-1.5 md:gap-2 shrink-0">
                <button onClick={() => goTo(current - 1)} className="p-2.5 md:p-4 rounded-xl bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-surface-800 backdrop-blur shadow-sm transition-all text-surface-900 dark:text-white"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5"/></button>
                <button onClick={() => goTo(current + 1)} className="p-2.5 md:p-4 rounded-xl bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-surface-800 backdrop-blur shadow-sm transition-all text-surface-900 dark:text-white"><ChevronRight className="w-4 h-4 md:w-5 md:h-5"/></button>
              </div>
            </div>
          </div>
          {/* Image Content */}
          <div className="w-full md:w-1/2 relative h-[300px] md:h-[400px] perspective-1000 order-1 md:order-2">
             {featured.map((p, i) => {
               const offset = i - current;
               const isVisible = Math.abs(offset) <= 1 || (i === 0 && current === featured.length - 1) || (i === featured.length - 1 && current === 0);
               const relativeIdx = offset === 0 ? 0 : (offset === 1 || (i === 0 && current === featured.length - 1)) ? 1 : -1;
               
               if (!isVisible) return null;
               
               return (
                 <div
                   key={p.id}
                   className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl shadow-2xl overflow-hidden border border-white/20`}
                   style={{
                     transform: `translateX(${relativeIdx * 25}px) translateZ(${relativeIdx === 0 ? 0 : -100}px) rotateY(${relativeIdx * -15}deg) scale(${relativeIdx === 0 ? 1 : 0.85})`,
                     opacity: relativeIdx === 0 ? 1 : 0.4,
                     zIndex: relativeIdx === 0 ? 30 : 20,
                   }}
                 >
                   <Image src={p.images[0]?.url || ''} alt={`bg-${p.title}`} fill sizes="20vw" className="object-cover blur-xl scale-125 opacity-50"  referrerPolicy="no-referrer" />
                   <Image src={p.images[0]?.url || ''} alt={p.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain"  referrerPolicy="no-referrer" />
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    );
  }

  // V4: Grid / Bento (Doesn't use auto-play slider, but shows top 3-4 featured)
  if (heroStyle === 'v4') {
    const topFeatured = featured.slice(0, 3);
    if (topFeatured.length === 0) return null;
    return (
      <div className="relative w-full rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Main Large Item */}
          <Link href={`/post/${topFeatured[0].slug || topFeatured[0].id}`} className="relative h-[400px] lg:h-[500px] lg:col-span-2 rounded-2xl overflow-hidden group">
            <Image src={topFeatured[0].images[0]?.url || ''} alt={`bg-${topFeatured[0].title}`} fill sizes="20vw" className="object-cover blur-2xl scale-125 opacity-40 dark:opacity-30"  referrerPolicy="no-referrer" />
            <Image src={topFeatured[0].images[0]?.url || ''} alt="" fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-contain transition-transform duration-700 group-hover:scale-105"  referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <span className="px-3 py-1 w-max rounded-full text-xs font-bold bg-primary-500 text-white mb-3 shadow-lg">⭐ Main Feature</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{topFeatured[0].title}</h2>
              <p className="text-white/80 line-clamp-2 max-w-lg">{topFeatured[0].description}</p>
            </div>
          </Link>
          {/* Side Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {topFeatured.slice(1).map((fPost) => (
              <Link key={fPost.id} href={`/post/${fPost.slug || fPost.id}`} className="relative h-[200px] sm:h-[250px] lg:h-[calc(250px-4px)] rounded-2xl overflow-hidden group">
                <Image src={fPost.images[0]?.url || ''} alt={`bg-${fPost.title}`} fill sizes="20vw" className="object-cover blur-xl scale-125 opacity-40 dark:opacity-30"  referrerPolicy="no-referrer" />
                <Image src={fPost.images[0]?.url || ''} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain transition-transform duration-700 group-hover:scale-105"  referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <h3 className="text-xl font-bold text-white mb-1 leading-tight">{fPost.title}</h3>
                  <p className="text-white/80 text-sm line-clamp-1">{fPost.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // V5: Minimal & Large (Typography focused)
  if (heroStyle === 'v5') {
    return (
      <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-surface-950 group" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="relative w-full h-[600px]">
          {featured.map((p, i) => (
            <div key={p.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
              <Image
                src={p.images[0]?.url || ''} alt={`bg-${p.title}`} fill
                className="object-cover object-center blur-2xl scale-125 opacity-30" sizes="100vw"
               referrerPolicy="no-referrer" />
              <Image
                src={p.images[0]?.url || ''} alt={p.title} fill priority={i === 0}
                className="object-contain object-center opacity-80" sizes="100vw"
               referrerPolicy="no-referrer" />
            </div>
          ))}
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-surface-950/20 via-transparent to-surface-950/80 pointer-events-none" />
          
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-4xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-700" key={post.id}>
               <span className={`mb-6 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-surface-950 shadow-xl ${toolInfo.color}`}>{toolName}</span>
               <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-2xl font-serif">
                 {post.title}
               </h2>
               <p className="text-white/80 text-lg md:text-2xl font-medium max-w-2xl mb-10 drop-shadow-lg">
                 {post.description}
               </p>
               <Link href={`/post/${post.slug || post.id}`} className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-surface-950 font-bold text-lg transition-transform hover:scale-105 shadow-2xl hover:shadow-white/20">
                 Explore Now 
                 <span className="bg-surface-100 p-2 rounded-full group-hover/btn:bg-primary-100 transition-colors">
                   <ArrowRight className="w-5 h-5 text-primary-600" />
                 </span>
               </Link>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="absolute bottom-8 left-0 w-full z-40 flex justify-center items-center gap-6 px-6">
             <button onClick={() => goTo(current - 1)} className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur"><ChevronLeft className="w-6 h-6" /></button>
             <div className="flex gap-2">
               {featured.map((_, i) => (
                 <button key={i} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8' : 'border border-white/30 bg-transparent w-2'}`} />
               ))}
             </div>
             <button onClick={() => goTo(current + 1)} className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
