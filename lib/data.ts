import { createClient } from './supabase-server';
import type { Post, Section, SiteSettings } from './types';
import { seedPosts, seedSections } from './data/seedData';

const defaultSettings: SiteSettings = {
  siteTitle: 'Ai PromptMatrix',
  siteDescription: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  siteLogo: '',
  heroTitle: 'Discover AI Prompt Masterpieces',
  heroSubtitle: 'Explore a curated collection of breathtaking AI-generated imagery and their full prompts. Learn, inspire, and create.',
  heroEnabled: true,
  heroAutoPlay: true,
  aiTools: ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
  features: {
    userProfiles: false,
    userSubmissions: false,
    userSubmissionsAutoApprove: false,
    comments: false,
    commentsRequireApproval: false,
    showCopyCollection: true,
    showHowTo: true,
    showRecommendedPosts: true,
    showTags: true,
    showDetailedInsights: true,
    advancedFiltering: false,
    smartTemplates: false,
    infiniteScroll: false,
    infiniteScrollItems: 20,
    premiumPrompts: false,
    premiumPrice: 5,
    premiumPaymentUrl: '',
    skeletonLoaders: false,
    trendingAlgorithm: false,
    trendingLikesWeight: 2,
    trendingViewsWeight: 1,
  }
};

export async function fetchPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('posts').select('data');
  if (error) {
    console.error('Supabase posts fetch error:', error);
    return [];
  }
  return (data || []).map(d => d.data as Post);
}

export function isPublicPost(post: Pick<Post, 'status' | 'visibility'>) {
  return (post.status === 'published' || !post.status) && post.visibility !== 'private';
}

function isInlineImage(url?: string) {
  return !!url && url.startsWith('data:image');
}

function sanitizeSettings(settings: SiteSettings): SiteSettings {
  const toolDetails = settings.toolDetails
    ? Object.fromEntries(
        Object.entries(settings.toolDetails).map(([tool, details]) => [
          tool,
          {
            ...details,
            logo: isInlineImage(details.logo) ? undefined : details.logo,
          },
        ])
      )
    : undefined;

  return {
    ...settings,
    siteLogo: isInlineImage(settings.siteLogo) ? '' : settings.siteLogo,
    toolDetails,
  };
}

function publicImageUrl(post: Post) {
  if (post.thumbnailUrl && !isInlineImage(post.thumbnailUrl)) return post.thumbnailUrl;
  const remoteImage = post.images?.find((image) => image.url && !isInlineImage(image.url));
  if (remoteImage?.url) return remoteImage.url;
  if (isInlineImage(post.thumbnailUrl) || post.images?.some((image) => isInlineImage(image.url))) {
    return `/api/image/${post.id}`;
  }
  return '';
}

export function toPostSummary(post: Post): Post {
  const imageUrl = publicImageUrl(post);
  const primaryImage = post.images?.[0];

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    thumbnailUrl: imageUrl,
    images: [
      {
        id: primaryImage?.id || post.id,
        url: imageUrl,
        prompt: '',
        aiTool: primaryImage?.aiTool || post.aiTools?.[0] || '',
        aiTools: primaryImage?.aiTools || post.aiTools,
        model: primaryImage?.model,
      },
    ],
    tags: post.tags || [],
    category: post.category,
    categories: post.categories,
    aiTools: post.aiTools,
    featured: post.featured,
    views: post.views,
    likes: post.likes,
    isPremium: post.isPremium,
    isTemplate: post.isTemplate,
    status: post.status,
    visibility: post.visibility,
    createdAt: post.createdAt,
  };
}

export async function fetchPostSummaries() {
  const posts = await fetchPosts();
  return posts.filter(isPublicPost).map(toPostSummary);
}

export async function fetchSections() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('sections').select('data');
  if (error) {
    console.error('Supabase sections fetch error:', error);
    return [];
  }
  return (data || []).map(d => d.data as Section);
}

export async function fetchSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('settings').select('data').eq('id', 'global').maybeSingle();
  if (error) {
    console.error('Supabase settings fetch error:', error);
    return defaultSettings;
  }
  if (data && data.data) {
    return sanitizeSettings({ ...defaultSettings, ...(data.data as Partial<SiteSettings>) });
  }
  return defaultSettings;
}

export async function getPostBySlugOrId(idOrSlug: string) {
  const posts = await fetchPosts();
  return posts.find((p) => p.slug === idOrSlug || p.id === idOrSlug) || null;
}

export async function getSectionBySlug(slug: string) {
  const sections = await fetchSections();
  return sections.find((s) => s.slug === slug || s.id === slug) || null;
}

export async function getPostsForSection(section: Section, settings: SiteSettings, allPosts?: Post[]) {
  // Fetch all posts if not provided - doing the filtering on the edge server side to avoid sending all to client
  // The posts are fetched directly from the database but filtered here before sending to <HomeSection>
  const posts = allPosts || await fetchPosts();
  let filtered = posts.filter(p => (p.status === 'published' || !p.status) && p.visibility !== 'private');
  
  // Apply section specific filtering
  switch (section.type) {
    case 'ai-tool':
      filtered = filtered.filter(p => p.images.some(img => img.aiTool === section.aiTool));
      break;
    case 'tag':
      filtered = filtered.filter(p => p.tags.some(t => t.toLowerCase() === section.tag?.toLowerCase()));
      break;
    case 'category':
      filtered = filtered.filter(p => p.category?.toLowerCase() === section.category?.toLowerCase());
      break;
    case 'latest':
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popular':
      filtered = filtered.sort((a, b) => b.views - a.views);
      break;
    case 'trending':
      const viewsW = settings.features?.trendingViewsWeight ?? 1;
      const likesW = settings.features?.trendingLikesWeight ?? 2;
      filtered = filtered.sort((a, b) => (b.views * viewsW + b.likes * likesW) - (a.views * viewsW + a.likes * likesW));
      break;
    case 'custom':
      if (section.postIds && section.postIds.length > 0) {
        filtered = section.postIds
          .map(pid => posts.find(p => p.id === pid))
          .filter((p): p is Post => p !== undefined && (p.status === 'published' || !p.status) && p.visibility !== 'private');
      }
      break;
  }
  
  // Apply limit constraints server side
  const limit = section.limit || 12;
  return section.type === 'latest' ? filtered : filtered.slice(0, limit);
}

export async function fetchSeoPages() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('seopages').select('data');
  if (error) {
    console.error('Supabase seo pages fetch error:', error);
    return [];
  }
  return (data || []).map(d => d.data);
}

export async function getSeoPageBySlug(slug: string) {
  const pages = await fetchSeoPages();
  return pages.find((p: any) => p.slug === slug || p.id === slug) || null;
}
