'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import SkeletonPostCard from '@/components/SkeletonPostCard';

interface GridPageSkeletonProps {
  showHero?: boolean;
  heroVariant?: 'container' | 'simple';
  showBreadcrumbs?: boolean;
  showHeroStats?: boolean;
  posts?: {
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    images?: { width?: number | string; height?: number | string }[];
  }[];
}

// Authentic aspect ratio distribution matching the site's real portrait & square prompt library
const DEFAULT_COLUMN_RATIOS: number[][] = [
  [0.8, 0.667, 0.563, 0.75], // Col 1: 4:5, 2:3, 9:16, 3:4
  [0.667, 0.8, 0.667, 0.8],  // Col 2: 2:3, 4:5, 2:3, 4:5
  [0.667, 0.563, 0.8, 0.667],// Col 3: 2:3, 9:16, 4:5, 2:3
  [0.563, 0.667, 0.75, 0.667],// Col 4: 9:16, 2:3, 3:4, 2:3
  [0.8, 0.667, 0.8, 0.563],  // Col 5: 4:5, 2:3, 4:5, 9:16
  [0.667, 0.75, 0.667, 0.8], // Col 6: 2:3, 3:4, 2:3, 4:5
];

export default function GridPageSkeleton({
  showHero = true,
  heroVariant = 'container',
  showBreadcrumbs = false,
  showHeroStats = true,
  posts,
}: GridPageSkeletonProps) {
  const { settings } = useData();
  const cardStyle = (settings?.cardStyle || 'v2') as 'v1' | 'v2';
  const mobileCols = settings?.features?.mobileColumns || 1;
  const desktopCols = settings?.features?.desktopColumns || 4;

  const [columnCount, setColumnCount] = useState<number>(desktopCols);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(mobileCols);
      } else if (width < 768) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(Math.min(desktopCols, 3));
      } else {
        setColumnCount(desktopCols);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [mobileCols, desktopCols]);

  // Compute column aspect ratios from provided posts if available, else use authentic masonry ratios
  const columnsData = useMemo(() => {
    const count = Math.max(1, columnCount);
    const cols: number[][] = Array.from({ length: count }, () => []);

    if (posts && posts.length > 0) {
      posts.forEach((p, index) => {
        const w = p.thumbnailWidth || (p.images?.[0]?.width ? Number(p.images[0].width) : undefined);
        const h = p.thumbnailHeight || (p.images?.[0]?.height ? Number(p.images[0].height) : undefined);
        const ratio = w && h && h > 0 ? w / h : 0.75;
        cols[index % count].push(ratio);
      });
    } else {
      // Use staggered realistic aspect ratios per column
      for (let colIdx = 0; colIdx < count; colIdx++) {
        const pattern = DEFAULT_COLUMN_RATIOS[colIdx % DEFAULT_COLUMN_RATIOS.length];
        cols[colIdx] = [...pattern];
      }
    }

    return cols;
  }, [posts, columnCount]);

  return (
    <div className="max-w-7xl mx-auto px-2 py-6 sm:py-8 w-full page-enter" role="status" aria-label="Loading gallery">
      {/* Breadcrumb nav placeholder */}
      {showBreadcrumbs && (
        <nav className="flex items-center gap-2 text-sm text-surface-400 mb-8 font-medium" aria-hidden="true">
          <div className="h-3.5 w-12 rounded-full bg-black/10 dark:bg-white/15 animate-pulse shrink-0" />
          <ChevronRight className="w-3.5 h-3.5 opacity-30 text-surface-400 shrink-0" />
          <div className="h-3.5 w-28 sm:w-36 rounded-full bg-black/10 dark:bg-white/15 animate-pulse shrink-0" />
        </nav>
      )}

      {/* Simple centered layout (when heroStyle is 'simple') */}
      {showHero && heroVariant === 'simple' && (
        <header className="mb-10 text-center max-w-3xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-surface-200/80 dark:border-surface-800 bg-surface-100/80 dark:bg-surface-800/60 px-4 py-1.5 animate-pulse">
            <div className="h-3.5 w-3.5 rounded-full bg-black/15 dark:bg-white/20" />
            <div className="h-3.5 w-24 rounded-full bg-black/15 dark:bg-white/20" />
          </div>
          <div className="h-10 sm:h-12 w-3/4 max-w-lg mx-auto rounded-2xl bg-black/[0.10] dark:bg-white/15 animate-pulse mb-4" />
          <div className="space-y-2 max-w-xl mx-auto">
            <div className="h-4 w-full rounded-lg bg-black/[0.06] dark:bg-white/10 animate-pulse" />
            <div className="h-4 w-4/5 mx-auto rounded-lg bg-black/[0.06] dark:bg-white/10 animate-pulse" />
          </div>
        </header>
      )}

      {/* Frosted glass container layout (when heroStyle is 'container') */}
      {showHero && heroVariant === 'container' && (
        <section className="glass-surface relative mb-8 overflow-hidden rounded-[30px] px-5 py-10 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)] sm:px-8 lg:px-10">
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              {/* Badge Pill skeleton */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 dark:border-white/10 dark:bg-white/[0.14]">
                <div className="h-4 w-4 rounded-full bg-black/15 dark:bg-white/20 animate-pulse" />
                <div className="h-3.5 w-24 rounded-full bg-black/15 dark:bg-white/20 animate-pulse" />
              </div>

              {/* Title skeleton: matches text-4xl sm:text-5xl */}
              <div className="space-y-3 max-w-2xl mb-4">
                <div className="h-9 sm:h-12 w-4/5 rounded-2xl bg-black/[0.10] dark:bg-white/15 animate-pulse" />
              </div>

              {/* Description skeleton: matches text-base leading-7 */}
              <div className="space-y-2 max-w-xl mt-4">
                <div className="h-4 w-full rounded-lg bg-black/[0.06] dark:bg-white/10 animate-pulse" />
                <div className="h-4 w-3/4 rounded-lg bg-black/[0.06] dark:bg-white/10 animate-pulse" />
              </div>
            </div>

            {/* Stats Boxes skeleton: matches Prompts & AI tools count cards */}
            {showHeroStats && (
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <div className="rounded-2xl border border-white/60 bg-white/25 px-5 py-4 dark:border-white/10 dark:bg-white/5 w-28 sm:w-32">
                  <div className="h-7 w-12 rounded-lg bg-black/10 dark:bg-white/15 animate-pulse mb-1.5" />
                  <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Filter / Sort Chips Toolbar Placeholder */}
      <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        <div className="h-8 w-20 rounded-full border border-white/80 bg-white/60 dark:border-white/10 dark:bg-white/10 animate-pulse shrink-0" />
        <div className="h-8 w-16 rounded-full border border-white/80 bg-white/60 dark:border-white/10 dark:bg-white/10 animate-pulse shrink-0" />
        <div className="h-8 w-24 rounded-full border border-white/80 bg-white/60 dark:border-white/10 dark:bg-white/10 animate-pulse shrink-0" />
        <div className="h-8 w-22 rounded-full border border-white/80 bg-white/60 dark:border-white/10 dark:bg-white/10 animate-pulse shrink-0" />
        <div className="h-8 w-28 rounded-full border border-white/80 bg-white/60 dark:border-white/10 dark:bg-white/10 animate-pulse shrink-0" />
      </div>

      {/* Responsive Masonry Grid with authentic aspect ratios */}
      <div
        className="grid gap-3 sm:gap-4 items-start w-full"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {columnsData.map((ratios, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3 sm:gap-4 w-full">
            {ratios.map((ratio, cardIndex) => (
              <SkeletonPostCard key={cardIndex} cardStyle={cardStyle} aspectRatio={ratio} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
