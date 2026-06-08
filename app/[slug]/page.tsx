export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlugOrId, fetchPostSummaries, getSeoPageBySlug, isPublicPost } from '@/lib/data';
import PostContent from '@/components/PostContent';
import PostCard from '@/components/PostCard';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { Post } from '@/lib/types';
import { matchesCategory, matchesTag, matchesTool } from '@/lib/sections';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugOrId(slug);
  const seoPage = post ? null : await getSeoPageBySlug(slug);

  if (!post && !seoPage) {
    return {
      title: 'Page Not Found | AI PromptMatrix',
      description: 'The requested page could not be found.',
    };
  }

  if (seoPage) {
    return {
      title: seoPage.seoTitle || seoPage.title,
      description: seoPage.seoDescription || `Discover best prompts for ${seoPage.title}`,
    };
  }

  const firstImageUrl = post!.images[0]?.url || '';
  const isBase64 = firstImageUrl.startsWith('data:');

  const metaTitle = post!.seoTitle || `${post!.title} | AI Prompts - AI PromptMatrix`;
  const metaDescription = post!.seoDescription || post!.description;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [...post!.tags, 'AI prompts', 'midjourney', 'dall-e'],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      url: `${siteUrl}/${slug}`,
      images: [
        {
          url: isBase64 ? `${siteUrl}/placeholder-image.png` : firstImageUrl,
          width: 1200,
          height: 630,
          alt: post!.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: isBase64 ? [] : [firstImageUrl],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, seoPage] = await Promise.all([
    getPostBySlugOrId(slug),
    getSeoPageBySlug(slug),
  ]);

  if (!post && seoPage) {
    const allPosts = await fetchPostSummaries();
    const { tags = [], categories = [], aiTools = [] } = seoPage;
    const filteredPosts = (allPosts as Post[]).filter(candidate => {
      if (!isPublicPost(candidate)) return false;
      if (!tags.every((tag: string) => matchesTag(candidate, tag))) return false;
      if (categories.length > 0 && !categories.every((category: string) => matchesCategory(candidate, category))) return false;
      if (aiTools.length > 0 && !aiTools.every((tool: string) => matchesTool(candidate, tool))) return false;
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
            {filteredPosts.map((candidate, index) => (
              <PostCard key={candidate.id} post={candidate} index={index} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!post) notFound();

  let relatedPosts: Post[] = [];
  const allPosts = await fetchPostSummaries();
  relatedPosts = allPosts
    .filter(p =>
      p.id !== post.id &&
      (p.status === 'published' || !p.status) &&
      p.visibility !== 'private' &&
      p.tags.some(t => post.tags.includes(t))
    )
    .slice(0, 4);

  return <PostContent post={post} relatedPosts={relatedPosts} />;
}
