import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { createAdminClient } from '@/lib/supabase-admin';
import { fetchSettings, isPublicPost, toPostSummary } from '@/lib/data';
import type { Post } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
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
  const [{ data: userData }, { data: rows }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from('posts').select('data'),
  ]);

  const profile = userData?.user;
  const allPosts = (rows || []).map((row: any) => row.data as Post).filter(Boolean);
  const publicPosts = allPosts.filter(isPublicPost);
  const submitted = publicPosts.filter(post => post.authorId === id).map(toPostSummary);
  const liked = settings.features?.publicProfileLikes
    ? publicPosts.filter(post => post.likedBy?.includes(id)).map(toPostSummary)
    : [];
  const saved = settings.features?.publicProfileBookmarks
    ? publicPosts.filter(post => post.bookmarkedBy?.includes(id)).map(toPostSummary)
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
