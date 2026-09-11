// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 43200;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { preload, preconnect } from 'react-dom';
import { getPostBySlugOrId, fetchPostSummaries, getSeoPageBySlug, isPublicPost, fetchSettings } from '@/lib/data';
import { getPromptImageUrl, getThumbnailImageUrl } from '@/lib/image-url';
import PostContent from '@/components/PostContent';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ScrollReveal from '@/components/ScrollReveal';
import type { Post } from '@/lib/types';
import SeoPageContent from '@/components/SeoPageContent';
import { generateSeoPageMetadata, formatTitleWithBrand } from '@/lib/seo-helpers';
import { getRelatedPosts, getRecommendedPosts } from '@/lib/related-posts';

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Google skips meta descriptions it considers weak (too short, thin, or generic)
 * and substitutes visible page text — for us that meant the boilerplate site
 * description bleeding into prompt-page snippets. Pad genuinely short
 * descriptions with post-specific context so they're worth displaying.
 * Only ever extends; never rewrites an admin-provided description.
 */
const META_DESC_MIN_LENGTH = 110;
const META_DESC_MAX_LENGTH = 158;

function strengthenMetaDescription(desc: string, post: Post): string {
  const trimmed = desc.trim();
  if (trimmed.length === 0 || trimmed.length >= META_DESC_MIN_LENGTH) return trimmed;
  const suffix = ' Copy and customize it for your own AI images.';
  const combined = `${trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?') ? trimmed : `${trimmed}.`}${suffix}`.replace(/\s+/g, ' ');
  if (combined.length <= META_DESC_MAX_LENGTH) return combined;
  const cut = combined.slice(0, META_DESC_MAX_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
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
    const [settings, allPosts] = await Promise.all([fetchSettings(), fetchPostSummaries()]);
    const { tags = [], categories = [] } = seoPage;
    const matching = allPosts.filter(candidate => {
      if (!isPublicPost(candidate)) return false;
      if (tags.length > 0 && !tags.every((tag: string) => candidate.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase()))) return false;
      const candCats = [candidate.category, ...(candidate.categories || [])].filter((c): c is string => Boolean(c));
      if (categories.length > 0 && !categories.every((cat: string) => candCats.some((c: string) => c.toLowerCase() === cat.toLowerCase()))) return false;
      return true;
    });
    return generateSeoPageMetadata(seoPage, settings, matching);
  }

  const settings = await fetchSettings();
  const seoSettings = settings.seoSettings;
  const firstImageUrl = post!.images[0]?.url || '';
  const isBase64 = firstImageUrl.startsWith('data:');

  const siteTitle = settings.siteTitle || 'AI PromptMatrix';
  const rawTitle = post!.seoTitle || (seoSettings?.metaTitleTemplate || '%post_title%')
    .replace(/%post_title%/g, post!.title)
    .replace(/%site_title%/g, siteTitle);
  const metaTitle = formatTitleWithBrand(rawTitle, siteTitle);
  const metaDescription = strengthenMetaDescription(
    post!.seoDescription || post!.description || seoSettings?.defaultMetaDescription || settings.siteDescription || '',
    post!
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const ogImage = isBase64 ? `${siteUrl}/og-image.webp` : firstImageUrl || seoSettings?.defaultOgImage || `${siteUrl}/og-image.webp`;

  return {
    title: { absolute: metaTitle },
    description: metaDescription,
    alternates: {
      canonical: `${siteUrl}/${slug}`,
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
    keywords: [...post!.tags, 'AI prompts', 'chatgpt prompts', 'gemini prompts', 'grok prompts', 'qwen prompts'],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      siteName: siteTitle,
      type: 'article',
      url: `${siteUrl}/${slug}`,
      images: [
        {
          url: ogImage,
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
      site: seoSettings?.twitterHandle || undefined,
      images: ogImage ? [ogImage] : [],
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
    const [allPosts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
    const { tags = [], categories = [] } = seoPage;
    const matching = (allPosts as Post[]).filter(candidate => {
      if (!isPublicPost(candidate)) return false;
      if (tags.length > 0 && !tags.every((tag: string) => candidate.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase()))) return false;
      const candCats = [candidate.category, ...(candidate.categories || [])].filter((c): c is string => Boolean(c));
      if (categories.length > 0 && !categories.every((cat: string) => candCats.some((c: string) => c.toLowerCase() === cat.toLowerCase()))) return false;
      return true;
    });
    const sorted = [...matching].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const topPost = sorted[0];
    if (topPost) {
      const topImg = topPost.thumbnailUrl || topPost.images?.[0]?.url;
      if (topImg) {
        const topThumbnailUrl = getThumbnailImageUrl(topImg);
        if (topThumbnailUrl) {
          preload(topThumbnailUrl, {
            as: 'image',
            fetchPriority: 'high',
            referrerPolicy: 'no-referrer',
          });
        }
      }
    }
    return <SeoPageContent seoPage={seoPage} allPosts={allPosts as Post[]} settings={settings} />;
  }

  if (!post) notFound();

  const [allPosts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const relatedPosts = getRelatedPosts(post, allPosts as Post[], { limit: 16 });
  const recommendedPosts = getRecommendedPosts(post, allPosts as Post[], relatedPosts, { limit: 6 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const schemaType = post.schemaType || settings.seoSettings?.schemaType || 'Article';
  const mainImage = post.thumbnailUrl || post.images[0]?.url;

  // Preload the LCP candidates so the browser fetches them before PostContent
  // hydrates. Two candidates: the hero image (thumbnail) and the first gallery
  // image, which Lighthouse identifies as the mobile LCP element. The srcset
  // widths/sizes MUST match the strings in PostContent.tsx (heroImageSrcSet /
  // buildGallerySrcSet) or the browser fetches the LCP image twice — the
  // preload key is the fully resolved URL, which srcset selection changes.
  const buildSrcSet = (url: string | undefined, widths: number[]) =>
    url
      ? widths.map((w) => `${getPromptImageUrl(url, { width: w, quality: 78 })} ${w}w`).join(', ')
      : undefined;
  const galleryFirstImage = post.images[0]?.url;
  const isSameAsMain = galleryFirstImage && (galleryFirstImage === mainImage || !post.thumbnailUrl || post.thumbnailUrl === galleryFirstImage);
  const preloadTargets = [
    mainImage && {
      url: getPromptImageUrl(mainImage, { width: 1280, quality: 78 }),
      srcSet: buildSrcSet(mainImage, [480, 768, 1280]),
      sizes: '(max-width: 640px) 200px, (max-width: 1024px) 240px, 320px',
      priority: 'high' as const,
    },
    (!isSameAsMain && galleryFirstImage) && {
      url: getPromptImageUrl(galleryFirstImage, { width: 1100, quality: 78 }),
      srcSet: buildSrcSet(galleryFirstImage, [480, 768, 1100]),
      sizes: '(max-width: 768px) calc(100vw - 48px), 680px',
      priority: 'high' as const,
    },
    // The hero blurred background — same source, smaller size (720w q60).
    // PostContent.tsx line 473 generates this exact URL. Preloading it ensures
    // the ToolBadge's backdrop-blur has content to sample on first paint,
    // eliminating the "frost pop" (transparent → blurred bg) flash.
    // fetchPriority: low so it doesn't compete with the real LCP image above.
    mainImage && {
      url: getPromptImageUrl(mainImage, { width: 720, quality: 60 }),
      srcSet: undefined,
      sizes: '720px',
      priority: 'low' as const,
    },
  ].filter(Boolean) as { url: string; srcSet?: string; sizes: string; priority: 'high' | 'low' }[];
  const seenUrls = new Set<string>();
  for (const target of preloadTargets) {
    if (seenUrls.has(target.url)) continue;
    seenUrls.add(target.url);
    preload(target.url, {
      as: 'image',
      fetchPriority: target.priority,
      imageSrcSet: target.srcSet,
      imageSizes: target.sizes,
      referrerPolicy: 'no-referrer',
    });
    // Warm the cross-origin uploads host early when resizing is disabled and the
    // image is served straight from uploads.aipromptmatrix.in.
    try {
      const origin = new URL(target.url).origin;
      if (!origin.includes('aipromptmatrix.in') && !origin.includes('localhost')) {
        preconnect(origin);
      }
    } catch {
      // Relative/data URLs have no origin to preconnect — skip.
    }
  }
  
  const rawLogo = settings.siteLogo || '/icon-256x256.webp';
  const publisherLogoUrl = rawLogo.startsWith('http') || rawLogo.startsWith('data:')
    ? rawLogo
    : `${siteUrl}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;

  const mainJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: schemaType === 'HowTo' ? `How to use ${post.title}` : (post.seoTitle || post.title),
    // Article rich results key off `headline`, not `name`; HowTo uses `name`.
    ...(schemaType !== 'HowTo' ? { headline: post.seoTitle || post.title } : {}),
    description: post.description,
    author: {
      '@type': 'Organization',
      name: settings.siteTitle || 'AI PromptMatrix',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: settings.siteTitle || 'AI PromptMatrix',
      logo: {
        '@type': 'ImageObject',
        url: publisherLogoUrl,
      },
    },
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    url: `${siteUrl}/${post.slug || post.id}`,
  };

  if (post.images?.length) {
    mainJsonLd.image = post.images
      .filter((img: any) => img.url)
      .map((img: any) => ({
        '@type': 'ImageObject',
        url: img.url,
        contentUrl: img.url,
        name: img.prompt ? img.prompt.slice(0, 120) : post.title,
        description: img.prompt || post.description,
        creator: {
          '@type': 'Organization',
          name: settings.siteTitle || 'AI PromptMatrix',
          url: siteUrl,
        },
        creditText: settings.siteTitle || 'AI PromptMatrix',
        license: `${siteUrl}/terms`,
        acquireLicensePage: `${siteUrl}/contact`,
        copyrightNotice: `© ${new Date().getFullYear()} ${settings.siteTitle || 'AI PromptMatrix'}`,
      }));
  } else if (mainImage) {
    mainJsonLd.image = [{
      '@type': 'ImageObject',
      url: mainImage,
      contentUrl: mainImage,
      name: post.title,
      description: post.description,
      creator: {
        '@type': 'Organization',
        name: settings.siteTitle || 'AI PromptMatrix',
        url: siteUrl,
      },
      creditText: settings.siteTitle || 'AI PromptMatrix',
      license: `${siteUrl}/terms`,
      acquireLicensePage: `${siteUrl}/contact`,
      copyrightNotice: `© ${new Date().getFullYear()} ${settings.siteTitle || 'AI PromptMatrix'}`,
    }];
  }

  if (schemaType === 'HowTo') {
    mainJsonLd.step = [
      'Open the AI tool listed with the prompt.',
      'Copy the prompt.',
      'Upload a reference image if the prompt asks for one.',
      'Customize placeholders, names, colors, or style notes.',
      'Paste the prompt and generate the artwork.',
    ].map((name, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name,
    }));
  }
  const faqJsonLd = post.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs
      .filter(faq => faq.question?.trim() && faq.answer?.trim())
      .map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
  } : null;

  let breadcrumbJsonLd = null;
  if (settings.seoSettings?.enableBreadcrumbList !== false) {
    const primaryTool = post.aiTools?.[0] || post.images?.[0]?.aiTool || '';
    const toolSlug = primaryTool.toLowerCase().replace(/[\s-]+/g, '-');

    const items: { name: string; item: string }[] = [
      { name: 'Home', item: siteUrl },
      { name: 'Prompts', item: `${siteUrl}/explore` },
    ];

    if (primaryTool) {
      items.push({ name: primaryTool, item: `${siteUrl}/tool/${toolSlug}` });
    }

    items.push({ name: post.title, item: `${siteUrl}/${post.slug || post.id}` });

    breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((entry, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: entry.name,
        item: entry.item,
      })),
    };
  }

  return (
    <>
      {(settings.seoSettings?.enableJsonLd ?? settings.features?.showFaqSchema ?? true) && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(mainJsonLd) }}
          />
          {breadcrumbJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
          )}
          {faqJsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
          )}
        </>
      )}
      <PostContent post={post} relatedPosts={relatedPosts} recommendedPosts={recommendedPosts} />
    </>
  );
}

// Empty array + dynamicParams default (true) is required for ISR to actually cache
// this route per-slug — without it, `revalidate` above is silently ignored and every
// request falls back to full SSR. See https://github.com/vercel/next.js/issues/62195
export function generateStaticParams() {
  return [];
}
