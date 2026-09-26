// 1h TTL: on-demand revalidation (admin edits) refreshes pages instantly, so the
// time-based fallback only bounds staleness of view/like counts, which update the
// DB without revalidatePath. 300s caused a cold ~2.5s SSR miss every 5 minutes.
export const revalidate = 43200;

import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ToolContent from './ToolContent';
import { fetchPostSummaries, fetchSettings } from '@/lib/data';
import { fillDiscoveryTemplate } from '@/lib/discovery-pages';
import { formatTitleWithBrand, generateCollectionJsonLd } from '@/lib/seo-helpers';
import { stringifyJsonLd } from '@/lib/json-ld';
import { getAllTools, getActiveTools, isToolActive } from '@/lib/constants';

interface Props {
  params: Promise<{ tool: string }>;
}

type PostSummary = Awaited<ReturnType<typeof fetchPostSummaries>>[number];

function findToolKey(tool: string, settings: Awaited<ReturnType<typeof fetchSettings>>): string | null {
  const normalized = tool.trim().toLowerCase();
  if (!normalized) return null;

  const fromDetails = Object.keys(settings.toolDetails || {}).find(name => {
    if (name.toLowerCase() === normalized) return true;
    const slug = (settings.toolDetails?.[name] as any)?.slug;
    return slug && slug.toLowerCase() === normalized;
  });
  if (fromDetails) return fromDetails;

  const fromAiTools = (settings.aiTools || []).find(name => name.toLowerCase() === normalized);
  if (fromAiTools) return fromAiTools;

  return null;
}

// Active tools configured in settings get a page; inactive tools return 404 (notFound).
function isKnownTool(tool: string, posts: PostSummary[], settings: Awaited<ReturnType<typeof fetchSettings>>) {
  const normalizedTool = tool.trim().toLowerCase();
  if (!normalizedTool) return false;

  const toolKey = findToolKey(tool, settings);
  if (toolKey) {
    if (!isToolActive(toolKey, settings.toolDetails)) return false;
    return true;
  }

  const publicPosts = getPublicToolPosts(posts, tool);
  if (publicPosts.length > 0) {
    return isToolActive(tool, settings.toolDetails);
  }

  return false;
}

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
  const toolKey = findToolKey(tool, settings);
  if (toolKey) return toolKey;

  const normalizedTool = tool.trim().toLowerCase();
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

  if (!isKnownTool(decodedTool, posts, settings)) {
    return {
      title: 'Tool not found',
      robots: { index: false, follow: false },
    };
  }

  const toolDetails = settings.toolDetails?.[displayTool] || {};
  
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const rawTitle = fillDiscoveryTemplate(
    toolDetails.seoTitle || discovery.toolSeoTitleTemplate || discovery.toolTitleTemplate || 'Best %tool% AI Prompts',
    { tool: displayTool, count, site_title: siteTitle }
  );
  const title = formatTitleWithBrand(rawTitle, siteTitle);
  const description = fillDiscoveryTemplate(
    toolDetails.seoDescription || discovery.toolSeoDescriptionTemplate || discovery.toolDescriptionTemplate || 'Explore the best AI prompts and images for %tool%.',
    { tool: displayTool, count, site_title: siteTitle }
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${siteUrl}/tool/${encodeURIComponent(decodedTool.toLowerCase())}` },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      type: 'website',
      url: `${siteUrl}/tool/${encodeURIComponent(decodedTool.toLowerCase())}`,
      ...(settings.seoSettings?.defaultOgImage ? { images: [{ url: settings.seoSettings.defaultOgImage }] } : {}),
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { tool } = await params;
  const decodedTool = decodeURIComponent(tool).trim();
  // Canonicalize to lowercase so /tool/ChatGPT and /tool/chatgpt don't both get
  // indexed. generateStaticParams only emits lowercase; a mixed-case request is
  // rendered on demand, caught here, and 301'd to the lowercase URL.
  if (decodedTool && decodedTool !== decodedTool.toLowerCase()) {
    permanentRedirect(`/tool/${encodeURIComponent(decodedTool.toLowerCase())}`);
  }
  const posts = await fetchPostSummaries();
  const settings = await fetchSettings();

  if (!isKnownTool(decodedTool, posts, settings)) {
    notFound();
  }

  const displayTool = getDisplayTool(decodedTool, posts, settings);
  const matchingPosts = getPublicToolPosts(posts, decodedTool);
  const siteTitle = settings.siteTitle || 'PromptSoul';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://promptsoul.in';
  const toolDetails = settings.toolDetails?.[displayTool] || {};
  const discovery = settings.discoveryPages || {};

  const pageTitle = fillDiscoveryTemplate(
    toolDetails.seoTitle || discovery.toolSeoTitleTemplate || discovery.toolTitleTemplate || 'Best %tool% AI Prompts',
    { tool: displayTool, count: matchingPosts.length, site_title: siteTitle }
  );
  const description = fillDiscoveryTemplate(
    toolDetails.seoDescription || discovery.toolSeoDescriptionTemplate || discovery.toolDescriptionTemplate || 'Explore the best AI prompts and images for %tool%.',
    { tool: displayTool, count: matchingPosts.length, site_title: siteTitle }
  );

  const jsonLd = generateCollectionJsonLd({
    title: pageTitle,
    description,
    url: `${siteUrl}/tool/${encodeURIComponent(decodedTool.toLowerCase())}`,
    posts: matchingPosts,
    siteTitle,
    siteUrl,
  });
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
      />
      <ToolContent posts={posts} settings={settings} />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const [posts, settings] = await Promise.all([fetchPostSummaries(), fetchSettings()]);
    const tools = new Set<string>();
    getActiveTools(settings).forEach(t => {
      const slug = (settings.toolDetails?.[t] as any)?.slug || t.toLowerCase();
      if (slug) tools.add(slug);
    });
    (posts || []).forEach(p => getAllTools(p).forEach(t => {
      if (t && isToolActive(t, settings.toolDetails)) {
        tools.add(t.toLowerCase());
      }
    }));
    return Array.from(tools).filter(Boolean).map(tool => ({ tool }));
  } catch (error) {
    console.error('generateStaticParams error in tool:', error);
    return [];
  }
}
