'use client';

import { useEffect, useRef } from 'react';
import { Eye, Heart, Bookmark } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import { usePostPage } from './PostPageProvider';
import type { Post, PostClientMeta } from '@/lib/types';

interface PostHeroStatsProps {
  post: PostClientMeta;
  showViewCount?: boolean;
  showLikeCount?: boolean;
  showSaveButton?: boolean;
}

export default function PostHeroStats({
  post,
  showViewCount = true,
  showLikeCount = true,
  showSaveButton = true,
}: PostHeroStatsProps) {
  const { incrementViews, toggleLike, toggleBookmark, posts } = useData();
  const { user, handleLogin } = usePostPage();
  const viewIncrementedRef = useRef(false);
  // The DataContext mutation fallbacks take a full Post, but only read the
  // summary fields carried here; the cast keeps the slim client prop from
  // dragging the article body through the RSC boundary.
  const postArg = post as unknown as Post;

  // Read reactive stats from DataContext if present, otherwise fallback to server post props
  const contextPost = posts.find((p) => p.id === post.id);
  const views = contextPost?.views ?? post.views ?? 0;
  const likes = contextPost?.likes ?? post.likes ?? 0;
  const likedByUser = contextPost?.likedByUser ?? post.likedByUser ?? false;
  const bookmarkedByUser = contextPost?.bookmarkedByUser ?? post.bookmarkedByUser ?? false;

  useEffect(() => {
    if (viewIncrementedRef.current) return;

    const requestIdle = (window as any).requestIdleCallback as
      | ((callback: () => void, options?: { timeout?: number }) => number)
      | undefined;
    const cancelIdle = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
    const run = () => {
      if (viewIncrementedRef.current) return;
      viewIncrementedRef.current = true;
      incrementViews(post.id, postArg);
    };
    const idleId = requestIdle
      ? requestIdle(run, { timeout: 3500 })
      : window.setTimeout(run, 1800);

    return () => {
      if (requestIdle && cancelIdle) {
        cancelIdle(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [post.id, post, incrementViews]);

  const handleBookmarkClick = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    try {
      await toggleBookmark(post.id, postArg);
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', bookmarkedByUser ? 'prompt_unsaved' : 'prompt_saved');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleLikeClick = () => {
    toggleLike(post.id, postArg);
  };

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2.5 max-w-full shrink-0">
      {showViewCount && (
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2 sm:px-3.5 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-white/90 backdrop-blur-xl shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:border-white/30 hover:bg-white/15 hover:text-white select-none antialiased transform-gpu will-change-transform [backface-visibility:hidden] origin-center shrink-0">
          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-white/80" strokeWidth={2} />
          <span className="tabular-nums">{views.toLocaleString()} Views</span>
        </div>
      )}

      <button
        onClick={handleLikeClick}
        type="button"
        className={`group inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-semibold backdrop-blur-xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-sm select-none cursor-pointer antialiased transform-gpu will-change-transform [backface-visibility:hidden] origin-center shrink-0 ${
          likedByUser
            ? 'border-rose-500/60 bg-rose-500/25 text-rose-200 shadow-rose-500/25 hover:border-rose-500/80 hover:bg-rose-500/35 hover:text-white'
            : 'border-white/15 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/20 hover:text-white'
        }`}
      >
        <Heart
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors duration-300 ${
            likedByUser
              ? 'fill-rose-500 text-rose-500 animate-heart-pop'
              : 'text-white/80 group-hover:text-rose-400'
          }`}
          strokeWidth={2}
        />
        <span className="tabular-nums">
          {showLikeCount ? `${likes.toLocaleString()} Like` : 'Like'}
        </span>
      </button>

      {showSaveButton && (
        <button
          onClick={handleBookmarkClick}
          type="button"
          aria-label={bookmarkedByUser ? 'Remove bookmark' : 'Bookmark this post'}
          className={`group inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-semibold backdrop-blur-xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-sm select-none cursor-pointer antialiased transform-gpu will-change-transform [backface-visibility:hidden] origin-center shrink-0 ${
            bookmarkedByUser
              ? 'border-indigo-500/60 bg-indigo-500/25 text-indigo-200 shadow-indigo-500/25 hover:border-indigo-500/80 hover:bg-indigo-500/35 hover:text-white'
              : 'border-white/15 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/20 hover:text-white'
          }`}
        >
          <Bookmark
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors duration-300 ${
              bookmarkedByUser
                ? 'fill-indigo-400 text-indigo-400'
                : 'text-white/80 group-hover:text-white'
            }`}
            strokeWidth={2}
          />
          <span>{bookmarkedByUser ? 'Saved' : 'Save'}</span>
        </button>
      )}
    </div>
  );
}
