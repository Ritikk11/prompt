import { createClient } from './supabase-server';
import type { Post, Section, SiteSettings } from './types';
import { seedPosts, seedSections } from './data/seedData';
import { filterPostsForSection } from './sections';
import { getThumbnailImageUrl } from './image-url';

const defaultSettings: SiteSettings = {
  siteTitle: 'AI PromptMatrix',
  siteDescription: 'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.',
  siteLogo: '',
  heroTitle: 'Discover AI Prompt Masterpieces',
  heroSubtitle: 'Explore a curated collection of breathtaking AI-generated imagery and their full prompts. Learn, inspire, and create.',
  heroEnabled: true,
  heroAutoPlay: true,
  aiTools: ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
  headerLinks: [],
  homeLinkBlocks: [],
  footerLinkGroups: [
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'DMCA Notice', href: '/dmca' },
        { label: 'Disclaimer', href: '/disclaimer' },
      ],
    },
    {
      title: 'Platform',
      links: [
        { label: 'Explore', href: '/explore' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
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

function isNextDynamicServerError(error: unknown) {
  const err = error as { digest?: string; message?: string };
  return err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage');
}

export async function fetchPosts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('posts').select('data');
    if (error) {
      console.error('Supabase posts fetch error:', error);
      return [];
    }
    return (data || []).map(d => d.data as Post).filter(Boolean);
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase posts fetch error:', error);
    return [];
  }
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
  const imageUrl = getThumbnailImageUrl(publicImageUrl(post));
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
    comments: (post.comments || []).filter((comment) => comment.status === 'approved'),
    bookmarkedByUser: undefined,
    bookmarkedBy: undefined,
    isPremium: post.isPremium,
    isTemplate: post.isTemplate,
    status: post.status,
    visibility: post.visibility,
    createdAt: post.createdAt,
  };
}

export function toPublicPost(post: Post): Post {
  return {
    ...post,
    comments: (post.comments || []).filter((comment) => comment.status === 'approved'),
    bookmarkedBy: undefined,
    bookmarkedByUser: undefined,
  };
}

export async function fetchPostSummaries() {
  const posts = await fetchPosts();
  return posts.filter(isPublicPost).map(toPostSummary);
}

export async function fetchSections() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('sections').select('data');
    if (error) {
      console.error('Supabase sections fetch error:', error);
      return [];
    }
    return (data || []).map(d => d.data as Section).filter(Boolean);
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase sections fetch error:', error);
    return [];
  }
}

export async function fetchSettings() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('settings').select('data').eq('id', 'global').maybeSingle();
    if (error) {
      console.error('Supabase settings fetch error:', error);
      return defaultSettings;
    }
    if (data && data.data) {
      return sanitizeSettings({ ...defaultSettings, ...(data.data as Partial<SiteSettings>) });
    }
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase settings fetch error:', error);
  }
  return defaultSettings;
}

export async function getPostBySlugOrId(idOrSlug: string) {
  const posts = await fetchPosts();
  const post = posts.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
  return post ? toPublicPost(post) : null;
}

export async function getSectionBySlug(slug: string) {
  const sections = await fetchSections();
  return sections.find((s) => s.slug === slug || s.id === slug) || null;
}

export async function getPostsForSection(section: Section, settings: SiteSettings, allPosts?: Post[]) {
  const posts = allPosts || await fetchPosts();
  return filterPostsForSection(section, posts, settings, true);
}

export async function fetchSeoPages() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('seoPages').select('data');
    if (error) {
      console.error('Supabase seo pages fetch error:', error);
      return [];
    }
    return (data || []).map(d => d.data).filter(Boolean);
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase seo pages fetch error:', error);
    return [];
  }
}

export async function getSeoPageBySlug(slug: string) {
  const pages = await fetchSeoPages();
  return pages.find((p: any) => p.slug === slug || p.id === slug) || null;
}
