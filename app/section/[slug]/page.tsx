export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { getSectionBySlugREST, getAllPostsREST } from '@/lib/firebase-rest';
import PostCard from '@/components/PostCard';
import type { Post, Section } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const section = await getSectionBySlugREST(slug);

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
  const [section, allPosts] = await Promise.all([
    getSectionBySlugREST(slug) as Promise<Section | null>,
    getAllPostsREST() as Promise<Post[]>,
  ]);

  if (!section) {
    notFound();
  }

  // Helper to filter posts based on section type
  const getFilteredPosts = () => {
    switch (section.type) {
      case 'latest':
        return [...allPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popular':
        return [...allPosts].sort((a, b) => b.views - a.views);
      case 'trending':
        return [...allPosts].sort((a, b) => b.likes - a.likes);
      case 'ai-tool':
        return allPosts.filter(p => p.images.some(img => img.aiTool?.toLowerCase() === section.aiTool?.toLowerCase()));
      case 'tag':
        return allPosts.filter(p => p.tags.some(t => t.toLowerCase() === section.tag?.toLowerCase()));
      case 'category':
        return allPosts.filter(p => {
          const matchSingle = p.category?.toLowerCase() === section.category?.toLowerCase();
          const matchArray = p.categories?.some(c => c.toLowerCase() === section.category?.toLowerCase());
          return matchSingle || matchArray;
        });
      case 'custom':
        return allPosts.filter(p => section.postIds?.includes(p.id));
      default:
        return allPosts;
    }
  };

  const filteredPosts = getFilteredPosts();

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
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
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
