import { cache } from 'react';
import { createPublicClient } from './supabase-public';
import type { Post, PostComment, PostSummary, Section, SiteSettings } from './types';

import { getAllTools } from './constants';
import { filterPostsForSection } from './sections';
import { getThumbnailImageUrl } from './image-url';

const defaultArticleThumbnails: Record<string, string> = {
  '3d-figurine-photo-trend-guide': 'https://uploads.aipromptmatrix.in/thumbnails/3d-figurine-photo-trend-guide.webp',
  'ai-headshots-guide': 'https://uploads.aipromptmatrix.in/thumbnails/ai-headshots-guide.webp',
  'ai-image-aspect-ratios-explained': 'https://uploads.aipromptmatrix.in/thumbnails/ai-image-aspect-ratios-explained.webp',
  'ai-photo-trends-2026': 'https://uploads.aipromptmatrix.in/thumbnails/ai-photo-trends-2026.webp',
  'ai-product-photography-guide': 'https://uploads.aipromptmatrix.in/thumbnails/ai-product-photography-guide.webp',
  'anatomy-of-a-perfect-ai-image-prompt': 'https://uploads.aipromptmatrix.in/thumbnails/anatomy-of-a-perfect-ai-image-prompt.webp',
  'anime-portrait-prompts-guide': 'https://uploads.aipromptmatrix.in/thumbnails/anime-portrait-prompts-guide.webp',
  'chatgpt-image-generation-guide': 'https://uploads.aipromptmatrix.in/thumbnails/chatgpt-image-generation-guide.webp',
  'chatgpt-vs-gemini-image-generation': 'https://uploads.aipromptmatrix.in/thumbnails/chatgpt-vs-gemini-image-generation.webp',
  'common-ai-prompt-mistakes': 'https://uploads.aipromptmatrix.in/thumbnails/common-ai-prompt-mistakes.webp',
  'consistent-characters-ai-images': 'https://uploads.aipromptmatrix.in/thumbnails/consistent-characters-ai-images.webp',
  'couple-portrait-prompts-guide': 'https://uploads.aipromptmatrix.in/thumbnails/couple-portrait-prompts-guide.webp',
  'gemini-photo-editing-guide': 'https://uploads.aipromptmatrix.in/thumbnails/gemini-photo-editing-guide.webp',
  'how-ai-image-generators-work': 'https://uploads.aipromptmatrix.in/thumbnails/how-ai-image-generators-work.webp',
  'how-to-use-prompts-from-promptmatrix': '/thumbnails/how-to-use-prompts-from-promptmatrix.webp',
  'how-to-write-better-ai-image-prompts': 'https://uploads.aipromptmatrix.in/thumbnails/how-to-write-better-ai-image-prompts.webp',
  'negative-prompts-explained': 'https://uploads.aipromptmatrix.in/thumbnails/negative-prompts-explained.webp',
  'reference-images-vs-text-prompts': 'https://uploads.aipromptmatrix.in/thumbnails/reference-images-vs-text-prompts.webp',
  'restore-old-photos-with-ai': 'https://uploads.aipromptmatrix.in/thumbnails/restore-old-photos-with-ai.webp',
  'retro-saree-portrait-guide': 'https://uploads.aipromptmatrix.in/thumbnails/retro-saree-portrait-guide.webp',
  'what-are-ai-image-prompts': 'https://uploads.aipromptmatrix.in/thumbnails/what-are-ai-image-prompts.webp',
  'who-owns-ai-generated-images': 'https://uploads.aipromptmatrix.in/thumbnails/who-owns-ai-generated-images.webp',
};

const defaultSettings: SiteSettings = {
  "ads": {
    "header": {
      "code": "",
      "enabled": false
    },
    "inFeed": {
      "code": "",
      "enabled": false,
      "frequency": 8
    },
    "postTop": {
      "code": "",
      "enabled": false
    },
    "postBottom": {
      "code": "",
      "enabled": false
    }
  },
  "aiTools": [
    "ChatGPT",
    "Gemini",
    "Grok",
    "Qwen Image"
  ],
  "categoryPresets": [
    { "id": "cat-anime", "name": "Anime & Manga", "slug": "anime", "description": "Anime portraits, stylized illustrations, and Japanese comic aesthetics." },
    { "id": "cat-photography", "name": "Photography & Portraits", "slug": "photography", "description": "Hyper-realistic portraits, candid street photos, and studio lighting." },
    { "id": "cat-3d", "name": "3D & CGI Renders", "slug": "3d-art", "description": "Octane renders, isometric scenes, claymation, and Pixar-style characters." },
    { "id": "cat-digital-art", "name": "Digital Art & Fantasy", "slug": "digital-art", "description": "Concept art, mythical creatures, fantasy landscapes, and surreal paintings." },
    { "id": "cat-logos", "name": "Logos & Vector Icons", "slug": "logos", "description": "Minimalist vector logos, emblem badges, app icons, and branding kits." },
    { "id": "cat-ui-ux", "name": "UI/UX & Web Design", "slug": "ui-ux", "description": "Landing page hero sections, mobile dashboard concepts, and web UI components." },
    { "id": "cat-cinematic", "name": "Cinematic & Film", "slug": "cinematic", "description": "Wide-angle cinematic stills, movie scenes, anamorphic lens flares, and mood lighting." },
    { "id": "cat-architecture", "name": "Architecture & Interiors", "slug": "architecture", "description": "Modern minimalist interiors, futuristic facades, and architectural renderings." },
    { "id": "cat-creative", "name": "Creative & Conceptual", "slug": "creative", "description": "Abstract compositions, creative directions, posters, and experimental designs." }
  ],
  "authors": [
    {
      "id": "editorial-team",
      "bio": "The PromptSoul editorial team reviews and organizes prompt collections so creators can find clear examples, model notes, and reusable AI image workflows.",
      "name": "PromptSoul Editorial Team",
      "role": "Editorial Team",
      "slug": "editorial-team",
      "active": true,
      "website": "https://promptsoul.in",
      "avatarUrl": "",
      "createdAt": "2026-06-25T15:17:07.365Z",
      "updatedAt": "2026-07-04T19:05:14.208Z"
    }
  ],
  "features": {
    "comments": false,
    "premiumPrice": 5,
    "userProfiles": false,
    "mobileColumns": 1,
    "showLikeCount": false,
    "showViewCount": false,
    "infiniteScroll": true,
    "premiumPrompts": false,
    "smartTemplates": true,
    "skeletonLoaders": true,
    "userSubmissions": false,
    "advancedFiltering": true,
    "premiumPaymentUrl": "",
    "trendingAlgorithm": false,
    "publicProfileLikes": false,
    "showPublicProfiles": true,
    "showScrollProgress": true,
    "showAnimatedBackground": true,
    "infiniteScrollItems": 20,
    "trendingLikesWeight": 2,
    "trendingViewsWeight": 1,
    "commentsRequireApproval": true,
    "showHomepageLibraryHero": true,
    "showHomepagePromptOfDay": false,
    "userSubmissionsAutoApprove": false,
    "showHomepageCreativeDirections": false
  },
  "siteLogo": "",
  "cardStyle": "v2",
  "heroTitle": "Discover AI Prompt Masterpieces",
  "siteTitle": "PromptSoul",
  "badgeStyle": "v1",
  "categories": [
    "Fantasy",
    "Sci-Fi",
    "Portraits",
    "Abstract",
    "Nature",
    "Anime",
    "Architecture",
    "Space",
    "Illustration",
    "Gothic",
    "Vintage",
    "Food"
  ],
  "adminEmails": [],
  "headerLinks": [
    {
      "id": "e61198ab-e5ff-46f7-b5c6-d295f1db257c",
      "href": "/tool/chatgpt",
      "label": "ChatGPT Prompts"
    },
    {
      "id": "d793a34d-170e-40c9-bf3c-93394812e140",
      "href": "/tool/gemini",
      "label": "Gemini Prompts"
    }
  ],
  "headerMenus": [
    {
      "id": "menu-1",
      "label": "Tools",
      "itemNavKeys": [
        "link:e61198ab-e5ff-46f7-b5c6-d295f1db257c",
        "link:d793a34d-170e-40c9-bf3c-93394812e140"
      ]
    }
  ],
  "heroEnabled": true,
  "seoSettings": {
    "redirects": [],
    "robotsText": "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\nDisallow: /api/\nDisallow: /search/\nDisallow: /submit/\nDisallow: /login/\n\nSitemap: https://promptsoul.in/sitemap.xml\nSitemap: https://promptsoul.in/sitemap-prompts.xml",
    "schemaType": "Article",
    "enableJsonLd": true,
    "twitterHandle": "@promptsoul",
    "defaultOgImage": "/og-image.webp?v=5",
    "sitemapInclude": {
      "tags": false,
      "posts": true,
      "tools": true,
      "sections": true,
      "staticPages": true
    },
    "bingVerification": "",
    "metaTitleTemplate": "%post_title% | PromptSoul",
    "homeSeoTitleTemplate": "%site_title% - AI Prompts",
    "googleVerification": "",
    "enableBreadcrumbList": true,
    "pinterestVerification": "",
    "defaultMetaDescription": "PromptSoul is your ultimate collection of curated image prompts for ChatGPT, Gemini, Grok, and more. Discover, copy and create stunning artwork instantly.",
    "enableSitelinksSearchbox": true,
    "alternateSiteNames": [
      "PromptSoul",
      "Prompt Soul",
      "Promptsoul",
      "prompt soul"
    ],
    "indexNowKey": "d2725a72cddd4faba71fcc50a0d414cc",
    "enableIndexNow": true
  },
  "socialLinks": {
    "pinterest": "https://in.pinterest.com/aipromptmatrix"
  },
  "toolDetails": {
    "Grok": {
      "logo": "https://i.ibb.co/XrRWC5c6/Grok-logo.webp",
      "color": "bg-surface-500"
    },
    "Gemini": {
      "logo": "https://i.ibb.co/LzfTxCfN/Gemini-Logo.webp",
      "color": "bg-[#4285f4]"
    },
    "ChatGPT": {
      "logo": "/tool-logos/chatgpt.svg",
      "slug": "chatgpt",
      "badge": "Optimized for GPT Image 2",
      "color": "bg-green-500",
      "stats": [
        {
          "label": "Prompt Quality",
          "value": "Premium"
        },
        {
          "label": "Image Fidelity",
          "value": "Excellent"
        },
        {
          "label": "Text & Realism",
          "value": "Best For"
        }
      ],
      "active": true,
      "checks": [
        "High-quality image generation",
        "Accurate text rendering",
        "Reference image support"
      ],
      "models": [
        "GPT IMAGE 2"
      ],
      "featured": true,
      "logoScale": 1,
      "showInHero": true,
      "description": "Explore professionally written AI image prompts for ChatGPT GPT Image 2. Find prompt collections for realistic portraits, anime, illustrations, logos, product photography, concept art, cinematic scenes, and more to create high-quality AI images.",
      "defaultModel": "GPT IMAGE 2",
      "showInFooter": true
    },
    "Qwen Image": {
      "logo": "https://i.ibb.co/twPrFnrq/Qwen-logo-svg.webp",
      "color": "bg-surface-500"
    }
  },
  "heroAutoPlay": true,
  "heroSubtitle": "Explore a curated collection of breathtaking AI-generated imagery and their full prompts. Learn, inspire, and create.",
  "heroHideStats": true,
  "heroContent": {
    "kickerPrefix": "Curated prompts for",
    "accentPattern": "(ai\\s+prompts?|image\\s+prompts?)",
    "searchPlaceholder": "Search prompts by style, tool or subject...",
    "searchButtonLabel": "Search",
    "popularLabel": "Popular:",
    "popularTags": ["Portraits", "Cinematic", "Anime", "Wallpaper", "Architecture", "Logos"],
    "primaryCtaLabel": "Browse All Prompts",
    "primaryCtaHref": "/explore",
    "secondaryCtaLabel": "How It Works",
    "secondaryCtaHref": "#how-it-works",
    "trustBadges": ["100% Free to Copy", "Tested & Verified Outputs", "Exact Model Parameters Included"],
    "statLabels": { "prompts": "Prompts", "featured": "Featured", "likes": "Likes", "saves": "Saves" },
    "toolsRowLabel": "Browse Prompts by AI Tools:"
  },
  "imageProvider": "cloudflare",
  "keepExploring": {
    "links": [
      {
        "href": "/explore",
        "icon": "image",
        "label": "Image prompt library"
      },
      {
        "href": "/tool/chatgpt",
        "icon": "image",
        "label": "ChatGPT Prompts"
      },
      {
        "href": "/tool/gemini",
        "icon": "image",
        "label": "Gemini | Nano Banana Pro Prompts"
      }
    ],
    "title": "Keep exploring",
    "ctaHref": "/explore",
    "ctaLabel": "Open prompt library",
    "description": "Browse more prompt pages with examples, model notes, and copy-ready creative workflows."
  },
  "postHeroStyle": "v2",
  "shareSettings": {
    "targets": [
      "whatsapp",
      "x",
      "instagram",
      "facebook",
      "pinterest",
      "copy"
    ],
    "position": "floating-sidebar"
  },
  "customArticles": [],
  "discoveryPages": {
    "exploreSlug": "/explore",
    "exploreBadge": "Prompt Library",
    "exploreTitle": "Explore Premium Image Prompts",
    "tagRailItems": [],
    "showHeroStats": false,
    "toolRailItems": [],
    "exploreOgImage": "",
    "exploreSeoTitle": "Premium AI Image Prompts for ChatGPT, Gemini & More | PromptSoul",
    "exploreRailItems": [
      {
        "type": "tool",
        "label": "ChatGPT | GPT image 2",
        "value": "ChatGPT"
      },
      {
        "type": "tool",
        "label": "Gemini | Nano Banana Pro",
        "value": "Gemini"
      },
      {
        "type": "tag",
        "label": "Photography",
        "value": "Photography"
      },
      {
        "type": "category",
        "label": "Portraits",
        "value": "Portraits"
      },
      {
        "type": "tag",
        "label": "Fashion",
        "value": "Fashion"
      },
      {
        "type": "tag",
        "label": "Realistic",
        "value": "Realistic"
      },
      {
        "type": "tag",
        "label": "Selfie",
        "value": "Selfie"
      }
    ],
    "sectionRailItems": [],
    "tagTitleTemplate": "%tag% Prompts",
    "toolTitleTemplate": "%tool% Prompts",
    "exploreDescription": "Discover high-quality AI image prompts organized by tool, image model, style, category, and creative direction.",
    "tagSeoTitleTemplate": "%tag% Prompts",
    "useCustomRailOnTags": false,
    "toolSeoTitleTemplate": "%tool% Prompts",
    "useCustomRailOnTools": false,
    "exploreSeoDescription": "Discover curated AI image prompts for ChatGPT, Gemini, Nano Banana Pro and all Other image models. Browse collections by style, model, category, and creative use case.",
    "tagDescriptionTemplate": "Showing %count% collections tagged with \"%tag%\".",
    "useCustomRailOnExplore": true,
    "sectionSeoTitleTemplate": "%section% Prompts",
    "toolDescriptionTemplate": "Browse %count% prompt collections organized for %tool%.",
    "useCustomRailOnSections": false,
    "tagSeoDescriptionTemplate": "Browse prompts tagged with %tag%.",
    "sectionDescriptionTemplate": "Discover a curated collection of %count% prompts.",
    "toolSeoDescriptionTemplate": "Browse curated prompts for %tool%.",
    "sectionSeoDescriptionTemplate": "Browse curated prompts in %section%."
  },
  "headerBuiltins": {
    "explore": {
      "hidden": false
    }
  },
  "headerNavOrder": [
    "home",
    "explore",
    "link:e61198ab-e5ff-46f7-b5c6-d295f1db257c",
    "link:d793a34d-170e-40c9-bf3c-93394812e140",
    "blog"
  ],
  "homeLinkBlocks": [],
  "defaultAuthorId": "editorial-team",
  "homepageContent": {
    "howTo": {
      "badge": "How It Works",
      "title": "Create better images in 4 simple steps",
      "description": "From browsing prompts to generating finished artwork, this workflow keeps the process simple and repeatable."
    },
    "promptOfDay": {
      "pinnedPostId": "nm7m3g09mown2c83"
    },
    "reviewProcess": {
      "badge": "Review process",
      "title": "How prompts are reviewed before they go live",
      "ctaHref": "/submit",
      "ctaLabel": "Submit a prompt",
      "description": "Every public prompt is checked for clarity, useful examples, model context, and clean organization before it appears in the library."
    },
    "supportedTools": {
      "badge": "Supported tools",
      "title": "Prompts for Every Major Image Tool",
      "description": "Find prompt sets organized by the image tools people actually create with, so you can choose the right workflow before you start experimenting."
    },
    "creatorFeedback": {
      "badge": "Creator-focused",
      "title": "Built for Creators Who Need Usable Prompts",
      "description": "Built for creators who want practical prompt examples, clear model notes, and repeatable workflows instead of vague inspiration screenshots."
    },
    "creativeDirections": {
      "badge": "Browse by style",
      "title": "Explore Creative Directions",
      "description": "Browse by subject, genre, and visual direction — from portraits and posters to product shots and anime styles.",
      "itemDescription": "Curated prompt direction"
    }
  },
  "siteDescription": "Explore curated AI image prompts for ChatGPT, Gemini, Nano Banana Pro, Grok, and more. Copy, customize, and create stunning images.",
  "articleOverrides": {},
  "footerLinkGroups": [
    {
      "links": [
        {
          "id": "3d2c42b6-b18f-4cee-94a5-9f44f35a3899",
          "href": "/privacy",
          "label": "Privacy Policy"
        },
        {
          "id": "99d124c8-03d7-4c44-8c25-d4f0c6a18fcb",
          "href": "/terms",
          "label": "Terms of Service"
        },
        {
          "id": "2b89f8f8-44fc-4ad8-89aa-7f71ff1501a5",
          "href": "/dmca",
          "label": "DMCA Notice"
        },
        {
          "id": "1b5e8ed4-4567-43d3-bc33-0b0603a89f8f",
          "href": "/disclaimer",
          "label": "Disclaimer"
        }
      ],
      "title": "Legal"
    },
    {
      "links": [
        {
          "id": "d3ca58c7-f5e1-407e-a189-70bcde813a54",
          "href": "/explore",
          "label": "Explore"
        },
        {
          "id": "958a8044-f540-4fa2-a141-d3985dbdbb94",
          "href": "/about",
          "label": "About Us"
        },
        {
          "id": "162fb092-0d76-48f8-b0d9-5347f39c72c5",
          "href": "/contact",
          "label": "Contact"
        },
        {
          "id": "da8d1a2a-07e5-4201-a41c-a59a38195f6d",
          "href": "/cookies",
          "label": "Cookies Policy"
        }
      ],
      "title": "Platform"
    }
  ],
  "articleThumbnails": {
    "ai-headshots-guide": "https://uploads.aipromptmatrix.in/thumbnails/ai-headshots-guide.webp",
    "ai-photo-trends-2026": "https://uploads.aipromptmatrix.in/thumbnails/ai-photo-trends-2026.webp",
    "common-ai-prompt-mistakes": "https://uploads.aipromptmatrix.in/thumbnails/common-ai-prompt-mistakes.webp",
    "what-are-ai-image-prompts": "https://uploads.aipromptmatrix.in/thumbnails/what-are-ai-image-prompts.webp",
    "gemini-photo-editing-guide": "https://uploads.aipromptmatrix.in/thumbnails/gemini-photo-editing-guide.webp",
    "negative-prompts-explained": "https://uploads.aipromptmatrix.in/thumbnails/negative-prompts-explained.webp",
    "restore-old-photos-with-ai": "https://uploads.aipromptmatrix.in/thumbnails/restore-old-photos-with-ai.webp",
    "retro-saree-portrait-guide": "https://uploads.aipromptmatrix.in/thumbnails/retro-saree-portrait-guide.webp",
    "ai-product-photography-guide": "https://uploads.aipromptmatrix.in/thumbnails/ai-product-photography-guide.webp",
    "anime-portrait-prompts-guide": "https://uploads.aipromptmatrix.in/thumbnails/anime-portrait-prompts-guide.webp",
    "how-ai-image-generators-work": "https://uploads.aipromptmatrix.in/thumbnails/how-ai-image-generators-work.webp",
    "who-owns-ai-generated-images": "https://uploads.aipromptmatrix.in/thumbnails/who-owns-ai-generated-images.webp",
    "3d-figurine-photo-trend-guide": "https://uploads.aipromptmatrix.in/thumbnails/3d-figurine-photo-trend-guide.webp",
    "couple-portrait-prompts-guide": "https://uploads.aipromptmatrix.in/thumbnails/couple-portrait-prompts-guide.webp",
    "chatgpt-image-generation-guide": "https://uploads.aipromptmatrix.in/thumbnails/chatgpt-image-generation-guide.webp",
    "consistent-characters-ai-images": "https://uploads.aipromptmatrix.in/thumbnails/consistent-characters-ai-images.webp",
    "ai-image-aspect-ratios-explained": "https://uploads.aipromptmatrix.in/thumbnails/ai-image-aspect-ratios-explained.webp",
    "reference-images-vs-text-prompts": "https://uploads.aipromptmatrix.in/thumbnails/reference-images-vs-text-prompts.webp",
    "chatgpt-vs-gemini-image-generation": "https://uploads.aipromptmatrix.in/thumbnails/chatgpt-vs-gemini-image-generation.webp",
    "anatomy-of-a-perfect-ai-image-prompt": "https://uploads.aipromptmatrix.in/thumbnails/anatomy-of-a-perfect-ai-image-prompt.webp",
    "how-to-use-prompts-from-promptmatrix": "/thumbnails/how-to-use-prompts-from-promptmatrix.webp",
    "how-to-write-better-ai-image-prompts": "https://uploads.aipromptmatrix.in/thumbnails/how-to-write-better-ai-image-prompts.webp"
  },
  "exploreFilterTags": [],
  "exploreFilterItems": [
    {
      "type": "tool",
      "label": "Gemini",
      "value": "Gemini"
    },
    {
      "type": "tag",
      "label": "Photography",
      "value": "Photography"
    },
    {
      "type": "tool",
      "label": "ChatGPT",
      "value": "ChatGPT"
    },
    {
      "type": "category",
      "label": "Portraits",
      "value": "Portraits"
    },
    {
      "type": "tag",
      "label": "Fashion",
      "value": "Fashion"
    },
    {
      "type": "tag",
      "label": "Realistic",
      "value": "Realistic"
    },
    {
      "type": "tag",
      "label": "Selfie",
      "value": "Selfie"
    },
    {
      "type": "tag",
      "label": "Anime",
      "value": "Anime"
    },
    {
      "type": "tag",
      "label": "Character",
      "value": "Character"
    },
    {
      "type": "tag",
      "label": "Collage",
      "value": "Collage"
    },
    {
      "type": "tag",
      "label": "Products",
      "value": "Products"
    },
    {
      "type": "tag",
      "label": "Ads",
      "value": "Ads"
    }
  ],
  "homepageBlockOrder": [
    "block:howTo",
    "block:reviewProcess",
    "block:promptOfDay",
    "block:supportedTools",
    "block:creativeDirections",
    "block:creatorFeedback",
    "block:guides",
    "block:blog",
    "section:s_popular_posts",
    "section:s_latest_prompts"
  ],
  "cloudinaryCloudName": "dr25hoyly",
  "cloudinaryUploadPreset": "prompt",
  "creativeDirectionItems": [
    {
      "type": "tag",
      "label": "Anime",
      "value": "Anime"
    },
    {
      "type": "tag",
      "label": "Chatgpt",
      "value": "Chatgpt"
    },
    {
      "type": "tag",
      "label": "Images",
      "value": "Images"
    },
    {
      "type": "tag",
      "label": "Japanese",
      "value": "Japanese"
    },
    {
      "type": "tag",
      "label": "Games",
      "value": "Games"
    },
    {
      "type": "tag",
      "label": "GTA",
      "value": "GTA"
    },
    {
      "type": "tag",
      "label": "Poster",
      "value": "Poster"
    },
    {
      "type": "tag",
      "label": "Spiderman",
      "value": "Spiderman"
    }
  ]
} as any;

function isNextDynamicServerError(error: unknown) {
  const err = error as { digest?: string; message?: string };
  return err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage');
}

// Detects "relation not deployed yet" errors so callers can fall back to the
// legacy path instead of hard-failing. Covers both the Postgres shape
// (42P01 / "does not exist") and the PostgREST shape returned over the REST
// API: PGRST205 for a missing view/table and PGRST202 for a missing RPC, both
// with "in the schema cache" in the message.
function isMissingTableError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    message.includes('Could not find the table') ||
    message.includes('Could not find the function') ||
    message.includes('does not exist')
  );
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

  const rawTitle = settings.siteTitle || defaultSettings.siteTitle || 'PromptSoul';
  const siteTitle = (rawTitle === 'AI PromptMatrix' || !rawTitle) ? 'PromptSoul' : rawTitle;

  return {
    ...settings,
    siteTitle,
    siteDescription: cleanPublicCopy(settings.siteDescription) || settings.siteDescription,
    heroSubtitle: cleanPublicCopy(settings.heroSubtitle) || settings.heroSubtitle,
    siteLogo: isInlineImage(settings.siteLogo) ? '' : settings.siteLogo,
    articleThumbnails: {
      ...defaultArticleThumbnails,
      ...(settings.articleThumbnails || {}),
    },
    homepageContent,
    seoSettings: {
      ...(defaultSettings.seoSettings || {}),
      ...(settings.seoSettings || {}),
      metaTitleTemplate: (settings.seoSettings?.metaTitleTemplate || defaultSettings.seoSettings?.metaTitleTemplate || '%post_title%')
        .replace(/\s*(?:\||-|–|—)\s*(?:%site_title%|AI PromptMatrix)$/i, '')
        .trim(),
    },
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
  const {
    adminEmails: _adminEmails,
    pinterestSettings: _pinterestSettings,
    ...publicSettings
  } = sanitized;

  return publicSettings as SiteSettings;
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
    featuredAt: post.featuredAt,
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

// Shape returned by the `public_post_summaries` view (snake_case columns).
// The view is `security_invoker`, so RLS already restricts anon/authenticated
// readers to published, non-private posts — same visibility rule as
// `isPublicPost`, enforced at the database instead of in JS.
type PostSummaryRow = {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  seo_keywords: string[] | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  category: string | null;
  categories: string[] | null;
  ai_tools: string[] | null;
  featured: boolean;
  views: number;
  likes: number;
  is_premium: boolean;
  is_template: boolean;
  status: string | null;
  visibility: string | null;
  created_at: string | null;
  featured_at?: string | null;
  images: Array<{
    id: string;
    url: string;
    prompt: string;
    aiTool: string;
    aiTools: string[] | null;
    model: string | null;
  }> | null;
};

// Mirrors `toPostSummary` but works off the lightweight view row instead of a
// full Post: same thumbnail resolution (incl. the `/api/image/:id` fallback for
// legacy inline images). The view's `ai_tools` column already unions post- and
// image-level tools (matching getAllTools), so it is the source of truth here.
function resolveSummaryThumbnail(row: PostSummaryRow): string {
  const raw = row.thumbnail_url || '';
  if (raw && !isInlineImage(raw)) return raw;
  if (isInlineImage(raw) || (row.images || []).some((img) => isInlineImage(img?.url))) {
    return `/api/image/${row.id}`;
  }
  return '';
}

function mapSummaryRow(row: PostSummaryRow): PostSummary {
  const primaryImage = row.images?.[0];
  const thumbnailUrl = getThumbnailImageUrl(resolveSummaryThumbnail(row));
  const allTools = row.ai_tools || [];

  return {
    id: row.id,
    slug: row.slug || '',
    title: row.title || '',
    description: row.description || '',
    seoKeywords: row.seo_keywords || [],
    thumbnailUrl,
    images: [
      {
        id: primaryImage?.id || row.id,
        url: thumbnailUrl,
        prompt: '',
        aiTool: primaryImage?.aiTool || allTools[0] || '',
        aiTools: allTools,
        model: primaryImage?.model || undefined,
      },
    ],
    tags: row.tags || [],
    category: row.category || undefined,
    categories: row.categories || [],
    aiTools: allTools,
    featured: row.featured,
    views: row.views,
    likes: row.likes,
    isPremium: row.is_premium,
    isTemplate: row.is_template,
    status: (row.status || 'published') as Post['status'],
    visibility: (row.visibility || 'public') as Post['visibility'],
    createdAt: row.created_at || '',
    featuredAt: row.featured_at || undefined,
  };
}

export const fetchPostSummaries = cache(async (): Promise<Post[]> => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from('public_post_summaries').select('*');
    if (error) {
      // Fall back to the full loader if the view isn't deployed yet so a missing
      // migration never takes the site down — list pages just run the old path.
      if (isMissingTableError(error)) {
        const posts = await fetchPosts();
        return posts.filter(isPublicPost).map(toPostSummary);
      }
      console.error('Supabase post summaries fetch error:', error);
      return [];
    }
    const rows = (data || []) as unknown as PostSummaryRow[];
    return rows
      .map(mapSummaryRow)
      .filter((p) => isPublicPost(p));
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase post summaries fetch error:', error);
    return [];
  }
});

export const fetchSections = cache(async () => {
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
});

export const fetchSettings = cache(async () => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from('public_settings').select('data').eq('id', 'global').maybeSingle();
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

// React `cache` dedupes the metadata + page calls within a request — prompt
// pages previously ran this (RPC + comments query) twice per render.
export const getPostBySlugOrId = cache(async (idOrSlug: string) => {
  if (!idOrSlug) return null;
  try {
    const supabase = createPublicClient();
    // RPC is `security invoker`, so RLS already hides drafts/private posts from
    // anon. We still run `isPublicPost` as defense-in-depth in case the
    // migration's RLS assumption is ever loosened.
    const { data, error } = await supabase
      .rpc('get_public_post_by_slug_or_id', { p_slug_or_id: idOrSlug })
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) {
        // View/RPC not deployed yet — keep detail pages working via the old path.
        const posts = await fetchPosts();
        const post = posts.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
        return post ? toPublicPost(post) : null;
      }
      console.error('Supabase post lookup error:', error);
      return null;
    }
    if (!data) return null;
    const post = (data as { id: string; data: Post }).data;
    if (!post || !isPublicPost(post)) return null;

    // Fetch only this post's approved comments instead of every comment
    // site-wide (the old path merged the full comments table in JS).
    const { data: commentRows, error: commentsError } = await supabase
      .from('comments')
      .select('id, post_id, user_id, user_name, user_avatar, text, status, created_at')
      .eq('status', 'approved')
      .eq('post_id', post.id);
    if (commentsError && !isMissingTableError(commentsError)) {
      console.error('Supabase comments fetch error:', commentsError);
    }
    const tableComments: PostComment[] = (commentRows || []).map((row) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      text: row.text,
      status: row.status,
      createdAt: row.created_at,
    }));
    const legacyComments = post.comments || [];
    const mergedComments = [
      ...legacyComments.filter((c) => !tableComments.some((t) => t.id === c.id)),
      ...tableComments,
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return toPublicPost({ ...post, comments: mergedComments });
  } catch (error) {
    if (isNextDynamicServerError(error)) throw error;
    console.error('Supabase post lookup error:', error);
    return null;
  }
});

export async function getSectionBySlug(slug: string) {
  const sections = await fetchSections();
  return sections.find((s) => s.slug === slug || s.id === slug) || null;
}

export async function getPostsForSection(section: Section, settings: SiteSettings, allPosts?: Post[]) {
  const posts = allPosts || await fetchPosts();
  return filterPostsForSection(section, posts, settings, true);
}

export const fetchSeoPages = cache(async () => {
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
});

export async function getSeoPageBySlug(slug: string) {
  const pages = await fetchSeoPages();
  return pages.find((p: any) => p.slug === slug || p.id === slug) || null;
}
