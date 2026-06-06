export interface ImagePrompt {
  id: string;
  url: string;
  prompt: string;
  aiTool: string;
  aiTools?: string[];
  model?: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  extendedDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  thumbnailUrl?: string;
  referenceImages?: string[];
  images: ImagePrompt[];
  tags: string[];
  category?: string;
  categories?: string[];
  aiTools?: string[];
  featured: boolean;
  views: number;
  likes: number;
  likedByUser?: boolean;
  isPremium?: boolean;
  isTemplate?: boolean;
  templateVariables?: string[];
  authorId?: string;
  status?: 'published' | 'pending' | 'draft';
  visibility?: 'public' | 'private';
  createdAt: string;
}

export interface Section {
  id: string;
  slug?: string;
  name: string;
  seoTitle?: string;
  seoDescription?: string;
  introContent?: string;
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
  showCopyCollection?: boolean;
  showHowTo?: boolean;
  showRecommendedPosts?: boolean;
  showTags?: boolean;
  showDetailedInsights?: boolean;
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
  desktopColumns?: 3 | 4 | 5 | 6 | 7 | 8;
}

export interface AdSettings {
  header: { enabled: boolean; code: string };
  inFeed: { enabled: boolean; code: string; frequency: number };
  postTop: { enabled: boolean; code: string };
  postBottom: { enabled: boolean; code: string };
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface HomeLinkBlock {
  title: string;
  href: string;
  description?: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteLogo?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroEnabled: boolean;
  heroAutoPlay: boolean;
  heroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'custom';
  postHeroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
  cardStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
  badgeStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';
  aiTools: string[];
  toolDetails?: Record<string, { logo?: string; color?: string; logoScale?: number }>;
  headerSections?: Section[];
  headerLinks?: NavLink[];
  homeLinkBlocks?: HomeLinkBlock[];
  footerLinkGroups?: FooterLinkGroup[];
  ads?: AdSettings;
  imgbbApiKey?: string;
  imageProvider?: 'imgbb' | 'cloudinary' | 'supabase';
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  features?: SiteFeatures;
  adminEmails?: string[];
  pageAbout?: string;
  pagePrivacy?: string;
  pageTerms?: string;
  pageDmca?: string;
  pageDisclaimer?: string;
  pageContact?: string;
}

export type Theme = 'light' | 'dark';
