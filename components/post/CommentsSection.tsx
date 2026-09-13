'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase-lazy';
import { usePostPage } from './PostPageProvider';
import type { PostComment, SiteSettings } from '@/lib/types';

interface CommentsSectionProps {
  postId: string;
  initialComments?: PostComment[];
  settings?: SiteSettings;
}

export default function CommentsSection({
  postId,
  initialComments = [],
  settings,
}: CommentsSectionProps) {
  const { user, handleLogin } = usePostPage();

  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(initialComments);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const supabase = await getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'comment',
          id: postId,
          text: commentText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not post comment');

      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'comment_submitted', {
          status: json.comment?.status || 'unknown',
        });
      }

      if (json.comment) {
        setComments((prev) => [json.comment, ...prev]);
      }
      setCommentText('');
    } catch (err) {
      console.error('Submit comment error:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const visibleComments = comments
    .filter((comment) => comment.status === 'approved' || comment.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mb-16 border-t border-white/80 dark:border-white/10 pt-16">
      <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-8">Comments & Feedback</h3>
      <div className="bg-white/25 dark:bg-white/5 rounded-2xl p-8 text-center border border-white/80 dark:border-white/10">
        {user ? (
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <textarea
              rows={3}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Share your experience using these prompts, or post your own variations..."
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/[0.08] border border-white/80 dark:border-white/10 focus:border-primary-500 outline-none transition-colors text-sm resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={commentSubmitting || commentText.trim().length < 2}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Join the discussion and share your results.
            </p>
            <button
              type="button"
              onClick={handleLogin}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              Sign in to Comment
            </button>
          </div>
        )}

        <div className="mt-12 text-left">
          <p className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-6">
            {visibleComments.length} comments
          </p>
          <div className="space-y-4">
            {visibleComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-white/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {comment.userAvatar ? (
                      <Image
                        src={comment.userAvatar}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/40">
                        {comment.userName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      {settings?.features?.showPublicProfiles ? (
                        <Link
                          href={`/user/${comment.userId}`}
                          prefetch={false}
                          className="block truncate text-sm font-bold text-surface-900 hover:text-primary-500 dark:text-white"
                        >
                          {comment.userName}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-bold text-surface-900 dark:text-white">
                          {comment.userName}
                        </p>
                      )}
                      <p className="text-xs text-surface-400">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                  {comment.status === 'pending' && (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Pending
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  {comment.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
