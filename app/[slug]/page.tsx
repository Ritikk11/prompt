// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 3600;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlugOrId, fetchPostSummaries, getSeoPageBySlug, isPublicPost, fetchSettings } from '@/lib/data';
import PostContent from '@/components/PostContent';
import PostCard from '@/components/PostCard';
import FilterChipRail from '@/components/FilterChipRail';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ScrollReveal from '@/components/ScrollReveal';
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
    const settings = await fetchSettings();
    const seoSettings = settings.seoSettings;
    return {
      title: seoPage.seoTitle || seoPage.title,
      description: seoPage.seoDescription || seoSettings?.defaultMetaDescription || `Discover best prompts for ${seoPage.title}`,
      openGraph: seoSettings?.defaultOgImage ? {
        title: seoPage.seoTitle || seoPage.title,
        description: seoPage.seoDescription || seoSettings?.defaultMetaDescription || `Discover best prompts for ${seoPage.title}`,
        images: [{ url: seoSettings.defaultOgImage }],
      } : undefined,
    };
  }

  const settings = await fetchSettings();
  const seoSettings = settings.seoSettings;
  const firstImageUrl = post!.images[0]?.url || '';
  const isBase64 = firstImageUrl.startsWith('data:');

  const templateTitle = (seoSettings?.metaTitleTemplate || '%post_title% | AI PromptMatrix')
    .replace(/%post_title%/g, post!.title)
    .replace(/%site_title%/g, settings.siteTitle || 'AI PromptMatrix');
  const metaTitle = post!.seoTitle || templateTitle;
  const metaDescription = post!.seoDescription || post!.description || seoSettings?.defaultMetaDescription || settings.siteDescription;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const ogImage = isBase64 ? `${siteUrl}/og-image.png` : firstImageUrl || seoSettings?.defaultOgImage || `${siteUrl}/og-image.png`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `${siteUrl}/${slug}`,
    },
    keywords: [...post!.tags, 'AI prompts', 'midjourney', 'dall-e'],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
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
        ) : seoPage.filterTags?.length ? (
          <ScrollReveal>
            <FilterChipRail posts={filteredPosts} tags={seoPage.filterTags} tools={[]} showTools={false} settings={settings} cardStyleOverride={seoPage.cardStyle} renderGrid />
          </ScrollReveal>
        ) : (
          <ScrollReveal>
            <div data-reveal-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start pt-8">
              {filteredPosts.map((candidate, index) => (
                <PostCard key={candidate.id} post={candidate} index={index} cardStyleOverride={seoPage.cardStyle} />
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    );
  }

  if (!post) notFound();

  let relatedPosts: Post[] = [];
  const [allPosts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  relatedPosts = allPosts
    .filter(p =>
      p.id !== post.id &&
      (p.status === 'published' || !p.status) &&
      p.visibility !== 'private' &&
      p.tags.some(t => post.tags.includes(t))
    )
    .slice(0, 4);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';
  const schemaType = post.schemaType || settings.seoSettings?.schemaType || 'Article';
  const mainImage = post.thumbnailUrl || post.images[0]?.url;
  
  const rawLogo = settings.siteLogo || '/icon-256x256.png';
  const publisherLogoUrl = rawLogo.startsWith('http') || rawLogo.startsWith('data:')
    ? rawLogo
    : `${siteUrl}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;

  const mainJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: schemaType === 'HowTo' ? `How to use ${post.title}` : post.title,
    // Article rich results key off `headline`, not `name`; HowTo uses `name`.
    ...(schemaType !== 'HowTo' ? { headline: post.title } : {}),
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
    dateModified: post.createdAt,
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
      <PostContent post={post} relatedPosts={relatedPosts} />
    </>
  );
}

// Empty array + dynamicParams default (true) is required for ISR to actually cache
// this route per-slug — without it, `revalidate` above is silently ignored and every
// request falls back to full SSR. See https://github.com/vercel/next.js/issues/62195
export function generateStaticParams() {
  return [];
}
