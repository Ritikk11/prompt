export const runtime = 'edge';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import ToolContent from './ToolContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';

interface Props {
  params: Promise<{ tool: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const decodedTool = decodeURIComponent(tool);
  const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const discovery = settings.discoveryPages || {};
  const count = posts.filter(post =>
    (post.status === 'published' || !post.status) &&
    post.visibility !== 'private' &&
    ((post.aiTools || []).some(item => item.toLowerCase() === decodedTool.toLowerCase()) ||
      post.images.some(image => (image.aiTools || [image.aiTool]).filter(Boolean).some(item => item.toLowerCase() === decodedTool.toLowerCase())))
  ).length;
  const title = fillDiscoveryTemplate(
    discovery.toolSeoTitleTemplate || discovery.toolTitleTemplate || 'Best %tool% AI Prompts | AI PromptMatrix',
    { tool: decodedTool, count }
  );
  const description = fillDiscoveryTemplate(
    discovery.toolSeoDescriptionTemplate || discovery.toolDescriptionTemplate || 'Explore the best AI prompts and images for %tool%.',
    { tool: decodedTool, count }
  );
  
  return {
    title,
    description,
    keywords: [decodedTool, 'AI prompts', 'templates'],
  };
}

export default async function ToolPage({ params }: Props) {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <ToolContent posts={posts} settings={settings} />;
}
