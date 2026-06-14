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
  seoKeywords?: string[];
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
  likedBy?: string[];
  bookmarkedByUser?: boolean;
  bookmarkedBy?: string[];
  comments?: PostComment[];
  isPremium?: boolean;
  isTemplate?: boolean;
  templateVariables?: string[];
  authorId?: string;
  status?: 'published' | 'pending' | 'draft';
  visibility?: 'public' | 'private';
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  status: 'approved' | 'pending';
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
  filterTags?: string[];
  category?: string;
  postIds?: string[];
  order: number;
  visible: boolean;
  limit: number;
  cardStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
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
  showPostSidebar?: boolean;
  showShareButtons?: boolean;
  showTryButtons?: boolean;
  showYouMightAlsoLike?: boolean;
  showHomepageLibraryHero?: boolean;
  showHomepageHowTo?: boolean;
  showScrollProgress?: boolean;
  showFaqSchema?: boolean;
  showPublicProfiles?: boolean;
  publicProfileLikes?: boolean;
  publicProfileBookmarks?: boolean;
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
  icon?: 'sparkles' | 'image' | 'wand' | 'layers' | 'search' | 'tag';
  accent?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  style?: 'showcase' | 'clean' | 'compact';
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteLogo?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroEnabled: boolean;
  heroAutoPlay: boolean;
  heroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'custom';
  postHeroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
  cardStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
  badgeStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';
  aiTools: string[];
  toolDetails?: Record<string, { logo?: string; color?: string; logoScale?: number }>;
  headerSections?: Section[];
  headerLinks?: NavLink[];
  homeLinkBlocks?: HomeLinkBlock[];
  exploreFilterTags?: string[];
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

export interface AdminUserSummary {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  createdAt?: string;
  lastSignInAt?: string;
}

export type Theme = 'light' | 'dark';
