'use client';
import React, { useState, useEffect, useMemo } from 'react';
import type { Post, SiteSettings } from '@/lib/types';
import PostCard from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';

interface MasonryGridProps {
  posts: Post[];
  settings?: SiteSettings;
  cardStyleOverride?: string;
  renderAdSlot?: boolean;
  className?: string;
  disablePriority?: boolean;
}

export default function MasonryGrid({
  posts,
  settings,
  cardStyleOverride,
  renderAdSlot = true,
  className = '',
  disablePriority = false,
}: MasonryGridProps) {
  const mobileColsSetting = settings?.features?.mobileColumns || 1;
  const desktopColsSetting = settings?.features?.desktopColumns || 4;

  const [columnCount, setColumnCount] = useState<number>(desktopColsSetting);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(mobileColsSetting);
      } else if (width < 768) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(Math.min(desktopColsSetting, 3));
      } else {
        setColumnCount(desktopColsSetting);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [mobileColsSetting, desktopColsSetting]);

  // Distribute posts across active columns
  const columns = useMemo(() => {
    const count = Math.max(1, columnCount);
    const cols: { post: Post; index: number }[][] = Array.from({ length: count }, () => []);
    
    posts.forEach((post, index) => {
      cols[index % count].push({ post, index });
    });
    
    return cols;
  }, [posts, columnCount]);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div
      data-reveal-stagger
      className={`grid gap-3 sm:gap-4 items-start w-full ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      }}
    >
      {columns.map((colPosts, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-3 sm:gap-4 w-full">
          {colPosts.map(({ post, index }) => (
            <div key={post.id} className="w-full">
              <PostCard
                post={post}
                index={index}
                priority={!disablePriority && index < 2}
                cardStyleOverride={cardStyleOverride as any}
              />
              {renderAdSlot && (
                <AdSlot
                  placement="inFeed"
                  inFeedIndex={index}
                  className="mt-3 sm:mt-4 rounded-[18px] bg-black/[0.03] dark:bg-white/[0.04]"
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
