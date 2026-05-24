export const runtime = 'edge';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import ToolContent from './ToolContent';
import { fetchPosts, fetchSettings } from '@/lib/data';

interface Props {
  params: Promise<{ tool: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const decodedTool = decodeURIComponent(tool);
  
  return {
    title: `Best ${decodedTool} AI Prompts | AI Prompt Matrix`,
    description: `Explore the best AI prompts and images for ${decodedTool}. Discover collections curated for advanced text generation, image creation, and more.`,
    keywords: [decodedTool, 'AI prompts', 'templates'],
  };
}

export default async function ToolPage({ params }: Props) {
  const posts = await fetchPosts();
  const settings = await fetchSettings();
  
  return <ToolContent posts={posts} settings={settings} />;
}
