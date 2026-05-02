export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TagContent from './TagContent';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  return {
    title: `${decodedTag} AI Prompts | PromptVault`,
    description: `Explore the best AI prompts and images for ${decodedTag}. Discover collections curated for ChatGPT, Midjourney, and more.`,
    keywords: [decodedTag, 'AI prompts', 'midjourney', 'dall-e'],
  };
}

export default function TagPage() {
  return <TagContent />;
}
