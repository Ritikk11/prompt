import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UserX } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase-admin';
import { fetchSettings, isPublicPost, toPostSummary } from '@/lib/data';
import { getPublicUserByIdOrUsername } from '@/lib/users';
import PublicProfileClient from '@/components/PublicProfileClient';
import type { Post } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

function postsFromRows(rows: any[] | null | undefined) {
  return (rows || [])
    .map((row: any) => row.data as Post)
    .filter(Boolean)
    .filter(isPublicPost);
}

function uniquePosts(posts: Post[]) {
  return Array.from(new Map(posts.map(post => [post.id, post])).values());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getPublicUserByIdOrUsername(id);

  if (!user) {
    return {
      title: 'Creator Not Found | AI PromptMatrix',
      description: 'The requested creator profile does not exist.',
    };
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'creator';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const profileTitle = `${displayName} (@${username}) — AI Prompts | AI PromptMatrix`;
  const profileDescription = user.user_metadata?.bio || `Browse AI prompts and workflows created by ${displayName} (@${username}) on AI PromptMatrix.`;

  return {
    title: profileTitle,
    description: profileDescription,
    alternates: { canonical: `${siteUrl}/user/${encodeURIComponent(username)}` },
    openGraph: {
      title: profileTitle,
      description: profileDescription,
      siteName: 'AI PromptMatrix',
      type: 'profile',
      url: `${siteUrl}/user/${encodeURIComponent(username)}`,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const settings = await fetchSettings();

  const cleanId = decodeURIComponent(id).trim().replace(/^@/, '').toLowerCase();
  const isEditorialTarget =
    cleanId === 'editorial-team' ||
    cleanId === (settings.defaultAuthorId || 'editorial-team').toLowerCase() ||
    (settings.authors || []).some(
      (a: any) =>
        (a.id || '').toLowerCase() === cleanId ||
        (a.slug || '').toLowerCase() === cleanId
    );

  // If profiles are disabled from admin, regular profiles are blocked,
  // but the Editorial Team is ALWAYS visible.
  const profilesEnabled = Boolean(settings.features?.showPublicProfiles && settings.features?.userProfiles);

  if (!profilesEnabled && !isEditorialTarget) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold">Public profiles are disabled</h1>
        <p className="mt-2 text-sm text-surface-500">Public creator profiles are currently disabled by the site admin.</p>
        <Link href="/" prefetch={false} className="mt-4 inline-block text-primary-500 hover:text-primary-600">
          Return home
        </Link>
      </div>
    );
  }

  const user = await getPublicUserByIdOrUsername(id);

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 bg-white/60 text-surface-400 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]">
          <UserX className="h-8 w-8 opacity-70" />
        </div>
        <h1 className="text-xl font-black text-surface-950 dark:text-white">Creator Not Found</h1>
        <p className="mt-2 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
          We couldn&apos;t find a creator profile matching &quot;{decodeURIComponent(id)}&quot;. The handle may have changed or the profile is private.
        </p>
        <Link
          href="/explore"
          prefetch={false}
          className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
        >
          Explore trending prompts
        </Link>
      </div>
    );
  }

  const userId = user.id;
  const admin = createAdminClient();
  const isEditorial = userId === (settings.defaultAuthorId || 'editorial-team');

  const postsQuery = isEditorial
    ? admin
        .from('posts')
        .select('data')
        .eq('data->>status', 'published')
        .or(`data->>authorId.eq.${userId},data->>authorId.is.null`)
    : admin
        .from('posts')
        .select('data')
        .eq('data->>authorId', userId)
        .eq('data->>status', 'published');

  const [
    submittedResult,
    likeRowsResult,
    bookmarkRowsResult,
    legacyLikedResult,
    legacySavedResult,
  ] = await Promise.all([
    postsQuery,
    settings.features?.publicProfileLikes
      ? admin.from('user_likes').select('post_id').eq('user_id', userId)
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileBookmarks
      ? admin.from('user_bookmarks').select('post_id').eq('user_id', userId)
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileLikes
      ? admin
          .from('posts')
          .select('data')
          .eq('data->>status', 'published')
          .filter('data->likedBy', 'cs', JSON.stringify([userId]))
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileBookmarks
      ? admin
          .from('posts')
          .select('data')
          .eq('data->>status', 'published')
          .filter('data->bookmarkedBy', 'cs', JSON.stringify([userId]))
      : Promise.resolve({ data: [] }),
  ]);

  const likedPostIds = (likeRowsResult.data || []).map((row: any) => row.post_id);
  const savedPostIds = (bookmarkRowsResult.data || []).map((row: any) => row.post_id);

  const [likedPostsResult, savedPostsResult] = await Promise.all([
    settings.features?.publicProfileLikes && likedPostIds.length > 0
      ? admin.from('posts').select('data').in('id', likedPostIds)
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileBookmarks && savedPostIds.length > 0
      ? admin.from('posts').select('data').in('id', savedPostIds)
      : Promise.resolve({ data: [] }),
  ]);

  const submitted = postsFromRows(submittedResult.data).map(toPostSummary);

  const liked = settings.features?.publicProfileLikes
    ? uniquePosts([
        ...postsFromRows(likedPostsResult.data),
        ...postsFromRows(legacyLikedResult.data),
      ]).map(toPostSummary)
    : [];

  const saved = settings.features?.publicProfileBookmarks
    ? uniquePosts([
        ...postsFromRows(savedPostsResult.data),
        ...postsFromRows(legacySavedResult.data),
      ]).map(toPostSummary)
    : [];

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'creator';
  const avatarUrl = user.user_metadata?.avatar_url;
  const bio = user.user_metadata?.bio;
  const website = user.user_metadata?.website;
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <PublicProfileClient
      profile={{
        id: userId,
        displayName,
        username,
        avatarUrl,
        bio,
        website,
        joinedDate,
      }}
      submitted={submitted}
      liked={liked}
      saved={saved}
      showLikes={Boolean(settings.features?.publicProfileLikes)}
      showBookmarks={Boolean(settings.features?.publicProfileBookmarks)}
      settings={settings}
    />
  );
}
