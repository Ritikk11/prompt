import { cache } from 'react';
import { createPublicClient } from './supabase-public';
import type { Post, PostComment, Section, SiteSettings } from './types';
import { seedPosts, seedSections } from './data/seedData';
import { getAllTools } from './constants';
import { filterPostsForSection } from './sections';
import { getThumbnailImageUrl } from './image-url';

const defaultArticleThumbnails: Record<string, string> = {
  '3d-figurine-photo-trend-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/3d-figurine-photo-trend-guide.webp',
  'ai-headshots-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/ai-headshots-guide.webp',
  'ai-image-aspect-ratios-explained': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/ai-image-aspect-ratios-explained.webp',
  'ai-photo-trends-2026': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/ai-photo-trends-2026.webp',
  'ai-product-photography-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/ai-product-photography-guide.webp',
  'anatomy-of-a-perfect-ai-image-prompt': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/anatomy-of-a-perfect-ai-image-prompt.webp',
  'anime-portrait-prompts-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/anime-portrait-prompts-guide.webp',
  'chatgpt-image-generation-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/chatgpt-image-generation-guide.webp',
  'chatgpt-vs-gemini-image-generation': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/chatgpt-vs-gemini-image-generation.webp',
  'common-ai-prompt-mistakes': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/common-ai-prompt-mistakes.webp',
  'consistent-characters-ai-images': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/consistent-characters-ai-images.webp',
  'couple-portrait-prompts-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/couple-portrait-prompts-guide.webp',
  'gemini-photo-editing-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/gemini-photo-editing-guide.webp',
  'how-ai-image-generators-work': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/how-ai-image-generators-work.webp',
  'how-to-use-prompts-from-promptmatrix': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/how-to-use-prompts-from-promptmatrix.webp',
  'how-to-write-better-ai-image-prompts': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/how-to-write-better-ai-image-prompts.webp',
  'negative-prompts-explained': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/negative-prompts-explained.webp',
  'reference-images-vs-text-prompts': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/reference-images-vs-text-prompts.webp',
  'restore-old-photos-with-ai': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/restore-old-photos-with-ai.webp',
  'retro-saree-portrait-guide': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/retro-saree-portrait-guide.webp',
  'what-are-ai-image-prompts': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/what-are-ai-image-prompts.webp',
  'who-owns-ai-generated-images': 'https://fcmmcgyqovqbxbqfeaho.supabase.co/storage/v1/object/public/images/thumbnails/who-owns-ai-generated-images.webp',
};

const defaultSettings: SiteSettings = {
  siteTitle: 'AI PromptMatrix',
  siteDescription: 'A curated prompt library for image creators. Discover tested examples, copy the workflow, and make stronger artwork.',
  siteLogo: '',
  heroTitle: 'Better Image Prompts Start Here',
  heroSubtitle: 'Browse a curated library of tested prompts for ChatGPT, Gemini, Grok, and more — each with example images and the exact text that created them.',
  heroEnabled: true,
  heroAutoPlay: true,
  aiTools: ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
  headerLinks: [],
  homeLinkBlocks: [],
  articleThumbnails: defaultArticleThumbnails,
  articleOverrides: {},
  customArticles: [],
  homepageBlockOrder: [
    'howTo',
    'reviewProcess',
    'promptOfDay',
    'supportedTools',
    'creativeDirections',
    'guides',
    'blog',
    'creatorFeedback',
  ],
  homepageContent: {
    howTo: {
      badge: 'How It Works',
      title: 'Create better images in 4 simple steps',
      description: 'From browsing prompts to generating finished artwork, this workflow keeps the process simple and repeatable.',
      items: [
        {
          title: 'Browse & Discover',
          text: 'Explore curated prompts organized by tool, style, mood, and use case. Find the right direction before you generate.',
          checks: ['Filter by tool', 'Check trending prompts', 'Open curated collections'],
        },
        {
          title: 'Copy the Prompt',
          text: 'Found the perfect prompt? Click the copy button to instantly copy it to your clipboard with model-specific notes.',
          checks: ['One-click copy', 'Includes model notes', 'Collection copy when available'],
        },
        {
          title: 'Paste & Generate',
          text: 'Open your preferred image tool, paste the prompt, attach reference images when needed, and adjust settings as needed.',
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
      showCta: true,
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
      description: 'One standout prompt, hand-picked every day. Copy it, tweak it, and make it your own.',
      ctaLabel: 'View This Prompt',
    },
    supportedTools: {
      badge: 'Supported tools',
      title: 'Prompts for Every Major Image Tool',
      description: 'Find prompt sets organized by the image tools people actually create with, so you can choose the right workflow before you start experimenting.',
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
      description: 'Portraits, posters, anime, product shots — jump straight to the visual style you have in mind.',
      itemDescription: 'Curated prompt direction',
    },
    creatorFeedback: {
      badge: 'Why creators use it',
      title: 'A Prompt Library You Can Actually Rely On',
      description: 'No vague inspiration dumps — every prompt is tested, labeled, and written so you can copy it and get the same result.',
      items: [
        { title: 'Find it fast', text: 'Browse by tool, style, and intent instead of scrolling a random feed hoping something fits.' },
        { title: 'Know before you generate', text: 'Every prompt shows the AI tool and model it was written for, so you always know where to paste it.' },
        { title: 'Copy the whole workflow', text: 'Multi-prompt collections, one-click copy, and model notes let you reproduce the full result — not just one image.' },
        { title: 'Curated, not scraped', text: 'Each collection is reviewed for clear prompt text and real example images before it goes live.' },
      ],
    },
    guides: {
      badge: 'Learn the craft',
      title: 'Step-by-Step Prompt Guides',
      description: 'Hands-on tutorials that take you from a blank prompt box to a finished image — trends, edits, and pro techniques included.',
      ctaLabel: 'Browse all guides',
      ctaHref: '/guides',
    },
    blog: {
      badge: 'From the blog',
      title: 'Latest From Our Blog',
      description: 'News, prompt trends, and deep dives on getting more out of every AI image tool.',
      ctaLabel: 'Read the blog',
      ctaHref: '/blog',
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
    defaultOgImage: '/og-default.png',
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
    showHomepageGuides: true,
    showHomepageBlog: true,
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

function isMissingTableError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
  return code === '42P01' || message.includes('Could not find the table') || message.includes('does not exist');
}

export async function fetchPosts() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from('posts').select('data');
    if (error) {
      console.error('Supabase posts fetch error:', error);
      return [];
    }
    const posts = (data || []).map(d => d.data as Post).filter(Boolean);
    const { data: commentRows, error: commentsError } = await supabase
      .from('comments')
      .select('id, post_id, user_id, user_name, user_avatar, text, status, created_at')
      .eq('status', 'approved');

    if (commentsError) {
      if (!isMissingTableError(commentsError)) console.error('Supabase comments fetch error:', commentsError);
      return posts;
    }

    const commentsByPost = new Map<string, PostComment[]>();
    for (const row of commentRows || []) {
      const comment: PostComment = {
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        userName: row.user_name,
        userAvatar: row.user_avatar,
        text: row.text,
        status: row.status,
        createdAt: row.created_at,
      };
      commentsByPost.set(row.post_id, [...(commentsByPost.get(row.post_id) || []), comment]);
    }

    return posts.map((post) => {
      const tableComments = commentsByPost.get(post.id) || [];
      if (tableComments.length === 0) return post;
      const legacyComments = post.comments || [];
      const mergedComments = [
        ...legacyComments.filter((comment) => !tableComments.some((item) => item.id === comment.id)),
        ...tableComments,
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return { ...post, comments: mergedComments };
    });
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

function cleanPublicCopy(value?: string) {
  if (!value) return value;
  const exactReplacements: Record<string, string> = {
    'Create better AI images in 4 simple steps': 'Create better images in 4 simple steps',
    'Prompts for Every Major AI Tool': 'Prompts for Every Major Image Tool',
    'Supported AI tools': 'Supported tools',
    'Browse prompt collections prepared for the tools your visitors already use.': 'Find prompt sets organized by the image tools people actually create with, so you can choose the right workflow before you start experimenting.',
    'Browse prompt collections prepared for the generators creators use most.': 'Find prompt sets organized by the image tools people actually create with, so you can choose the right workflow before you start experimenting.',
    'These blocks explain why the library is useful without relying on fake testimonials.': 'Built for creators who want practical prompt examples, clear model notes, and repeatable workflows instead of vague inspiration screenshots.',
    'Step-by-Step AI Prompt Guides': 'Step-by-Step Prompt Guides',
    'Jump into prompt collections by subject, genre, and visual direction using your real post tags.': 'Browse by subject, genre, and visual direction — from portraits and posters to product shots and anime styles.',
    'Explore a curated collection of breathtaking AI-generated imagery and their full prompts. Learn, inspire, and create.': 'Explore polished prompt examples, finished visuals, and copy-ready workflows for your next creation.',
    'Your curated collection of AI image prompts. Discover, copy, and create stunning AI-generated artwork.': 'A curated prompt library for image creators. Discover tested examples, copy the workflow, and make stronger artwork.',
  };
  if (exactReplacements[value]) return exactReplacements[value];
  if (value.startsWith('Browse a curated library of tested prompts for ChatGPT')) {
    return 'Browse tested prompts for ChatGPT, Gemini, Grok, and more — each paired with example images and the exact text behind them.';
  }
  return value;
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
  // Only known blocks are kept — saved content for removed blocks (e.g. the old
  // newsletter section) is dead data and shouldn't ship to every visitor.
  const homepageContent = {
    ...Object.fromEntries(
      Object.entries(defaultSettings.homepageContent || {}).map(([key, content]) => [
        key,
        {
          ...content,
          ...(savedHomepageContent[key] || {}),
          title: cleanPublicCopy((savedHomepageContent[key] || {}).title || content.title),
          badge: cleanPublicCopy((savedHomepageContent[key] || {}).badge || content.badge),
          description: cleanPublicCopy((savedHomepageContent[key] || {}).description || content.description),
        },
      ])
    ),
  };

  return {
    ...settings,
    siteDescription: cleanPublicCopy(settings.siteDescription) || settings.siteDescription,
    heroSubtitle: cleanPublicCopy(settings.heroSubtitle) || settings.heroSubtitle,
    siteLogo: isInlineImage(settings.siteLogo) ? '' : settings.siteLogo,
    articleThumbnails: {
      ...defaultArticleThumbnails,
      ...(settings.articleThumbnails || {}),
    },
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
  // Aggregate tools from all images before they're trimmed to the primary one,
  // so tool filters (hero/footer/supported tools) still see every tool used.
  const allTools = getAllTools(post);

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
        aiTools: allTools,
        model: primaryImage?.model,
      },
    ],
    tags: post.tags || [],
    category: post.category,
    categories: post.categories,
    aiTools: allTools,
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
    const supabase = createPublicClient();
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

export const fetchSettings = cache(async () => {
  try {
    const supabase = createPublicClient();
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
});

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
    const supabase = createPublicClient();
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
