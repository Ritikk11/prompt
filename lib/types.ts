export interface ImagePrompt {
  id: string;
  url: string;
  prompt: string;
  aiTool: string;
  model?: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  images: ImagePrompt[];
  tags: string[];
  featured: boolean;
  views: number;
  likes: number;
  likedByUser?: boolean;
  createdAt: string;
}

export interface Section {
  id: string;
  name: string;
  type: 'ai-tool' | 'latest' | 'popular' | 'custom';
  aiTool?: string;
  postIds?: string[];
  order: number;
  visible: boolean;
  limit: number;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  heroEnabled: boolean;
  heroAutoPlay: boolean;
  aiTools: string[];
  toolDetails?: Record<string, { logo: string; color: string }>;
}

export type Theme = 'light' | 'dark';
