'use client';
import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react';
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

export const SLIDE_DURATION_MS = 4000;

export function useFeaturedSlider(featured: Post[], autoPlay: boolean, durationMs = SLIDE_DURATION_MS) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);

  const goTo = useCallback((i: number) => {
    if (featured.length === 0) return;
    setCurrent(((i % featured.length) + featured.length) % featured.length);
  }, [featured.length]);

  // One state update per slide change — nothing ticks. An earlier version ran a
  // 100ms setProgress interval to drive a progress bar, which re-rendered the
  // whole hero tree 10x/second for the page's lifetime and dominated
  // main-thread time in Lighthouse.
  useEffect(() => {
    if (!playing || featured.length <= 1) return;
    const timer = setInterval(() => goTo(current + 1), durationMs);
    return () => clearInterval(timer);
  }, [playing, current, goTo, featured.length, durationMs]);

  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchEndYRef = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (!e.targetTouches[0]) return;
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
    touchEndXRef.current = e.targetTouches[0].clientX;
    touchEndYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!e.targetTouches[0]) return;
    touchEndXRef.current = e.targetTouches[0].clientX;
    touchEndYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const dx = touchStartXRef.current - touchEndXRef.current;
    const dy = touchStartYRef.current - touchEndYRef.current;
    // Advance slides only on intentional horizontal swipe (|dx| > 50 and dominant over vertical |dy|)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goTo(current + 1);
      else goTo(current - 1);
    }
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
    touchStartYRef.current = 0;
    touchEndYRef.current = 0;
  };

  return { current, playing, setPlaying, goTo, handleTouchStart, handleTouchMove, handleTouchEnd };
}
