export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { getPostBySlugOrIdREST, getSettingsREST } from '@/lib/firebase-rest';
import PostContent from './PostContent';
import type { Post, SiteSettings } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugOrIdREST(slug);

  if (!post) {
    return {
      title: 'Post Not Found | AI Prompt Matrix',
      description: 'The requested AI prompt could not be found.',
    };
  }

  const firstImageUrl = post.images[0]?.url || '';
  const isBase64 = firstImageUrl.startsWith('data:');

  const metaTitle = post.seoTitle || `${post.title} | AI Prompts - AI Prompt Matrix`;
  const metaDescription = post.seoDescription || post.description;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [...post.tags, 'AI prompts', 'midjourney', 'dall-e'],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      url: `${siteUrl}/post/${slug}`,
      images: [
        {
          url: isBase64 ? `${siteUrl}/placeholder-image.png` : firstImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
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
  const [post, settings] = await Promise.all([
    getPostBySlugOrIdREST(slug),
    getSettingsREST()
  ]);

  return <PostContent initialPost={post as Post | null} initialSettings={settings as SiteSettings | null} />;
}
