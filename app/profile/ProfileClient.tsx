'use client';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogOut, Heart, FileText, MessageCircle, Edit2, Camera, User as UserIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { showToast } from '@/components/ui/ToastContainer';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { getGridClasses } from '@/lib/utils';
import type { Post, SiteSettings } from '@/lib/types';
import { getPostPath } from '@/lib/sections';
import { uploadImageFileToProvider } from '@/lib/client-upload';

import PostCard from '@/components/PostCard';
import MasonryGrid from '@/components/MasonryGrid';

type ProfileComment = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  text: string;
  status: 'approved' | 'pending';
  createdAt: string;
};

function ProfileContent({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
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
  const searchParams = useSearchParams();

  // Profile edit states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasIncompleteProfile = Boolean(user) && (!user?.user_metadata?.username || !user?.user_metadata?.full_name);

  const applyUserProfileState = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      setFullName(nextUser.user_metadata?.full_name || '');
      setUsername(nextUser.user_metadata?.username || '');
      setAvatarUrl(nextUser.user_metadata?.avatar_url || '');
      const incompleteProfile = !nextUser.user_metadata?.username || !nextUser.user_metadata?.full_name;
      if (searchParams.get('setup') === 'true' || incompleteProfile) {
        setIsEditing(true);
      }
    }
  }, [searchParams]);


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          username: username.toLowerCase().trim(),
          avatar_url: avatarUrl.trim(),
        }
      });
      if (error) throw error;
      setUser(data.user);
      setIsEditing(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setSaving(true);
      const { optimizeImageFile } = await import('@/lib/client-image-optimizer');
      const optimizedFile = await optimizeImageFile(file, 'logo');
      
      const url = await uploadImageFileToProvider(
        optimizedFile,
        settings.imageProvider === 'cloudflare' ? 'cloudflare' : 'supabase',
        'avatar',
        username || undefined
      );
      setAvatarUrl(url);
      showToast('Avatar uploaded successfully! Click Save to apply changes.');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setSaving(false);
    }
  };



  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      applyUserProfileState(session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user) {
        navigate.replace('/login?redirectTo=/profile');
      }
      // This page is also the user's submissions dashboard, so keep it available
      // when submissions are enabled even if saved/liked profiles are disabled.
      if (!accountHubEnabled) {
         navigate.push('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUserProfileState(session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user) {
        navigate.replace('/login?redirectTo=/profile');
      }
    });

    return () => subscription.unsubscribe();
  }, [accountHubEnabled, applyUserProfileState, navigate]);

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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-surface-500">Redirecting to login...</p>
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
            <div className="w-20 h-20 bg-surface-200 dark:bg-surface-700 rounded-full mb-4 overflow-hidden relative group">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-primary-500">
                  {(fullName || user.email || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="font-bold text-lg leading-tight">{fullName || 'Anonymous Creator'}</h2>
            <p className="text-xs font-semibold text-primary-500 mt-1">@{username || 'set_username'}</p>
            <p className="text-[10px] text-surface-400 mt-2 truncate w-full" title={user.email || ''}>{user.email}</p>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-800 hover:border-primary-400 dark:hover:border-primary-500/50 hover:bg-white dark:hover:bg-surface-900 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> {isEditing ? "View Dashboard" : "Edit Profile"}
            </button>
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
          {isEditing ? (
            <div className="mb-10 rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900 fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary-500" /> Edit Profile Settings
                  </h2>
                  <p className="text-xs text-surface-500 mt-1">Configure your public credentials and picture</p>
                </div>
                {!hasIncompleteProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-bold text-surface-400 hover:text-surface-600 uppercase tracking-wider font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {hasIncompleteProfile && (
                <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3.5 text-xs leading-relaxed text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-primary-500 dark:text-primary-300 shrink-0 mt-0.5" />
                  <span>Welcome! Please set your display name and public @username before you save, like, or submit prompts.</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Display Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Username (public @handle)</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. johndoe"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-200 ring-2 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Profile picture preview" fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-primary-500">
                          {(fullName || user.email || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold transition-colors hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:hover:bg-surface-800">
                        <Camera className="w-4 h-4" /> {avatarUrl ? 'Change photo' : 'Upload photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                        />
                      </label>
                      <p className="text-[11px] text-surface-400 dark:text-surface-500">
                        Google sign-in users: your account photo is used automatically. Upload a photo to replace it.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-bold mb-1">Email Verification Warning:</p>
                  <p>Please make sure you are using a proper, verified real email address. Submissions or interactions created by accounts registered with random, temporary, or fake email addresses will be permanently deleted without notice.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving Changes..." : "Save Profile Info"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {settings.features?.userSubmissions && (
                <div className="mb-10 rounded-2xl border border-primary-100 bg-primary-50 p-5 dark:border-primary-500/20 dark:bg-surface-900">
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
                  <MasonryGrid
                    posts={savedPosts}
                    settings={settings}
                    renderAdSlot={false}
                  />
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
                    <Heart className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-surface-500 font-medium">No liked prompts yet</p>
                    <Link href="/explore" className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block">
                      Explore trending prompts
                    </Link>
                  </div>
                ) : (
                  <MasonryGrid
                    posts={likedPosts}
                    settings={settings}
                    renderAdSlot={false}
                  />
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
                <MasonryGrid
                  posts={mySubmissions}
                  settings={settings}
                  renderAdSlot={false}
                />
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
          </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileClient({ posts, settings }: { posts: Post[], settings: SiteSettings }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileContent posts={posts} settings={settings} />
    </Suspense>
  );
}
