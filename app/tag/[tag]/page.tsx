// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 43200;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TagContent from './TagContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import { formatTitleWithBrand } from '@/lib/seo-helpers';

interface Props {
  params: Promise<{ tag: string }>;
}

type PostSummary = Awaited<ReturnType<typeof fetchPostSummaries>>[number];

function getPublicTagPosts(posts: PostSummary[], tag: string) {
  const normalizedTag = tag.trim().toLowerCase();

  if (!normalizedTag) return [];

  return posts.filter(post =>
    (post.status === 'published' || !post.status) &&
    post.visibility !== 'private' &&
    post.tags.some(item => item.toLowerCase() === normalizedTag)
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag).trim();
  const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const discovery = settings.discoveryPages || {};
  const count = getPublicTagPosts(posts, decodedTag).length;
  const siteTitle = settings.siteTitle || 'AI PromptMatrix';

  if (count === 0) {
    return {
      title: formatTitleWithBrand('Tag not found', siteTitle),
      robots: { index: false, follow: false },
    };
  }

  const rawTitle = fillDiscoveryTemplate(
    discovery.tagSeoTitleTemplate || discovery.tagTitleTemplate || '%tag% AI Prompts',
    { tag: decodedTag, count, site_title: siteTitle }
  );
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const description = fillDiscoveryTemplate(
    discovery.tagSeoDescriptionTemplate || discovery.tagDescriptionTemplate || 'Browse curated AI prompts for %tag%.',
    { tag: decodedTag, count, site_title: siteTitle }
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aipromptmatrix.in';

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${siteUrl}/tag/${encodeURIComponent(decodedTag)}` },
    keywords: [decodedTag, 'AI prompts', 'chatgpt prompts', 'gemini prompts', 'grok prompts', 'qwen prompts'],
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'website',
      url: `${siteUrl}/tag/${encodeURIComponent(decodedTag)}`,
      ...(settings.seoSettings?.defaultOgImage ? { images: [{ url: settings.seoSettings.defaultOgImage }] } : {}),
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag).trim();
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();

  if (getPublicTagPosts(posts, decodedTag).length === 0) {
    notFound();
  }
  
  return <TagContent posts={posts} settings={settings} />;
}

export async function generateStaticParams() {
  try {
    const posts = await fetchPostSummaries();
    const tagSet = new Set<string>();
    (posts || []).forEach(p => (p.tags || []).forEach(t => {
      const clean = t.trim();
      if (clean) tagSet.add(clean.toLowerCase());
    }));
    return Array.from(tagSet).map(tag => ({ tag }));
  } catch (error) {
    console.error('generateStaticParams error in tag:', error);
    return [];
  }
}
