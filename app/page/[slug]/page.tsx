export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { getSeoPageBySlug, fetchPostSummaries, isPublicPost } from '@/lib/data';
import PostCard from '@/components/PostCard';
import type { Post } from '@/lib/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { matchesCategory, matchesTag, matchesTool } from '@/lib/sections';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seoPage = await getSeoPageBySlug(slug);

  if (!seoPage) {
    return {
      title: 'Page Not Found | AI Prompt Matrix',
      description: 'The requested page could not be found.',
    };
  }

  return {
    title: seoPage.seoTitle || seoPage.title,
    description: seoPage.seoDescription || `Discover best prompts for ${seoPage.title}`,
  };
}

export default async function SeoPublicPage({ params }: Props) {
  const { slug } = await params;
  
  const [seoPage, allPosts] = await Promise.all([
    getSeoPageBySlug(slug),
    fetchPostSummaries(),
  ]);

  if (!seoPage) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-surface-500">The SEO page you are looking for does not exist.</p>
      </div>
    );
  }

  const { tags = [], categories = [], aiTools = [] } = seoPage;

  // Filter ONLY show posts that match ALL of the selected tags AND ALL of the selected categories AND ALL of the selected aiTools
  const filteredPosts = (allPosts as Post[]).filter(post => {
    if (!isPublicPost(post)) return false;

    const hasAllTags = tags.every((tag: string) => matchesTag(post, tag));
    if (!hasAllTags) return false;

    const hasAllCategories = categories.every((category: string) => matchesCategory(post, category));
    if (categories.length > 0 && !hasAllCategories) return false;

    const hasAllAiTools = aiTools.every((tool: string) => matchesTool(post, tool));
    if (aiTools.length > 0 && !hasAllAiTools) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">{seoPage.title}</h1>
        {seoPage.seoDescription && (
          <p className="text-surface-500 dark:text-surface-400 text-base md:text-lg">{seoPage.seoDescription}</p>
        )}
      </div>
      {seoPage.introContent && (
        <div className="max-w-3xl mx-auto mb-10">
          <MarkdownRenderer>{seoPage.introContent}</MarkdownRenderer>
        </div>
      )}
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-500">No posts found matching the criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start pt-8">
          {filteredPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
