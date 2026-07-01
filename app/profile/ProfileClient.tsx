'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { LogOut, Heart, FileText, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';
import { getPostPath } from '@/lib/sections';

import PostCard from '@/components/PostCard';

type ProfileComment = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  text: string;
  status: 'approved' | 'pending';
  createdAt: string;
};

export default function ProfileClient({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  const accountHubEnabled = Boolean(settings.features?.userProfiles || settings.features?.userSubmissions);
  const savedAndLikedEnabled = Boolean(settings.features?.userProfiles);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [liked, setLiked] = useState<Post[]>([]);
  const [submissions, setSubmissions] = useState<Post[]>([]);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      // This page is also the user's submissions dashboard, so keep it available
      // when submissions are enabled even if saved/liked profiles are disabled.
      if (!accountHubEnabled) {
         navigate.push('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [accountHubEnabled, navigate]);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      if (!user) {
        setBookmarks([]);
        setLiked([]);
        setSubmissions([]);
        setComments([]);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const supabase = createClient();
        let { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          const { data } = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } as any }));
          session = data.session;
        }
        const res = await fetch('/api/profile', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Failed to load profile');
        if (!cancelled) {
          setBookmarks(json.bookmarks || []);
          setLiked(json.liked || []);
          setSubmissions(json.submissions || []);
          setComments(json.comments || []);
        }
      } catch (error) {
        console.error('Profile load failed', error);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!accountHubEnabled) {
    return null;
  }

  if (authLoading && !user) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-surface-500 mb-8">Sign in to manage your account activity.</p>
        <button onClick={() => navigate.push('/')} className="text-primary-500 hover:text-primary-600 font-medium">
          Return Home
        </button>
      </div>
    );
  }

  const savedPosts = bookmarks.length > 0
    ? bookmarks
    : posts.filter(p => p.bookmarkedByUser && (p.status === 'published' || !p.status) && p.visibility !== 'private');
  const likedPosts = liked.length > 0
    ? liked
    : posts.filter(p => p.likedByUser && (p.status === 'published' || !p.status) && p.visibility !== 'private');
  const mySubmissions = submissions.length > 0
    ? submissions
    : posts.filter(p => p.authorId === user.id);

  return (
    <div className="max-w-7xl mx-auto px-1 py-6 sm:py-8 fade-in">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-surface-200 dark:bg-surface-700 rounded-full mb-4 overflow-hidden shadow-sm relative">
              {user.user_metadata?.avatar_url && <Image src={user.user_metadata.avatar_url} alt="" fill className="object-cover" referrerPolicy="no-referrer" />}
            </div>
            <h2 className="font-bold text-lg">{user.user_metadata?.full_name || 'Anonymous User'}</h2>
            <p className="text-xs text-surface-500 truncate w-full" title={user.email || ''}>{user.email}</p>
          </div>
          
          <hr className="my-6 border-surface-200 dark:border-surface-800" />
          
          <button onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            navigate.push('/');
          }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {settings.features?.userSubmissions && (
            <div className="mb-10 rounded-2xl border border-primary-100 bg-primary-50/70 p-5 dark:border-primary-900/50 dark:bg-primary-950/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500">Creator dashboard</p>
                  <h1 className="mt-1 text-2xl font-black text-surface-950 dark:text-white">Your prompt submissions</h1>
                  <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">
                    Track pending, approved, and draft prompt collections from one place.
                  </p>
                </div>
                <Link href="/submit" className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-5 py-3 text-sm font-bold text-white hover:bg-primary-600">
                  Submit new prompt
                </Link>
              </div>
            </div>
          )}

          {savedAndLikedEnabled && (
            <>
              <div className="mb-10">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Saved Prompts
                </h2>
                {profileLoading ? (
                  <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonPostCard key={i} />)}
                  </div>
                ) : savedPosts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50">
                    <Heart className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-surface-500 font-medium">No bookmarks yet</p>
                    <Link href="/explore" className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block">
                      Explore trending prompts
                    </Link>
                  </div>
                ) : (
                  <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                    {savedPosts.map((post, i) => (
                      <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
                        <PostCard post={post} index={i} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-10">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" /> My Liked Prompts
                </h2>
                {profileLoading ? (
                  <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonPostCard key={i} />)}
                  </div>
                ) : likedPosts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50">
                    <p className="text-surface-500 font-medium">No liked prompts yet</p>
                  </div>
                ) : (
                  <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                    {likedPosts.map((post, i) => (
                      <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
                        <PostCard post={post} index={i} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {settings.features?.userSubmissions && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary-500" /> My Submissions
              </h2>
              {profileLoading ? (
                <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonPostCard key={i} />)}
                </div>
              ) : mySubmissions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50">
                  <p className="text-surface-500 font-medium">You haven&apos;t submitted any prompts.</p>
                  <Link href="/submit" className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block">
                    Submit a new prompt
                  </Link>
                </div>
              ) : (
                <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
                  {mySubmissions.map((post, i) => (
                    <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid relative">
                       {/* Overlay indicator for pending/draft */}
                       {(post.status === 'pending' || post.status === 'draft') && (
                          <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                            {post.status}
                          </div>
                       )}
                       <PostCard post={post} index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {settings.features?.comments && (
            <div className="mt-10">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-primary-500" /> My Comments
              </h2>
              {profileLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50">
                  <MessageCircle className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                  <p className="text-surface-500 font-medium">No comments yet</p>
                  <Link href="/explore" className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block">
                    Find prompts to discuss
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-950">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500">
                        <Link href={getPostPath({ id: comment.postId, slug: comment.postSlug })} className="font-bold text-primary-500 hover:text-primary-600">
                          {comment.postTitle}
                        </Link>
                        <span>•</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        {comment.status === 'pending' && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-200">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
