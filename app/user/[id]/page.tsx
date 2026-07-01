import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { createAdminClient } from '@/lib/supabase-admin';
import { fetchSettings, isPublicPost, toPostSummary } from '@/lib/data';
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
  return Array.from(new Map(posts.map((post) => [post.id, post])).values());
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const settings = await fetchSettings();

  if (!settings.features?.showPublicProfiles) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold">Public profiles are disabled</h1>
        <Link href="/" className="text-primary-500 hover:text-primary-600">Return home</Link>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: userData }, submittedResult, likeRowsResult, bookmarkRowsResult, legacyLikedResult, legacySavedResult] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin
      .from('posts')
      .select('data')
      .eq('data->>authorId', id)
      .eq('data->>status', 'published'),
    settings.features?.publicProfileLikes
      ? admin.from('user_likes').select('post_id').eq('user_id', id)
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileBookmarks
      ? admin.from('user_bookmarks').select('post_id').eq('user_id', id)
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileLikes
      ? admin
          .from('posts')
          .select('data')
          .eq('data->>status', 'published')
          .filter('data->likedBy', 'cs', JSON.stringify([id]))
      : Promise.resolve({ data: [] }),
    settings.features?.publicProfileBookmarks
      ? admin
          .from('posts')
          .select('data')
          .eq('data->>status', 'published')
          .filter('data->bookmarkedBy', 'cs', JSON.stringify([id]))
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

  const profile = userData?.user;
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
  const displayName = profile?.user_metadata?.full_name || profile?.email?.split('@')[0] || 'Creator';

  const sections = [
    { title: 'Submitted prompts', posts: submitted },
    ...(settings.features?.publicProfileLikes ? [{ title: 'Liked prompts', posts: liked }] : []),
    ...(settings.features?.publicProfileBookmarks ? [{ title: 'Saved prompts', posts: saved }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10 rounded-3xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary-500">Public Profile</p>
        <h1 className="text-3xl font-black text-surface-900 dark:text-white">{displayName}</h1>
        <p className="mt-2 text-sm text-surface-500">{submitted.length} submitted prompts</p>
      </div>

      <div className="space-y-12">
        {sections.map(section => (
          <section key={section.title}>
            <h2 className="mb-5 text-xl font-black">{section.title}</h2>
            {section.posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-200 p-8 text-sm text-surface-500 dark:border-surface-800">
                Nothing public here yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {section.posts.map((post, index) => <PostCard key={post.id} post={post} index={index} />)}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
