export const revalidate = 300;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ToolContent from './ToolContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import { getAllTools } from '@/lib/constants';

interface Props {
  params: Promise<{ tool: string }>;
}

type PostSummary = Awaited<ReturnType<typeof fetchPostSummaries>>[number];

function getPublicToolPosts(posts: PostSummary[], tool: string) {
  const normalizedTool = tool.trim().toLowerCase();

  if (!normalizedTool) return [];

  return posts.filter(post =>
    (post.status === 'published' || !post.status) &&
    post.visibility !== 'private' &&
    getAllTools(post).some(item => item.toLowerCase() === normalizedTool)
  );
}

function getDisplayTool(tool: string, posts: Awaited<ReturnType<typeof fetchPostSummaries>>, settings: Awaited<ReturnType<typeof fetchSettings>>) {
  const normalizedTool = tool.trim().toLowerCase();
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
  const decodedTool = decodeURIComponent(tool).trim();
  const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
  const displayTool = getDisplayTool(decodedTool, posts, settings);
  const discovery = settings.discoveryPages || {};
  const count = getPublicToolPosts(posts, decodedTool).length;

  if (count === 0) {
    return {
      title: 'Tool not found',
      robots: { index: false, follow: false },
    };
  }

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
  const { tool } = await params;
  const decodedTool = decodeURIComponent(tool).trim();
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();

  if (getPublicToolPosts(posts, decodedTool).length === 0) {
    notFound();
  }
  
  return <ToolContent posts={posts} settings={settings} />;
}

// Empty array is required for ISR to actually cache this route per-tool — without it,
// `revalidate` above is silently ignored and every request falls back to full SSR.
export function generateStaticParams() {
  return [];
}
