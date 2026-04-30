'use client';
import { useData } from '@/components/context/DataContext';
import dynamic from 'next/dynamic';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { LayoutTemplate } from 'lucide-react';

const PostCard = dynamic(() => import('@/components/PostCard'), {
  loading: () => <SkeletonPostCard />
});

export default function SectionContent() {
  const { slug } = useParams() as { slug: string };
  const { sections, getFilteredPosts, loading, settings } = useData();
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-1 py-6 sm:py-10 space-y-6">
        <div className="h-10 bg-surface-200 dark:bg-surface-800 rounded w-64 animate-pulse" />
        <div className={`${settings.features?.mobileColumns === 1 ? 'columns-1 sm:columns-2' : 'columns-2'} lg:columns-3 xl:columns-4 gap-1 px-0`}>
           {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="mb-1 inline-block w-full break-inside-avoid">
               <SkeletonPostCard />
             </div>
           ))}
        </div>
      </div>
    );
  }

  const section = sections.find(s => s.slug === slug || s.id === slug);
  if (!section) return notFound();

  const posts = getFilteredPosts(section);

  return (
    <div className="max-w-7xl mx-auto px-1 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold">{section.name}</h1>
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <span className="capitalize px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg">{section.type}</span>
          {section.aiTool && <span>AI Tool: {section.aiTool}</span>}
          {section.tag && <span>Tag: {section.tag}</span>}
          {section.category && <span>Category: {section.category}</span>}
        </div>
      </div>

      <div className={`${settings.features?.mobileColumns === 1 ? 'columns-1 sm:columns-2' : 'columns-2'} lg:columns-3 xl:columns-4 gap-1 px-0 mb-8`}>
        {posts.map((post, i) => (
          <div key={post.id} className="mb-1 inline-block w-full break-inside-avoid">
            <PostCard post={post} index={i} />
          </div>
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-800">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
            <LayoutTemplate className="w-8 h-8 text-surface-400" />
          </div>
          <p className="text-xl font-bold text-surface-600 dark:text-surface-300">No posts here yet</p>
          <p className="text-sm text-surface-400 mt-2 max-w-sm mb-6">Check back later for new curated prompts and content in this section.</p>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors shadow-sm cursor-pointer">
            Return Home
          </Link>
        </div>
      )}
    </div>
  );
}
