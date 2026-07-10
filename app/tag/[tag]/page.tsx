export const revalidate = 300;

import { Metadata } from 'next';
import TagContent from './TagContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const discovery = settings.discoveryPages || {};
  const count = posts.filter(post =>
    (post.status === 'published' || !post.status) &&
    post.visibility !== 'private' &&
    post.tags.some(item => item.toLowerCase() === decodedTag.toLowerCase())
  ).length;
  const title = fillDiscoveryTemplate(
    discovery.tagSeoTitleTemplate || discovery.tagTitleTemplate || '%tag% AI Prompts | AI PromptMatrix',
    { tag: decodedTag, count }
  );
  const description = fillDiscoveryTemplate(
    discovery.tagSeoDescriptionTemplate || discovery.tagDescriptionTemplate || 'Browse curated AI prompts for %tag%.',
    { tag: decodedTag, count }
  );
  
  return {
    title,
    description,
    keywords: [decodedTag, 'AI prompts', 'midjourney', 'dall-e'],
  };
}

export default async function TagPage({ params }: Props) {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <TagContent posts={posts} settings={settings} />;
}

// Empty array is required for ISR to actually cache this route per-tag — without it,
// `revalidate` above is silently ignored and every request falls back to full SSR.
export function generateStaticParams() {
  return [];
}
