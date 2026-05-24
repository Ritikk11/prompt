import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { Post, Section, SiteSettings } from './types';

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

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Key is missing. Check your environment variables.');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

const cachedPosts = unstable_cache(async () => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('posts').select('data');
  if (error) {
    console.error('Supabase posts fetch error:', error);
    return [];
  }
  return (data || []).map(d => d.data as Post);
}, ['posts'], { tags: ['posts', 'content'] });

const cachedSections = unstable_cache(async () => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('sections').select('data');
  if (error) {
    console.error('Supabase sections fetch error:', error);
    return [];
  }
  return (data || []).map(d => d.data as Section);
}, ['sections'], { tags: ['sections', 'content'] });

const cachedSettings = unstable_cache(async () => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return defaultSettings;

  const { data, error } = await supabase.from('settings').select('data').eq('id', 'global').maybeSingle();
  if (error) {
    console.error('Supabase settings fetch error:', error);
    return defaultSettings;
  }
  if (data && data.data) {
    return { ...defaultSettings, ...(data.data as Partial<SiteSettings>) };
  }
  return defaultSettings;
}, ['settings'], { tags: ['settings', 'content'] });

export async function fetchPosts() {
  return cachedPosts();
}

export async function fetchSections() {
  return cachedSections();
}

export async function fetchSettings() {
  return cachedSettings();
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

const cachedSeoPages = unstable_cache(async () => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('seopages').select('data');
  if (error) {
    console.error('Supabase seo pages fetch error:', error);
    return [];
  }
  return (data || []).map(d => d.data);
}, ['seo-pages'], { tags: ['seo-pages', 'content'] });

export async function fetchSeoPages() {
  return cachedSeoPages();
}

export async function getSeoPageBySlug(slug: string) {
  const pages = await fetchSeoPages();
  return pages.find((p: any) => p.slug === slug || p.id === slug) || null;
}
