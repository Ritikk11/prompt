export const revalidate = 300;

import { Metadata } from 'next';
import ToolContent from './ToolContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import { getAllTools } from '@/lib/constants';

interface Props {
  params: Promise<{ tool: string }>;
}

function getDisplayTool(tool: string, posts: Awaited<ReturnType<typeof fetchPostSummaries>>, settings: Awaited<ReturnType<typeof fetchSettings>>) {
  const normalizedTool = tool.toLowerCase();
  const fromSettings = Object.keys(settings.toolDetails || {}).find(name => name.toLowerCase() === normalizedTool);
  if (fromSettings) return fromSettings;

  for (const post of posts) {
    const match = getAllTools(post).find(name => name.toLowerCase() === normalizedTool);
    if (match) return match;
  }

  return tool
    .split(/([\s-]+)/)
    .map(part => part.toLowerCase() === 'chatgpt' ? 'ChatGPT' : part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const decodedTool = decodeURIComponent(tool);
  const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const displayTool = getDisplayTool(decodedTool, posts, settings);
  const discovery = settings.discoveryPages || {};
  const count = posts.filter(post =>
    (post.status === 'published' || !post.status) &&
    post.visibility !== 'private' &&
    ((post.aiTools || []).some(item => item.toLowerCase() === decodedTool.toLowerCase()) ||
      post.images.some(image => (image.aiTools || [image.aiTool]).filter(Boolean).some(item => item.toLowerCase() === decodedTool.toLowerCase())))
  ).length;
  const title = fillDiscoveryTemplate(
    discovery.toolSeoTitleTemplate || discovery.toolTitleTemplate || 'Best %tool% AI Prompts | AI PromptMatrix',
    { tool: displayTool, count }
  );
  const description = fillDiscoveryTemplate(
    discovery.toolSeoDescriptionTemplate || discovery.toolDescriptionTemplate || 'Explore the best AI prompts and images for %tool%.',
    { tool: displayTool, count }
  );
  
  return {
    title,
    description,
    keywords: [displayTool, 'AI prompts', 'templates'],
  };
}

export default async function ToolPage({ params }: Props) {
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();
  
  return <ToolContent posts={posts} settings={settings} />;
}

// Empty array is required for ISR to actually cache this route per-tool — without it,
// `revalidate` above is silently ignored and every request falls back to full SSR.
export function generateStaticParams() {
  return [];
}
