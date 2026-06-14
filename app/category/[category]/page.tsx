export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { matchesCategory } from '@/lib/sections';
import { getGridClasses } from '@/lib/utils';

interface Props {
  params: Promise<{ category: string }>;
}

function normalizeCategory(value: string) {
  return decodeURIComponent(value).replace(/-/g, ' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const name = normalizeCategory(category);
  return {
    title: `${name} AI Prompts | AI PromptMatrix`,
    description: `Browse ${name} AI prompt collections with examples, model notes, and copy-ready image prompts.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const name = normalizeCategory(category);
  const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const filtered = posts
    .filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private')
    .filter(post => matchesCategory(post, name))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-surface-500">
            <Link href="/" className="hover:text-primary-500">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-primary-500">Categories</Link>
            <span>/</span>
            <span className="capitalize text-surface-900 dark:text-white">{name}</span>
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Category</p>
          <h1 className="text-4xl font-black capitalize tracking-tight text-surface-950 dark:text-white md:text-6xl">{name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
            {filtered.length} prompt collection{filtered.length === 1 ? '' : 's'} with examples, model notes, and copy-ready workflows.
          </p>
        </div>
        <Link href="/explore" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-500 px-4 py-2.5 text-xs font-black text-white">
          Open full library <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {filtered.length > 0 ? (
        <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns)}>
          {filtered.map((post, index) => (
            <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-surface-200 bg-white p-10 text-center dark:border-surface-800 dark:bg-surface-900">
          <h2 className="text-xl font-black text-surface-950 dark:text-white">No prompts found</h2>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">No published prompt collections are in this category yet.</p>
        </div>
      )}
    </div>
  );
}
