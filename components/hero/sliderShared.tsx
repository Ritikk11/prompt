'use client';
import { useState, useEffect, useCallback, type TouchEvent } from 'react';
import { Play, Pause } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getPromptImageUrl } from '@/lib/image-url';

export type HeroProps = {
  featuredPosts: Post[];
  settings: SiteSettings;
  stats?: { postCount: number; sectionCount: number };
};

export function isNearbySlide(index: number, current: number, total: number) {
  if (total <= 3) return true;
  const distance = Math.abs(index - current);
  return distance <= 1 || distance >= total - 1;
}

export const promptImageUrl = (item?: Post, fallback = '') => (
  getPromptImageUrl(item?.thumbnailUrl || item?.images[0]?.url || fallback, { width: 960, quality: 78 })
);

export function useFeaturedSlider(featured: Post[], autoPlay: boolean) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);

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

  const handleTouchStart = (e: TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) goTo(current + 1);
    if (distance < -50) goTo(current - 1);
    setTouchStart(0);
    setTouchEnd(0);
  };

  return { current, playing, setPlaying, progress, goTo, handleTouchStart, handleTouchMove, handleTouchEnd };
}

// Common Nav & Progress Controls (used by v1 and v2)
export function SliderProgress({
  featured,
  current,
  progress,
  playing,
  goTo,
  setPlaying,
}: {
  featured: Post[];
  current: number;
  progress: number;
  playing: boolean;
  goTo: (i: number) => void;
  setPlaying: (playing: boolean) => void;
}) {
  return (
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
              aria-label={`Show featured prompt ${i + 1}`}
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
            aria-label={playing ? 'Pause featured slider' : 'Play featured slider'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
