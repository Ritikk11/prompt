export const runtime = 'edge';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { getSectionBySlug, fetchPostSummaries, fetchSettings } from '@/lib/data';
import PostCard from '@/components/PostCard';
import type { Post, Section } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { filterPostsForSection } from '@/lib/sections';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const section = await getSectionBySlug(slug);

  if (!section) {
    return {
      title: 'Section Not Found',
    };
  }

  return {
    title: `${section.name} | AI Prompt Matrix`,
    description: `Explore all prompts in the ${section.name} section.`,
  };
}

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const [section, allPosts, settings] = await Promise.all([
    getSectionBySlug(slug) as Promise<Section | null>,
    fetchPostSummaries() as Promise<Post[]>,
    fetchSettings(),
  ]);

  if (!section) {
    notFound();
  }

  const filteredPosts = filterPostsForSection(section, allPosts, settings, false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-8 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-surface-900 dark:text-white">{section.name}</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-surface-900 dark:text-white mb-4 tracking-tight leading-tight">
          {section.name}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 text-lg max-w-3xl">
          Discover a curated collection of {filteredPosts.length} prompts.
        </p>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-surface-50 dark:bg-surface-900 rounded-[32px] border border-dashed border-surface-200 dark:border-surface-800">
          <p className="text-surface-500 font-medium">No prompts found in this section yet.</p>
          <Link href="/explore" className="mt-4 inline-block text-primary-500 font-bold hover:underline">
            Explore other prompts
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {filteredPosts.map((post, i) => (
            <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
              <PostCard post={post} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
