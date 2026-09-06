'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Post, SiteSettings } from '@/lib/types';
import PostCard from '@/components/PostCard';

/*
 * Masonry for the /test redesign — same responsive column logic, round-robin
 * distribution, and PostCard rendering as the main MasonryGrid, minus the
 * AdSlot and the main-site reveal attributes (the parent section owns its
 * GlmReveal). Cards are the main-site PostCard on purpose: they follow the
 * admin cardStyle / per-section cardStyleOverride exactly like production.
 */

type GlmMasonryProps = {
  posts: Post[];
  settings?: SiteSettings;
  cardStyleOverride?: 'v1' | 'v2';
  className?: string;
};

export default function GlmMasonry({ posts, settings, cardStyleOverride, className = '' }: GlmMasonryProps) {
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

  const columns = useMemo(() => {
    const count = Math.max(1, columnCount);
    const cols: { post: Post; index: number }[][] = Array.from({ length: count }, () => []);
    posts.forEach((post, index) => {
      cols[index % count].push({ post, index });
    });
    return cols;
  }, [posts, columnCount]);

  if (!posts || posts.length === 0) return null;

  return (
    <div
      className={`grid items-start gap-3 sm:gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {columns.map((colPosts, colIndex) => (
        <div key={colIndex} className="flex w-full flex-col gap-3 sm:gap-4">
          {colPosts.map(({ post, index }) => (
            /* glm-post-card: hook for the scoped glass thumbnail-frame
               adaptation of the main PostCard (styles live in TestClient). */
            <div key={post.id} className="glm-post-card w-full">
              <PostCard
                post={post}
                index={index}
                cardStyleOverride={cardStyleOverride}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
