export const runtime = 'edge';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TagContent from './TagContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  return {
    title: `${decodedTag} AI Prompts | AI PromptMatrix`,
    description: `Explore the best AI prompts and images for ${decodedTag}. Discover collections curated for ChatGPT, Midjourney, and more.`,
    keywords: [decodedTag, 'AI prompts', 'midjourney', 'dall-e'],
  };
}

export default async function TagPage({ params }: Props) {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <TagContent posts={posts} settings={settings} />;
}
