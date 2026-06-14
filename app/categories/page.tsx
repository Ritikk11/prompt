export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Grid2X2 } from 'lucide-react';
import { fetchPostSummaries } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Prompt Categories | AI PromptMatrix',
  description: 'Browse AI prompt categories for posters, portraits, anime, characters, realistic images, and creative visual styles.',
};

function slugify(value: string) {
  return encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, '-'));
}

export default async function CategoriesPage() {
  const posts = (await fetchPostSummaries()).filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private');
  const counts = new Map<string, number>();
  posts.forEach(post => {
    const values = [post.category, ...(post.categories || [])].filter(Boolean) as string[];
    values.forEach(category => counts.set(category, (counts.get(category) || 0) + 1));
  });

  const categories = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <div className="mb-10">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary-500">Browse</p>
        <h1 className="text-4xl font-black tracking-tight text-surface-950 dark:text-white md:text-6xl">Categories</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-surface-600 dark:text-surface-400">
          Use categories as landing pages for bigger creative groups. Tags can stay specific; categories should feel broad and easy to browse.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="grid overflow-hidden rounded-[28px] border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 md:grid-cols-2 lg:grid-cols-3">
          {categories.map(([category, count], index) => (
            <Link
              key={category}
              href={`/category/${slugify(category)}`}
              className="group min-h-[210px] border-b border-surface-200 p-6 transition-colors hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-950/70 md:border-r"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-black text-surface-400">0{index + 1}</span>
                <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">{count} prompts</span>
              </div>
              <h2 className="text-2xl font-black capitalize text-surface-950 dark:text-white">{category}</h2>
              <p className="mt-3 text-sm leading-6 text-surface-600 dark:text-surface-400">
                Browse prompt collections, examples, and reusable image-generation workflows in this category.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary-500">
                Browse <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-surface-200 bg-white p-10 text-center dark:border-surface-800 dark:bg-surface-900">
          <Grid2X2 className="mx-auto mb-4 h-8 w-8 text-primary-500" />
          <h2 className="text-xl font-black text-surface-950 dark:text-white">No categories yet</h2>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Add a category while editing posts in the admin panel.</p>
        </div>
      )}
    </div>
  );
}
