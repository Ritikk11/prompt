export const runtime = 'edge';
export const revalidate = 3600;

import { Metadata } from 'next';
import TagContent from './TagContent';
import { fetchPosts, fetchSettings } from '@/lib/data';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  return {
    title: `${decodedTag} AI Prompts | AI Prompt Matrix`,
    description: `Explore the best AI prompts and images for ${decodedTag}. Discover collections curated for ChatGPT, Midjourney, and more.`,
    keywords: [decodedTag, 'AI prompts', 'midjourney', 'dall-e'],
  };
}

export default async function TagPage({ params }: Props) {
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  return <TagContent posts={posts} settings={settings} />;
}
