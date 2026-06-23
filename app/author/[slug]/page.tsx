import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import PostCard from '@/components/PostCard';
import { fetchPostSummaries, fetchSettings, isPublicPost } from '@/lib/data';
import { getAuthorForPost, getAuthors } from '@/lib/authors';
import type { Post } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSettings();
  const author = getAuthors(settings).find(item => item.slug === slug || item.id === slug);
  if (!author) {
    return {
      title: 'Author Not Found | AI PromptMatrix',
      description: 'The requested author profile could not be found.',
    };
  }

  return {
    title: `${author.name} | ${settings.siteTitle || 'AI PromptMatrix'}`,
    description: author.bio || `Browse prompt collections reviewed by ${author.name}.`,
    openGraph: {
      title: `${author.name} | ${settings.siteTitle || 'AI PromptMatrix'}`,
      description: author.bio || `Browse prompt collections reviewed by ${author.name}.`,
      images: author.avatarUrl ? [{ url: author.avatarUrl }] : undefined,
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const [settings, posts] = await Promise.all([
    fetchSettings(),
    fetchPostSummaries() as Promise<Post[]>,
  ]);
  const author = getAuthors(settings).find(item => item.slug === slug || item.id === slug);
  if (!author || author.active === false) notFound();

  const authorPosts = posts
    .filter(isPublicPost)
    .filter(post => getAuthorForPost(post, settings).id === author.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 rounded-3xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-primary-500/10">
            {author.avatarUrl ? (
              <Image src={author.avatarUrl} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-primary-500">
                {author.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Author</p>
            <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white sm:text-4xl">{author.name}</h1>
            {author.role && <p className="mt-1 text-sm font-bold text-surface-500 dark:text-surface-400">{author.role}</p>}
            {author.bio && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-surface-600 dark:text-surface-300">{author.bio}</p>}
            {author.website && (
              <Link href={author.website} className="mt-4 inline-flex text-sm font-bold text-primary-500 hover:text-primary-600">
                Visit website
              </Link>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-surface-900 dark:text-white">Reviewed prompts</h2>
            <p className="mt-1 text-sm text-surface-500">{authorPosts.length} public prompt{authorPosts.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        {authorPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-200 p-8 text-sm text-surface-500 dark:border-surface-800">
            No public prompts are assigned to this author yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {authorPosts.map((post, index) => <PostCard key={post.id} post={post} index={index} />)}
          </div>
        )}
      </section>
    </main>
  );
}
