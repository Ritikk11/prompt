export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { getSeoPageBySlugREST, getAllPostsREST } from '@/lib/firebase-rest';
import PostCard from '@/components/PostCard';
import type { Post } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seoPage = await getSeoPageBySlugREST(slug);

  if (!seoPage) {
    return {
      title: 'Page Not Found | AI Prompt Matrix',
      description: 'The requested page could not be found.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

  return {
    title: seoPage.title,
    description: `Discover best prompts for ${seoPage.title}`,
  };
}

export default async function SeoPublicPage({ params }: Props) {
  const { slug } = await params;
  
  const [seoPage, allPosts] = await Promise.all([
    getSeoPageBySlugREST(slug),
    getAllPostsREST(),
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
    // Check tags: post.tags must contain all seoPage.tags
    const hasAllTags = tags.every((t: string) => 
      post.tags?.some(postTag => postTag.toLowerCase() === t.toLowerCase())
    );
    if (!hasAllTags) return false;

    // Check categories: post.category must match or post.categories array must contain all seoPage.categories
    // Assuming post has a single 'category', but the prompt says 'categories array' for SEO page. 
    // This could mean we treat post.category as a single item or an array, let's just check if post.category is inside or matches
    const hasAllCategories = categories.every((c: string) => {
      if (post.category && post.category.toLowerCase() === c.toLowerCase()) return true;
      if (post.categories?.some(cat => cat.toLowerCase() === c.toLowerCase())) return true;
      return false;
    });
    if (categories.length > 0 && !hasAllCategories) return false;

    // Check aiTools: post.images must contain an image that uses the specific aiTool
    // Or post itself must have an aiTool matching.
    const postAiTools = Array.from(new Set([
      ...(post.images?.map(img => img.aiTool?.toLowerCase() || '') || []),
      ...(post.aiTools?.map(tool => tool.toLowerCase() || '') || [])
    ]));
    const hasAllAiTools = aiTools.every((tool: string) => 
      postAiTools.includes(tool.toLowerCase().trim())
    );
    if (aiTools.length > 0 && !hasAllAiTools) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">{seoPage.title}</h1>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-500">No posts found matching the criteria.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pt-8">
          {filteredPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
