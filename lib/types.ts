export interface ImagePrompt {
  id: string;
  url: string;
  prompt: string;
  aiTool: string;
  aiTools?: string[];
  model?: string;
}

export interface PostFaq {
  question: string;
  answer: string;
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
  faqs?: PostFaq[];
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

export interface Author {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  location?: 'homepage' | 'header' | 'footer';
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
  showHomepageReviewProcess?: boolean;
  showHomepagePromptOfDay?: boolean;
  showHomepageCreativeDirections?: boolean;
  showHomepageSupportedTools?: boolean;
  showHomepageNewsletter?: boolean;
  showHomepageCreatorFeedback?: boolean;
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

export type ShareTarget = 'whatsapp' | 'x' | 'instagram' | 'copy' | 'facebook' | 'pinterest';

export interface ShareSettings {
  targets: ShareTarget[];
  position: 'below-prompt' | 'bottom' | 'floating-sidebar';
}

export interface SeoSettings {
  metaTitleTemplate?: string;
  defaultMetaDescription?: string;
  defaultOgImage?: string;
  twitterHandle?: string;
  googleVerification?: string;
  bingVerification?: string;
  pinterestVerification?: string;
  robotsText?: string;
  sitemapInclude?: {
    posts?: boolean;
    sections?: boolean;
    tags?: boolean;
    tools?: boolean;
    staticPages?: boolean;
  };
  enableJsonLd?: boolean;
  schemaType?: 'Article' | 'CreativeWork' | 'HowTo';
  enableBreadcrumbList?: boolean;
  enableSitelinksSearchbox?: boolean;
  redirects?: { from: string; to: string; status: 301 | 302 }[];
}

export interface StaticPageSettings {
  title?: string;
  subtitle?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  visible?: boolean;
}

export interface HomeLinkBlock {
  title: string;
  href: string;
  description?: string;
  icon?: 'sparkles' | 'image' | 'wand' | 'layers' | 'search' | 'tag';
  accent?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  style?: 'showcase' | 'clean' | 'compact';
}

export interface FilterRailItem {
  label: string;
  type: 'tool' | 'tag' | 'category';
  value: string;
}

export interface HomepageBlockContent {
  badge?: string;
  title?: string;
  description?: string;
  itemDescription?: string;
  pinnedPostId?: string;
  items?: {
    title: string;
    text: string;
    checks?: string[];
  }[];
  ctaLabel?: string;
  ctaHref?: string;
  inputPlaceholder?: string;
  successText?: string;
  helperText?: string;
}

export interface KeepExploringSettings {
  title?: string;
  description?: string;
  links?: {
    label: string;
    href: string;
    icon?: 'image' | 'layers' | 'clipboard';
  }[];
  ctaLabel?: string;
  ctaHref?: string;
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
  homepageBlockOrder?: string[];
  homepageContent?: Record<string, HomepageBlockContent>;
  exploreFilterTags?: string[];
  exploreFilterItems?: FilterRailItem[];
  creativeDirectionItems?: FilterRailItem[];
  footerLinkGroups?: FooterLinkGroup[];
  footerDescription?: string;
  copyrightText?: string;
  contactEmail?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  authors?: Author[];
  defaultAuthorId?: string;
  shareSettings?: ShareSettings;
  keepExploring?: KeepExploringSettings;
  seoSettings?: SeoSettings;
  staticPages?: Record<string, StaticPageSettings>;
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
