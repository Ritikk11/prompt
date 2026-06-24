import { createClient } from './supabase-server';
import type { Post, Section, SiteSettings } from './types';
import { seedPosts, seedSections } from './data/seedData';
import { filterPostsForSection } from './sections';
import { getThumbnailImageUrl } from './image-url';
import { getAuthors } from './authors';

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
  homepageBlockOrder: [
    'howTo',
    'reviewProcess',
    'promptOfDay',
    'supportedTools',
    'creativeDirections',
    'creatorFeedback',
    'newsletter',
  ],
  homepageContent: {
    howTo: {
      badge: 'How It Works',
      title: 'Create better AI images in 4 simple steps',
      description: 'From browsing prompts to generating finished artwork, this workflow keeps the process simple and repeatable.',
      items: [
        {
          title: 'Browse & Discover',
          text: 'Explore curated AI prompts organized by tool, style, mood, and use case. Find the right direction before you generate.',
          checks: ['Filter by AI tool', 'Check trending prompts', 'Open curated collections'],
        },
        {
          title: 'Copy the Prompt',
          text: 'Found the perfect prompt? Click the copy button to instantly copy it to your clipboard with model-specific notes.',
          checks: ['One-click copy', 'Includes model notes', 'Collection copy when available'],
        },
        {
          title: 'Paste & Generate',
          text: 'Open your preferred AI tool, paste the prompt, attach reference images when needed, and adjust settings as needed.',
          checks: ['Works with major image tools', 'Adjust aspect ratios', 'Fine-tune prompt details'],
        },
        {
          title: 'Create & Save',
          text: 'Generate the result, save prompts you want to revisit, and keep useful ideas ready for your next artwork.',
          checks: ['Save favorite prompts', 'Share useful collections', 'Return from your profile'],
        },
      ],
    },
    reviewProcess: {
      badge: 'Review process',
      title: 'How prompts are reviewed before they go live',
      description: 'Every public prompt is checked for clarity, useful examples, model context, and clean organization before it appears in the library.',
      ctaLabel: 'Submit a prompt',
      ctaHref: '/submit',
      items: [
        { title: 'Submission check', text: 'Prompts are checked for a clear title, useful example image, model label, and complete prompt text before publishing.' },
        { title: 'Prompt quality pass', text: 'We look for prompts that are reusable, specific enough to help creators, and organized with the right tools, categories, and tags.' },
        { title: 'Safety and clarity', text: 'Public posts should avoid misleading claims, unsafe instructions, broken images, and confusing placeholders.' },
        { title: 'Publish and improve', text: 'Approved prompts can be updated later with better descriptions, FAQs, model notes, and richer usage guidance.' },
      ],
    },
    promptOfDay: {
      badge: 'Prompt of the Day',
      title: "Today's Featured Prompt",
      description: 'Handpicked from your published featured prompts',
      ctaLabel: 'View This Prompt',
    },
    supportedTools: {
      badge: 'Supported AI tools',
      title: 'Prompts for Every Major AI Tool',
      description: 'Browse prompt collections prepared for the tools your visitors already use.',
      items: [
        { title: 'ChatGPT', text: 'Strong text rendering, Reference image workflows, Detailed prompt structure' },
        { title: 'Gemini', text: 'Fast image ideation, Reference-aware prompts, Creative variations' },
        { title: 'Grok', text: 'Photoreal direction, Cinematic scenes, Social-first ideas' },
        { title: 'Qwen', text: 'Typography prompts, Poster layouts, Graphic design details' },
      ],
    },
    creativeDirections: {
      badge: 'Browse by style',
      title: 'Explore Creative Directions',
      description: 'Jump into prompt collections by subject, genre, and visual direction using your real post tags.',
      itemDescription: 'Curated prompt direction',
    },
    creatorFeedback: {
      badge: 'Creator-focused',
      title: 'Built for Creators Who Need Usable Prompts',
      description: 'These blocks explain why the library is useful without relying on fake testimonials.',
      items: [
        { title: 'Faster prompt browsing', text: 'Visitors can move through image prompt ideas by tool, style, and intent instead of guessing which post is useful.' },
        { title: 'Clear model context', text: 'Prompt pages show the AI tool and model labels, so creators know where each prompt is meant to be used.' },
        { title: 'Reusable collections', text: 'Multi-prompt posts, copy actions, and workflow notes make prompts easier to test and revisit later.' },
        { title: 'Better organized library', text: 'Sections, tags, search, and custom pages help the site feel like a curated resource instead of a raw feed.' },
      ],
    },
    newsletter: {
      badge: 'Stay updated',
      title: 'Get Weekly Prompt Collections',
      description: 'Subscribe to receive curated prompt packs for ChatGPT, Gemini, Grok, and Qwen.',
      inputPlaceholder: 'Enter your email',
      ctaLabel: 'Subscribe',
      successText: "Subscribed. You're on the list.",
      helperText: 'No spam. Unsubscribe anytime.',
    },
  },
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
  authors: [],
  defaultAuthorId: 'editorial-team',
  shareSettings: {
    targets: ['whatsapp', 'x', 'instagram', 'copy'],
    position: 'floating-sidebar',
  },
  discoveryPages: {
    exploreBadge: 'Prompt Library',
    exploreTitle: 'Explore curated AI image prompts',
    exploreDescription: 'Browse %count% prompt collections by model, visual direction, and creative use case.',
    exploreSlug: '/explore',
    exploreSeoTitle: 'Explore AI Image Prompts | AI PromptMatrix',
    exploreSeoDescription: 'Browse curated AI image prompts by model, style, tag, and creative direction.',
    exploreOgImage: '',
    toolTitleTemplate: '%tool% Prompts',
    toolDescriptionTemplate: 'Browse %count% prompt collections organized for %tool%.',
    tagTitleTemplate: '%tag% Prompts',
    tagDescriptionTemplate: 'Showing %count% collections tagged with "%tag%".',
    sectionDescriptionTemplate: 'Discover a curated collection of %count% prompts.',
    exploreRailItems: [],
    toolRailItems: [],
    tagRailItems: [],
    sectionRailItems: [],
    useCustomRailOnExplore: false,
    useCustomRailOnTools: false,
    useCustomRailOnTags: false,
    useCustomRailOnSections: false,
    showHeroStats: true,
  },
  keepExploring: {
    title: 'Keep exploring',
    description: 'Browse more prompt pages with examples, model notes, and copy-ready creative workflows.',
    links: [
      { label: 'Image prompt library', href: '/explore', icon: 'image' },
      { label: 'Poster and portrait ideas', href: '/tag/poster', icon: 'layers' },
      { label: 'Copy-ready creative workflows', href: '/search?q=workflow', icon: 'clipboard' },
    ],
    ctaLabel: 'Open prompt library',
    ctaHref: '/explore',
  },
  seoSettings: {
    metaTitleTemplate: '%post_title% | AI PromptMatrix',
    defaultMetaDescription: 'Discover curated AI image prompts, prompt collections, and creative workflows.',
    defaultOgImage: '',
    twitterHandle: '',
    googleVerification: '',
    bingVerification: '',
    pinterestVerification: '',
    robotsText: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\n\nSitemap: https://aipromptmatrix.in/sitemap.xml',
    sitemapInclude: {
      posts: true,
      sections: true,
      tags: true,
      tools: true,
      staticPages: true,
    },
    enableJsonLd: true,
    schemaType: 'HowTo',
    enableBreadcrumbList: true,
    enableSitelinksSearchbox: true,
    redirects: [],
  },
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
    showPostSidebar: true,
    showShareButtons: true,
    showTryButtons: true,
    showYouMightAlsoLike: true,
    showHomepageLibraryHero: true,
    showHomepageHowTo: true,
    showHomepageReviewProcess: true,
    showHomepagePromptOfDay: true,
    showHomepageCreativeDirections: true,
    showHomepageSupportedTools: true,
    showHomepageNewsletter: true,
    showHomepageCreatorFeedback: true,
    showScrollProgress: true,
    showFaqSchema: true,
    showPublicProfiles: true,
    publicProfileLikes: false,
    publicProfileBookmarks: false,
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
  const savedHomepageContent = settings.homepageContent || {};
  const homepageContent = {
    ...savedHomepageContent,
    ...Object.fromEntries(
      Object.entries(defaultSettings.homepageContent || {}).map(([key, content]) => [
        key,
        {
          ...content,
          ...(savedHomepageContent[key] || {}),
        },
      ])
    ),
  };

  return {
    ...settings,
    siteLogo: isInlineImage(settings.siteLogo) ? '' : settings.siteLogo,
    authors: getAuthors(settings),
    defaultAuthorId: settings.defaultAuthorId || 'editorial-team',
    homepageContent,
    discoveryPages: {
      ...(defaultSettings.discoveryPages || {}),
      ...(settings.discoveryPages || {}),
    },
    keepExploring: {
      ...(defaultSettings.keepExploring || {}),
      ...(settings.keepExploring || {}),
      links: settings.keepExploring?.links?.length ? settings.keepExploring.links : defaultSettings.keepExploring?.links,
    },
    toolDetails,
  };
}

function sanitizePublicSettings(settings: SiteSettings): SiteSettings {
  const sanitized = sanitizeSettings(settings);
  return {
    ...sanitized,
    adminEmails: [],
    imgbbApiKey: '',
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
    likedByUser: undefined,
    likedBy: undefined,
    comments: (post.comments || []).filter((comment) => comment.status === 'approved'),
    bookmarkedByUser: undefined,
    bookmarkedBy: undefined,
    isPremium: post.isPremium,
    isTemplate: post.isTemplate,
    authorId: post.authorId,
    status: post.status,
    visibility: post.visibility,
    createdAt: post.createdAt,
  };
}

export function toPublicPost(post: Post): Post {
  return {
    ...post,
    comments: (post.comments || []).filter((comment) => comment.status === 'approved'),
    likedBy: undefined,
    likedByUser: undefined,
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
      return sanitizePublicSettings(defaultSettings);
    }
    if (data && data.data) {
      return sanitizePublicSettings({ ...defaultSettings, ...(data.data as Partial<SiteSettings>) });
    }
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase settings fetch error:', error);
  }
  return sanitizePublicSettings(defaultSettings);
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
