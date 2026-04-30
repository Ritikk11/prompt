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
  category?: string;
  featured: boolean;
  views: number;
  likes: number;
  likedByUser?: boolean;
  isPremium?: boolean;
  isTemplate?: boolean;
  templateVariables?: string[];
  authorId?: string;
  status?: 'published' | 'pending' | 'draft';
  createdAt: string;
}

export interface Section {
  id: string;
  slug?: string;
  name: string;
  type: 'ai-tool' | 'latest' | 'popular' | 'custom' | 'trending' | 'tag' | 'category';
  location?: 'homepage' | 'header';
  aiTool?: string;
  tag?: string;
  category?: string;
  postIds?: string[];
  order: number;
  visible: boolean;
  limit: number;
}

export interface SiteFeatures {
  userProfiles: boolean;
  userSubmissions: boolean;
  userSubmissionsAutoApprove?: boolean;
  comments: boolean;
  commentsRequireApproval?: boolean;
  advancedFiltering: boolean;
  smartTemplates: boolean;
  infiniteScroll: boolean;
  infiniteScrollItems?: number;
  premiumPrompts: boolean;
  premiumPrice?: number;
  premiumPaymentUrl?: string;
  skeletonLoaders: boolean;
  trendingAlgorithm: boolean;
  trendingLikesWeight?: number;
  trendingViewsWeight?: number;
  mobileColumns?: 1 | 2;
}

export interface AdSettings {
  header: { enabled: boolean; code: string };
  inFeed: { enabled: boolean; code: string; frequency: number };
  postTop: { enabled: boolean; code: string };
  postBottom: { enabled: boolean; code: string };
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteLogo?: string;
  heroEnabled: boolean;
  heroAutoPlay: boolean;
  heroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
  aiTools: string[];
  toolDetails?: Record<string, { logo: string; color: string }>;
  headerSections?: Section[];
  ads?: AdSettings;
  imgbbApiKey?: string;
  features?: SiteFeatures;
}

export type Theme = 'light' | 'dark';
