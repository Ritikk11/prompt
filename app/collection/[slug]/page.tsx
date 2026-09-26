export const revalidate = 43200;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlugOrId, fetchPostSummaries, fetchSettings, isPublicPost } from '@/lib/data';
import { getClientSettings } from '@/lib/constants';
import { formatTitleWithBrand } from '@/lib/seo-helpers';
import { stringifyJsonLd } from '@/lib/json-ld';
import type { Post } from '@/lib/types';
import CollectionArticleClient from './CollectionArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim();
  const [post, settings] = await Promise.all([
    getPostBySlugOrId(decodedSlug),
    fetchSettings(),
  ]);

  const siteTitle = settings.siteTitle || 'PromptSoul';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';

  if (!post) {
    return { title: formatTitleWithBrand('Collection Not Found', siteTitle) };
  }

  const title = formatTitleWithBrand(post.seoTitle || post.title, siteTitle);
  const description =
    post.seoDescription ||
    post.description ||
    `Explore ${post.title} — a curated AI prompt collection with tested prompts, parameters, and style tips.`;

  const ogImage = post.thumbnailUrl || settings.seoSettings?.defaultOgImage || `${siteUrl}/og-image.webp`;

  return {
    title: { absolute: title },
    description,
    keywords: [...(post.tags || []), 'AI Prompts', 'ChatGPT Prompts', 'Gemini Prompts', 'Curated Prompts', 'Prompt Collection'],
    alternates: {
      canonical: `${siteUrl}/collection/${post.slug || post.id}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'article',
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt || post.createdAt,
      url: `${siteUrl}/collection/${post.slug || post.id}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim();
  const [post, allPosts, settings] = await Promise.all([
    getPostBySlugOrId(decodedSlug),
    fetchPostSummaries(),
    fetchSettings(),
  ]);

  if (!post) notFound();

  const siteTitle = settings.siteTitle || 'PromptSoul';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';
  const items = post.roundupItems || [];

  // Filter other posts for the bottom "Related" section
  const relatedPosts = (allPosts as Post[])
    .filter((p) => p.id !== post.id && isPublicPost(p))
    .slice(0, 6);

  // Schema.org Article & ItemList for rich Google results
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    mainEntityOfPage: `${siteUrl}/collection/${post.slug || post.id}`,
    author: {
      '@type': 'Organization',
      name: siteTitle,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteTitle,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon-256x256.webp`,
      },
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: post.title,
    description: post.description,
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.title,
      description: item.description || item.prompt,
      image: item.imageUrl,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: `${siteUrl}/explore` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/collection/${post.slug || post.id}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbJsonLd) }}
      />
      <CollectionArticleClient
        post={post}
        settings={getClientSettings(settings)}
        relatedPosts={relatedPosts}
        siteUrl={siteUrl}
      />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const posts = (await fetchPostSummaries()) as Post[];
    return posts
      .filter((p) => p.postType === 'roundup' || p.category === 'Collection' || p.categories?.includes('Collection'))
      .map((p) => ({ slug: p.slug || p.id }));
  } catch (err) {
    console.error('generateStaticParams error in collection:', err);
    return [];
  }
}
