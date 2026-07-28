import type { ArticleIcon } from './content/types';

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
  schemaType?: 'Article' | 'CreativeWork' | 'HowTo';
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
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  status?: 'published' | 'pending' | 'draft';
  visibility?: 'public' | 'private';
  createdAt: string;
}

export type PostSummary = Pick<
  Post,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'seoKeywords'
  | 'thumbnailUrl'
  | 'images'
  | 'tags'
  | 'category'
  | 'categories'
  | 'aiTools'
  | 'featured'
  | 'views'
  | 'likes'
  | 'isPremium'
  | 'isTemplate'
  | 'status'
  | 'visibility'
  | 'createdAt'
>;

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
  heroBadge?: string;
  heroTitle?: string;
  heroDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  introContent?: string;
  type: 'ai-tool' | 'latest' | 'popular' | 'custom' | 'trending' | 'tag' | 'category';
  location?: 'homepage' | 'header' | 'footer';
  aiTool?: string;
  tag?: string;
  filterTags?: string[];
  useCustomRail?: boolean;
  railItems?: FilterRailItem[];
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
  showHomepageGuides?: boolean;
  showHomepageBlog?: boolean;
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
  publisherId?: string;
  autoAdsEnabled?: boolean;
  header: { enabled: boolean; code: string };
  inFeed: { enabled: boolean; code: string; frequency: number };
  postTop: { enabled: boolean; code: string };
  postBottom: { enabled: boolean; code: string };
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string; id?: string }[];
}

export interface NavLink {
  label: string;
  href: string;
  /** Stable id used to persist header nav ordering across edits. */
  id?: string;
}

export type ShareTarget = 'whatsapp' | 'x' | 'instagram' | 'copy' | 'facebook' | 'pinterest';

export interface ShareSettings {
  targets: ShareTarget[];
  position: 'below-prompt' | 'bottom' | 'floating-sidebar';
}

export interface SeoSettings {
  homeSeoTitleTemplate?: string;
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

/** Homepage "Browse by style" card — fully standalone from the chip-rail filters. */
export interface CreativeDirectionItem {
  label: string;
  type: 'tool' | 'tag' | 'category';
  value: string;
  /** Icon from the shared article icon set. */
  icon?: ArticleIcon;
  /** Custom logo/image URL — takes priority over `icon` when set */
  imageUrl?: string;
}

export interface HomepageBlockContent {
  badge?: string;
  title?: string;
  description?: string;
  itemDescription?: string;
  pinnedPostId?: string;
  selectedGuideSlugs?: string[];
  selectedBlogSlugs?: string[];
  items?: {
    title: string;
    text: string;
    checks?: string[];
  }[];
  ctaLabel?: string;
  ctaHref?: string;
  showCta?: boolean;
  hidePromptCounts?: boolean;
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

export interface DiscoveryPageSettings {
  exploreBadge?: string;
  exploreTitle?: string;
  exploreDescription?: string;
  exploreSlug?: string;
  exploreSeoTitle?: string;
  exploreSeoDescription?: string;
  exploreOgImage?: string;
  toolTitleTemplate?: string;
  toolDescriptionTemplate?: string;
  toolSeoTitleTemplate?: string;
  toolSeoDescriptionTemplate?: string;
  tagTitleTemplate?: string;
  tagDescriptionTemplate?: string;
  tagSeoTitleTemplate?: string;
  tagSeoDescriptionTemplate?: string;
  sectionDescriptionTemplate?: string;
  sectionSeoTitleTemplate?: string;
  sectionSeoDescriptionTemplate?: string;
  exploreRailItems?: FilterRailItem[];
  toolRailItems?: FilterRailItem[];
  tagRailItems?: FilterRailItem[];
  sectionRailItems?: FilterRailItem[];
  useCustomRailOnExplore?: boolean;
  useCustomRailOnTools?: boolean;
  useCustomRailOnTags?: boolean;
  useCustomRailOnSections?: boolean;
  showHeroStats?: boolean;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  authors?: any;
  categories?: any;
  imgbbApiKey?: string;
  defaultAuthorId?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  siteLogo?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroEnabled: boolean;
  heroHideStats?: boolean;
  heroAutoPlay: boolean;
  heroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'custom';
  postHeroStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
  cardStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
  badgeStyle?: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';
  aiTools: string[];
  toolDetails?: Record<string, {
    logo?: string;
    color?: string;
    logoScale?: number;
    badge?: string;
    stats?: { label: string; value: string }[];
    checks?: string[];
    description?: string;
    heroTitle?: string;
    heroDescription?: string;
    seoTitle?: string;
    seoDescription?: string;
    slug?: string;
    models?: string[];
    defaultModel?: string;
    active?: boolean;
    featured?: boolean;
    showInHero?: boolean;
    showInFooter?: boolean;
  }>;
  headerSections?: Section[];
  headerLinks?: NavLink[];
  /** Ordered nav-item keys (home, explore, submit, section:<id>, link:<id>) for the header. */
  headerNavOrder?: string[];
  /** Hide/rename overrides for the built-in header items (home, explore, blog, submit). */
  headerBuiltins?: Partial<Record<'home' | 'explore' | 'blog' | 'submit', { hidden?: boolean; label?: string }>>;
  homeLinkBlocks?: HomeLinkBlock[];
  homepageBlockOrder?: string[];
  homepageContent?: Record<string, HomepageBlockContent>;
  articleThumbnails?: Record<string, string>;
  articleOverrides?: Record<string, ArticleSettingsOverride>;
  customArticles?: ArticleSettingsOverride[];
  exploreFilterTags?: string[];
  exploreFilterItems?: FilterRailItem[];
  discoveryPages?: DiscoveryPageSettings;
  creativeDirectionItems?: CreativeDirectionItem[];
  footerLinkGroups?: FooterLinkGroup[];
  footerDescription?: string;
  copyrightText?: string;
  contactEmail?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
    pinterest?: string;
  };
  shareSettings?: ShareSettings;
  keepExploring?: KeepExploringSettings;
  seoSettings?: SeoSettings;
  staticPages?: Record<string, StaticPageSettings>;
  ads?: AdSettings;
  imageProvider?: 'supabase' | 'cloudflare';
  features?: SiteFeatures;
  adminEmails?: string[];
  pageAbout?: string;
  pagePrivacy?: string;
  pageTerms?: string;
  pageDmca?: string;
  pageDisclaimer?: string;
  pageContact?: string;
  pageCookies?: string;
}

export interface ArticleSettingsOverride {
  slug: string;
  title?: string;
  description?: string;
  category?: 'blog' | 'guide';
  tags?: string[];
  readMinutes?: number;
  datePublished?: string;
  dateModified?: string;
  icon?: string;
  thumbnailUrl?: string;
  featured?: boolean;
  body?: string;
}

export interface AdminUserSummary {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  createdAt?: string;
  lastSignInAt?: string;
  bannedUntil?: string;
  role?: string;
}

export type Theme = 'light' | 'dark';
