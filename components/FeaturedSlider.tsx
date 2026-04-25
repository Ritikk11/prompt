'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { ChevronLeft, ChevronRight, Play, Pause, Eye, Heart, ArrowRight } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import type { Post } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';

export default function FeaturedSlider() {
  const { posts, settings } = useData();
  const featured = posts.filter(p => p.featured);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(settings.heroAutoPlay);
  const [progress, setProgress] = useState(0);

  const goTo = useCallback((i: number) => {
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) goTo(current + 1);
    if (isRightSwipe) goTo(current - 1);
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (!settings.heroEnabled || featured.length === 0) return null;

  const post: Post = featured[current];
  const toolName = post.images[0]?.aiTool || '';
  const toolInfo = getToolInfo(toolName);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface-900 group shadow-2xl">
      {/* Main Image Container */}
      <div 
        className="relative w-full min-h-[500px] md:min-h-[400px] md:max-h-[520px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides with real img tags */}
        {featured.map((p, i) => (
          <Image
            key={p.id}
            src={p.images[0]?.url || 'https://picsum.photos/seed/placeholder/1200/800'}
            alt={p.title}
            fill
            priority={i === 0}
            unoptimized
            className={`object-cover object-top transition-opacity duration-700 ease-in-out ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            sizes="100vw"
          />
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 md:p-10">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${toolInfo.color}`}>
                {toolInfo.logo ? (
                  <div className="relative w-4 h-4 shrink-0 bg-white/20 rounded-sm p-0.5">
                    <Image src={toolInfo.logo} alt="" fill className="object-contain" unoptimized />
                  </div>
                ) : null}
                {toolName}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                ⭐ Featured
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
              {post.title}
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-4 line-clamp-2 drop-shadow">
              {post.description}
            </p>

            <div className="flex items-center gap-4 mb-5">
              <span className="flex items-center gap-1.5 text-white/60 text-sm">
                <Eye className="w-4 h-4" /> {post.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5 text-white/60 text-sm">
                <Heart className="w-4 h-4" /> {post.likes.toLocaleString()}
              </span>
              <span className="text-white/60 text-sm">{post.images.length} prompts</span>
            </div>

            <Link
              href={`/post/${post.slug || post.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary-500/25"
            >
              View Prompts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={() => goTo(current - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => goTo(current + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Vertical Thumbnails on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col gap-2">
          {featured.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i)}
              className={`relative w-14 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                i === current
                  ? 'border-primary-400 scale-110 shadow-lg shadow-primary-500/30'
                  : 'border-white/20 opacity-40 hover:opacity-70'
              }`}
            >
              <Image src={p.images[0]?.url || 'https://picsum.photos/seed/thumb/200/300'} alt="" fill unoptimized className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom progress & controls bar */}
      <div className="relative z-30">
        <div className="h-1 bg-white/10">
          <div className="h-full bg-primary-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-5 py-2.5 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-primary-400 w-8' : 'bg-white/25 hover:bg-white/40 w-3'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-xs">
              {current + 1} / {featured.length}
            </span>
            <button
              onClick={() => setPlaying(!playing)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
