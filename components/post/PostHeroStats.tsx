'use client';

import { useEffect, useRef } from 'react';
import { Eye, Heart, Bookmark } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import { usePostPage } from './PostPageProvider';
import type { Post } from '@/lib/types';

interface PostHeroStatsProps {
  post: Post;
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
      incrementViews(post.id, post);
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
      await toggleBookmark(post.id, post);
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', bookmarkedByUser ? 'prompt_unsaved' : 'prompt_saved');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleLikeClick = () => {
    toggleLike(post.id, post);
  };

  return (
    <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-5 rounded-[32px] border border-white/20 bg-black/25 py-2 px-3 sm:py-3 sm:px-7 text-xs sm:text-sm font-medium text-white/75 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(129,140,248,0.25),0_0_60px_rgba(139,92,246,0.15)] transition-shadow duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(129,140,248,0.35),0_0_80px_rgba(139,92,246,0.2)]">
      {showViewCount && (
        <>
          <span className="flex items-center gap-2 sm:gap-2.5">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]" />
            </span>
            {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
          </span>
          <span className="h-5 w-px bg-white/15" />
        </>
      )}

      <button
        onClick={handleLikeClick}
        type="button"
        className="flex items-center gap-2 sm:gap-2.5 transition-all duration-300 hover:text-white hover:scale-105 active:scale-95"
      >
        <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <Heart
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
              likedByUser
                ? 'text-red-500 fill-red-500 animate-heart-pop drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                : 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.7)]'
            }`}
          />
        </span>
        {showLikeCount ? `${likes.toLocaleString()} ${likes === 1 ? 'like' : 'likes'}` : likedByUser ? 'Liked' : 'Like'}
      </button>

      {showSaveButton && (
        <>
          <span className="h-5 w-px bg-white/15" />
          <button
            onClick={handleBookmarkClick}
            type="button"
            aria-label={bookmarkedByUser ? 'Remove bookmark' : 'Bookmark this post'}
            className="flex items-center gap-2 sm:gap-2.5 transition-all duration-300 hover:text-white hover:scale-105 active:scale-95"
          >
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              <Bookmark
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                  bookmarkedByUser
                    ? 'text-indigo-300 fill-indigo-300'
                    : 'text-indigo-400'
                } drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]`}
              />
            </span>
            {bookmarkedByUser ? 'Saved' : 'Save'}
          </button>
        </>
      )}
    </div>
  );
}
