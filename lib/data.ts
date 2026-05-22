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
    return { ...defaultSettings, ...(data.data as Partial<SiteSettings>) };
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
