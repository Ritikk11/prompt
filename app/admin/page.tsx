'use client';
import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useData } from '@/components/context/DataContext';

import type { Post, Section, ImagePrompt, PostFaq, AdSettings, SiteSettings, SiteFeatures, FooterLinkGroup, HomeLinkBlock, HomepageBlockContent, KeepExploringSettings, NavLink, AdminUserSummary, FilterRailItem, CreativeDirectionItem, ShareTarget, DiscoveryPageSettings, ArticleSettingsOverride } from '@/lib/types';
import { createClient as createSupabaseClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import {
  Plus, Trash2, Edit3, Eye, EyeOff, ChevronUp, ChevronDown,
  Save, X, FileText, LayoutGrid, Star, StarOff, Upload, Copy,
  Settings, Check, Filter, Search, RotateCcw, GripVertical, Image as ImageIcon,
  Zap, Layers, Info, LayoutTemplate, BarChart2, Sparkles, Wand2, Tag, ArrowRight, Users, MessageCircle, Grid3X3, Compass, Menu, Mail,
  Ban, Shield, Flag, CheckCircle, Cpu, BookOpen, Newspaper, Share2, Loader2, KeyRound, LogOut
} from 'lucide-react';
import { showToast } from '@/components/ui/ToastContainer';
import { ConfirmDialogHost, confirmAction } from '@/components/ui/ConfirmDialog';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { imageModelOptions, getAllTools, getDefaultImageModel, getImageModelForTools, getToolInfo } from '@/lib/constants';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoPagesTab from '@/components/admin/SeoPagesTab';
import StaticPagesTab from '@/components/admin/StaticPagesTab';
import AiStudioTab from '@/components/admin/AiStudioTab';
import { MagicWandProvider, WandButton, useMagicWand } from '@/components/admin/MagicWand';
import { TabBanner, Panel, PanelHeader, SectionEyebrow, Field, FieldTextarea, EditableCard, CharCount, Toggle, ActionButton, adminInput, adminInputOnCard, adminLabel } from '@/components/admin/AdminUI';
import { askAi } from '@/lib/admin/ai';
import { postPrompts, articlePrompts, generalPrompts, discoveryPrompts, homepagePrompts, aiToolPrompts, featurePrompts, TOOLS_MODELS_RULES, aiStudioSystemContext } from '@/lib/admin/wandPrompts';
import { filterPostsForSection, getSectionPath } from '@/lib/sections';
import { buildHeaderNavItems, headerLinkKey } from '@/lib/header-nav';
import { getFilterTagsFromPosts } from '@/lib/filter-tags';
import { optimizeImageFile, type ImageOptimizePreset } from '@/lib/client-image-optimizer';
import { uploadImageFileToProvider, type UploadProvider } from '@/lib/client-upload';
import PostCard from '@/components/PostCard';
import HomeHowItWorks from '@/components/HomeHowItWorks';
import HomeReviewProcess from '@/components/HomeReviewProcess';
import HomePromptOfDay from '@/components/HomePromptOfDay';
import HomeSupportedTools from '@/components/HomeSupportedTools';
import HomeCreativeDirections from '@/components/HomeCreativeDirections';
import HomeCreatorFeedback from '@/components/HomeCreatorFeedback';
import HomeGuides from '@/components/HomeGuides';
import HomeBlog from '@/components/HomeBlog';
import ArticleThumbnail, { articleIconList } from '@/components/ArticleThumbnail';
import { getArticlesForSettings } from '@/lib/content';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';

type AdminTab = 'dashboard' | 'posts' | 'sections' | 'articles' | 'settings' | 'submissions' | 'comments' | 'users' | 'seo' | 'pages' | 'ai-studio';
const DiscoveryPageIds = ['explore', 'tool', 'tag'] as const;
export type DiscoveryPageId = typeof DiscoveryPageIds[number];
type SettingsSubTab = 'general' | 'homepage' | 'discovery' | 'navigation' | 'footer' | 'features' | 'ads' | 'ai-tools' | 'comments' | 'share';
type SectionLocationFilter = 'homepage' | 'header' | 'footer' | 'all';

const adminTabKeys: AdminTab[] = ['dashboard', 'posts', 'sections', 'articles', 'settings', 'submissions', 'comments', 'users', 'seo', 'pages', 'ai-studio'];
const settingsSubTabKeys: SettingsSubTab[] = ['general', 'homepage', 'discovery', 'navigation', 'footer', 'features', 'ads', 'ai-tools', 'comments', 'share'];
const sectionLocationKeys: SectionLocationFilter[] = ['homepage', 'header', 'footer', 'all'];

function parseAdminTab(value: string | null): AdminTab {
  if (value === 'seo-pages') return 'seo';
  if (value === 'static-pages') return 'pages';
  if (value === 'features') return 'settings';
  if (value && adminTabKeys.includes(value as AdminTab)) return value as AdminTab;
  return 'dashboard';
}

function parseSettingsSubTab(value: string | null): SettingsSubTab {
  if (value === 'aitools') return 'ai-tools';
  if (value === 'explore') return 'discovery';
  if (value && settingsSubTabKeys.includes(value as SettingsSubTab)) return value as SettingsSubTab;
  return 'general';
}

function parseSectionLocation(value: string | null): SectionLocationFilter {
  if (value && sectionLocationKeys.includes(value as SectionLocationFilter)) return value as SectionLocationFilter;
  return 'homepage';
}

function settingsSubTabParam(value: SettingsSubTab) {
  return value === 'ai-tools' ? 'aitools' : value;
}

function cleanAdminPublicCopy(value?: string) {
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

function cleanAdminHomepageContent(content: Record<string, HomepageBlockContent> = {}) {
  return Object.fromEntries(
    Object.entries(content)
      // Drop content for blocks that no longer exist (e.g. the removed
      // newsletter section) so saving settings purges the dead data.
      .filter(([key]) => homepageBlockOptions.some(option => option.key === key))
      .map(([key, block]) => [
        key,
        {
          ...block,
          title: cleanAdminPublicCopy(block.title),
          badge: cleanAdminPublicCopy(block.badge),
          description: cleanAdminPublicCopy(block.description),
        },
      ])
  );
}

const TAILWIND_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-primary-500', 'bg-surface-800', 'bg-black', 'bg-white'
];

const DEFAULT_MODEL_OPTIONS = Array.from(new Set(Object.values(imageModelOptions).flat()));
const CUSTOM_MODEL_VALUE = '__custom';
const AUTO_MODEL_VALUE = '__auto';
const homeCardIcons = [
  { value: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'image', label: 'Image', Icon: ImageIcon },
  { value: 'wand', label: 'Wand', Icon: Wand2 },
  { value: 'layers', label: 'Layers', Icon: Layers },
  { value: 'search', label: 'Search', Icon: Search },
  { value: 'tag', label: 'Tag', Icon: Tag },
] as const;
const homeCardAccents = [
  { value: 'violet', label: 'Violet', className: 'bg-violet-500', soft: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  { value: 'cyan', label: 'Cyan', className: 'bg-cyan-500', soft: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  { value: 'emerald', label: 'Emerald', className: 'bg-emerald-500', soft: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  { value: 'amber', label: 'Amber', className: 'bg-amber-500', soft: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-500', soft: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
  { value: 'slate', label: 'Slate', className: 'bg-surface-500', soft: 'bg-surface-700/40 text-surface-200 border-surface-600' },
] as const;
const homeCardStyles = [
  { value: 'showcase', label: 'Showcase', description: 'Bigger visual card for important links.' },
  { value: 'clean', label: 'Clean', description: 'Balanced card with a top accent line.' },
  { value: 'compact', label: 'Compact', description: 'Short utility row for denser pages.' },
] as const;
const shareTargetOptions: { id: ShareTarget; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'copy', label: 'Copy Link' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
];
const homepageBlockOptions = [
  { key: 'howTo', featureKey: 'showHomepageHowTo', title: 'How it works' },
  { key: 'reviewProcess', featureKey: 'showHomepageReviewProcess', title: 'Review process' },
  { key: 'promptOfDay', featureKey: 'showHomepagePromptOfDay', title: 'Prompt of the day' },
  { key: 'supportedTools', featureKey: 'showHomepageSupportedTools', title: 'Supported AI tools' },
  { key: 'creativeDirections', featureKey: 'showHomepageCreativeDirections', title: 'Creative directions' },
  { key: 'guides', featureKey: 'showHomepageGuides', title: 'Guides' },
  { key: 'blog', featureKey: 'showHomepageBlog', title: 'Blog' },
  { key: 'creatorFeedback', featureKey: 'showHomepageCreatorFeedback', title: 'Creator feedback' },
] as const;
const defaultHomepageBlockOrder = homepageBlockOptions.map(item => item.key);
const homepageBlockStaticHints: Record<string, string> = {
  howTo: 'Edit the step titles, descriptions, and checklist lines below. Icons and colors stay fixed for layout consistency.',
  reviewProcess: 'Edit the review card titles and descriptions below. Icons stay fixed for layout consistency.',
  supportedTools: 'Edit tool note lines below. Tool cards still come from your AI tool settings and published posts.',
  creativeDirections: 'Card order is controlled in Browse by Style Cards. Icons and colors are automatic.',
  creatorFeedback: 'Edit the feedback card titles and descriptions below. Star styling stays fixed for layout consistency.',
};

function normalizeHomepageOrderToken(key: string) {
  return key.startsWith('block:') || key.startsWith('section:') ? key : `block:${key}`;
}

const MARKDOWN_HELP_EXAMPLE = `## Main section
### Question style heading
#### Small subpoint

:::tip Reference images do the heavy lifting
Add reference images for more accurate outputs.
:::

:::creative
Use cinematic lighting, a clear subject, and one strong visual style.
:::

:::prompt Copy-ready poster prompt
Ultra detailed poster art, dramatic lighting, sharp composition
:::

Callout titles are optional: text after the type (e.g. ":::tip Your title") becomes the label; with none, the block renders without a header.

Use {mark:highlights}, {primary:primary notes}, {green:recommended}, {red:avoid}, and {kbd:Ctrl+C}.`;

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
}

const defaultFooterLinkGroups: FooterLinkGroup[] = [
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
];

const defaultKeepExploring: Required<KeepExploringSettings> = {
  title: 'Keep exploring',
  description: 'Browse more prompt pages with examples, model notes, and copy-ready creative workflows.',
  links: [
    { label: 'Image prompt library', href: '/explore', icon: 'image' },
    { label: 'Poster and portrait ideas', href: '/tag/poster', icon: 'layers' },
    { label: 'Copy-ready creative workflows', href: '/search?q=workflow', icon: 'clipboard' },
  ],
  ctaLabel: 'Open prompt library',
  ctaHref: '/explore',
};

const defaultDiscoveryPages: Required<DiscoveryPageSettings> = {
  exploreSlug: 'explore',
  exploreBadge: 'Prompt Library',
  exploreTitle: 'Explore curated AI image prompts',
  exploreDescription: 'Browse %count% prompt collections by model, visual direction, and creative use case.',
  exploreSeoTitle: 'Explore AI Prompts',
  exploreSeoDescription: 'Browse curated AI prompt collections.',
  exploreOgImage: '',
  toolTitleTemplate: '%tool% Prompts',
  toolDescriptionTemplate: 'Browse %count% prompt collections organized for %tool%.',
  toolSeoTitleTemplate: '%tool% Prompts',
  toolSeoDescriptionTemplate: 'Browse curated prompts for %tool%.',
  tagTitleTemplate: '%tag% Prompts',
  tagDescriptionTemplate: 'Showing %count% collections tagged with "%tag%".',
  tagSeoTitleTemplate: '%tag% Prompts',
  tagSeoDescriptionTemplate: 'Browse prompts tagged with %tag%.',
  sectionDescriptionTemplate: 'Discover a curated collection of %count% prompts.',
  sectionSeoTitleTemplate: '%section% Prompts',
  sectionSeoDescriptionTemplate: 'Browse curated prompts in %section%.',
  exploreRailItems: [],
  toolRailItems: [],
  tagRailItems: [],
  sectionRailItems: [],
  useCustomRailOnExplore: true,
  useCustomRailOnTools: false,
  useCustomRailOnTags: false,
  useCustomRailOnSections: false,
  showHeroStats: true,
};

function newNavId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `nav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Ensures every header link has a stable id so nav ordering survives edits. */
function withHeaderLinkIds(links: NavLink[] = []): NavLink[] {
  return links.map(link => (link.id ? link : { ...link, id: newNavId() }));
}

function cleanNavLinks(links: NavLink[] = []) {
  return links.map(link => ({
    id: link.id || newNavId(),
    label: link.label.trim(),
    href: link.href.trim(),
  })).filter(link => link.label && link.href);
}

function cleanHomeBlocks(blocks: HomeLinkBlock[] = []) {
  return blocks.map(block => ({
    title: block.title.trim(),
    href: block.href.trim(),
    description: block.description?.trim() || undefined,
    icon: block.icon,
    accent: block.accent,
    style: block.style,
  })).filter(block => block.title && block.href);
}

function cleanKeepExploring(settings: KeepExploringSettings): KeepExploringSettings {
  const links = (settings.links || []).map(link => ({
    label: link.label.trim(),
    href: link.href.trim(),
    icon: link.icon || 'image',
  })).filter(link => link.label && link.href);

  return {
    title: settings.title?.trim() || defaultKeepExploring.title,
    description: settings.description?.trim() || defaultKeepExploring.description,
    links: links.length ? links : defaultKeepExploring.links,
    ctaLabel: settings.ctaLabel?.trim() || defaultKeepExploring.ctaLabel,
    ctaHref: settings.ctaHref?.trim() || defaultKeepExploring.ctaHref,
  };
}

function cleanFooterGroups(groups: FooterLinkGroup[] = []) {
  return groups.map(group => ({
    title: group.title.trim() || 'Links',
    links: cleanNavLinks(group.links),
  })).filter(group => group.title && group.links.length > 0);
}

function cleanCommaList(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function tagsToRailItems(tags: string[] = []): FilterRailItem[] {
  return tags.filter(Boolean).map(tag => ({ label: tag, type: 'tag', value: tag }));
}

function titleCase(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function cleanRailItems(items: { label: string; type: string; value: string }[] = []): FilterRailItem[] {
  return items
    .map(item => ({
      label: item.label.trim(),
      type: (item.type || 'tag') as 'tool' | 'tag' | 'category',
      value: item.value.trim(),
    }))
    .filter(item => item.label && item.value);
}

function cleanCreativeDirectionItems(items: CreativeDirectionItem[] = []): CreativeDirectionItem[] {
  return items
    .map(item => {
      const icon = item.icon && articleIconList.includes(item.icon) ? item.icon : undefined;
      return {
        label: item.label.trim(),
        type: (item.type || 'tag') as 'tool' | 'tag' | 'category',
        value: item.value.trim(),
        ...(icon ? { icon } : {}),
        ...(item.imageUrl?.trim() ? { imageUrl: item.imageUrl.trim() } : {}),
      };
    })
    .filter(item => item.label && item.value);
}

function getPublicPosts(posts: Post[]) {
  return posts.filter(post => (post.status === 'published' || !post.status) && post.visibility !== 'private');
}

function getAutoExploreItems(posts: Post[]): FilterRailItem[] {
  const publicPosts = getPublicPosts(posts);
  const tools = Array.from(new Set(publicPosts.flatMap(post => getAllTools(post)).filter(Boolean)));
  const tags = getFilterTagsFromPosts(publicPosts);
  return [
    ...tools.map(tool => ({ label: tool, type: 'tool' as const, value: tool })),
    ...tags.map(tag => ({ label: titleCase(tag), type: 'tag' as const, value: tag })),
  ];
}

function getAutoCreativeItems(posts: Post[]): CreativeDirectionItem[] {
  const counts = new Map<string, number>();
  getPublicPosts(posts).forEach(post => {
    const values = [...(post.categories || []), post.category, ...(post.tags || [])].filter(Boolean) as string[];
    values.slice(0, 4).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => ({ label: titleCase(name), type: 'tag' as const, value: name }));
}

function countRailMatches(posts: Post[], item: FilterRailItem) {
  const target = item.value.toLowerCase();
  return getPublicPosts(posts).filter(post => {
    if (item.type === 'tool') return getAllTools(post).some(value => value.toLowerCase() === target);
    if (item.type === 'category') {
      return [post.category, ...(post.categories || [])].filter(Boolean).some(value => value!.toLowerCase() === target);
    }
    return (post.tags || []).some(value => value.toLowerCase() === target);
  }).length;
}

function cardStyleName(value: string) {
  const names: Record<string, string> = {
    v1: 'Flat Hover Overlay',
    v2: 'Glass Frame',
  };
  return names[value] || 'Global card style';
}

function CardStylePreview({ style, badgeStyle = 'v1', label = 'Live preview' }: { style: string; badgeStyle?: string; label?: string }) {
  const activeStyle = style || 'v1';
  const previewPost: Post = {
    id: 'admin-card-preview',
    slug: 'admin-card-preview',
    title: 'Anime poster prompt',
    description: 'A real PostCard preview using the selected card and badge style.',
    thumbnailUrl: '/og-image.jpg',
    images: [{
      id: 'preview-image',
      url: '/og-image.jpg',
      prompt: 'Vibrant anime poster, dramatic composition, clean typography',
      aiTool: 'ChatGPT',
      model: 'GPT Image',
    }],
    tags: ['anime', 'poster'],
    category: 'Creative',
    aiTools: ['ChatGPT'],
    featured: true,
    views: 1240,
    likes: 86,
    status: 'published',
    visibility: 'public',
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">{label}</p>
        <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[10px] font-black text-primary-600 dark:text-primary-300">{cardStyleName(activeStyle)}</span>
      </div>
      <div className="pointer-events-none mx-auto max-w-[280px] overflow-hidden rounded-xl bg-white p-2 dark:bg-surface-900">
        <PostCard
          post={previewPost}
          index={0}
          cardStyleOverride={activeStyle as Section['cardStyle']}
          badgeStyleOverride={badgeStyle}
        />
      </div>
    </div>
  );
}

/**
 * Renders fixed-width content (a real homepage block, laid out at desktop width)
 * scaled down to fit whatever column it sits in. Without this the 1200px content
 * at a fixed 0.32 scale overflows narrow columns and mobile screens.
 */
function ScaledFrame({
  children,
  contentWidth = 1200,
  maxScale = 0.32,
  className = '',
}: {
  children: React.ReactNode;
  contentWidth?: number;
  maxScale?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxScale);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(maxScale, el.clientWidth / contentWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentWidth, maxScale]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div
        className="pointer-events-none origin-top-left"
        style={{ width: contentWidth, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

function HomepageBlockPreview({
  blockKey,
  title,
  content,
  settings,
  posts,
  currentPrompt,
}: {
  blockKey: string;
  title: string;
  content: HomepageBlockContent;
  settings: SiteSettings;
  posts: Post[];
  currentPrompt?: Post;
}) {
  const previewSettings: SiteSettings = {
    ...settings,
    homepageContent: {
      ...(settings.homepageContent || {}),
      [blockKey]: content,
    },
  };
  const fallbackPost: Post = currentPrompt || posts[0] || {
    id: 'admin-homepage-preview',
    slug: 'admin-homepage-preview',
    title: 'Anime poster prompt',
    description: 'A real homepage preview using your selected content.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=80',
    images: [{
      id: 'preview-image',
      url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=80',
      prompt: 'Vibrant anime poster, dramatic composition, clean typography',
      aiTool: 'ChatGPT',
      model: 'GPT Image',
    }],
    tags: ['anime', 'poster'],
    category: 'Creative',
    aiTools: ['ChatGPT'],
    featured: true,
    views: 1240,
    likes: 86,
    status: 'published',
    visibility: 'public',
    createdAt: new Date().toISOString(),
  };
  const previewPosts = posts.length > 0 ? posts : [fallbackPost];
  const actualPreview = (() => {
    if (blockKey === 'howTo') return <HomeHowItWorks settings={previewSettings} />;
    if (blockKey === 'reviewProcess') return <HomeReviewProcess settings={previewSettings} />;
    if (blockKey === 'promptOfDay') return <HomePromptOfDay post={fallbackPost} settings={previewSettings} />;
    if (blockKey === 'supportedTools') return <HomeSupportedTools posts={previewPosts} settings={previewSettings} />;
    if (blockKey === 'creativeDirections') return <HomeCreativeDirections posts={previewPosts} settings={previewSettings} />;
    if (blockKey === 'creatorFeedback') return <HomeCreatorFeedback settings={previewSettings} />;
    if (blockKey === 'guides') return <HomeGuides settings={previewSettings} />;
    if (blockKey === 'blog') return <HomeBlog settings={previewSettings} />;
    return null;
  })();

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Actual block preview</p>
        <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[10px] font-black text-primary-600 dark:text-primary-300">{title}</span>
      </div>
      <ScaledFrame className="h-[560px] rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-950">
        {actualPreview}
      </ScaledFrame>
      <p className="mt-2 text-[11px] leading-5 text-surface-500">
        This is the real homepage component scaled down for admin preview.
      </p>
    </div>
  );
}

export default function Admin() {
  return (
    <Suspense fallback={null}>
      <MagicWandProvider>
        <AdminInner />
      </MagicWandProvider>
    </Suspense>
  );
}

function AdminInner() {
  const {
    posts, sections, settings, addPost, updatePost, deletePost,
    addSection, updateSection, deleteSection, updateSettings, resetData, deleteMockData, loading, loadAdminData
  } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [mediaLibraryCallback, setMediaLibraryCallback] = useState<((url: string) => void) | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminChecking, setAdminChecking] = useState(false);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);
  const [adminAccessError, setAdminAccessError] = useState<string | null>(null);
  const [adminConfigError, setAdminConfigError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordRecoveryOpen, setPasswordRecoveryOpen] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleRecoveryPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPassword || isUpdatingPassword) return;
    setIsUpdatingPassword(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) {
        showToast('Error updating password: ' + error.message, 'error');
      } else {
        showToast('Password updated successfully!');
        setPasswordRecoveryOpen(false);
        setRecoveryPassword('');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const isAdmin = Boolean(user && !adminAccessDenied);

  const initialDataLoaded = useRef(false);
  const lastAuthUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user && !initialDataLoaded.current) {
      setAdminChecking(true);
      const loadUsers = async () => {
        try {
          const supabase = createSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('No active admin session. Please sign in again.');
          }
          const data = await loadAdminData();
          if (Array.isArray(data?.users)) setAdminUsers(data.users);
          setAdminAccessDenied(false);
          setAdminAccessError(null);
          setAdminConfigError(null);
        } catch (error: unknown) {
          console.error('Failed to load admin data', error);
          const message = error instanceof Error ? error.message : 'Admin request failed';
          if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            setAdminConfigError(message);
          } else {
            setAdminAccessDenied(true);
            setAdminAccessError(message);
          }
        } finally {
          initialDataLoaded.current = true;
          setAdminChecking(false);
        }
      };
      loadUsers();
    }
  }, [user, loadAdminData]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const applyAuthSession = (nextUser: User | null) => {
      const nextUserId = nextUser?.id ?? null;
      const userChanged = lastAuthUserId.current !== nextUserId;
      // Skip no-op updates (e.g. TOKEN_REFRESHED) — calling setUser with the
      // same user object still creates a new reference and re-renders the
      // entire 9,300-line admin component tree.
      if (!userChanged && !authLoading) return;
      lastAuthUserId.current = nextUserId;
      setUser(nextUser);
      if (userChanged) {
        initialDataLoaded.current = false;
        setAdminAccessDenied(false);
        setAdminAccessError(null);
      }
      setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applyAuthSession(session?.user ?? null);

      // Check if we just completed a password reset
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('reset') === 'true') {
          const newPassword = prompt('Enter your new password:');
          if (newPassword) {
            supabase.auth.updateUser({ password: newPassword }).then(({ error }) => {
              if (error) showToast('Error updating password: ' + error.message, 'error');
              else {
                showToast('Password updated successfully!');
                window.history.replaceState({}, '', '/admin');
              }
            });
          }
        } else if (params.get('error')) {
          setAuthError(params.get('error') as string);
          window.history.replaceState({}, '', '/admin');
        }
      }
    });

    const handleOauthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (origin !== window.location.origin && !isLocalhost) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { access_token, refresh_token } = event.data;
        if (access_token && refresh_token) {
          supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
            if (error) {
              setAuthError('Failed to establish session: ' + error.message);
            } else {
              initialDataLoaded.current = false;
              setAdminAccessDenied(false);
              applyAuthSession(data.user);
            }
          });
        } else {
          supabase.auth.getSession().then(({ data: { session } }) => {
            applyAuthSession(session?.user ?? null);
          });
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        const err = event.data.error || 'Google login failed';
        setAuthError(decodeURIComponent(err));
      }
    };
    window.addEventListener('message', handleOauthMessage);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip token-only refreshes — the singleton fix prevents the race, but
      // even a single client firing TOKEN_REFRESHED would trigger a setUser
      // re-render cascade. Only respond to real auth state changes.
      if (event === 'TOKEN_REFRESHED') return;
      applyAuthSession(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryOpen(true);
      }
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleOauthMessage);
    };
  }, []);

  const handleGoogleLogin = () => {
    setAuthError('');
    const popupUrl = `${window.location.origin}/auth/login-popup?next=${encodeURIComponent('/admin')}`;
    const authWindow = window.open(
      popupUrl,
      'oauth_popup',
      'width=600,height=700'
    );
    if (!authWindow) {
      showToast('Please allow popups for this site to sign in with Google.', 'info');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }
    try {
      const supabase = createSupabaseClient();
      // Admin sign-in only — the signup path was removed: accounts are provisioned
      // by invitation, so the public admin screen must never offer registration.
      const res = await supabase.auth.signInWithPassword({ email, password });
      const error = res.error;
      if (error) throw error;
    } catch (e: any) {
      setAuthError(e.message || 'Authentication failed');
    }
  };

  const handleResetPassword = async () => {
    setAuthError('');
    if (!email) {
      setAuthError('Email is required to reset password.');
      return;
    }
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin?reset=true`,
      });
      if (error) throw error;
      showToast('Password reset email sent! Check your inbox.');
    } catch (e: any) {
      setAuthError(e.message || 'Password reset failed');
    }
  };

  const [tab, setTabState] = useState<AdminTab>(() => parseAdminTab(searchParams.get('tab')));
  const [sectionLocationFilter, setSectionLocationFilterState] = useState<SectionLocationFilter>(() => parseSectionLocation(searchParams.get('loc')));
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [postToolFilter, setPostToolFilter] = useState('');
  const [postTagFilter, setPostTagFilter] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState('');
  const [postFeaturedFilter, setPostFeaturedFilter] = useState('');
  const [postSort, setPostSort] = useState<'newest' | 'oldest' | 'views' | 'likes' | 'title'>('newest');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  // Submissions, Comments & Users UI states
  const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'approved' | 'spam'>('all');
  const [commentSearch, setCommentSearch] = useState('');

  // Local state overrides for users and comments merged with DB to make everything live and fully interactive!
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'Admin' | 'Editor' | 'Author' | 'Subscriber'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Author' | 'Subscriber'>('Subscriber');

  // Overrides trackers to avoid setState in useEffect
  const [userOverrides, setUserOverrides] = useState<Record<string, { role?: string; status?: string; name?: string; avatar?: string }>>({});
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);

  const [commentOverrides, setCommentOverrides] = useState<Record<string, { status: 'approved' | 'spam' | 'pending' }>>({});
  const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());

  const [submissionOverrides, setSubmissionOverrides] = useState<Record<string, { status: 'pending' | 'published' | 'rejected' }>>({});

  // Memoized user list merging DB with overrides
  const localUsers = useMemo(() => {
    const dbUsers = adminUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role || 'Subscriber',
      posts: posts.filter(post => post.authorId === user.id).length,
      // eslint-disable-next-line react-hooks/purity
      status: (user.bannedUntil && new Date(user.bannedUntil).getTime() > Date.now()) ? 'suspended' : 'active',
      avatar: user.avatar || user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'
    }));

    const combined = [...invitedUsers, ...dbUsers];

    return combined.map(u => {
      const override = userOverrides[u.id];
      if (override) {
        return { ...u, ...override };
      }
      return u;
    });
  }, [adminUsers, posts, invitedUsers, userOverrides]);

  // Memoized comment list merging DB comments with overrides
  const localComments = useMemo(() => {
    const realComments = posts.flatMap(post =>
      (post.comments || []).map(comment => ({
        id: comment.id,
        userName: comment.userName,
        postTitle: post.title,
        text: comment.text,
        status: comment.status || 'pending',
        createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString().split('T')[0] : '2026-06-27',
        userAvatar: comment.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US',
        postId: post.id
      }))
    );

    const combined = [...realComments];

    return combined
      .filter(c => !deletedCommentIds.has(c.id))
      .map(c => {
        const override = commentOverrides[c.id];
        if (override) {
          return { ...c, ...override };
        }
        return c;
      });
  }, [posts, commentOverrides, deletedCommentIds]);

  // Memoized submission list merging DB submissions with overrides
  const localSubmissions = useMemo(() => {
    const dbPending = posts.filter(p => p.status === 'pending').map(p => ({
      id: p.id,
      title: p.title,
      aiTool: p.aiTools?.[0] || 'ChatGPT',
      authorName: p.authorId ? (localUsers.find(u => u.id === p.authorId)?.name || 'Contributor') : 'Contributor',
      authorEmail: p.authorId ? (localUsers.find(u => u.id === p.authorId)?.email || '') : '',
      createdAt: p.createdAt ? p.createdAt.split('T')[0] : '2026-06-27',
      status: 'pending',
      prompt: p.images?.[0]?.prompt || p.description,
      isReal: true,
      rawPost: p
    }));

    const dbPublished = posts.filter(p => p.status === 'published' && p.id.startsWith('sub')).map(p => ({
      id: p.id,
      title: p.title,
      aiTool: p.aiTools?.[0] || 'ChatGPT',
      authorName: 'Contributor',
      authorEmail: '',
      createdAt: p.createdAt ? p.createdAt.split('T')[0] : '2026-06-27',
      status: 'published',
      prompt: p.images?.[0]?.prompt || p.description,
      isReal: true,
      rawPost: p
    }));

    const combined = [...dbPending, ...dbPublished];

    return combined.map(s => {
      const override = submissionOverrides[s.id];
      if (override) {
        return { ...s, ...override };
      }
      return s;
    });
  }, [posts, localUsers, submissionOverrides]);

  const handleConfirmUserStatus = async (userId: string, newStatus: string, durationVal?: number, durationUn?: string) => {
    const current = userOverrides[userId]?.status || localUsers.find(u => u.id === userId)?.status || 'active';
    setUserOverrides(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        status: newStatus
      }
    }));

    try {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          action: 'updateUserStatus',
          data: { userId, status: newStatus, durationValue: durationVal, durationUnit: durationUn }
        })
      });
      if (!res.ok) {
        throw new Error('Failed to update user status');
      }
      setBanModalUser(null);
    } catch (e) {
      console.error(e);
      setUserOverrides(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          status: current
        }
      }));
      showToast('Failed to update user status', 'error');
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const userObj = localUsers.find(u => u.id === userId);
    const current = userOverrides[userId]?.status || userObj?.status || 'active';
    if (current === 'active') {
      if (userObj) {
        setBanDurationValue(24);
        setBanDurationUnit('Hours');
        setBanModalUser(userObj);
      }
    } else {
      handleConfirmUserStatus(userId, 'active', 0, 'None');
    }
  };

  const handleUpdateUserRole = (userId: string, newRole: string) => {
    setUserOverrides(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        role: newRole
      }
    }));

    const user = localUsers.find(u => u.id === userId);
    if (user && user.email) {
      const email = user.email.toLowerCase();
      let newAdminEmails = [...(settings.adminEmails || [])];

      if (newRole === 'Admin' && !newAdminEmails.includes(email)) {
        newAdminEmails.push(email);
      } else if (newRole !== 'Admin') {
        newAdminEmails = newAdminEmails.filter(e => e.toLowerCase() !== email);
      }

      updateSettings({ ...settings, adminEmails: newAdminEmails });
    }
  };

  const handleInviteUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    const newUser = {
      id: 'invited-' + Date.now(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      posts: 0,
      status: 'active',
      avatar: inviteName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'
    };
    setInvitedUsers(prev => [newUser, ...prev]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
  };

  const handleApproveComment = (commentId: string) => {
    const target = localComments.find(c => c.id === commentId);
    if (!target) return;
    setCommentOverrides(prev => ({
      ...prev,
      [commentId]: { status: 'approved' }
    }));

    const realPost = posts.find(p => p.id === target.postId);
    if (realPost) {
      const updatedComments = (realPost.comments || []).map(c =>
        c.id === commentId ? { ...c, status: 'approved' as const } : c
      );
      updatePost({ ...realPost, comments: updatedComments });
    }
  };

  const handleRejectComment = (commentId: string) => {
    const target = localComments.find(c => c.id === commentId);
    if (!target) return;
    setDeletedCommentIds(prev => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    const realPost = posts.find(p => p.id === target.postId);
    if (realPost) {
      const updatedComments = (realPost.comments || []).filter(c => c.id !== commentId);
      updatePost({ ...realPost, comments: updatedComments });
    }
  };

  const handleFlagCommentAsSpam = (commentId: string) => {
    const target = localComments.find(c => c.id === commentId);
    if (!target) return;
    setCommentOverrides(prev => ({
      ...prev,
      [commentId]: { status: 'spam' }
    }));

    const realPost = posts.find(p => p.id === target.postId);
    if (realPost) {
      const updatedComments = (realPost.comments || []).map(c =>
        c.id === commentId ? { ...c, status: 'pending' as const } : c
      );
      updatePost({ ...realPost, comments: updatedComments });
    }
  };

  const handleApproveSubmission = (subId: string) => {
    const target = localSubmissions.find(s => s.id === subId);
    if (!target) return;
    setSubmissionOverrides(prev => ({
      ...prev,
      [subId]: { status: 'published' }
    }));

    if (target.isReal && target.rawPost) {
      updatePost({ ...target.rawPost, status: 'published' });
    }
  };

  const handleRejectSubmission = (subId: string) => {
    const target = localSubmissions.find(s => s.id === subId);
    if (!target) return;
    setSubmissionOverrides(prev => ({
      ...prev,
      [subId]: { status: 'rejected' }
    }));

    if (target.isReal) {
      deletePost(subId);
    }
  };

  // Post form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [extendedDescription, setExtendedDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [schemaType, setSchemaType] = useState<Post['schemaType']>('HowTo');
  const [faqs, setFaqs] = useState<PostFaq[]>([]);
  const [tagsStr, setTagsStr] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesStr, setCategoriesStr] = useState('');
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'pending' | 'draft'>('published');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [images, setImages] = useState<ImagePrompt[]>([{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
  const [assignedSections, setAssignedSections] = useState<string[]>([]);

  // --- Draft persistence (sessionStorage) ---
  // Debounce-save the in-progress post form so even a genuine reload (browser
  // discarding a backgrounded tab, deploy invalidating old chunks) never loses
  // typed content. The draft is keyed to distinguish new vs edit.
  const DRAFT_KEY = 'pmx-admin-post-draft';
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = useCallback(() => {
    if (!showPostForm) return;
    try {
      const draft = {
        editingPostId: editingPost?.id || null,
        title, slug, description, extendedDescription, thumbnailUrl,
        referenceImages, seoTitle, seoDescription, schemaType, faqs,
        tagsStr, category, categoriesStr, selectedAiTools, featured,
        status, visibility, images, assignedSections,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* quota exceeded — ignore */ }
  }, [
    showPostForm, editingPost, title, slug, description, extendedDescription,
    thumbnailUrl, referenceImages, seoTitle, seoDescription, schemaType, faqs,
    tagsStr, category, categoriesStr, selectedAiTools, featured, status,
    visibility, images, assignedSections,
  ]);

  // Debounce draft saves to every 500ms
  useEffect(() => {
    if (!showPostForm) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(saveDraft, 500);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [saveDraft, showPostForm]);

  // Restore draft on mount if the form isn't already populated
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Only restore if saved less than 30 minutes ago
      if (Date.now() - (draft.savedAt || 0) > 30 * 60 * 1000) {
        sessionStorage.removeItem(DRAFT_KEY);
        return;
      }
      // Only auto-restore if the URL says we should be on the post form
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      const urlAction = new URLSearchParams(window.location.search).get('action');
      if (urlTab !== 'posts' || !urlAction) return;
      if (urlAction === 'new' && draft.editingPostId) return;
      if (urlAction === 'edit') {
        const urlId = new URLSearchParams(window.location.search).get('id');
        if (draft.editingPostId !== urlId) return;
      }
      // Restore
      if (draft.title) setTitle(draft.title);
      if (draft.slug) setSlug(draft.slug);
      if (draft.description) setDescription(draft.description);
      if (draft.extendedDescription) setExtendedDescription(draft.extendedDescription);
      if (draft.thumbnailUrl) setThumbnailUrl(draft.thumbnailUrl);
      if (draft.referenceImages) setReferenceImages(draft.referenceImages);
      if (draft.seoTitle) setSeoTitle(draft.seoTitle);
      if (draft.seoDescription) setSeoDescription(draft.seoDescription);
      if (draft.schemaType) setSchemaType(draft.schemaType);
      if (draft.faqs) setFaqs(draft.faqs);
      if (draft.tagsStr) setTagsStr(draft.tagsStr);
      if (draft.category) setCategory(draft.category);
      if (draft.categoriesStr) setCategoriesStr(draft.categoriesStr);
      if (draft.selectedAiTools) setSelectedAiTools(draft.selectedAiTools);
      if (draft.featured !== undefined) setFeatured(draft.featured);
      if (draft.status) setStatus(draft.status);
      if (draft.visibility) setVisibility(draft.visibility);
      if (draft.images?.length) setImages(draft.images);
      if (draft.assignedSections) setAssignedSections(draft.assignedSections);
      setShowPostForm(true);
      showToast('Restored your unsaved draft', 'info');
    } catch { /* corrupt draft — ignore */ }
  }, []);

  const clearDraft = useCallback(() => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  }, []);


  // Section form

  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionSlug, setNewSectionSlug] = useState('');
  const [newSectionType, setNewSectionType] = useState<Section['type']>('ai-tool');
  const [newSectionLocation, setNewSectionLocation] = useState<'homepage' | 'header' | 'footer'>('homepage');
  const [newSectionTool, setNewSectionTool] = useState('');
  const [newSectionTag, setNewSectionTag] = useState('');
  const [newSectionCategory, setNewSectionCategory] = useState('');
  const [newSectionLimit, setNewSectionLimit] = useState(8);
  const [newSectionCardStyle, setNewSectionCardStyle] = useState<Section['cardStyle'] | ''>('');
  const [newSectionFilterTags, setNewSectionFilterTags] = useState('');
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [expandedHomepageBlock, setExpandedHomepageBlock] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [editSectionSlug, setEditSectionSlug] = useState('');
  const [editSectionLimit, setEditSectionLimit] = useState(8);
  const [editSectionCardStyle, setEditSectionCardStyle] = useState<Section['cardStyle'] | ''>('');
  const [editSectionFilterTags, setEditSectionFilterTags] = useState('');
  const [editSectionHeroTitle, setEditSectionHeroTitle] = useState('');
  const [editSectionHeroDescription, setEditSectionHeroDescription] = useState('');
  const [editSectionHeroBadge, setEditSectionHeroBadge] = useState('');
  const [editSectionSeoTitle, setEditSectionSeoTitle] = useState('');
  const [editSectionSeoDescription, setEditSectionSeoDescription] = useState('');
  const [editSectionIntroContent, setEditSectionIntroContent] = useState('');
  const [editSectionType, setEditSectionType] = useState<Section['type']>('custom');
  const [editSectionLocation, setEditSectionLocation] = useState<Section['location'] | ''>('');
  const [editSectionAiTool, setEditSectionAiTool] = useState('');
  const [editSectionTag, setEditSectionTag] = useState('');
  const [editSectionCategory, setEditSectionCategory] = useState('');
  const [editSectionUseCustomRail, setEditSectionUseCustomRail] = useState(false);
  const [editSectionRailItems, setEditSectionRailItems] = useState<FilterRailItem[]>([]);
  const [pagesSubTab, setPagesSubTab] = useState<'static' | 'seo'>('static');
  const [discoveryTab, setDiscoveryTab] = useState<'explore' | 'tool' | 'tag'>('explore');
  const [pickingPostsForSection, setPickingPostsForSection] = useState<string | null>(null);
  const [postPickerSearch, setPostPickerSearch] = useState('');
  const [sectionPostSearch, setSectionPostSearch] = useState('');
  const [promptOfDayPickerSearch, setPromptOfDayPickerSearch] = useState('');
  const [banModalUser, setBanModalUser] = useState<any | null>(null);
  const [banDurationValue, setBanDurationValue] = useState<number>(24);
  const [banDurationUnit, setBanDurationUnit] = useState<'Hours' | 'Days' | 'Weeks' | 'Months' | 'Permanent' | 'None'>('Hours');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPromptInstruction, setAiPromptInstruction] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode || false);
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteLogo, setSiteLogo] = useState(settings.siteLogo || '');
  const [siteDescription, setSiteDescription] = useState(cleanAdminPublicCopy(settings.siteDescription) || settings.siteDescription);
  const [heroEnabled, setHeroEnabled] = useState(settings.heroEnabled);
  const [heroHideStats, setHeroHideStats] = useState(settings.heroHideStats || false);
  const [heroAutoPlay, setHeroAutoPlay] = useState(settings.heroAutoPlay);
  const [heroContent, setHeroContent] = useState<NonNullable<SiteSettings['heroContent']>>(settings.heroContent || {});
  const [postHeroStyle, setPostHeroStyle] = useState(settings.postHeroStyle || 'v1');
  const [cardStyle, setCardStyle] = useState(settings.cardStyle || 'v2');
  const [badgeStyle, setBadgeStyle] = useState(settings.badgeStyle || 'v1');
  const [adminEmailsStr, setAdminEmailsStr] = useState((settings.adminEmails || []).join(', '));
  const [headerLinks, setHeaderLinks] = useState<NavLink[]>(() => withHeaderLinkIds(settings.headerLinks || []));
  const [headerNavOrder, setHeaderNavOrder] = useState<string[]>(settings.headerNavOrder || []);
  // Header dropdown menus. navMenus === null means "auto" (one "Tools" menu
  // containing all header sections). Legacy headerToolsMenu is migrated.
  const [navMenus, setNavMenus] = useState<Array<{ id: string; label: string; itemNavKeys: string[] }> | null>(() => {
    if (settings.headerMenus) {
      return settings.headerMenus.map(m => ({ id: m.id, label: m.label, itemNavKeys: m.itemNavKeys ?? [] }));
    }
    const legacy = settings.headerToolsMenu;
    if (legacy) {
      return legacy.enabled === false ? [] : [{ id: 'menu-1', label: legacy.label?.trim() || 'Tools', itemNavKeys: legacy.itemNavKeys ?? [] }];
    }
    return null;
  });
  const [headerBuiltins, setHeaderBuiltins] = useState<NonNullable<SiteSettings['headerBuiltins']>>(settings.headerBuiltins || {});
  const [homeLinkBlocks, setHomeLinkBlocks] = useState<HomeLinkBlock[]>(settings.homeLinkBlocks || []);
  const [homepageContent, setHomepageContent] = useState<Record<string, HomepageBlockContent>>(cleanAdminHomepageContent(settings.homepageContent || {}));
  const [articleOverrides, setArticleOverrides] = useState<Record<string, ArticleSettingsOverride>>(settings.articleOverrides || {});
  const [customArticles, setCustomArticles] = useState<ArticleSettingsOverride[]>(settings.customArticles || []);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState('');
  const [articleManagerFilter, setArticleManagerFilter] = useState<'all' | 'blog' | 'guide'>('all');
  const [discoveryPages, setDiscoveryPages] = useState<DiscoveryPageSettings>({
    ...defaultDiscoveryPages,
    ...(settings.discoveryPages || {}),
  });
  const [keepExploring, setKeepExploring] = useState<KeepExploringSettings>({
    ...defaultKeepExploring,
    ...(settings.keepExploring || {}),
    links: settings.keepExploring?.links?.length ? settings.keepExploring.links : defaultKeepExploring.links,
  });
  const [homepageBlockOrder, setHomepageBlockOrder] = useState<string[]>(
    (settings.homepageBlockOrder || defaultHomepageBlockOrder).map(normalizeHomepageOrderToken)
  );
  const [exploreFilterTags, setExploreFilterTags] = useState((settings.exploreFilterTags || []).join(', '));
  const [exploreFilterItems, setExploreFilterItems] = useState<FilterRailItem[]>(
    settings.discoveryPages?.exploreRailItems || settings.exploreFilterItems || tagsToRailItems(settings.exploreFilterTags || [])
  );
  const [toolRailItems, setToolRailItems] = useState<FilterRailItem[]>(settings.discoveryPages?.toolRailItems || []);
  const [tagRailItems, setTagRailItems] = useState<FilterRailItem[]>(settings.discoveryPages?.tagRailItems || []);
  const [sectionRailItems, setSectionRailItems] = useState<FilterRailItem[]>(settings.discoveryPages?.sectionRailItems || []);
  const [creativeDirectionItems, setCreativeDirectionItems] = useState<CreativeDirectionItem[]>(
    settings.creativeDirectionItems || []
  );
  const [expandedCreativeIndex, setExpandedCreativeIndex] = useState<number | null>(null);
  const [footerLinkGroups, setFooterLinkGroups] = useState<FooterLinkGroup[]>(settings.footerLinkGroups || defaultFooterLinkGroups);
  const [socialLinks, setSocialLinks] = useState<NonNullable<SiteSettings['socialLinks']>>(settings.socialLinks || {});
  const [imageProvider, setImageProvider] = useState<UploadProvider>(
    settings.imageProvider === 'cloudflare' ? 'cloudflare' : 'supabase'
  );
  const [adsConfig, setAdsConfig] = useState<AdSettings>(
    settings.ads || {
      header: { enabled: false, code: '' },
      inFeed: { enabled: false, code: '', frequency: 8 },
      postTop: { enabled: false, code: '' },
      postBottom: { enabled: false, code: '' },
    }
  );

  const [features, setFeatures] = useState<SiteFeatures>(
    settings.features || {
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
      showLikeCount: true,
      showViewCount: true,
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
      showAnimatedBackground: true,
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
      mobileColumns: 2,
      desktopColumns: 4,
    }
  );

  const [settingsSubTab, setSettingsSubTabState] = useState<SettingsSubTab>(() => parseSettingsSubTab(searchParams.get('sub')));
  const [markdownMode, setMarkdownMode] = useState<'edit' | 'preview'>('edit');
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [isBackfillingModels, setIsBackfillingModels] = useState(false);

  // AI Studio and Magic Wand state
  const [aiStudioPrompt, setAiStudioPrompt] = useState('');
  const [aiStudioResponse, setAiStudioResponse] = useState('');
  const [aiStudioImageUrl, setAiStudioImageUrl] = useState<string>('');
  const [isAiStudioLoading, setIsAiStudioLoading] = useState(false);
  const { loaders: activeAiLoaders, undoStack: aiUndoStack, runJsonWand, undo: wandUndo } = useMagicWand();
  const [articleAiInstruction, setArticleAiInstruction] = useState('');
  const [isGeneratingArticleAi, setIsGeneratingArticleAi] = useState(false);

  const handleMagicWandFaqs = () => runJsonWand<PostFaq[]>(
    'post-faqs',
    JSON.stringify(faqs),
    (parsed) => { if (Array.isArray(parsed)) setFaqs(parsed); },
    (json) => setFaqs(JSON.parse(json)),
    postPrompts.faqs(title, tagsStr),
  );

  const handleAiStudioSubmit = async () => {
    if (!aiStudioPrompt.trim()) return;
    setIsAiStudioLoading(true);
    try {
      const existingPostsContext = posts.slice(0, 5).map(p => ({ title: p.title, description: p.description }));
      const existingCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))).slice(0, 60) as string[];
      const existingTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 150);
      const sysCtx = aiStudioSystemContext({
        existingTags,
        existingCategories,
        recentPosts: existingPostsContext,
      });
      const response = await askAi(aiStudioPrompt, { systemContext: sysCtx, imageUrl: aiStudioImageUrl });
      setAiStudioResponse(response);
    } catch (err: any) {
      showToast("Failed to generate: " + err.message, 'error');
    } finally {
      setIsAiStudioLoading(false);
    }
  };

  const pushAdminRoute = (
    nextTab: AdminTab,
    options: { sub?: SettingsSubTab; loc?: SectionLocationFilter } = {}
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'dashboard') params.delete('tab');
    else params.set('tab', nextTab);

    if (nextTab === 'settings') {
      params.set('sub', settingsSubTabParam(options.sub || settingsSubTab));
    } else {
      params.delete('sub');
    }

    if (nextTab === 'sections') {
      params.set('loc', options.loc || sectionLocationFilter);
    } else {
      params.delete('loc');
    }

    if (nextTab !== 'posts') {
      params.delete('action');
      params.delete('id');
    }

    if (nextTab !== 'pages') {
      params.delete('page');
    }

    const query = params.toString();
    router.push(query ? `/admin?${query}` : '/admin', { scroll: false });
  };

  const setTab = (nextTab: AdminTab) => {
    setTabState(nextTab);
    pushAdminRoute(nextTab);
  };

  const setSettingsSubTab = (nextSubTab: SettingsSubTab) => {
    setSettingsSubTabState(nextSubTab);
    pushAdminRoute('settings', { sub: nextSubTab });
  };

  const setSectionLocationFilter = (nextLocation: SectionLocationFilter) => {
    setSectionLocationFilterState(nextLocation);
    pushAdminRoute('sections', { loc: nextLocation });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTabState(parseAdminTab(searchParams.get('tab')));
    setSettingsSubTabState(parseSettingsSubTab(searchParams.get('sub')));
    setSectionLocationFilterState(parseSectionLocation(searchParams.get('loc')));
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settings.siteTitle !== undefined) setSiteTitle(settings.siteTitle);
    if (settings.siteLogo !== undefined) setSiteLogo(settings.siteLogo);
    if (settings.siteDescription !== undefined) setSiteDescription(cleanAdminPublicCopy(settings.siteDescription) || settings.siteDescription);
    if (settings.heroEnabled !== undefined) setHeroEnabled(settings.heroEnabled);
    if (settings.heroHideStats !== undefined) setHeroHideStats(settings.heroHideStats);
    if (settings.heroAutoPlay !== undefined) setHeroAutoPlay(settings.heroAutoPlay);
    if (settings.heroContent !== undefined) setHeroContent(settings.heroContent);
    if (settings.postHeroStyle !== undefined) setPostHeroStyle(settings.postHeroStyle);
    if (settings.cardStyle !== undefined) setCardStyle(settings.cardStyle);
    if (settings.badgeStyle !== undefined) setBadgeStyle(settings.badgeStyle);
    if (settings.adminEmails !== undefined) setAdminEmailsStr((settings.adminEmails || []).join(', '));
    if (settings.headerLinks !== undefined) setHeaderLinks(withHeaderLinkIds(settings.headerLinks || []));
    if (settings.headerNavOrder !== undefined) setHeaderNavOrder(settings.headerNavOrder || []);
    if (settings.headerMenus !== undefined) {
      setNavMenus(settings.headerMenus.map(m => ({ id: m.id, label: m.label, itemNavKeys: m.itemNavKeys ?? [] })));
    }
    if (settings.headerBuiltins !== undefined) setHeaderBuiltins(settings.headerBuiltins || {});
    if (settings.homeLinkBlocks !== undefined) setHomeLinkBlocks(settings.homeLinkBlocks || []);
    if (settings.homepageContent !== undefined) setHomepageContent(cleanAdminHomepageContent(settings.homepageContent || {}));
    if (settings.articleOverrides !== undefined) setArticleOverrides(settings.articleOverrides || {});
    if (settings.customArticles !== undefined) setCustomArticles(settings.customArticles || []);
    if (settings.discoveryPages !== undefined) setDiscoveryPages({ ...defaultDiscoveryPages, ...(settings.discoveryPages || {}) });
    if (settings.keepExploring !== undefined) {
      setKeepExploring({
        ...defaultKeepExploring,
        ...(settings.keepExploring || {}),
        links: settings.keepExploring?.links?.length ? settings.keepExploring.links : defaultKeepExploring.links,
      });
    }
    if (settings.homepageBlockOrder !== undefined) {
      setHomepageBlockOrder((settings.homepageBlockOrder || defaultHomepageBlockOrder).map(normalizeHomepageOrderToken));
    }
    if (settings.exploreFilterTags !== undefined) setExploreFilterTags((settings.exploreFilterTags || []).join(', '));
    if (settings.discoveryPages?.exploreRailItems !== undefined || settings.exploreFilterItems !== undefined || settings.exploreFilterTags !== undefined) {
      setExploreFilterItems(settings.discoveryPages?.exploreRailItems || settings.exploreFilterItems || tagsToRailItems(settings.exploreFilterTags || []));
    }
    if (settings.discoveryPages?.toolRailItems !== undefined) setToolRailItems(settings.discoveryPages.toolRailItems || []);
    if (settings.discoveryPages?.tagRailItems !== undefined) setTagRailItems(settings.discoveryPages.tagRailItems || []);
    if (settings.discoveryPages?.sectionRailItems !== undefined) setSectionRailItems(settings.discoveryPages.sectionRailItems || []);
    if (settings.creativeDirectionItems !== undefined) setCreativeDirectionItems(settings.creativeDirectionItems || []);
    if (settings.footerLinkGroups !== undefined) setFooterLinkGroups(settings.footerLinkGroups || defaultFooterLinkGroups);
    if (settings.socialLinks !== undefined) setSocialLinks(settings.socialLinks || {});
    if (settings.imageProvider !== undefined) {
      setImageProvider(settings.imageProvider === 'cloudflare' ? 'cloudflare' : 'supabase');
    }
    if (settings.ads) setAdsConfig(settings.ads);
    if (settings.features) setFeatures(settings.features);
  }, [settings]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'sections' | 'settings'>('dashboard');

  // Get custom sections for assignment
  const customSections = sections.filter(s => s.type === 'custom');
  const publicPosts = getPublicPosts(posts);
  const articleManagerSettings: SiteSettings = { ...settings, articleOverrides, customArticles };
  const managedArticles = getArticlesForSettings(articleManagerSettings);
  const filteredManagedArticles = articleManagerFilter === 'all'
    ? managedArticles
    : managedArticles.filter(article => article.category === articleManagerFilter);
  const selectedArticle = selectedArticleSlug ? managedArticles.find(article => article.slug === selectedArticleSlug) : undefined;
  const selectedArticleIsCustom = Boolean(selectedArticle && customArticles.some(article => article.slug === selectedArticle.slug));
  const guideArticles = managedArticles.filter(article => article.category === 'guide');
  const blogArticles = managedArticles.filter(article => article.category === 'blog');
  const featuredPosts = publicPosts.filter(post => post.featured);
  const promptOfDayContent = homepageContent.promptOfDay || {};
  const pinnedPromptOfDayId = promptOfDayContent.pinnedPostId;
  const currentPromptOfDay = publicPosts.find(post => post.id === pinnedPromptOfDayId || post.slug === pinnedPromptOfDayId) || featuredPosts[0] || publicPosts[0];
  const currentPromptOfDayImage = currentPromptOfDay?.thumbnailUrl || currentPromptOfDay?.images?.[0]?.url || '';
  const promptOfDayPickerPosts = publicPosts
    .filter(post => {
      const query = promptOfDayPickerSearch.trim().toLowerCase();
      if (!query) return true;
      const values = [
        post.title,
        post.description,
        post.category || '',
        ...(post.categories || []),
        ...(post.tags || []),
        ...getAllTools(post),
      ];
      return values.some(value => value.toLowerCase().includes(query));
    })
    .slice(0, 24);
  const homepagePostSections = sections
    .filter(section => (section.location || 'homepage') === 'homepage')
    .sort((a, b) => a.order - b.order);
  const homepageSectionTokens = homepagePostSections.map(section => `section:${section.id}`);
  const defaultHomepageOrder = [
    ...defaultHomepageBlockOrder.map(key => `block:${key}`),
    ...homepageSectionTokens,
  ];
  const orderedHomepageItems = [
    ...homepageBlockOrder.filter(token => {
      if (token.startsWith('block:')) return defaultHomepageBlockOrder.includes(token.replace('block:', '') as any);
      if (token.startsWith('section:')) return homepageSectionTokens.includes(token);
      return false;
    }),
    ...defaultHomepageOrder.filter(token => !homepageBlockOrder.includes(token)),
  ];
  const activeHomepageBlockOption = expandedHomepageBlock
    ? homepageBlockOptions.find(item => item.key === expandedHomepageBlock)
    : undefined;
  const activeHomepageBlockContent = activeHomepageBlockOption
    ? homepageContent[activeHomepageBlockOption.key] || {}
    : undefined;
  const autoExploreItems = getAutoExploreItems(posts);
  const savedExploreItems = cleanRailItems(exploreFilterItems);
  const liveExploreItems = savedExploreItems.length > 0 ? savedExploreItems : autoExploreItems;
  const savedToolRailItems = cleanRailItems(toolRailItems);
  const liveToolRailItems = savedToolRailItems.length > 0 ? savedToolRailItems : autoExploreItems;
  const savedTagRailItems = cleanRailItems(tagRailItems);
  const liveTagRailItems = savedTagRailItems.length > 0 ? savedTagRailItems : autoExploreItems;
  const savedSectionRailItems = cleanRailItems(sectionRailItems);
  const liveSectionRailItems = savedSectionRailItems.length > 0 ? savedSectionRailItems : autoExploreItems;
  const autoCreativeItems = getAutoCreativeItems(posts);
  const savedCreativeItems = cleanCreativeDirectionItems(creativeDirectionItems);
  const liveCreativeItems = savedCreativeItems.length > 0 ? savedCreativeItems : autoCreativeItems;
  const supportedTools = Array.from(new Set(publicPosts.flatMap(post => getAllTools(post)).filter(Boolean)));
  const getHomepageBlockDetail = (key: string) => {
    if (key === 'howTo') return 'Fixed 3-step guidance block with clickable preview cards';
    if (key === 'reviewProcess') return 'Fixed trust block about prompt checks and public quality';
    if (key === 'promptOfDay') {
      return currentPromptOfDay ? `${currentPromptOfDay.title} (${pinnedPromptOfDayId ? 'pinned' : currentPromptOfDay.featured ? 'featured' : 'latest public'})` : 'No public post available';
    }
    if (key === 'supportedTools') {
      return supportedTools.length > 0 ? supportedTools.slice(0, 5).join(', ') + (supportedTools.length > 5 ? ` +${supportedTools.length - 5}` : '') : 'No AI tools found in posts';
    }
    if (key === 'creativeDirections') return `${liveCreativeItems.length} ${savedCreativeItems.length > 0 ? 'saved' : 'auto'} cards`;
    if (key === 'creatorFeedback') return 'Static creator-focused trust section';
    if (key === 'guides') {
      const selectedCount = homepageContent.guides?.selectedGuideSlugs?.length || 0;
      return selectedCount > 0 ? `${selectedCount} manually selected guide${selectedCount === 1 ? '' : 's'}` : 'Auto: featured/latest guides';
    }
    if (key === 'blog') {
      const selectedCount = homepageContent.blog?.selectedBlogSlugs?.length || 0;
      return selectedCount > 0 ? `${selectedCount} manually selected blog post${selectedCount === 1 ? '' : 's'}` : 'Auto: latest blog posts';
    }
    return 'Homepage block';
  };

  const resetForm = () => {
    setTitle(''); setSlug(''); setDescription(''); setExtendedDescription(''); setThumbnailUrl(''); setReferenceImages([]); setSeoTitle(''); setSeoDescription(''); setSchemaType('HowTo'); setFaqs([]); setTagsStr(''); setCategory(''); setCategoriesStr(''); setSelectedAiTools([]);
    setFeatured(false); setImages([{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
    setStatus('published'); setVisibility('public');
    setEditingPost(null); setShowPostForm(false); setAssignedSections([]);
    clearDraft();
  };

  const closePostForm = () => {
    resetForm();
    router.push('/admin?tab=posts', { scroll: false });
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug || '');
    setDescription(post.description);
    setExtendedDescription(post.extendedDescription || '');
    setThumbnailUrl(post.thumbnailUrl || '');
    setReferenceImages(post.referenceImages || []);
    setSeoTitle(post.seoTitle || '');
    setSeoDescription(post.seoDescription || '');
    setSchemaType(post.schemaType || 'HowTo');
    setFaqs(post.faqs || []);
    setTagsStr(post.tags.join(', '));
    setCategory(post.category || '');
    setCategoriesStr(post.categories?.join(', ') || '');
    setSelectedAiTools(post.aiTools || []);
    setFeatured(post.featured);
    setStatus(post.status || 'published');
    setVisibility(post.visibility || 'public');
    setImages(post.images.length > 0 ? post.images.map(image => ({
      ...image,
      model: image.model || getImageModelForTools(image.aiTools || [image.aiTool].filter(Boolean))
    })) : [{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
    // Find which custom sections contain this post
    const inSections = sections
      .filter(s => s.type === 'custom' && s.postIds?.includes(post.id))
      .map(s => s.id);
    setAssignedSections(inSections);
    setShowPostForm(true);
  };

  const openNewPost = () => {
    resetForm();
    setShowPostForm(true);
    setTabState('posts');
    router.push('/admin?tab=posts&action=new', { scroll: false });
  };

  const openEditPost = (post: Post) => {
    startEdit(post);
    setTabState('posts');
    router.push(`/admin?tab=posts&action=edit&id=${encodeURIComponent(post.id)}`, { scroll: false });
  };

  // Ref for posts so the URL-sync effect below doesn't re-run on every posts
  // array reference change (which happens on token refresh, likes, views, etc.)
  const postsRef = useRef(posts);
  postsRef.current = posts;

  useEffect(() => {
    if (parseAdminTab(searchParams.get('tab')) !== 'posts') return;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    if (action === 'new') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetForm();
      setShowPostForm(true);
      return;
    }
    if (action === 'edit' && id) {
      const post = postsRef.current.find(item => item.id === id || item.slug === id);
      if (post && editingPost?.id !== post.id) {
        startEdit(post);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const addImageField = () => {
    setImages(prev => [...prev, { id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
  };

  const updateImage = (idx: number, field: keyof ImagePrompt | Partial<ImagePrompt>, value?: any) => {
    setImages(prev => prev.map((img, i) => {
      if (i !== idx) return img;
      if (typeof field === 'string') {
        return { ...img, [field]: value };
      }
      return { ...img, ...field };
    }));
  };

  const getModelSelectValue = (model?: string) => {
    if (!model?.trim()) return AUTO_MODEL_VALUE;
    return DEFAULT_MODEL_OPTIONS.includes(model) ? model : CUSTOM_MODEL_VALUE;
  };

  const handleModelSelect = (idx: number, img: ImagePrompt, value: string) => {
    const selectedTools = img.aiTools || [img.aiTool].filter(Boolean);
    if (value === AUTO_MODEL_VALUE) {
      updateImage(idx, 'model', getImageModelForTools(selectedTools));
      return;
    }
    if (value === CUSTOM_MODEL_VALUE) {
      updateImage(idx, 'model', DEFAULT_MODEL_OPTIONS.includes(img.model || '') ? '' : img.model || '');
      return;
    }
    updateImage(idx, 'model', value);
  };

  const normalizeImageModel = (image: ImagePrompt) => {
    const tools = image.aiTools || [image.aiTool].filter(Boolean);
    const model = getImageModelForTools(tools, image.model);
    return model && model !== image.model ? { ...image, model } : image;
  };

  const handleBackfillModels = async () => {
    const postsToUpdate = posts
      .map(post => {
        let changed = false;
        const updatedImages = post.images.map(image => {
          const updated = normalizeImageModel(image);
          if (updated !== image) changed = true;
          return updated;
        });
        return changed ? { ...post, images: updatedImages } : null;
      })
      .filter((post): post is Post => Boolean(post));

    if (postsToUpdate.length === 0) {
      showToast('All image model labels are already filled.', 'info');
      return;
    }

    setIsBackfillingModels(true);
    try {
      for (const post of postsToUpdate) {
        await updatePost(post);
      }
      await loadAdminData();
      showToast(`Filled model labels for ${postsToUpdate.length} posts.`);
    } catch (error: any) {
      console.error('Failed to backfill models:', error);
      showToast(`Failed to fill model labels: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsBackfillingModels(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImageFile = async (
    file: File,
    preset: ImageOptimizePreset = 'prompt',
    baseName?: string
  ): Promise<string> => {
    const optimizedFile = await optimizeImageFile(file, preset);
    return uploadImageFileToProvider(optimizedFile, imageProvider, preset, baseName);
  };

  const handleImageUpload = async (idx: number, file: File) => {
    try {
      const currentUrls = (images[idx].urls && images[idx].urls!.length > 0 ? images[idx].urls! : [images[idx].url]).filter(Boolean);
      updateImage(idx, {
        urls: [...currentUrls, 'Uploading...'],
        url: currentUrls[0] || 'Uploading...'
      });
      const url = await uploadImageFile(file, 'prompt', title || slug);
      const updated = [...currentUrls, url];
      updateImage(idx, {
        urls: updated,
        url: updated[0] || ''
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to process image', 'error');
      const currentUrls = (images[idx].urls && images[idx].urls!.length > 0 ? images[idx].urls! : [images[idx].url]).filter(u => u !== 'Uploading...');
      updateImage(idx, {
        urls: currentUrls,
        url: currentUrls[0] || ''
      });
    }
  };

  const handlePromptImagesUpload = async (idx: number, files: File[]) => {
    if (files.length === 0) return;
    try {
      const currentUrls = (images[idx].urls && images[idx].urls!.length > 0 ? images[idx].urls! : [images[idx].url]).filter(Boolean);
      const uploadingLabels = files.map(() => 'Uploading...');
      updateImage(idx, {
        urls: [...currentUrls, ...uploadingLabels],
        url: currentUrls[0] || 'Uploading...'
      });

      const newUrls = await Promise.all(
        files.map(file => uploadImageFile(file, 'prompt', title || slug))
      );

      const finalUrls = [...currentUrls, ...newUrls];
      updateImage(idx, {
        urls: finalUrls,
        url: finalUrls[0] || ''
      });
      showToast(`Uploaded ${newUrls.length} image${newUrls.length === 1 ? '' : 's'}`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to upload some prompt images', 'error');
      const currentUrls = (images[idx].urls && images[idx].urls!.length > 0 ? images[idx].urls! : [images[idx].url]).filter(u => u !== 'Uploading...');
      updateImage(idx, {
        urls: currentUrls,
        url: currentUrls[0] || ''
      });
    }
  };

  const addPromptImageUrl = (idx: number, url: string) => {
    if (!url.trim()) return;
    const currentUrls = (images[idx].urls && images[idx].urls!.length > 0 ? images[idx].urls! : [images[idx].url]).filter(Boolean);
    if (!currentUrls.includes(url.trim())) {
      const updated = [...currentUrls, url.trim()];
      updateImage(idx, {
        urls: updated,
        url: updated[0] || ''
      });
    }
  };

  const removePromptImageUrl = (promptIdx: number, imgIdx: number) => {
    const currentUrls = (images[promptIdx].urls && images[promptIdx].urls!.length > 0 ? images[promptIdx].urls! : [images[promptIdx].url]).filter(Boolean);
    const updated = currentUrls.filter((_, i) => i !== imgIdx);
    updateImage(promptIdx, {
      urls: updated,
      url: updated[0] || ''
    });
  };

  const setPromptCoverImage = (promptIdx: number, imgIdx: number) => {
    const currentUrls = (images[promptIdx].urls && images[promptIdx].urls!.length > 0 ? images[promptIdx].urls! : [images[promptIdx].url]).filter(Boolean);
    if (imgIdx === 0 || !currentUrls[imgIdx]) return;
    const target = currentUrls[imgIdx];
    const remaining = currentUrls.filter((_, i) => i !== imgIdx);
    const reordered = [target, ...remaining];
    updateImage(promptIdx, {
      urls: reordered,
      url: target
    });
  };

  const handleArticleThumbnailUpload = async (slug: string, file: File) => {
    try {
      updateManagedArticle(slug, { thumbnailUrl: 'Uploading...' });
      const url = await uploadImageFile(file, 'thumbnail', slug);
      updateManagedArticle(slug, { thumbnailUrl: url });
    } catch (err) {
      console.error(err);
      showToast('Failed to upload article thumbnail', 'error');
      updateManagedArticle(slug, { thumbnailUrl: '' });
    }
  };

  const handleCreativeDirectionLogoUpload = async (index: number, file: File) => {
    try {
      updateRailItem('creative', index, 'imageUrl', 'Uploading...');
      const url = await uploadImageFile(file, 'thumbnail', creativeDirectionItems[index]?.label);
      updateRailItem('creative', index, 'imageUrl', url);
    } catch (err) {
      console.error(err);
      showToast('Failed to upload browse card logo', 'error');
      updateRailItem('creative', index, 'imageUrl', '');
    }
  };

  const toggleSectionAssignment = (sectionId: string) => {
    setAssignedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerateAiDetails = async () => {
    // Collect the images that have prompts
    const usedImages = images.filter(i => i.prompt);
    if (usedImages.length === 0) {
      showToast("Please add at least one image with a prompt first before generating details.", 'info');
      return;
    }

    setIsGeneratingAi(true);
    try {
      // Get last 5 posts for style context
      const existingPostsContext = posts.slice(0, 5).map(p => ({ title: p.title, description: p.description }));
      // Give the AI the real site taxonomy so it reuses existing categories/tags
      // instead of inventing near-duplicates every time.
      const existingCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
      const existingTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          images: usedImages,
          existingPosts: existingPostsContext,
          promptInstruction: aiPromptInstruction,
          existingCategories,
          existingTags,
          currentFields: {
            title,
            seoTitle,
            description,
            seoDescription,
            extendedDescription,
            category,
            tags: tagsStr,
            schemaType,
            faqs
          }
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.title && !editingPost) setSlug(slugify(data.title));
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.description) setDescription(data.description);
      if (data.seoDescription) setSeoDescription(data.seoDescription);
      if (data.extendedDescription) setExtendedDescription(data.extendedDescription);
      if (data.category && !category) setCategory(data.category);
      if (data.tags && Array.isArray(data.tags)) setTagsStr(data.tags.join(', '));
      if (data.schemaType) setSchemaType(data.schemaType);
      if (data.faqs && Array.isArray(data.faqs)) setFaqs(data.faqs);

      showToast("Generated details successfully!");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to generate details. " + err.message, 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateArticleDetails = async () => {
    if (!selectedArticle) return;

    const hasTopic = selectedArticle.title.trim() && selectedArticle.title.trim() !== 'New Article';
    if (!hasTopic && !articleAiInstruction.trim()) {
      showToast('Set a working title first, or describe the article you want in the instructions box.', 'info');
      return;
    }

    setIsGeneratingArticleAi(true);
    try {
      // Existing articles for tone/style context + tag reuse, like the post generator.
      const existingArticlesContext = managedArticles
        .filter(a => a.slug !== selectedArticle.slug)
        .slice(0, 15)
        .map(a => ({ title: a.title, description: a.description }));
      const existingArticleTags = Array.from(new Set(managedArticles.flatMap(a => a.tags || [])));

      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          topic: hasTopic ? selectedArticle.title : '',
          category: selectedArticle.category,
          promptInstruction: articleAiInstruction,
          existingArticles: existingArticlesContext,
          existingTags: existingArticleTags,
          currentFields: {
            title: selectedArticle.title,
            description: selectedArticle.description,
            tags: selectedArticle.tags,
            body: selectedArticle.body
          }
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      const patch: Partial<ArticleSettingsOverride> = {};
      if (data.title) patch.title = data.title;
      if (data.description) patch.description = data.description;
      if (Array.isArray(data.tags) && data.tags.length) patch.tags = data.tags;
      if (data.body) {
        patch.body = data.body;
        patch.readMinutes = Math.max(1, Math.round(data.body.trim().split(/\s+/).length / 200));
      }

      // For brand-new custom articles still on their placeholder slug, derive
      // the real slug from the generated title.
      if (data.title && selectedArticleIsCustom && selectedArticle.slug.startsWith('new-article-')) {
        const nextSlug = slugify(data.title);
        if (nextSlug && !managedArticles.some(a => a.slug === nextSlug)) {
          patch.slug = nextSlug;
        }
      }

      updateManagedArticle(selectedArticle.slug, patch);
      if (patch.slug) setSelectedArticleSlug(patch.slug);

      showToast('Generated article details successfully! Review the fields, then hit Save Articles.');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to generate article. ' + err.message, 'error');
    } finally {
      setIsGeneratingArticleAi(false);
    }
  };

  const handleSavePost = async () => {
    if (!thumbnailUrl) {
      showToast('Thumbnail URL is required', 'error');
      return;
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || generateId();

    // Check for duplicate slugs
    const slugInUse = posts.some(p => p.slug === finalSlug && p.id !== (editingPost?.id || ''));
    if (slugInUse) {
      showToast('This slug is already in use. Please choose a different one.', 'error');
      return;
    }

    const postId = editingPost?.id || generateId();
    const isFinished = title.trim() !== '' && description.trim() !== '' && images.length > 0 && images.some(i => i.url || i.prompt);
    let finalStatus = status;
    if (!isFinished && status === 'published') {
      finalStatus = 'draft';
    }

    const post: any = {
      id: postId,
      slug: finalSlug,
      title: title || 'Untitled Post',
      description: description || '',
      extendedDescription: extendedDescription || '',
      schemaType: schemaType || undefined,
      faqs: faqs
        .map(item => ({ question: item.question.trim(), answer: item.answer.trim() }))
        .filter(item => item.question && item.answer),
      thumbnailUrl,
      referenceImages: referenceImages.filter(Boolean),
      images: images.filter(i => i.url || i.prompt || i.aiTool),
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      category: category || undefined,
      categories: categoriesStr.split(',').map(c => c.trim()).filter(Boolean),
      aiTools: selectedAiTools,
      authorId: editingPost?.authorId,
      authorName: editingPost?.authorName,
      authorUsername: editingPost?.authorUsername,
      authorAvatar: editingPost?.authorAvatar,
      featured,
      views: editingPost?.views || 0,
      likes: editingPost?.likes || 0,
      likedByUser: editingPost?.likedByUser,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      status: finalStatus,
      visibility,
    };
    if (seoTitle) post.seoTitle = seoTitle;
    if (seoDescription) post.seoDescription = seoDescription;

    try {
      if (editingPost) {
        await updatePost(post);
      } else {
        await updatePost(post);
      }

    // Update custom sections - add/remove post from sections
      for (const section of customSections) {
        const wasAssigned = section.postIds?.includes(postId) || false;
        const isAssigned = assignedSections.includes(section.id);
        if (wasAssigned && !isAssigned) {
          await updateSection({ ...section, postIds: (section.postIds || []).filter(id => id !== postId) });
        } else if (!wasAssigned && isAssigned) {
          await updateSection({ ...section, postIds: [...(section.postIds || []), postId] });
        }
      }

      await loadAdminData();
      closePostForm();
      showToast(!isFinished && status === 'published'
        ? 'Post saved as draft because some required fields (title, description, or images) are missing.'
        : 'Post saved successfully.', !isFinished && status === 'published' ? 'info' : 'success');
    } catch (error: any) {
      console.error('Failed to save post:', error);
      showToast(`Failed to save post: ${error?.message || 'Unknown error'}`, 'error');
    }
  };

  const handleAddSection = () => {
    if (!newSectionName) return;
    const sectionSlug = newSectionSlug || slugify(newSectionName);
    addSection({
      id: generateId(),
      slug: sectionSlug,
      name: newSectionName,
      type: newSectionType,
      location: newSectionLocation,
      aiTool: newSectionType === 'ai-tool' ? newSectionTool : undefined,
      tag: newSectionType === 'tag' ? newSectionTag : undefined,
      category: newSectionType === 'category' ? newSectionCategory : undefined,
      postIds: newSectionType === 'custom' ? [] : undefined,
      order: sections.filter(s => (s.location || 'homepage') === newSectionLocation).length,
      visible: true,
      limit: newSectionLimit,
      cardStyle: newSectionCardStyle || undefined,
      filterTags: cleanCommaList(newSectionFilterTags),
    });
    setNewSectionName('');
    setNewSectionSlug('');
    setNewSectionLimit(8);
    setNewSectionTool('');
    setNewSectionTag('');
    setNewSectionCategory('');
    setNewSectionCardStyle('');
    setNewSectionFilterTags('');
    setShowNewSectionForm(false);
  };

  const startNewSection = (location: 'homepage' | 'header' | 'footer' = 'homepage') => {
    setNewSectionLocation(location);
    setSectionLocationFilter(location);
    setShowNewSectionForm(true);
    window.requestAnimationFrame(() => {
      document.getElementById('add-section-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const duplicatePost = async (post: Post) => {
    const id = generateId();
    const duplicated: Post = {
      ...JSON.parse(JSON.stringify(post)),
      id,
      slug: `${post.slug || slugify(post.title)}-${id.slice(0, 4)}`,
      title: `${post.title} Copy`,
      featured: false,
      views: 0,
      likes: 0,
      likedBy: [],
      bookmarkedBy: [],
      comments: [],
      status: 'draft',
      visibility: 'private',
      createdAt: new Date().toISOString(),
    };
    await updatePost(duplicated);
  };

  const togglePostSelection = (id: string) => {
    setSelectedPostIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const applyBulkPostAction = async (action: 'feature' | 'unfeature' | 'publish' | 'unpublish' | 'delete') => {
    const selected = posts.filter(post => selectedPostIds.includes(post.id));
    if (selected.length === 0) return;
    if (action === 'delete' && !(await confirmAction({ title: `Delete ${selected.length} selected post${selected.length === 1 ? '' : 's'}?`, message: 'This permanently removes the posts and their data.', confirmLabel: 'Delete' }))) return;

    for (const post of selected) {
      if (action === 'delete') await deletePost(post.id);
      if (action === 'feature') await updatePost({ ...post, featured: true });
      if (action === 'unfeature') await updatePost({ ...post, featured: false });
      if (action === 'publish') await updatePost({ ...post, status: 'published', visibility: 'public' });
      if (action === 'unpublish') await updatePost({ ...post, status: 'draft', visibility: 'private' });
    }
    setSelectedPostIds([]);
  };

  const moveSection = (section: Section, dir: 'up' | 'down') => {
    const sorted = [...sections].filter(s => (s.location || 'homepage') === (section.location || 'homepage')).sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === section.id);
    if (dir === 'up' && idx > 0) {
      const prev = sorted[idx - 1];
      const prevOrder = prev.order;
      updateSection({ ...section, order: prevOrder });
      updateSection({ ...prev, order: section.order });
    } else if (dir === 'down' && idx < sorted.length - 1) {
      const next = sorted[idx + 1];
      const nextOrder = next.order;
      updateSection({ ...section, order: nextOrder });
      updateSection({ ...next, order: section.order });
    }
  };

  const startEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setExpandedHomepageBlock(null);
    setSectionPostSearch('');
    setEditSectionName(section.name);
    setEditSectionSlug(section.slug || '');
    setEditSectionLimit(section.limit);
    setEditSectionCardStyle(section.cardStyle || '');
    setEditSectionHeroTitle(section.heroTitle || '');
    setEditSectionHeroDescription(section.heroDescription || '');
    setEditSectionHeroBadge(section.heroBadge || '');
    setEditSectionSeoTitle(section.seoTitle || '');
    setEditSectionSeoDescription(section.seoDescription || '');
    setEditSectionIntroContent(section.introContent || '');
    setEditSectionFilterTags((section.filterTags || []).join(', '));
    setEditSectionType(section.type);
    setEditSectionLocation(section.location || '');
    setEditSectionAiTool(section.aiTool || '');
    setEditSectionTag(section.tag || '');
    setEditSectionCategory(section.category || '');
    setEditSectionUseCustomRail(section.useCustomRail || false);
    setEditSectionRailItems(section.railItems || []);
  };

  const saveEditSection = (section: Section) => {
    const latestSection = sections.find(item => item.id === section.id) || section;
    updateSection({
      ...latestSection,
      name: editSectionName,
      slug: editSectionSlug || slugify(editSectionName),
      limit: editSectionLimit,
      cardStyle: editSectionCardStyle || undefined,
      heroBadge: editSectionHeroBadge || undefined,
      heroTitle: editSectionHeroTitle || undefined,
      heroDescription: editSectionHeroDescription || undefined,
      seoTitle: editSectionSeoTitle || undefined,
      seoDescription: editSectionSeoDescription || undefined,
      introContent: editSectionIntroContent || undefined,
      filterTags: cleanCommaList(editSectionFilterTags),
      type: editSectionType,
      location: editSectionLocation || undefined,
      aiTool: editSectionAiTool || undefined,
      tag: editSectionTag || undefined,
      category: editSectionCategory || undefined,
      useCustomRail: editSectionUseCustomRail,
      railItems: editSectionRailItems,
    });
    setEditingSectionId(null);
  };

  const toggleSectionVisibility = (section: Section) => {
    updateSection({ ...section, visible: !section.visible });
  };

  const togglePostInSection = (sectionId: string, postId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const currentIds = section.postIds || [];
    const newIds = currentIds.includes(postId)
      ? currentIds.filter(id => id !== postId)
      : [...currentIds, postId];
    updateSection({ ...section, postIds: newIds });
  };

  const movePostInSection = (section: Section, postId: string, dir: 'up' | 'down') => {
    const currentIds = section.postIds || [];
    const idx = currentIds.indexOf(postId);
    if (idx === -1) return;
    const nextIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= currentIds.length) return;
    const nextIds = [...currentIds];
    [nextIds[idx], nextIds[nextIdx]] = [nextIds[nextIdx], nextIds[idx]];
    updateSection({ ...section, postIds: nextIds });
  };

  const updateHeaderLink = (index: number, field: keyof NavLink, value: string) => {
    setHeaderLinks(prev => prev.map((link, i) => i === index ? { ...link, [field]: value } : link));
  };

  const headerNavSections = sections.filter(s => s.location === 'header' && s.visible).sort((a, b) => a.order - b.order);
  // includeHiddenBuiltins: keep hidden built-ins in the editor list so they can
  // be toggled back on. The public header omits them.
  const headerNavItems = buildHeaderNavItems({ features: settings.features, headerLinks, headerNavOrder, headerBuiltins }, headerNavSections, true);

  const moveHeaderNavItem = (navKey: string, dir: -1 | 1) => {
    const keys = headerNavItems.map(item => item.navKey);
    const from = keys.indexOf(navKey);
    const to = from + dir;
    if (from === -1 || to < 0 || to >= keys.length) return;
    const next = [...keys];
    [next[from], next[to]] = [next[to], next[from]];
    setHeaderNavOrder(next);
  };

  type HeaderBuiltinKey = 'home' | 'explore' | 'blog' | 'submit';
  const toggleHeaderBuiltinHidden = (key: HeaderBuiltinKey) => {
    setHeaderBuiltins(prev => ({ ...prev, [key]: { ...prev[key], hidden: !prev[key]?.hidden } }));
  };
  const updateHeaderBuiltinLabel = (key: HeaderBuiltinKey, label: string) => {
    setHeaderBuiltins(prev => ({ ...prev, [key]: { ...prev[key], label } }));
  };

  const autoToolsMenuKeys = () => headerNavItems.filter(i => i.kind === 'section').map(i => i.navKey);
  const AUTO_MENU_ID = '__auto-tools';
  // Editing anything while in auto mode first materializes the auto menu so
  // current behavior continues unchanged from there.
  const materializeAutoMenus = () => [{ id: newNavId(), label: 'Tools', itemNavKeys: autoToolsMenuKeys() }];
  const effectiveNavMenus = navMenus ?? [{ id: AUTO_MENU_ID, label: 'Tools', itemNavKeys: autoToolsMenuKeys() }];
  // A nav item can belong to at most one dropdown menu.
  const navMenuOwner = (navKey: string) => effectiveNavMenus.find(m => m.itemNavKeys.includes(navKey))?.id ?? null;
  const toggleNavMenuItem = (menuId: string, navKey: string) => {
    const base = navMenus ?? materializeAutoMenus();
    const targetId = menuId === AUTO_MENU_ID ? base[0].id : menuId;
    setNavMenus(base.map(m => m.id === targetId
      ? { ...m, itemNavKeys: m.itemNavKeys.includes(navKey) ? m.itemNavKeys.filter(k => k !== navKey) : [...m.itemNavKeys, navKey] }
      : { ...m, itemNavKeys: m.itemNavKeys.filter(k => k !== navKey) }
    ));
  };
  const addNavMenu = () => setNavMenus([...(navMenus ?? []), { id: newNavId(), label: '', itemNavKeys: [] }]);
  const removeNavMenu = (menuId: string) => setNavMenus((navMenus ?? []).filter(m => m.id !== menuId));
  const updateNavMenuLabel = (menuId: string, label: string) => {
    const targetId = menuId === AUTO_MENU_ID ? materializeAutoMenus()[0].id : menuId;
    setNavMenus((navMenus ?? materializeAutoMenus()).map(m => (m.id === targetId ? { ...m, label } : m)));
  };
  const resetNavMenus = () => setNavMenus(null);

  const addHeaderLink = () => {
    const link: NavLink = { id: newNavId(), label: '', href: '' };
    setHeaderLinks(prev => [...prev, link]);
    setHeaderNavOrder(prev => [...headerNavItems.map(i => i.navKey), headerLinkKey(link, headerLinks.length)]
      .filter((k, i, arr) => arr.indexOf(k) === i));
  };

  const removeHeaderLink = (index: number) => {
    const removedKey = headerLinkKey(headerLinks[index], index);
    setHeaderLinks(prev => prev.filter((_, i) => i !== index));
    setHeaderNavOrder(prev => prev.filter(k => k !== removedKey));
  };

  const updateHomeLinkBlock = (index: number, field: keyof HomeLinkBlock, value: string) => {
    setHomeLinkBlocks(prev => prev.map((block, i) => i === index ? { ...block, [field]: value } : block));
  };

  const updateKeepExploringLink = (
    index: number,
    field: 'label' | 'href' | 'icon',
    value: string,
  ) => {
    setKeepExploring(prev => {
      const links = [...(prev.links || defaultKeepExploring.links)];
      links[index] = { ...(links[index] || { label: '', href: '', icon: 'image' }), [field]: value };
      return { ...prev, links };
    });
  };

  const updateHomepageContent = (key: string, field: keyof HomepageBlockContent, value: HomepageBlockContent[keyof HomepageBlockContent]) => {
    setHomepageContent(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const toggleHomepageGuide = (slug: string) => {
    setHomepageContent(prev => {
      const current = prev.guides || {};
      const selected = current.selectedGuideSlugs || [];
      const nextSelected = selected.includes(slug)
        ? selected.filter(item => item !== slug)
        : [...selected, slug].slice(0, 4);
      return {
        ...prev,
        guides: {
          ...current,
          selectedGuideSlugs: nextSelected,
        },
      };
    });
  };

  const moveHomepageGuide = (slug: string, direction: -1 | 1) => {
    setHomepageContent(prev => {
      const current = prev.guides || {};
      const selected = [...(current.selectedGuideSlugs || [])];
      const index = selected.indexOf(slug);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= selected.length) return prev;
      [selected[index], selected[nextIndex]] = [selected[nextIndex], selected[index]];
      return {
        ...prev,
        guides: {
          ...current,
          selectedGuideSlugs: selected,
        },
      };
    });
  };

  const toggleHomepageBlogPost = (slug: string) => {
    setHomepageContent(prev => {
      const current = prev.blog || {};
      const selected = current.selectedBlogSlugs || [];
      const nextSelected = selected.includes(slug)
        ? selected.filter(item => item !== slug)
        : [...selected, slug].slice(0, 4);
      return {
        ...prev,
        blog: {
          ...current,
          selectedBlogSlugs: nextSelected,
        },
      };
    });
  };

  const moveHomepageBlogPost = (slug: string, direction: -1 | 1) => {
    setHomepageContent(prev => {
      const current = prev.blog || {};
      const selected = [...(current.selectedBlogSlugs || [])];
      const index = selected.indexOf(slug);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= selected.length) return prev;
      [selected[index], selected[nextIndex]] = [selected[nextIndex], selected[index]];
      return {
        ...prev,
        blog: {
          ...current,
          selectedBlogSlugs: selected,
        },
      };
    });
  };

  const updateHomepageItem = (key: string, index: number, field: 'title' | 'text' | 'checks', value: string) => {
    setHomepageContent(prev => {
      const current = prev[key] || {};
      const items = [...(current.items || [])];
      const item = items[index] || { title: '', text: '' };
      items[index] = {
        ...item,
        [field]: field === 'checks' ? value.split('\n').map(line => line.trim()).filter(Boolean) : value,
      };
      return {
        ...prev,
        [key]: {
          ...current,
          items,
        },
      };
    });
  };

  const resetHomepageContentBlock = (key: string) => {
    setHomepageContent(prev => ({
      ...prev,
      [key]: {},
    }));
  };

  const addPostToCustomSection = (section: Section, postId: string) => {
    if (!postId || section.type !== 'custom') return;
    const currentIds = section.postIds || [];
    if (currentIds.includes(postId)) return;
    updateSection({ ...section, postIds: [...currentIds, postId] });
    setSectionPostSearch('');
  };

  type RailListKey = 'explore' | 'tool' | 'tag' | 'section' | 'creative';

  const updateRailItem = (list: RailListKey, index: number, field: string, value: string) => {
    if (list === 'creative') {
      setCreativeDirectionItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
      return;
    }

    const update = (prev: FilterRailItem[]) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item);
    if (list === 'explore') setExploreFilterItems(update);
    if (list === 'tool') setToolRailItems(update);
    if (list === 'tag') setTagRailItems(update);
    if (list === 'section') setSectionRailItems(update);
  };

  const addRailItem = (list: RailListKey) => {
    if (list === 'creative') {
      setCreativeDirectionItems(prev => [...prev, { label: '', type: 'tag', value: '', icon: undefined, imageUrl: undefined }]);
      return;
    }

    const add = (prev: FilterRailItem[]) => [...prev, { label: '', type: 'tag' as const, value: '' }];
    if (list === 'explore') setExploreFilterItems(add);
    if (list === 'tool') setToolRailItems(add);
    if (list === 'tag') setTagRailItems(add);
    if (list === 'section') setSectionRailItems(add);
  };

  const removeRailItem = (list: RailListKey, index: number) => {
    if (list === 'creative') {
      setCreativeDirectionItems(prev => prev.filter((_, i) => i !== index));
      return;
    }

    const remove = (prev: FilterRailItem[]) => prev.filter((_, i) => i !== index);
    if (list === 'explore') setExploreFilterItems(remove);
    if (list === 'tool') setToolRailItems(remove);
    if (list === 'tag') setTagRailItems(remove);
    if (list === 'section') setSectionRailItems(remove);
  };

  const moveRailItem = (list: RailListKey, index: number, dir: -1 | 1) => {
    const move = <T,>(prev: T[]) => moveArrayItem(prev, index, index + dir);
    if (list === 'creative') { setCreativeDirectionItems(move); return; }
    if (list === 'explore') setExploreFilterItems(move);
    if (list === 'tool') setToolRailItems(move);
    if (list === 'tag') setTagRailItems(move);
    if (list === 'section') setSectionRailItems(move);
  };

  const moveHomepageItem = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= orderedHomepageItems.length) return;
    const next = [...orderedHomepageItems];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setHomepageBlockOrder(next);
  };

  const moveArrayItem = <T,>(list: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= list.length || from === to) return list;
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  };

  const moveFooterLink = (groupIndex: number, from: number, to: number) => {
    setFooterLinkGroups(prev => prev.map((group, i) => (
      i === groupIndex ? { ...group, links: moveArrayItem(group.links, from, to) } : group
    )));
  };

  const updateManagedArticle = (slug: string, patch: Partial<ArticleSettingsOverride>) => {
    if (customArticles.some(article => article.slug === slug)) {
      setCustomArticles(prev => prev.map(article => article.slug === slug ? { ...article, ...patch } : article));
      return;
    }
    setArticleOverrides(prev => ({
      ...prev,
      [slug]: {
        ...(prev[slug] || {}),
        ...patch,
        slug,
      },
    }));
  };

  const resetManagedArticle = (slug: string) => {
    if (customArticles.some(article => article.slug === slug)) {
      setCustomArticles(prev => prev.filter(article => article.slug !== slug));
      setSelectedArticleSlug('');
      return;
    }
    setArticleOverrides(prev => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  };

  const addManagedArticle = () => {
    const baseSlug = `new-article-${Date.now().toString(36)}`;
    const article: ArticleSettingsOverride = {
      slug: baseSlug,
      title: 'New Article',
      description: 'Write a clear 140-160 character description for search previews and article cards.',
      category: 'blog',
      tags: ['ai prompts'],
      readMinutes: 6,
      datePublished: new Date().toISOString().slice(0, 10),
      icon: 'book',
      thumbnailUrl: '',
      featured: false,
      body: 'Start writing your article here.\n\n## Main section\n\nAdd practical, original advice for readers.',
    };
    setCustomArticles(prev => [article, ...prev]);
    setSelectedArticleSlug(baseSlug);
  };

  const updateFooterGroupTitle = (groupIndex: number, title: string) => {
    setFooterLinkGroups(prev => prev.map((group, i) => i === groupIndex ? { ...group, title } : group));
  };

  const updateFooterLink = (groupIndex: number, linkIndex: number, field: keyof NavLink, value: string) => {
    setFooterLinkGroups(prev => prev.map((group, i) => (
      i === groupIndex
        ? { ...group, links: group.links.map((link, j) => j === linkIndex ? { ...link, [field]: value } : link) }
        : group
    )));
  };

  const handleSaveSettings = () => {
    updateSettings({
      ...settings,
      maintenanceMode,
      siteTitle,
      siteLogo,
      siteDescription,
      heroEnabled,
      heroHideStats,
      heroAutoPlay,
      heroContent,
      postHeroStyle,
      cardStyle,
      badgeStyle,
      adminEmails: adminEmailsStr.split(',').map(e => e.trim()).filter(Boolean),
      headerLinks: cleanNavLinks(headerLinks),
      headerNavOrder,
      headerBuiltins,
      // Undefined keeps the public header in auto mode; legacy key dropped.
      headerToolsMenu: undefined,
      headerMenus: navMenus === null
        ? undefined
        : navMenus.map(m => ({ id: m.id, label: m.label.trim() || 'Menu', itemNavKeys: m.itemNavKeys })),
      homeLinkBlocks: cleanHomeBlocks(homeLinkBlocks),
      homepageContent: cleanAdminHomepageContent(homepageContent),
      articleOverrides,
      customArticles: customArticles.filter(article => article.slug && article.title && article.description && article.body),
      discoveryPages: {
        ...discoveryPages,
        exploreRailItems: cleanRailItems(exploreFilterItems),
        toolRailItems: cleanRailItems(toolRailItems),
        tagRailItems: cleanRailItems(tagRailItems),
        sectionRailItems: cleanRailItems(sectionRailItems),
      },
      keepExploring: cleanKeepExploring(keepExploring),
      homepageBlockOrder: orderedHomepageItems,
      exploreFilterTags: cleanCommaList(exploreFilterTags),
      exploreFilterItems: cleanRailItems(exploreFilterItems),
      creativeDirectionItems: cleanCreativeDirectionItems(creativeDirectionItems),
      footerLinkGroups: cleanFooterGroups(footerLinkGroups),
      socialLinks: {
        twitter: socialLinks.twitter?.trim() || undefined,
        instagram: socialLinks.instagram?.trim() || undefined,
        youtube: socialLinks.youtube?.trim() || undefined,
        facebook: socialLinks.facebook?.trim() || undefined,
        pinterest: socialLinks.pinterest?.trim() || undefined,
      },
      aiTools: settings.aiTools || ['ChatGPT', 'Gemini', 'Grok', 'Qwen'],
      ads: adsConfig,
      imageProvider,
      features,
    });
    showToast('Settings saved!');
  };

  // AI Tools Management
  const [newAiTool, setNewAiTool] = useState('');
  const [editingAiTool, setEditingAiTool] = useState<string | null>(null);
  const [editAiToolValue, setEditAiToolValue] = useState('');
  const [editAiToolLogo, setEditAiToolLogo] = useState('');
  const [editAiToolColor, setEditAiToolColor] = useState('');
  const [editAiToolLogoScale, setEditAiToolLogoScale] = useState<number>(1);
  const [editAiToolBadge, setEditAiToolBadge] = useState('');
  const [editAiToolStats, setEditAiToolStats] = useState('');
  const [editAiToolChecks, setEditAiToolChecks] = useState('');
  const [editAiToolDescription, setEditAiToolDescription] = useState('');
  const [editAiToolHeroTitle, setEditAiToolHeroTitle] = useState('');
  const [editAiToolHeroDescription, setEditAiToolHeroDescription] = useState('');
  const [editAiToolSeoTitle, setEditAiToolSeoTitle] = useState('');
  const [editAiToolSeoDescription, setEditAiToolSeoDescription] = useState('');
  const [editAiToolSlug, setEditAiToolSlug] = useState('');
  const [editAiToolModels, setEditAiToolModels] = useState<string[]>([]);
  const [editAiToolDefaultModel, setEditAiToolDefaultModel] = useState('');
  const [editAiToolActive, setEditAiToolActive] = useState(true);
  const [editAiToolFeatured, setEditAiToolFeatured] = useState(true);
  const [editAiToolShowInHero, setEditAiToolShowInHero] = useState(true);
  const [editAiToolShowInFooter, setEditAiToolShowInFooter] = useState(true);

  const addAiTool = () => {
    const toolList = settings.aiTools || [];
    if (!newAiTool.trim()) return;
    if (toolList.includes(newAiTool.trim())) {
      showToast('AI Tool already exists', 'error');
      return;
    }
    updateSettings({ ...settings, aiTools: [...toolList, newAiTool.trim()] });
    setNewAiTool('');
  };

  const removeAiTool = (tool: string) => {
    const inUse = posts.some(p => p.aiTools?.includes(tool) || p.images.some(img => img.aiTools ? img.aiTools.includes(tool) : img.aiTool === tool));
    if (inUse) {
      showToast(`Cannot delete "${tool}" - it's used by existing posts. Remove or reassign those images first.`, 'error');
      return;
    }
    updateSettings({ ...settings, aiTools: (settings.aiTools || []).filter(t => t !== tool) });
  };

  const startEditAiTool = (tool: string) => {
    setEditingAiTool(tool);
    setEditAiToolValue(tool);
    const existing = settings.toolDetails?.[tool] || {};
    const info = getToolInfo(tool, settings.toolDetails);
    setEditAiToolLogo(info.logo || '');
    setEditAiToolColor(info.color || 'bg-surface-500');
    setEditAiToolLogoScale(info.logoScale || 1);
    setEditAiToolBadge(existing.badge || '');
    setEditAiToolStats((existing.stats || []).map(stat => `${stat.label}: ${stat.value}`).join('\n'));
    setEditAiToolChecks((existing.checks || []).join('\n'));
    setEditAiToolDescription(existing.description || '');
    setEditAiToolHeroTitle(existing.heroTitle || '');
    setEditAiToolHeroDescription(existing.heroDescription || '');
    setEditAiToolSeoTitle(existing.seoTitle || '');
    setEditAiToolSeoDescription(existing.seoDescription || '');
    setEditAiToolSlug(existing.slug || tool.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    setEditAiToolModels(existing.models || []);
    setEditAiToolDefaultModel(existing.defaultModel || existing.models?.[0] || '');
    setEditAiToolActive(existing.active ?? true);
    setEditAiToolFeatured(existing.featured ?? true);
    setEditAiToolShowInHero(existing.showInHero ?? true);
    setEditAiToolShowInFooter(existing.showInFooter ?? true);
  };

  const saveEditAiTool = (oldTool: string) => {
    if (!editAiToolValue.trim()) return;
    const newToolName = editAiToolValue.trim();
    const newTools = (settings.aiTools || []).map(t => (t === oldTool ? newToolName : t));

    // Manage custom details
    const newToolDetails = { ...settings.toolDetails };
    if (oldTool !== newToolName && newToolDetails[oldTool]) {
      delete newToolDetails[oldTool];
    }
    const stats = editAiToolStats.split('\n').map(line => {
      const separator = line.indexOf(':');
      return separator < 0
        ? { label: '', value: line.trim() }
        : { label: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
    }).filter(stat => stat.label || stat.value).slice(0, 3);
    const checks = editAiToolChecks.split('\n').map(value => value.trim()).filter(Boolean);
    newToolDetails[newToolName] = {
      logo: editAiToolLogo,
      color: editAiToolColor,
      logoScale: editAiToolLogoScale,
      badge: editAiToolBadge.trim(),
      stats,
      checks,
      description: editAiToolDescription.trim(),
      heroTitle: editAiToolHeroTitle.trim(),
      heroDescription: editAiToolHeroDescription.trim(),
      seoTitle: editAiToolSeoTitle.trim(),
      seoDescription: editAiToolSeoDescription.trim(),
      slug: editAiToolSlug.trim() || newToolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      models: editAiToolModels.filter(Boolean),
      defaultModel: editAiToolDefaultModel,
      active: editAiToolActive,
      featured: editAiToolFeatured,
      showInHero: editAiToolShowInHero,
      showInFooter: editAiToolShowInFooter,
    };

    // Update posts using this tool
    posts.forEach(p => {
      let changed = false;
      const updatedImages = p.images.map(img => {
        if (img.aiTool === oldTool) {
          changed = true;
          return { ...img, aiTool: newToolName };
        }
        return img;
      });
      if (changed) {
        updatePost({ ...p, images: updatedImages });
      }
    });

    updateSettings({ ...settings, aiTools: newTools, toolDetails: newToolDetails });
    setEditingAiTool(null);
  };

  const handleToolLogoUpload = async (file: File) => {
    try {
      setEditAiToolLogo('Uploading...');
      const url = await uploadImageFile(file, 'logo', editAiToolSlug || editAiToolValue);
      setEditAiToolLogo(url);
    } catch (err) {
      console.error(err);
      showToast('Failed to process image', 'error');
      setEditAiToolLogo('');
    }
  };

  // Custom Sections Management
  const createCustomSection = () => {
    const newSection: Section = {
      id: `s_custom_${Date.now()}`,
      name: 'New Custom Section',
      type: 'custom',
      order: sections.length,
      visible: true,
      limit: 8,
      postIds: []
    };
    updateSection(newSection);
  };

  const handleResetData = async () => {
    if (await confirmAction({
      title: 'Reset all data to defaults?',
      message: 'Posts, sections, and settings will be restored to their default state. This cannot be undone.',
      confirmLabel: 'Reset everything',
    })) {
      resetData();
      window.location.reload();
    }
  };

  const postToolOptions = Array.from(new Set(posts.flatMap(post => getAllTools(post)).filter(Boolean))).sort();
  const postTagOptions = Array.from(new Set(posts.flatMap(post => post.tags || []).filter(Boolean))).sort();
  const filteredPosts = posts
    .filter(post => {
      const query = postSearch.trim().toLowerCase();
      if (!query) return true;
      return post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        (post.tags || []).some(tag => tag.toLowerCase().includes(query));
    })
    .filter(post => !postToolFilter || getAllTools(post).includes(postToolFilter))
    .filter(post => !postTagFilter || (post.tags || []).includes(postTagFilter))
    .filter(post => !postStatusFilter || (post.status || 'published') === postStatusFilter)
    .filter(post => {
      if (postFeaturedFilter === 'featured') return post.featured;
      if (postFeaturedFilter === 'not-featured') return !post.featured;
      if (postFeaturedFilter === 'private') return post.visibility === 'private';
      return true;
    });

  filteredPosts.sort((a, b) => {
    if (postSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (postSort === 'views') return (b.views || 0) - (a.views || 0);
    if (postSort === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (postSort === 'title') return a.title.localeCompare(b.title);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingSubmissionCount = posts.filter(p => p.status === 'pending').length;
  const pendingCommentCount = posts.reduce((count, post) => count + (post.comments || []).filter(comment => comment.status === 'pending').length, 0);
  const totalViews = posts.reduce((acc, post) => acc + (post.views || 0), 0);
  const totalLikes = posts.reduce((acc, post) => acc + (post.likes || post.likedBy?.length || 0), 0);
  const totalSaves = posts.reduce((acc, post) => acc + (post.bookmarkedBy?.length || 0), 0);
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);
  const adsSettings = settings.ads;
  const settingsExtras = settings as SiteSettings & { ogImage?: string; defaultOgImage?: string; footerDescription?: string };
  const siteHealthChecks = [
    { label: 'AdSense meta tag present', ok: Boolean(adsSettings?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID) },
    { label: 'Auto Ads script active', ok: Boolean(adsSettings?.autoAdsEnabled) },
    { label: 'Sitemap accessible', ok: true },
    { label: 'Robots.txt present', ok: true },
    { label: 'OG image set', ok: Boolean(settings.seoSettings?.defaultOgImage || settingsExtras.ogImage || settingsExtras.defaultOgImage || settings.siteLogo) },
    { label: 'Footer description set', ok: Boolean((settingsExtras.footerDescription || settings.siteDescription || '').trim()) },
  ];
  const sectionLocationsToRender: Array<'homepage' | 'header' | 'footer'> =
    sectionLocationFilter === 'all' ? ['homepage', 'header', 'footer'] : [sectionLocationFilter as 'homepage' | 'header' | 'footer'];

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'posts', label: 'Posts', icon: <FileText className="w-4 h-4" />, count: posts.length },
    { key: 'sections', label: 'Sections', icon: <Layers className="w-4 h-4" /> },
    { key: 'articles', label: 'Articles', icon: <BookOpen className="w-4 h-4" />, count: managedArticles.length },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { key: 'submissions', label: 'Submissions', icon: <Upload className="w-4 h-4" />, count: pendingSubmissionCount },
    { key: 'comments', label: 'Comments', icon: <MessageCircle className="w-4 h-4" />, count: pendingCommentCount },
    { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: adminUsers.length },
    { key: 'pages', label: 'Pages', icon: <FileText className="w-4 h-4" /> },
    { key: 'seo', label: 'SEO', icon: <LayoutTemplate className="w-4 h-4" /> },
    { key: 'ai-studio', label: 'AI Studio', icon: <Wand2 className="w-4 h-4" /> },
  ];
  if (authLoading || adminChecking) {
    return <div className="flex h-[50vh] items-center justify-center text-surface-400">Loading admin...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] max-w-sm mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl shadow-sm flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
          <p className="text-surface-500 dark:text-surface-400">
            Sign in securely to manage your site
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm border border-red-200 dark:border-red-800">
            {authError}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl placeholder:text-surface-400 focus:border-primary-500/60 focus:bg-white/90 dark:focus:bg-white/[0.12] focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl placeholder:text-surface-400 focus:border-primary-500/60 focus:bg-white/90 dark:focus:bg-white/[0.12] focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-primary-600 to-primary-500 shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.99]"
          >
            Sign in with Email          </button>
        </form>

        <div className="text-center mb-6">
          <button
            onClick={handleResetPassword}
            type="button"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Forgot password?
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 text-sm text-surface-500">
          <div className="flex-1 border-t border-black/10 dark:border-white/10" />
          <span>Or continue with</span>
          <div className="flex-1 border-t border-black/10 dark:border-white/10" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex justify-center items-center gap-2.5 py-3 px-4 rounded-xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl text-sm font-semibold hover:bg-white/80 dark:hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all mb-6"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.97 11.97 0 0 0 0 10.76l3.98-3.09Z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
          </svg>
          Google
        </button>
      </div>
    );
  }

  if (user && adminConfigError) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] max-w-lg mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-amber-500">Configuration Missing</h1>
        <p className="text-surface-600 dark:text-surface-300 mb-8">
          {adminConfigError}
        </p>
        <button
          onClick={async () => {
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
            setUser(null);
          }}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h1>
        <p className="text-surface-600 dark:text-surface-300 mb-4">
          Your email address ({user.email}) is not authorized to access the admin panel.
        </p>
        {adminAccessError && adminAccessError !== 'Access Denied' && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400 font-mono break-all text-left">
            <strong>Server Details:</strong>
            <div className="mt-1">{adminAccessError}</div>
          </div>
        )}
        <button
          onClick={async () => {
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
            setUser(null);
          }}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const navGroups = [
    {
      title: 'General',
      items: tabs.filter(t => t.key === 'dashboard')
    },
    {
      title: 'Content Engine',
      items: tabs.filter(t => ['posts', 'sections', 'articles', 'pages', 'ai-studio'].includes(t.key))
    },
    {
      title: 'Community & Feedback',
      items: tabs.filter(t => ['submissions', 'comments', 'users'].includes(t.key))
    },
    {
      title: 'Settings & Identity',
      items: tabs.filter(t => ['settings', 'seo'].includes(t.key))
    }
  ];

  const renderNavigationList = () => (
    <div className="space-y-5">
      {navGroups.map(group => (
        <div key={group.title} className="space-y-1">
          <h4 className="text-[10px] font-mono font-bold tracking-wider text-surface-500 dark:text-surface-400 uppercase px-3 py-1 flex items-center gap-1.5">
            <span>{group.title}</span>
          </h4>
          <div className="space-y-1">
            {group.items.map(item => {
              const isActive = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setTab(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold tracking-tight transition-all active:scale-[0.98] ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/30 border border-white/20 font-bold'
                      : 'text-surface-700 hover:text-surface-950 dark:text-surface-300 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-surface-500 dark:text-surface-400 group-hover:text-primary-500 dark:group-hover:text-primary-400'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.key === 'submissions'
                          ? 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : item.key === 'comments'
                            ? 'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            : 'border-black/[0.08] bg-black/[0.05] text-surface-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-200'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfileSection = () => (
    <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 mt-auto shrink-0">
      <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white/50 dark:bg-white/[0.06] border border-white/80 dark:border-white/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center font-black text-xs text-white shadow-sm shadow-primary-500/25">
              {user?.email ? user.email[0].toUpperCase() : 'A'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0c1d]" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-surface-950 dark:text-white truncate">
              {user?.email?.split('@')[0] || 'Administrator'}
            </p>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 truncate mt-0.5">
              {user?.email || 'admin@site.com'}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
            setUser(null);
          }}
          title="Sign Out"
          className="p-2 rounded-xl text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-surface-900 dark:text-surface-50">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -top-24 -left-24 h-[600px] w-[550px] rounded-full bg-purple-600/20 blur-[130px] dark:bg-purple-600/25" />
      <div className="pointer-events-none fixed top-1/3 -left-20 h-[500px] w-[450px] rounded-full bg-indigo-600/20 blur-[130px] dark:bg-indigo-600/25" />
      <div className="pointer-events-none fixed -top-40 left-1/3 h-[550px] w-[550px] rounded-full bg-primary-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[130px]" />

      <ConfirmDialogHost />

      {/* Password recovery modal (Supabase PASSWORD_RECOVERY event) */}
      {passwordRecoveryOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <form
            onSubmit={handleRecoveryPasswordSubmit}
            className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 dark:border-white/10 dark:bg-white/[0.08]"
          >
            <h3 className="text-sm font-bold text-surface-950 dark:text-white">Set a new password</h3>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Enter the new password for your account.</p>
            <input
              type="password"
              value={recoveryPassword}
              onChange={e => setRecoveryPassword(e.target.value)}
              minLength={6}
              required
              autoFocus
              className={`${adminInput} mt-4 py-2.5`}
              placeholder="New password (min 6 characters)"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordRecoveryOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-surface-600 transition-colors hover:bg-white/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword || recoveryPassword.length < 6}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
              >
                {isUpdatingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                Update password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Top Header & Quick Switcher */}
      <div className="md:hidden sticky top-14 z-40 bg-white/70 dark:bg-white/[0.06] border-b border-white/80 dark:border-white/10 backdrop-blur-2xl shadow-sm">
        {/* Top bar with active workspace title and menu trigger */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 dark:bg-primary-500/15 border border-primary-500/25 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 shadow-inner">
              {tabs.find(t => t.key === tab)?.icon || <Settings className="w-4 h-4" />}
            </div>
            <div className="min-w-0 leading-tight">
              <span className="text-xs font-bold text-surface-950 dark:text-white truncate block">
                {tabs.find(t => t.key === tab)?.label || 'Console'}
              </span>
              <span className="text-[9px] font-mono text-surface-500 dark:text-surface-400 uppercase tracking-wider block">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAdminData()}
              title="Refresh state"
              className="p-2 rounded-xl border border-white/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] text-surface-500 dark:text-surface-400 hover:text-surface-950 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary-500/30 bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
              {(tabs.find(t => t.key === 'submissions')?.count || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Tab Chip Rail (Swipeable on phone) */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-black/[0.04] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.03] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(item => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/25 border border-white/20 font-bold'
                    : 'border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] text-surface-700 dark:text-surface-200 hover:bg-white dark:hover:bg-white/[0.12]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-surface-400 dark:text-surface-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-primary-500/10 text-primary-500 dark:text-primary-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[85vw] max-w-[320px] my-3 ml-3 rounded-3xl border border-white/80 dark:border-white/15 bg-white/95 dark:bg-[#0e122b]/90 backdrop-blur-3xl h-[calc(100%-1.5rem)] p-4 sm:p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250 z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/25">
                  <Settings className="w-4 h-4 animate-spin-slow" style={{ animationDuration: '10s' }} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-surface-950 dark:text-white">Admin Console</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Production</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-surface-400 hover:text-surface-950 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-0.5">
              {renderNavigationList()}
            </div>

            {/* Profile/Signout on mobile */}
            {renderProfileSection()}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="flex max-w-[1600px] mx-auto min-h-screen">
        {/* Desktop Sidebar (Floating frosted glass panel with rounded-3xl edges) */}
        <aside className="hidden md:flex flex-col justify-between w-64 shrink-0 my-3 ml-3 md:my-4 md:ml-4 rounded-3xl border border-white/80 dark:border-white/12 bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl backdrop-saturate-[140%] p-4 sticky top-[4.5rem] h-[calc(100vh-5.5rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-2xl shadow-black/5 dark:shadow-primary-500/5 z-30">
          <div>
            {/* Header Badge */}
            <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.06] border border-white/80 dark:border-white/10 flex items-center justify-between mb-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/25">
                  <Settings className="w-4 h-4 animate-spin-slow" style={{ animationDuration: '10s' }} />
                </div>
                <div>
                  <h2 className="font-bold text-xs tracking-tight text-surface-950 dark:text-white leading-tight">Admin Console</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono tracking-wider text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Live System</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu */}
            <div className="space-y-6">
              {renderNavigationList()}
            </div>
          </div>

          {/* Profile Card / Footer */}
          {renderProfileSection()}
        </aside>

        {/* Main Area */}
        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6">
          {/* Top Info Header Bar */}
          {tab !== 'sections' && (
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 font-mono uppercase tracking-wider mb-1">
                <span>Production Environment</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-surface-950 dark:text-white">
                {tabs.find(t => t.key === tab)?.label || 'Console'} Workspace
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick status badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-300 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Sync Active</span>
              </div>
              {/* Reset / Cache Buster */}
              <button
                onClick={() => loadAdminData()}
                title="Force refresh database state"
                className="p-2 rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-white/[0.12] hover:text-surface-950 dark:hover:text-white shadow-sm backdrop-blur-md transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </header>
          )}

          {/* Active Tab View */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">

      {/* ===== DASHBOARD TAB ===== */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              onClick={openNewPost}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-primary-500/25 hover:bg-primary-700 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> New Post
            </button>
            <button
              onClick={() => {
                setTab('sections');
                setSectionLocationFilter('homepage');
                startNewSection('homepage');
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-xl hover:bg-white hover:text-surface-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200 dark:hover:bg-white/[0.12] dark:hover:text-white transition-all active:scale-[0.98]"
            >
              <Layers className="h-4 w-4" /> New Section
            </button>
            <button
              onClick={() => window.open('/', '_blank')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-xl hover:bg-white hover:text-surface-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200 dark:hover:bg-white/[0.12] dark:hover:text-white transition-all active:scale-[0.98]"
            >
              <Eye className="h-4 w-4" /> View Site
            </button>
            <button
              onClick={() => loadAdminData()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-xl hover:bg-white hover:text-surface-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200 dark:hover:bg-white/[0.12] dark:hover:text-white transition-all active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> Clear Cache
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              ['Total Posts', posts.length, 'text-primary-600 dark:text-primary-400 border-primary-500/20 bg-primary-500/10'],
              ['Total Views', totalViews.toLocaleString(), 'text-sky-600 dark:text-sky-400 border-sky-500/20 bg-sky-500/10'],
              ['Total Likes', totalLikes.toLocaleString(), 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/10'],
              ['Total Saves', totalSaves.toLocaleString(), 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10'],
              ['Submissions Pending', pendingSubmissionCount, 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10'],
            ].map(([label, value, tone]) => (
              <div key={label as string} className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.06]">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tight">{value}</p>
                  <span className={`h-2.5 w-2.5 rounded-full border ${tone}`} />
                </div>
                <p className="mt-2 text-xs font-medium text-surface-500 dark:text-surface-400">{label}</p>
              </div>
            ))}
          </div>

          {pendingSubmissionCount > 0 && (
            <button
              onClick={() => setTab('submissions')}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-left text-xs font-bold text-amber-700 backdrop-blur-xl hover:bg-amber-500/15 dark:text-amber-300 transition-all shadow-sm"
            >
              <span>{pendingSubmissionCount} submissions waiting for review</span>
              <span className="inline-flex items-center gap-1">Go to Submissions <ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.06]">
              <h2 className="mb-4 text-sm font-bold text-surface-950 dark:text-white">Site Health Checklist</h2>
              <div className="space-y-3">
                {siteHealthChecks.map(item => (
                  <div key={item.label} className="flex items-center gap-3 text-xs">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-xl text-xs font-black border ${item.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                      {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-surface-700 dark:text-surface-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl backdrop-saturate-[120%] dark:border-white/10 dark:bg-white/[0.06]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-surface-950 dark:text-white">Recent Posts</h2>
                <button onClick={() => setTab('posts')} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400">View all</button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
                {recentPosts.length === 0 ? (
                  <p className="p-4 text-xs text-surface-500">No posts yet.</p>
                ) : (
                  <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                    {recentPosts.map(post => (
                      <div key={post.id} className="flex flex-wrap items-center gap-2 px-3.5 py-3 text-xs transition-colors hover:bg-white/80 dark:hover:bg-white/[0.08] sm:flex-nowrap sm:gap-3 sm:px-4">
                        <div className="min-w-0 basis-full sm:flex-1">
                          <p className="truncate text-xs font-bold text-surface-900 dark:text-white">{post.title}</p>
                          <p className="truncate text-[11px] text-surface-500 dark:text-surface-400">{getAllTools(post).join(', ') || 'No tool'}</p>
                        </div>
                        <span className="text-surface-500 text-[11px]">{(post.views || 0).toLocaleString()} views</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${post.featured ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-black/[0.06] bg-black/[0.04] text-surface-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-400'}`}>
                          {post.featured ? 'Featured' : 'Normal'}
                        </span>
                        <button
                          onClick={() => openEditPost(post)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary-600 hover:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/15 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== POSTS TAB ===== */}
      {tab === 'posts' && (
        <div>
          {!showPostForm ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <ActionButton onClick={openNewPost} className="w-full py-2.5 shadow-lg shadow-primary-500/25 sm:w-auto">
                  <Plus className="w-4 h-4" /> Create new post
                </ActionButton>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    className={`${adminInputOnCard} py-2.5 pl-10 pr-4`}
                    placeholder="Search posts..."
                  />
                </div>
              </div>
              <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
                <select value={postToolFilter} onChange={e => setPostToolFilter(e.target.value)} className={adminInputOnCard}>
                  <option value="">All tools</option>
                  {postToolOptions.map(tool => <option key={tool} value={tool}>{tool}</option>)}
                </select>
                <select value={postTagFilter} onChange={e => setPostTagFilter(e.target.value)} className={adminInputOnCard}>
                  <option value="">All tags</option>
                  {postTagOptions.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
                <select value={postStatusFilter} onChange={e => setPostStatusFilter(e.target.value)} className={adminInputOnCard}>
                  <option value="">All status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                </select>
                <select value={postFeaturedFilter} onChange={e => setPostFeaturedFilter(e.target.value)} className={adminInputOnCard}>
                  <option value="">All visibility</option>
                  <option value="featured">Featured</option>
                  <option value="not-featured">Not featured</option>
                  <option value="private">Private</option>
                </select>
                <select value={postSort} onChange={e => setPostSort(e.target.value as typeof postSort)} className={adminInputOnCard}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="views">Most views</option>
                  <option value="likes">Most likes</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-3 text-xs backdrop-blur-xl backdrop-saturate-[120%] shadow-sm">
                <label className="flex items-center gap-2 font-bold text-surface-600 dark:text-surface-200">
                  <input
                    type="checkbox"
                    checked={filteredPosts.length > 0 && filteredPosts.every(post => selectedPostIds.includes(post.id))}
                    onChange={e => setSelectedPostIds(e.target.checked ? filteredPosts.map(post => post.id) : [])}
                    className="h-4 w-4 rounded text-primary-500"
                  />
                  Select visible
                </label>
                <span className="text-surface-400">{selectedPostIds.length} selected</span>
                <ActionButton variant="ghost" disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('feature')} className="px-3 py-1.5">Feature</ActionButton>
                <ActionButton variant="ghost" disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('unfeature')} className="px-3 py-1.5">Unfeature</ActionButton>
                <ActionButton variant="success" disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('publish')} className="px-3 py-1.5">Publish</ActionButton>
                <ActionButton variant="ghost" disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('unpublish')} className="px-3 py-1.5">Unpublish</ActionButton>
                <ActionButton variant="danger" disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('delete')} className="px-3 py-1.5">Delete</ActionButton>
              </div>

              {/* Posts list */}
              <div className="grid grid-cols-1 gap-3">
                {filteredPosts.map(post => (
                  <div key={post.id} className="group flex flex-wrap items-start gap-3 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-3.5 backdrop-blur-xl backdrop-saturate-[120%] shadow-sm transition-all hover:bg-white/80 dark:hover:bg-white/[0.09] hover:shadow-md sm:flex-nowrap sm:items-center sm:gap-4 sm:p-4">
                    <input
                      type="checkbox"
                      checked={selectedPostIds.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="h-4 w-4 shrink-0 rounded text-primary-500"
                    />
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-100 dark:bg-white/[0.05] border border-black/5 dark:border-white/10">
                      {post.images[0]?.url && (
                        <Image src={post.images[0].url} alt="" fill className="object-cover" sizes="80px" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{post.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-400">
                        <span>{post.images.length} images</span>
                        <span>{post.views.toLocaleString()} views</span>
                        {post.featured && <span className="inline-flex items-center gap-1 text-yellow-500 font-semibold"><Star className="h-3.5 w-3.5 fill-yellow-500" /> Featured</span>}
                        {post.status === 'draft' && <span className="inline-flex items-center gap-1 text-orange-500 font-semibold"><FileText className="h-3.5 w-3.5" /> Draft</span>}
                        {post.visibility === 'private' && <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 font-semibold text-surface-500 dark:bg-surface-800 dark:text-surface-300"><EyeOff className="h-3.5 w-3.5" /> Private</span>}
                        {sections.filter(s => s.type === 'custom' && s.postIds?.includes(post.id)).length > 0 && (
                          <span className="text-primary-500 font-semibold">
                            {sections.filter(s => s.type === 'custom' && s.postIds?.includes(post.id)).length} sections
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-7 flex basis-full flex-wrap items-center justify-end gap-1 border-t border-black/[0.06] dark:border-white/[0.08] pt-2 sm:ml-0 sm:basis-auto sm:flex-nowrap sm:border-t-0 sm:pt-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const url = `${window.location.origin}/${post.slug || post.id}`;
                          navigator.clipboard.writeText(url);
                          showToast('Link copied to clipboard!');
                        }}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Copy Post Link"
                      >
                        <svg className="w-4 h-4 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updatePost({ ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }); }}
                        className={`p-2 rounded-xl transition-colors ${post.visibility === 'private' ? 'bg-red-500/10 text-red-500' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                        title={post.visibility === 'private' ? 'Make Public' : 'Make Private'}
                      >
                        {post.visibility === 'private' ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-surface-400" />}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updatePost({ ...post, featured: !post.featured }); }}
                        className={`p-2 rounded-xl transition-colors ${post.featured ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                        title={post.featured ? 'Remove from hero' : 'Add to hero'}
                      >
                        {post.featured ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="w-4 h-4 text-surface-400" />}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); duplicatePost(post); }}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Duplicate as private draft"
                      >
                        <FileText className="w-4 h-4 text-surface-400" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditPost(post); }}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-primary-500" />
                      </button>
                      <button
                        onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (await confirmAction({ title: 'Delete this post?', message: `"${post.title}" will be permanently removed.`, confirmLabel: 'Delete' })) deletePost(post.id); }}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <p className="text-center text-surface-400 py-10">No posts found</p>
                )}
              </div>
            </>
          ) : (
            /* Post Form */
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
                <button onClick={closePostForm} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8 p-5 bg-primary-500/10 dark:bg-primary-500/[0.08] border border-primary-500/25 dark:border-primary-400/20 rounded-2xl backdrop-blur-xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
                  <Zap className="w-5 h-5" />
                  <h3>Auto-Generate Post Details with AI</h3>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Upload images below and add prompts to them first. Then, instruct the AI on how you want the title, tags, and descriptions generated. The AI uses your existing posts to learn your writing style.
                </p>
                <textarea
                  value={aiPromptInstruction}
                  onChange={e => setAiPromptInstruction(e.target.value)}
                  placeholder="(Optional) E.g., 'Make the title sound very poetic', 'Keep descriptions under 100 words', etc."
                  className="w-full min-h-20 px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm resize-y placeholder:text-surface-400"
                />
                <ActionButton onClick={handleGenerateAiDetails} disabled={isGeneratingAi}>
                  {isGeneratingAi ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isGeneratingAi ? 'Generating details...' : 'Generate details'}
                </ActionButton>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className={adminInputOnCard}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Visibility</label>
                    <select
                      value={visibility}
                      onChange={e => setVisibility(e.target.value as any)}
                      className={adminInputOnCard}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                  <div className="mb-4 flex flex-col gap-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-500">Schema Type</label>
                    <select
                      value={schemaType || 'HowTo'}
                      onChange={e => setSchemaType(e.target.value as any)}
                      className={adminInputOnCard}
                    >
                      <option value="Article">Article</option>
                      <option value="CreativeWork">CreativeWork</option>
                      <option value="HowTo">HowTo</option>
                    </select>
                    <p className="mt-1 text-xs text-surface-500">Tells Google how to display this post in search results.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-bold">FAQs</h4>
                      <p className="mt-1 text-xs text-surface-500">Questions shown on the post page and used for FAQ structured data.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiUndoStack[`post-faqs`] !== undefined && (
                        <button
                          type="button"
                          onClick={() => wandUndo('post-faqs')}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-surface-600 hover:bg-surface-200 dark:text-surface-300 dark:hover:bg-surface-700"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Undo
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={activeAiLoaders[`post-faqs`]}
                        onClick={handleMagicWandFaqs}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20"
                      >
                        {activeAiLoaders[`post-faqs`] ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /> : <Wand2 className="h-3.5 w-3.5" />}
                        Auto-generate FAQs
                      </button>
                      <button
                        type="button"
                        onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-600"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add FAQ
                      </button>
                    </div>
                  </div>

                  {faqs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-surface-200 bg-surface-50 p-4 text-sm text-surface-500 dark:border-surface-700 dark:bg-surface-800/50">
                      No FAQs added yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {faqs.map((faq, index) => {
                        const duplicate = faq.question.trim() && faqs.some((item, itemIndex) => itemIndex !== index && item.question.trim().toLowerCase() === faq.question.trim().toLowerCase());
                        return (
                          <div key={index} className="rounded-2xl border border-white/70 bg-white/40 p-3.5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="text-xs font-black uppercase tracking-wide text-surface-400">FAQ #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => setFaqs(prev => prev.filter((_, itemIndex) => itemIndex !== index))}
                                className="text-xs font-bold text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={faq.question}
                              onChange={e => setFaqs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, question: e.target.value } : item))}
                              className={`${adminInput} mb-2`}
                              placeholder="Question"
                            />
                            {duplicate && <p className="mb-2 text-xs font-bold text-amber-600">Duplicate question warning.</p>}
                            <textarea
                              value={faq.answer}
                              onChange={e => setFaqs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, answer: e.target.value } : item))}
                              rows={3}
                              className={`${adminInput} resize-y`}
                              placeholder="Answer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-sm font-medium">Title *</label>
                      <WandButton
                        fieldId="post-title"
                        value={title}
                        onChange={(v) => { setTitle(v); if (!editingPost) setSlug(slugify(v)); }}
                        prompt={() => postPrompts.title(tagsStr)}
                      />
                    </div>
                    <textarea rows={2}
                      value={title}
                      onChange={e => {
                        setTitle(e.target.value);
                        if (!editingPost) setSlug(slugify(e.target.value));
                      }}
                      className="resize-y w-full px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm placeholder:text-surface-400"
                      placeholder="Enter post title..."
                    />
                    <CharCount value={title} recommended={60} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">URL Slug *</label>
                    <input
                      value={slug}
                      onChange={e => setSlug(slugify(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm placeholder:text-surface-400"
                      placeholder="beautiful-modern-landscape"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <label className="block text-sm font-medium">Description *</label>
                    <WandButton
                      fieldId="post-desc"
                      value={description}
                      onChange={setDescription}
                      prompt={() => postPrompts.description(title)}
                    />
                  </div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full min-h-[96px] px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm resize-y placeholder:text-surface-400"
                    placeholder="Describe this prompt collection..."
                  />
                  <CharCount value={description} recommended={160} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Thumbnail URL *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={thumbnailUrl}
                      onChange={e => setThumbnailUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm min-w-0 placeholder:text-surface-400"
                      placeholder="https://..."
                    />
                    <div className="flex gap-2 shrink-0">
                      <button 
                        type="button" 
                        onClick={() => setMediaLibraryCallback(() => setThumbnailUrl)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] cursor-pointer hover:border-primary-500 transition-colors shrink-0"
                      >
                        <ImageIcon className="w-4 h-4 text-surface-400 shrink-0" />
                        <span className="text-sm">Library</span>
                      </button>
                      <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] cursor-pointer hover:border-primary-500 transition-colors shrink-0">
                        <Upload className="w-4 h-4 text-surface-400 shrink-0" />
                        <span className="text-sm">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                             try {
                               setThumbnailUrl('Uploading...');
                               const url = await uploadImageFile(file, 'thumbnail', title || slug);
                               setThumbnailUrl(url);
                             } catch (err: any) {
                               console.error(err);
                               showToast(`Failed to process thumbnail: ${err?.message || err}`, 'error');
                               setThumbnailUrl('');
                             }
                          }
                        }}
                      />
                    </label>
                    </div>
                  </div>
                  {thumbnailUrl && !thumbnailUrl.startsWith('Uploading') && (
                    <div className="mt-2 w-32 h-32 relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 group shadow-sm">
                      <Image src={thumbnailUrl} alt="Thumbnail preview" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 md:opacity-0 md:group-hover:opacity-100 transition-all"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Reference Images (Optional)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] cursor-pointer hover:border-primary-500 transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-surface-400 shrink-0" />
                      <span className="text-sm">Upload Reference Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async e => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                             const uploadingLabels = files.map(() => 'Uploading...');
                             setReferenceImages(prev => [...prev, ...uploadingLabels]);
                             try {
                               const urls = await Promise.all(
                                 files.map(file => uploadImageFile(file, 'reference', title || slug))
                               );
                               setReferenceImages(prev => [
                                 ...prev.filter(url => url !== 'Uploading...'),
                                 ...urls
                               ]);
                             } catch (err) {
                               console.error(err);
                               showToast('Failed to process some reference images', 'error');
                               setReferenceImages(prev => prev.filter(url => url !== 'Uploading...'));
                             }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {referenceImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {referenceImages.map((url, idx) => (
                        <div key={idx} className="w-32 h-32 relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 group shadow-sm">
                          {url === 'Uploading...' ? (
                            <div className="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-white/[0.05] text-xs">Uploading...</div>
                          ) : (
                            <>
                              <Image src={url} alt={`Reference ${idx + 1}`} fill className="object-cover" unoptimized />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setReferenceImages(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="text-sm font-medium">Extended Description / Content (Optional, useful for AdSense)</label>
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                      <WandButton
                        fieldId="post-ext-desc"
                        value={extendedDescription}
                        onChange={setExtendedDescription}
                        prompt={() => postPrompts.extendedDescription(title)}
                      />
                      <div className="grid grid-cols-2 rounded-xl bg-black/[0.04] p-1 text-xs font-semibold dark:bg-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setMarkdownMode('edit')}
                          className={`rounded-lg px-3 py-1.5 transition-colors ${markdownMode === 'edit' ? 'bg-white text-surface-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-surface-500'}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarkdownMode('preview')}
                          className={`rounded-lg px-3 py-1.5 transition-colors ${markdownMode === 'preview' ? 'bg-white text-surface-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-surface-500'}`}
                        >
                          Preview
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMarkdownHelp(prev => !prev)}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 px-3 py-2 text-xs font-bold text-surface-600 transition-colors hover:border-primary-400 hover:text-primary-600 dark:text-surface-300"
                      >
                        <Info className="h-3.5 w-3.5" />
                        Formatting
                      </button>
                    </div>
                  </div>

                  {showMarkdownHelp && (
                    <div className="mb-3 grid grid-cols-1 gap-3 rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4 text-xs dark:border-primary-400/20 dark:bg-primary-500/[0.08] backdrop-blur-md md:grid-cols-2">
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-950 p-3 font-mono text-[11px] leading-relaxed text-surface-50">{MARKDOWN_HELP_EXAMPLE}</pre>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <MarkdownRenderer>{MARKDOWN_HELP_EXAMPLE}</MarkdownRenderer>
                      </div>
                    </div>
                  )}

                  {markdownMode === 'edit' ? (
                    <textarea
                      value={extendedDescription}
                      onChange={e => setExtendedDescription(e.target.value)}
                      rows={8}
                      className="w-full min-h-[240px] resize-y rounded-2xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] px-4 py-3 font-mono text-sm outline-none focus:border-primary-500"
                      placeholder="Write a longer article or detailed description here to display at the bottom of the post page..."
                    />
                  ) : (
                    <div className="min-h-[240px] rounded-2xl border border-black/[0.06] bg-white/40 dark:border-white/10 dark:bg-white/[0.04] p-4 sm:p-6">
                      {extendedDescription.trim() ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base prose-p:text-surface-600 dark:prose-p:text-surface-300 prose-li:text-surface-600 dark:prose-li:text-surface-300">
                          <MarkdownRenderer>{extendedDescription}</MarkdownRenderer>
                        </div>
                      ) : (
                        <p className="text-sm text-surface-400">Preview will appear here as you write.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-sm font-medium">Custom Search Title (SEO)</label>
                      <WandButton
                        fieldId="post-seo-title"
                        value={seoTitle}
                        onChange={setSeoTitle}
                        prompt={() => postPrompts.seoTitle(title)}
                      />
                    </div>
                    <textarea
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      rows={2}
                      className="w-full min-h-[72px] px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm resize-y placeholder:text-surface-400"
                      placeholder="Title for Google search..."
                    />
                    <CharCount value={seoTitle} recommended={60} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-sm font-medium">Custom Search Description (SEO)</label>
                      <WandButton
                        fieldId="post-seo-desc"
                        value={seoDescription}
                        onChange={setSeoDescription}
                        prompt={() => postPrompts.seoDescription(title)}
                      />
                    </div>
                    <textarea
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      rows={3}
                      className="w-full min-h-[96px] px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm resize-y placeholder:text-surface-400"
                      placeholder="Short snippet for search results..."
                    />
                    <CharCount value={seoDescription} recommended={160} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-sm font-medium">Tags (comma separated)</label>
                      <WandButton
                        fieldId="post-tags"
                        value={tagsStr}
                        onChange={setTagsStr}
                        prompt={() => postPrompts.tags(title)}
                      />
                    </div>
                    <textarea
                      value={tagsStr}
                      onChange={e => setTagsStr(e.target.value)}
                      rows={2}
                      className="w-full min-h-[72px] px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm resize-y placeholder:text-surface-400"
                      placeholder="fantasy, landscape, magical"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-sm font-medium">Categories (comma separated)</label>
                      <WandButton
                        fieldId="post-categories"
                        value={categoriesStr}
                        onChange={setCategoriesStr}
                        prompt={() => postPrompts.category(title)}
                      />
                    </div>
                    <textarea
                      value={categoriesStr}
                      onChange={e => setCategoriesStr(e.target.value)}
                      rows={2}
                      className="w-full min-h-[72px] px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-sm resize-y placeholder:text-surface-400"
                      placeholder="e.g. UI, Characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">AI Tools</label>
                  <div className="flex flex-wrap gap-3">
                    {(settings.aiTools || []).map(tool => (
                      <label key={tool} className="flex items-center gap-2 cursor-pointer border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] px-3.5 py-2 rounded-xl text-sm transition-all hover:bg-white dark:hover:bg-white/10 shadow-sm">
                        <input
                          type="checkbox"
                          checked={selectedAiTools.includes(tool)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAiTools(prev => [...prev, tool]);
                            else setSelectedAiTools(prev => prev.filter(t => t !== tool));
                          }}
                          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                        />
                        {tool}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Featured checkbox */}
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:border-amber-400/20 dark:bg-amber-500/[0.08] backdrop-blur-xl shadow-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={e => setFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-300 text-yellow-500 focus:ring-yellow-500"
                    />
                    <div>
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500" /> Feature in Hero Slideshow
                      </span>
                      <p className="text-xs text-surface-400 mt-0.5">Featured posts appear in the hero carousel on the homepage</p>
                    </div>
                  </label>
                </div>

                {/* Section Assignment */}
                {customSections.length > 0 && (
                  <div className="p-4 rounded-2xl border border-primary-500/30 bg-primary-500/10 dark:border-primary-400/20 dark:bg-primary-500/[0.08] backdrop-blur-xl shadow-sm">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary-500" />
                      Add to Custom Sections
                    </h4>
                    <p className="text-xs text-surface-400 mb-3">Select which custom sections this post should appear in</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customSections.map(section => (
                        <label
                          key={section.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                            assignedSections.includes(section.id)
                              ? 'bg-primary-500/15 border-primary-500/40 text-primary-900 dark:text-primary-100 shadow-sm'
                              : 'bg-white/60 dark:bg-white/[0.04] border-black/[0.08] dark:border-white/10 hover:border-primary-500/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={assignedSections.includes(section.id)}
                            onChange={() => toggleSectionAssignment(section.id)}
                            className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium truncate">{section.name}</span>
                          {!section.visible && (
                            <span className="text-[10px] text-surface-400 ml-auto">(hidden)</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Images & Prompts *
                    </label>
                    <button
                      onClick={addImageField}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-bold hover:bg-primary-500/20 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Image
                    </button>
                  </div>

                  <div className="space-y-4">
                    {images.map((img, idx) => (
                      <div key={img.id} className="p-5 rounded-2xl border border-white/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-md shadow-sm space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" /> Image #{idx + 1}
                          </span>
                          <button onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-surface-400 mb-1">Add Images (URL or Multi-Upload)</label>
                            <div className="flex gap-2">
                              <input
                                value={img.url}
                                onChange={e => updateImage(idx, 'url', e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addPromptImageUrl(idx, img.url);
                                  }
                                }}
                                className="flex-1 px-3 py-2 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-xs"
                                placeholder="https://... (Press Enter to add)"
                              />
                              <button 
                                type="button" 
                                onClick={() => setMediaLibraryCallback(() => (url: string) => addPromptImageUrl(idx, url))}
                                className="p-2 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] cursor-pointer hover:border-primary-500 transition-colors shrink-0"
                                title="Choose from Library"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-surface-400" />
                              </button>
                              <label className="p-2 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] cursor-pointer hover:border-primary-500 transition-colors shrink-0 flex items-center gap-1">
                                <Upload className="w-3.5 h-3.5 text-surface-400" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={e => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) handlePromptImagesUpload(idx, files);
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="block text-xs text-surface-400 mb-1">AI Tools</label>
                              <div className="flex flex-wrap gap-2">
                                {(settings.aiTools || []).map(tool => {
                                  const isSelected = img.aiTools ? img.aiTools.includes(tool) : img.aiTool === tool;
                                  return (
                                    <label key={tool} className="flex items-center gap-1.5 cursor-pointer border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] px-2.5 py-1.5 rounded-xl text-xs hover:bg-white dark:hover:bg-white/10 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          let newTools = img.aiTools ? [...img.aiTools] : [img.aiTool].filter(Boolean);
                                          if (e.target.checked && !newTools.includes(tool)) newTools.push(tool);
                                          else newTools = newTools.filter(t => t !== tool);
                                          updateImage(idx, {
                                            aiTools: newTools,
                                            aiTool: newTools[0] || '',
                                            model: getImageModelForTools(newTools, img.model)
                                          });
                                        }}
                                        className="w-3.5 h-3.5 rounded text-primary-500 focus:ring-primary-500"
                                      />
                                      {tool}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-surface-400 mb-1">Model</label>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                <select
                                  value={getModelSelectValue(img.model)}
                                  onChange={e => handleModelSelect(idx, img, e.target.value)}
                                  className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/[0.06]"
                                >
                                  <option value={AUTO_MODEL_VALUE}>Auto default</option>
                                  {DEFAULT_MODEL_OPTIONS.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                  ))}
                                  <option value={CUSTOM_MODEL_VALUE}>Custom</option>
                                </select>
                                {getModelSelectValue(img.model) === CUSTOM_MODEL_VALUE && (
                                  <input
                                    value={img.model || ''}
                                    onChange={e => updateImage(idx, 'model', e.target.value)}
                                    placeholder="Custom model"
                                    className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/[0.06]"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-surface-400 mb-1">Prompt *</label>
                          <textarea
                            value={img.prompt}
                            onChange={e => updateImage(idx, 'prompt', e.target.value)}
                            rows={2}
                            className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white/80 dark:border-white/10 dark:bg-white/[0.06] outline-none focus:border-primary-500 text-xs resize-y placeholder:text-surface-400"
                            placeholder="Enter the AI prompt..."
                          />
                        </div>

                        {/* Multi-Image Thumbnails Gallery */}
                        {(() => {
                          const promptUrls = (img.urls && img.urls.length > 0 ? img.urls : [img.url]).filter(Boolean);
                          if (promptUrls.length === 0) return null;
                          return (
                            <div className="mt-3">
                              <label className="block text-[11px] font-semibold text-surface-400 mb-1.5 uppercase tracking-wider">
                                Attached Images ({promptUrls.length}) — First is Cover
                              </label>
                              <div className="flex flex-wrap gap-2.5">
                                {promptUrls.map((u, imgIndex) => (
                                  <div 
                                    key={imgIndex} 
                                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 bg-surface-100 dark:bg-surface-800 group/thumb shadow-sm transition-all ${
                                      imgIndex === 0 ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-surface-200 dark:border-surface-700'
                                    }`}
                                  >
                                    {u === 'Uploading...' ? (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-surface-400 font-medium">Uploading...</div>
                                    ) : (
                                      <>
                                        <Image src={u} alt="" fill className="object-cover" sizes="100px" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                          {imgIndex !== 0 && (
                                            <button
                                              type="button"
                                              onClick={() => setPromptCoverImage(idx, imgIndex)}
                                              className="p-1 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-[9px] font-bold shadow"
                                              title="Make Primary Cover"
                                            >
                                              ★ Cover
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => removePromptImageUrl(idx, imgIndex)}
                                            className="p-1 rounded-md bg-red-600 text-white hover:bg-red-700 shadow"
                                            title="Delete image"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        {imgIndex === 0 && (
                                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary-600 text-white text-[8px] font-bold uppercase tracking-wider shadow">
                                            Cover
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <ActionButton onClick={handleSavePost} className="flex-1 py-2.5 sm:flex-none">
                    <Save className="w-4 h-4" /> {editingPost ? 'Update post' : 'Create post'}
                  </ActionButton>
                  <ActionButton variant="outline" onClick={closePostForm} className="flex-1 py-2.5 sm:flex-none">
                    Cancel
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SECTIONS TAB ===== */}
      {tab === 'articles' && (
        <div className="space-y-6">
          <TabBanner
            icon={<BookOpen />}
            title="Article manager"
            text="Manage blog posts and guides, including thumbnails, SEO copy, tags, and full markdown body."
            action={(
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={addManagedArticle}>
                  <Plus className="h-4 w-4" /> Add article
                </ActionButton>
                <ActionButton variant="outline" onClick={handleSaveSettings}>
                  <Save className="h-4 w-4" /> Save articles
                </ActionButton>
              </div>
            )}
          />

          <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-4 backdrop-blur-xl shadow-sm">
            <div className="flex flex-wrap gap-2.5">
              {([
                ['all', 'All Articles'],
                ['blog', 'Blogs'],
                ['guide', 'Guides'],
              ] as const).map(([filter, label]) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setArticleManagerFilter(filter)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    articleManagerFilter === filter
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'border border-black/[0.08] dark:border-white/10 bg-white/50 dark:bg-white/[0.04] text-surface-600 hover:bg-white/80 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] items-start">
            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-3 backdrop-blur-xl shadow-sm xl:sticky xl:top-20 self-start">
              <div className="max-h-[calc(100vh-7.5rem)] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filteredManagedArticles.map(article => {
                  const active = selectedArticle?.slug === article.slug;
                  const isCustom = customArticles.some(item => item.slug === article.slug);
                  const isEdited = Boolean(articleOverrides[article.slug]);
                  return (
                    <button
                      key={article.slug}
                      onClick={() => setSelectedArticleSlug(article.slug)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-primary-500/60 bg-primary-500/10 dark:bg-primary-500/15 shadow-sm' : 'border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.03] hover:border-primary-500/30 hover:bg-white/70 dark:hover:bg-white/[0.07]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-black text-surface-950 dark:text-white">{article.title}</p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-surface-400">{article.category} · {article.readMinutes} min</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${isCustom ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : isEdited ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20' : 'bg-surface-100 text-surface-500 dark:bg-white/[0.08] dark:text-surface-400'}`}>
                          {isCustom ? 'Custom' : isEdited ? 'Edited' : 'Default'}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredManagedArticles.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 p-4 text-center text-xs font-semibold text-surface-500">
                    No {articleManagerFilter === 'all' ? 'articles' : articleManagerFilter === 'blog' ? 'blogs' : 'guides'} yet.
                  </div>
                )}
              </div>
            </div>

            {selectedArticle && (
              <div className="space-y-5">
                <div className="rounded-3xl border border-primary-500/30 bg-primary-500/10 dark:bg-primary-500/[0.08] p-5 space-y-4 backdrop-blur-xl shadow-sm">
                  <div className="flex items-center gap-2 font-medium text-primary-600 dark:text-primary-400">
                    <Zap className="h-5 w-5" />
                    <h3 className="font-bold text-surface-950 dark:text-white">Auto-Generate Article with AI</h3>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-300">
                    Set a working title above (or describe the article below) and the AI writes the title, description, tags, and full body in your site&apos;s style. Mention a specific field (e.g. &quot;rewrite the body&quot;) to regenerate only that field.
                  </p>
                  <textarea
                    value={articleAiInstruction}
                    onChange={e => setArticleAiInstruction(e.target.value)}
                    placeholder="(Optional) E.g., 'A beginner guide to negative prompts in ChatGPT', 'Keep it under 1000 words', 'Only rewrite the body', etc."
                    className="w-full min-h-20 resize-y rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:text-white backdrop-blur-md"
                  />
                  <ActionButton onClick={handleGenerateArticleDetails} disabled={isGeneratingArticleAi}>
                    {isGeneratingArticleAi ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Zap className="h-4 w-4" />}
                    {isGeneratingArticleAi ? 'Generating article...' : 'Generate article'}
                  </ActionButton>
                </div>
                <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="space-y-1 sm:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Title</span>
                        <textarea rows={2} value={selectedArticle.title} onChange={e => updateManagedArticle(selectedArticle.slug, { title: e.target.value })} className="resize-y w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-2 text-sm outline-none focus:border-primary-500 dark:text-white backdrop-blur-md" />
                        <CharCount value={selectedArticle.title} recommended={60} />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Slug</span>
                        <input
                          value={selectedArticle.slug}
                          disabled={!selectedArticleIsCustom}
                          onChange={e => {
                            const nextSlug = slugify(e.target.value);
                            updateManagedArticle(selectedArticle.slug, { slug: nextSlug });
                            setSelectedArticleSlug(nextSlug);
                          }}
                          className={`${adminInputOnCard} disabled:opacity-60`}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Category</span>
                        <select value={selectedArticle.category} onChange={e => updateManagedArticle(selectedArticle.slug, { category: e.target.value as 'blog' | 'guide' })} className={adminInputOnCard}>
                          <option value="blog">Blog</option>
                          <option value="guide">Guide</option>
                        </select>
                      </label>
                      <label className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Description</span>
                          <WandButton
                            fieldId={`article-desc-${selectedArticle.slug}`}
                            value={selectedArticle.description}
                            onChange={(v) => updateManagedArticle(selectedArticle.slug, { description: v })}
                            prompt={() => articlePrompts.metaDescription(selectedArticle.title)}
                          />
                        </div>
                        <textarea value={selectedArticle.description} onChange={e => updateManagedArticle(selectedArticle.slug, { description: e.target.value })} rows={3} className={`${adminInputOnCard} resize-y`} />
                        <CharCount value={selectedArticle.description} recommended={160} />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Tags</span>
                        <input value={selectedArticle.tags.join(', ')} onChange={e => updateManagedArticle(selectedArticle.slug, { tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} className={adminInputOnCard} placeholder="prompt writing, beginners" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Thumbnail URL</span>
                        <input value={selectedArticle.thumbnailUrl || ''} onChange={e => updateManagedArticle(selectedArticle.slug, { thumbnailUrl: e.target.value })} className={adminInputOnCard} placeholder="https://..." />
                        <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary-500/40 bg-primary-500/10 px-3 text-xs font-bold text-primary-600 hover:bg-primary-500/20 dark:text-primary-300">
                          <Upload className="h-3.5 w-3.5" /> Upload thumbnail
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleArticleThumbnailUpload(selectedArticle.slug, file);
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Read minutes</span>
                        <input type="number" min={1} value={selectedArticle.readMinutes} onChange={e => updateManagedArticle(selectedArticle.slug, { readMinutes: parseInt(e.target.value) || 1 })} className={adminInputOnCard} />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Publish date</span>
                        <input type="date" value={selectedArticle.datePublished} onChange={e => updateManagedArticle(selectedArticle.slug, { datePublished: e.target.value })} className={adminInputOnCard} />
                      </label>
                      <label className="flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-2 text-sm font-bold dark:text-white backdrop-blur-md">
                        <input type="checkbox" checked={Boolean(selectedArticle.featured)} onChange={e => updateManagedArticle(selectedArticle.slug, { featured: e.target.checked })} className="h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
                        Featured article
                      </label>
                      <p className="-mt-2 text-[11px] leading-5 text-surface-500 sm:col-span-2">
                        Featured guides are used first by the homepage Guides block when no manual guide picker is set.
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-surface-500">Thumbnail preview</p>
                      <ArticleThumbnail article={selectedArticle} />
                      <button type="button" onClick={() => resetManagedArticle(selectedArticle.slug)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-500/20 dark:text-red-300">
                        <RotateCcw className="h-4 w-4" /> {selectedArticleIsCustom ? 'Delete custom article' : 'Reset overrides'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm">
                  <label className="space-y-2 block">
                    <span className="text-xs font-bold uppercase tracking-wide text-surface-500">Article body markdown</span>
                    <textarea value={selectedArticle.body} onChange={e => updateManagedArticle(selectedArticle.slug, { body: e.target.value })} rows={22} className={`${adminInputOnCard} resize-y font-mono leading-6`} />
                  </label>
                </div>
              </div>
            )}
            {!selectedArticle && (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-black/15 dark:border-white/15 bg-white/60 dark:bg-white/[0.06] p-6 text-center backdrop-blur-xl shadow-sm">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500 dark:bg-primary-500/20 dark:text-primary-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-surface-950 dark:text-white">Choose an article to edit</h3>
                  <p className="mt-2 text-sm leading-6 text-surface-500">Select a blog or guide from the list, or add a new one. The editor stays closed until you choose something.</p>
                  <button onClick={addManagedArticle} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-600 shadow-md shadow-primary-500/20 transition-all">
                    <Plus className="h-4 w-4" /> Add Article
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'sections' && (
        <div className="w-full max-w-6xl space-y-6 animate-in fade-in duration-200">
          {/* Tab banner */}
          <TabBanner
            icon={<Layers />}
            title="Sections"
            text="Manage content sections and their dedicated pages. Homepage ordering lives here."
            action={(
              <button
                onClick={() => {
                  setShowNewSectionForm(prev => !prev);
                  if (!showNewSectionForm) {
                    window.requestAnimationFrame(() => {
                      document.getElementById('add-section-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> New section
              </button>
            )}
          />

          {/* Sub-tab container card matching frosted glass design */}
          <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-4 backdrop-blur-xl backdrop-saturate-[120%] shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'homepage', label: 'Homepage' },
                { id: 'header', label: 'Header menu' },
                { id: 'footer', label: 'Footer' },
                { id: 'all', label: 'All sections' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSectionLocationFilter(item.id as SectionLocationFilter)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sectionLocationFilter === item.id
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                      : 'text-surface-600 dark:text-surface-300 hover:bg-white/80 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add new section form (Shown only when toggled) */}
          {showNewSectionForm && (
            <div id="add-section-form" className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-6 shadow-sm backdrop-blur-xl backdrop-saturate-[120%] space-y-6 animate-in slide-in-from-top-2 duration-200">
              <PanelHeader
                title="Create new section"
                subtitle="Configure your custom layout block, tag rail, or category filter."
                actions={(
                  <button
                    onClick={() => setShowNewSectionForm(false)}
                    className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              />

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Section name">
                  <input
                    value={newSectionName}
                    onChange={e => {
                      setNewSectionName(e.target.value);
                      if (!newSectionSlug) setNewSectionSlug(slugify(e.target.value));
                    }}
                    className={adminInput}
                    placeholder="e.g., Hot Prompts"
                  />
                </Field>
                <Field label="URL slug">
                  <input
                    value={newSectionSlug}
                    onChange={e => setNewSectionSlug(slugify(e.target.value))}
                    className={adminInput}
                    placeholder="e.g., hot-prompts"
                  />
                </Field>
                <Field label="Location">
                  <select
                    value={newSectionLocation}
                    onChange={e => setNewSectionLocation(e.target.value as 'homepage' | 'header' | 'footer')}
                    className={adminInput}
                  >
                    <option value="homepage">Homepage</option>
                    <option value="header">Header Menu Link</option>
                    <option value="footer">Footer Section</option>
                  </select>
                </Field>
                <Field label="Data source type">
                  <select
                    value={newSectionType}
                    onChange={e => setNewSectionType(e.target.value as Section['type'])}
                    className={adminInput}
                  >
                    <option value="latest">Latest Prompts</option>
                    <option value="popular">Popular Posts</option>
                    <option value="trending">Trending</option>
                    <option value="ai-tool">AI Tool (auto-filter by tool)</option>
                    <option value="tag">Tag (auto-filter by tag)</option>
                    <option value="category">Category (auto-filter by category)</option>
                    <option value="custom">Custom (pick posts manually)</option>
                  </select>
                </Field>
              </div>

              {/* Conditional parameters and custom layout overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newSectionType === 'ai-tool' && (
                  <Field label="AI tool">
                    <select
                      value={newSectionTool}
                      onChange={e => setNewSectionTool(e.target.value)}
                      className={adminInput}
                    >
                      <option value="">Select AI tool...</option>
                      {(settings.aiTools || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                )}
                {newSectionType === 'tag' && (
                  <Field label="Tag value">
                    <input
                      value={newSectionTag}
                      onChange={e => setNewSectionTag(e.target.value)}
                      className={adminInput}
                      placeholder="e.g., character, anime"
                    />
                  </Field>
                )}
                {newSectionType === 'category' && (
                  <Field label="Category value">
                    <input
                      value={newSectionCategory}
                      onChange={e => setNewSectionCategory(e.target.value)}
                      className={adminInput}
                      placeholder="e.g., UI, Game"
                    />
                  </Field>
                )}
                {/* Post limit only affects how many cards the homepage block renders;
                    header/footer sections are just nav links to /section/[slug], which shows all posts. */}
                {newSectionLocation === 'homepage' && (
                  <Field label="Post limit">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newSectionLimit}
                      onChange={e => setNewSectionLimit(parseInt(e.target.value) || 8)}
                      className={adminInput}
                    />
                    <p className="text-[11px] text-surface-400 mt-1">Cards shown in the homepage block. The section page always shows all posts.</p>
                  </Field>
                )}
                <div className="sm:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                  <Field label="Card style override">
                    <select
                      value={newSectionCardStyle}
                      onChange={e => setNewSectionCardStyle(e.target.value as Section['cardStyle'] | '')}
                      className={adminInput}
                    >
                      <option value="">Use global card style</option>
                      <option value="v2">v2 - Glass Frame (default)</option>
                      <option value="v1">v1 - Flat Hover Overlay</option>
                    </select>
                    <p className="text-[11px] text-surface-400 mt-1">
                      {newSectionCardStyle ? 'This section will ignore the global card style.' : `Using global card style: ${cardStyleName(cardStyle)}`}
                    </p>
                  </Field>
                  <CardStylePreview style={newSectionCardStyle || cardStyle} badgeStyle={badgeStyle} label={newSectionCardStyle ? 'Section override preview' : 'Global style preview'} />
                </div>
                <Field label="Optional filter tags" className="sm:col-span-2">
                  <input
                    value={newSectionFilterTags}
                    onChange={e => setNewSectionFilterTags(e.target.value)}
                    className={adminInput}
                    placeholder="character, anime, realistic"
                  />
                  <p className="text-[11px] text-surface-400 mt-1">Adds a horizontal tag rail above this section grid. Tags must match post tags.</p>
                </Field>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddSection}
                  disabled={!newSectionName || (newSectionType === 'ai-tool' && !newSectionTool) || (newSectionType === 'tag' && !newSectionTag) || (newSectionType === 'category' && !newSectionCategory)}
                  className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create section
                </button>
                <button
                  onClick={() => setShowNewSectionForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sections Lists by Location */}
          <div className="space-y-8">
            {sectionLocationsToRender.map(loc => (
              <Panel key={loc}>
                <PanelHeader
                  title={loc === 'homepage' ? 'Homepage sections' : loc === 'header' ? 'Header menu sections' : 'Footer sections'}
                  count={sections.filter(s => (s.location || 'homepage') === loc).length}
                  subtitle={loc === 'homepage'
                    ? 'Edit homepage post sections here. Reorder them with the full homepage layout in Settings -> Homepage.'
                    : loc === 'header'
                      ? 'These appear in the header menu and open their full section pages.'
                      : 'Footer sections are ready for future footer placement and organization.'}
                  actions={(
                    <>
                      {loc === 'homepage' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab('settings');
                            setSettingsSubTab('homepage');
                          }}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                        >
                          <Layers className="h-3.5 w-3.5" /> Open homepage order
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startNewSection(loc)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add {loc === 'homepage' ? 'homepage' : loc === 'header' ? 'header' : 'footer'} section
                      </button>
                    </>
                  )}
                />
                <div className="space-y-3">
                  {[...sections].filter(s => (s.location || 'homepage') === loc).sort((a, b) => a.order - b.order).map((section, idx, arr) => {
                const isAutoSection = section.type === 'latest' || section.type === 'popular';
                const sectionPath = getSectionPath(section);
                return (
                  <EditableCard
                    key={section.id}
                    isEditing={editingSectionId === section.id}
                    className={!section.visible ? 'opacity-60' : ''}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3">
                      {/* Reorder buttons — hidden while editing so the form spans the full card width */}
                      {editingSectionId !== section.id && (loc === 'homepage' ? (
                        <div className="flex w-8 shrink-0 items-center justify-center" title="Use Settings -> Homepage to reorder homepage sections with the rest of the homepage blocks.">
                          <GripVertical className="w-3.5 h-3.5 text-surface-300" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => moveSection(section, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center justify-center">
                            <GripVertical className="w-3.5 h-3.5 text-surface-300" />
                          </div>
                          <button
                            onClick={() => moveSection(section, 'down')}
                            disabled={idx === arr.length - 1}
                            className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Section info */}
                      <div className="flex-1 min-w-0">
                      {editingSectionId === section.id ? (
                        <div className="space-y-6">
                          <SectionEyebrow>1. Section basics</SectionEyebrow>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Section name">
                              <input
                                value={editSectionName}
                                onChange={e => setEditSectionName(e.target.value)}
                                className={adminInput}
                                placeholder="Section title, e.g. Trending Now"
                              />
                            </Field>
                            <Field label="Slug">
                              <input
                                value={editSectionSlug}
                                onChange={e => setEditSectionSlug(slugify(e.target.value))}
                                className={adminInput}
                                placeholder="slug, e.g. trending"
                              />
                              <p className="text-[11px] text-surface-400 mt-1">URL preview: /section/{editSectionSlug || 'slug'}</p>
                            </Field>
                            <Field label="Type">
                              <select
                                value={editSectionType}
                                onChange={e => setEditSectionType(e.target.value as any)}
                                className={adminInput}
                              >
                                <option value="custom">Custom (Manually Picked)</option>
                                <option value="latest">Latest Prompts</option>
                                <option value="popular">Popular Prompts</option>
                                <option value="trending">Trending Prompts</option>
                                <option value="ai-tool">AI Tool Prompts</option>
                                <option value="tag">Tag Prompts</option>
                                <option value="category">Category Prompts</option>
                              </select>
                              <p className="text-[11px] text-surface-400 mt-1">How this section selects its posts</p>
                            </Field>
                            <Field label="Location">
                              <select
                                value={editSectionLocation}
                                onChange={e => setEditSectionLocation(e.target.value as any)}
                                className={adminInput}
                              >
                                <option value="homepage">Homepage Block</option>
                                <option value="header">Header Link</option>
                                <option value="footer">Footer Section</option>
                              </select>
                              <p className="text-[11px] text-surface-400 mt-1">Where this section appears</p>
                            </Field>
                            {/* Post limit only affects the homepage block; header/footer sections
                                are nav links to /section/[slug], which shows all posts. */}
                            {(editSectionLocation || 'homepage') === 'homepage' && (
                              <Field label="Post limit">
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={editSectionLimit}
                                  onChange={e => setEditSectionLimit(parseInt(e.target.value) || 8)}
                                  className={adminInput}
                                />
                                <p className="text-[11px] text-surface-400 mt-1">Cards shown in the homepage block. The section page always shows all posts.</p>
                              </Field>
                            )}
                            <Field label="Card style">
                              <select
                                value={editSectionCardStyle}
                                onChange={e => setEditSectionCardStyle(e.target.value as any)}
                                className={adminInput}
                              >
                                <option value="">Use global card style</option>
                                <option value="v2">v2 Glass Frame (default)</option>
                                <option value="v1">v1 Flat Hover Overlay</option>
                                
                                
                                
                                
                                
                                
                              </select>
                              <p className="text-[11px] text-surface-400 mt-1">Override default grid styling</p>
                            </Field>

                            {/* Conditional configuration based on Section Type */}
                            {editSectionType === 'ai-tool' && (
                              <Field label="AI tool slug or identifier" className="md:col-span-2">
                                <input
                                  value={editSectionAiTool}
                                  onChange={e => setEditSectionAiTool(e.target.value)}
                                  className={adminInput}
                                  placeholder="e.g. chatgpt, gemini"
                                />
                              </Field>
                            )}
                            {editSectionType === 'tag' && (
                              <Field label="Tag value" className="md:col-span-2">
                                <input
                                  value={editSectionTag}
                                  onChange={e => setEditSectionTag(e.target.value)}
                                  className={adminInput}
                                  placeholder="e.g. realistic, photorealistic"
                                />
                              </Field>
                            )}
                            {editSectionType === 'category' && (
                              <Field label="Category name" className="md:col-span-2">
                                <input
                                  value={editSectionCategory}
                                  onChange={e => setEditSectionCategory(e.target.value)}
                                  className={adminInput}
                                  placeholder="e.g. Photography, Art"
                                />
                              </Field>
                            )}
                          </div>

                          {/* Subpanel Section Page */}
                          <div className="pt-2">
                            <SectionEyebrow>2. Section page</SectionEyebrow>
                            <p className="text-xs text-surface-400 mt-2 mb-4">The dedicated page configuration at /section/{editSectionSlug || 'slug'}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Field label="Page hero badge">
                                <input
                                  value={editSectionHeroBadge}
                                  onChange={e => setEditSectionHeroBadge(e.target.value)}
                                  className={adminInput}
                                  placeholder="Leave blank to use 'Section'"
                                />
                                <p className="text-[11px] text-surface-400 mt-1">Small label shown above the hero title.</p>
                              </Field>
                              <Field label="Page hero title">
                                <input
                                  value={editSectionHeroTitle}
                                  onChange={e => setEditSectionHeroTitle(e.target.value)}
                                  className={adminInput}
                                  placeholder="Leave blank to use section name"
                                />
                                <p className="text-[11px] text-surface-400 mt-1">The big heading shown on the section page.</p>
                              </Field>
                              <FieldTextarea
                                label="Page hero description"
                                value={editSectionHeroDescription}
                                onChange={setEditSectionHeroDescription}
                                rows={2}
                                placeholder="Short introductory text under title"
                                recommended={160}
                                hint="Sub-text under the hero heading."
                                action={(
                                  <WandButton
                                    fieldId="section-hero-desc"
                                    value={editSectionHeroDescription}
                                    onChange={setEditSectionHeroDescription}
                                    prompt={() => homepagePrompts.sectionHeroDescription(editSectionHeroTitle || editSectionName, editSectionFilterTags)}
                                  />
                                )}
                              />
                              <FieldTextarea
                                label="SEO title"
                                value={editSectionSeoTitle}
                                onChange={setEditSectionSeoTitle}
                                rows={2}
                                placeholder="Leave blank to use hero title"
                                recommended={60}
                                hint={<>Browser tab &amp; search-result title (&lt;title&gt; tag).</>}
                                action={(
                                  <WandButton
                                    fieldId="section-seo-title"
                                    value={editSectionSeoTitle}
                                    onChange={setEditSectionSeoTitle}
                                    prompt={() => homepagePrompts.sectionSeoTitle(editSectionHeroTitle || editSectionName)}
                                  />
                                )}
                              />
                              <FieldTextarea
                                label="SEO description"
                                value={editSectionSeoDescription}
                                onChange={setEditSectionSeoDescription}
                                rows={2}
                                placeholder="Leave blank to use hero description"
                                recommended={160}
                                hint="Meta description for search engines."
                                action={(
                                  <WandButton
                                    fieldId="section-seo-desc"
                                    value={editSectionSeoDescription}
                                    onChange={setEditSectionSeoDescription}
                                    prompt={() => homepagePrompts.sectionSeoDescription(editSectionHeroTitle || editSectionName, editSectionFilterTags)}
                                  />
                                )}
                              />
                              <Field
                                label="Intro content (Markdown supported)"
                                className="md:col-span-2"
                                action={(
                                  <WandButton
                                    fieldId="section-intro-content"
                                    value={editSectionIntroContent}
                                    onChange={setEditSectionIntroContent}
                                    prompt={() => homepagePrompts.sectionIntroContent(editSectionHeroTitle || editSectionName, editSectionFilterTags)}
                                  />
                                )}
                              >
                                <textarea
                                  value={editSectionIntroContent}
                                  onChange={e => setEditSectionIntroContent(e.target.value)}
                                  rows={4}
                                  className={`${adminInput} resize-y`}
                                  placeholder="Full intro layout with Rich Markdown details to show above the prompts..."
                                />
                              </Field>
                            </div>
                          </div>

                          {/* Filter rail per-section */}
                          <div className="pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                              <SectionEyebrow>3. Filter rail for this section page</SectionEyebrow>
                              <Toggle
                                checked={editSectionUseCustomRail}
                                onChange={setEditSectionUseCustomRail}
                                label="Custom filter rail"
                              />
                            </div>
                            <p className="text-xs text-surface-400 mb-4">
                              Affects /section/{editSectionSlug || 'slug'}. When off, visitors see the normal sorting & filter UI. When on, only your custom chips show.
                            </p>

                            {!editSectionUseCustomRail ? (
                              <div className="border border-dashed border-surface-200 dark:border-surface-800 rounded-xl p-6 text-center text-xs text-surface-400">
                                Rail is disabled — public page uses default sorting & filters.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const sectionPosts = filterPostsForSection({ ...section, type: editSectionType, aiTool: editSectionAiTool, tag: editSectionTag, category: editSectionCategory }, posts, settings, false);
                                      const tags = Array.from(new Set(sectionPosts.flatMap(p => p.tags || []))).slice(0, 8);
                                      setEditSectionRailItems(tags.map(t => ({ label: t, type: 'tag', value: t })));
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-[11px] font-bold text-primary-600 hover:bg-primary-100 dark:bg-primary-950/20 dark:text-primary-300"
                                  >
                                    <Check className="w-3 h-3" /> Fill from current posts
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditSectionRailItems([])}
                                    className="inline-flex items-center gap-1 rounded-lg bg-surface-100 px-2.5 py-1.5 text-[11px] font-bold text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Clear custom chips
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {editSectionRailItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_auto] items-center">
                                      <input
                                        value={item.label}
                                        onChange={e => {
                                          setEditSectionRailItems(prev => prev.map((chip, idx) => idx === index ? { ...chip, label: e.target.value } : chip));
                                        }}
                                        className={adminInput}
                                        placeholder="Visible title, e.g. Anime"
                                      />
                                      <select
                                        value={item.type}
                                        onChange={e => {
                                          setEditSectionRailItems(prev => prev.map((chip, idx) => idx === index ? { ...chip, type: e.target.value as any } : chip));
                                        }}
                                        className={adminInput}
                                      >
                                        <option value="tag">Tag</option>
                                        <option value="tool">AI Tool</option>
                                        <option value="category">Category</option>
                                      </select>
                                      <input
                                        value={item.value}
                                        onChange={e => {
                                          setEditSectionRailItems(prev => prev.map((chip, idx) => idx === index ? { ...chip, value: e.target.value } : chip));
                                        }}
                                        className={adminInput}
                                        placeholder="Match value, e.g. anime"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setEditSectionRailItems(prev => prev.filter((_, idx) => idx !== index))}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
                                        title="Remove chip"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setEditSectionRailItems(prev => [...prev, { label: '', type: 'tag', value: '' }])}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-xs font-bold text-surface-600 dark:text-surface-300 transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add chip
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action controls footer */}
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
                              <ActionButton
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  setEditSectionName(section.name);
                                  setEditSectionSlug(section.slug || '');
                                  setEditSectionLimit(section.limit);
                                  setEditSectionCardStyle(section.cardStyle || '');
                                  setEditSectionHeroBadge(section.heroBadge || '');
                                  setEditSectionHeroTitle(section.heroTitle || '');
                                  setEditSectionHeroDescription(section.heroDescription || '');
                                  setEditSectionSeoTitle(section.seoTitle || '');
                                  setEditSectionSeoDescription(section.seoDescription || '');
                                  setEditSectionIntroContent(section.introContent || '');
                                  setEditSectionType(section.type);
                                  setEditSectionLocation(section.location || 'homepage');
                                  setEditSectionAiTool(section.aiTool || '');
                                  setEditSectionTag(section.tag || '');
                                  setEditSectionCategory(section.category || '');
                                  setEditSectionUseCustomRail(section.useCustomRail || false);
                                  setEditSectionRailItems(section.railItems || []);
                                }}
                              >
                                Reset
                              </ActionButton>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <ActionButton
                                  variant="ghost"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => setEditingSectionId(null)}
                                >
                                  Close
                                </ActionButton>
                                <ActionButton
                                  variant="primary"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => saveEditSection(section)}
                                >
                                  <Save className="w-3.5 h-3.5" /> Save section
                                </ActionButton>
                              </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-sm truncate flex items-center gap-2 text-surface-900 dark:text-white">
                            {section.name}
                            {isAutoSection && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                <Zap className="w-2.5 h-2.5" /> Auto
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-surface-400">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{section.type}</span>
                            <span className="capitalize px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-primary-600 dark:text-primary-400 font-semibold">{section.location || 'homepage'}</span>
                            <span className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 font-mono text-[10px]">{sectionPath}</span>
                            {section.aiTool && <span>- {section.aiTool}</span>}
                            {section.tag && <span>- {section.tag}</span>}
                            {section.category && <span>- {section.category}</span>}
                            <span>- Limit: {section.limit}</span>
                            {section.type === 'custom' && section.postIds && (
                              <span>- {section.postIds.length} posts selected</span>
                            )}
                            {section.cardStyle && <span>- Cards: {section.cardStyle}</span>}
                            {section.useCustomRail && (
                              <span className="text-primary-500 font-semibold">- Custom Rail: {section.railItems?.length || 0} chips</span>
                            )}
                            {!section.visible && <span className="text-red-400 font-medium">- Hidden</span>}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    {editingSectionId !== section.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        {section.type === 'custom' && (
                          <button
                            onClick={() => { setPickingPostsForSection(pickingPostsForSection === section.id ? null : section.id); setPostPickerSearch(''); }}
                            className={`p-2 rounded-lg transition-colors ${pickingPostsForSection === section.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-500' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400'}`}
                            title="Select posts for this section"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => window.open(sectionPath, '_blank')}
                          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          title="Open section"
                        >
                          <Eye className="w-4 h-4 text-surface-500" />
                        </button>
                        <button
                          onClick={() => startEditSection(section)}
                          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          title="Edit section"
                        >
                          <Edit3 className="w-4 h-4 text-primary-500" />
                        </button>
                        <button
                          onClick={() => toggleSectionVisibility(section)}
                          className={`p-2 rounded-lg transition-colors ${
                            section.visible ? 'hover:bg-surface-100 dark:hover:bg-surface-800' : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={section.visible ? 'Hide section' : 'Show section'}
                        >
                          {section.visible
                            ? <Eye className="w-4 h-4 text-green-500" />
                            : <EyeOff className="w-4 h-4 text-surface-400" />
                          }
                        </button>
                        <button
                          onClick={async () => { if (await confirmAction({ title: 'Delete this section?', message: `"${section.name}" will be permanently removed.`, confirmLabel: 'Delete' })) deleteSection(section.id); }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Auto section info */}
                  {isAutoSection && (
                    <div className="mt-3">
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-600 dark:text-blue-400">
                          {section.type === 'latest'
                            ? 'Auto-populated with the newest posts. Shows all posts sorted by date with a "Load More" button.'
                            : 'Auto-populated with the most viewed posts.'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post picker for custom sections */}
                  {pickingPostsForSection === section.id && section.type === 'custom' && (
                    <div className="mt-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-surface-400">
                          Select posts for &quot;{section.name}&quot;
                        </h5>
                        <span className="text-xs text-surface-400">
                          {section.postIds?.length || 0} selected
                        </span>
                      </div>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                        <input
                          value={postPickerSearch}
                          onChange={e => setPostPickerSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                          placeholder="Search posts to add..."
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5">
                        {posts
                          .filter(p => !postPickerSearch || p.title.toLowerCase().includes(postPickerSearch.toLowerCase()))
                          .map(p => {
                            const isSelected = section.postIds?.includes(p.id) || false;
                            const selectedIndex = section.postIds?.indexOf(p.id) ?? -1;
                            return (
                              <div
                                key={p.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                                  isSelected
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                    : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:border-primary-300'
                                }`}
                              >
                                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePostInSection(section.id, p.id)}
                                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500 shrink-0"
                                  />
                                  <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-200 dark:bg-surface-700">
                                    {p.images[0]?.url && <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="40px" referrerPolicy="no-referrer" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{p.title}</p>
                                    <p className="text-[10px] text-surface-400">{p.images.length} images{isSelected ? ` - #${selectedIndex + 1}` : ''}</p>
                                  </div>
                                  {p.featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                                </label>
                                {isSelected && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => movePostInSection(section, p.id, 'up')}
                                      disabled={selectedIndex <= 0}
                                      className="p-1.5 rounded-md hover:bg-white dark:hover:bg-surface-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move up"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => movePostInSection(section, p.id, 'down')}
                                      disabled={selectedIndex === -1 || selectedIndex >= (section.postIds?.length || 0) - 1}
                                      className="p-1.5 rounded-md hover:bg-white dark:hover:bg-surface-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move down"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </EditableCard>
              );
            })}

            {sections.filter(s => (s.location || 'homepage') === loc).length === 0 && (
              <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-8 text-center text-xs font-semibold text-surface-500">
                <LayoutGrid className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No sections yet for {loc === 'homepage' ? 'Homepage' : 'Header'}.</p>
              </div>
            )}
            </div>
            </Panel>
            ))}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {tab === 'settings' && (
        <div className="max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 items-start">

            {/* Settings navigation: horizontal chips on mobile, sticky sidebar on desktop. */}
            <div className="min-w-0 rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-2.5 backdrop-blur-xl shadow-sm lg:sticky lg:top-20 self-start lg:p-3.5 max-h-[calc(100vh-6rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <h3 className="mb-2.5 hidden px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-surface-400 dark:text-surface-500 lg:block">Settings Categories</h3>
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {[
                  { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
                  { id: 'homepage', label: 'Homepage Blocks', icon: <Layers className="w-4 h-4" /> },
                  { id: 'discovery', label: 'Discovery Pages', icon: <Compass className="w-4 h-4" /> },
                  { id: 'navigation', label: 'Navigation Menu', icon: <Menu className="w-4 h-4" /> },
                  { id: 'footer', label: 'Footer Links', icon: <LayoutTemplate className="w-4 h-4" /> },
                  { id: 'features', label: 'Feature Flags', icon: <Sparkles className="w-4 h-4" /> },
                  { id: 'ads', label: 'Ads & Scripts', icon: <BarChart2 className="w-4 h-4" /> },
                  { id: 'ai-tools', label: 'AI Tools', icon: <Wand2 className="w-4 h-4" /> },
                  { id: 'comments', label: 'Comments', icon: <MessageCircle className="w-4 h-4" /> },
                  { id: 'share', label: 'Share Targets', icon: <ArrowRight className="w-4 h-4" /> },
                ].map(cat => {
                  const isActive = settingsSubTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSettingsSubTab(cat.id as any)}
                      className={`flex w-auto shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-medium transition-all lg:w-full lg:text-xs ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 font-bold'
                          : 'text-surface-600 hover:text-surface-950 dark:text-surface-400 dark:hover:text-surface-100 hover:bg-white/80 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-surface-400 dark:text-surface-500'}>
                        {cat.icon}
                      </span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Settings Panel */}
            <div className="space-y-6">
            {settingsSubTab === 'general' && (
              <>
              <TabBanner
                icon={<Settings />}
                title="General settings"
                text="Site identity, image uploads, and the global look of the public site. Changes go live after you save."
              />
              <Panel>
                <PanelHeader
                  title="Site settings"
                  subtitle="Access, identity, uploads, and appearance."
                />
                <div className="space-y-6">
                  <SectionEyebrow>1. Access & identity</SectionEyebrow>
                  <div>
                    <label className={adminLabel}>Site Status</label>
                    <div className="flex items-center gap-3 mt-2 mb-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10">
                      <div className="flex-1">
                        <p className="font-bold text-red-600 dark:text-red-400">Maintenance Mode</p>
                        <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-1">If enabled, the public site is blocked with a maintenance screen. Only admins can browse the site. Remember to save changes at the bottom to apply.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={maintenanceMode}
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={adminLabel}>Admin emails (comma separated)</label>
                    <input
                      value={adminEmailsStr}
                      onChange={e => setAdminEmailsStr(e.target.value)}
                      className={adminInput}
                      placeholder="admin@example.com, owner@example.com"
                    />
                    <p className="text-[10px] text-surface-500 mt-1">Blank means only server-configured owner emails can access admin.</p>
                  </div>
                  <div>
                <label className={adminLabel}>Site title</label>
                <div className="flex gap-2">
                  <input
                    value={siteTitle}
                    onChange={e => setSiteTitle(e.target.value)}
                    className={`${adminInput} flex-1`}
                    placeholder="AI PromptMatrix"
                  />
                  <button
                    onClick={async () => {
                      try {
                        // Call the server-side route so the Gemini API key
                        // never has to be a NEXT_PUBLIC_ var (client-bundle leak).
                        const supabase = createSupabaseClient();
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch('/api/generate-text', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                          },
                          body: JSON.stringify({
                            prompt: `Suggest 5 memorable, short domain names for a website titled "${siteTitle}" with description "${siteDescription}". Just return the options separated by commas.`,
                          }),
                        });
                        const result = await res.json();
                        if (result.text) {
                          showToast(`Suggested domains:\n${result.text}`, 'info');
                        } else {
                          showToast('Could not generate domain names. Please try again.', 'error');
                        }
                      } catch(e) {
                        showToast('Could not generate domain names. Please try again.', 'error');
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 whitespace-nowrap transition-colors"
                  >
                    Suggest domains
                  </button>
                </div>
              </div>
              <div>
                <label className={adminLabel}>Site logo URL (used in header & favicon)</label>
                <input
                  value={siteLogo}
                  onChange={e => setSiteLogo(e.target.value)}
                  className={adminInput}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300">Site description</label>
                  <WandButton
                    fieldId="general-site-desc"
                    value={siteDescription}
                    onChange={setSiteDescription}
                    prompt={() => generalPrompts.siteDescription(siteTitle)}
                  />
                </div>
                <textarea
                  value={siteDescription}
                  onChange={e => setSiteDescription(e.target.value)}
                  rows={2}
                  className={`${adminInput} min-h-[80px] resize-y`}
                />
              </div>
              <div>
                <SectionEyebrow>2. Image uploads</SectionEyebrow>
                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mt-3 mb-2">Upload platform</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { id: 'supabase', label: 'Supabase Storage', desc: 'Uses your public images bucket' },
                    { id: 'cloudflare', label: 'Cloudflare R2', desc: 'Uses uploads.aipromptmatrix.in' },
                  ].map(provider => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setImageProvider(provider.id as UploadProvider)}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                        imageProvider === provider.id
                          ? 'border-primary-500/50 bg-primary-50/10 dark:bg-primary-950/10 shadow-md'
                          : 'border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 hover:border-surface-300 dark:hover:border-surface-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-surface-900 dark:text-white">{provider.label}</span>
                      <span className="text-[10px] text-surface-500 mt-0.5">{provider.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                  {imageProvider === 'cloudflare' ? (
                    <>
                      <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">
                        Images upload through your app API into the Cloudflare R2 <span className="font-mono">uploads</span> bucket.
                      </p>
                      <p className="text-[10px] text-surface-500 font-mono bg-surface-100 dark:bg-surface-900 p-2 rounded">
                        Requires the Worker R2 binding named UPLOADS and public domain https://uploads.aipromptmatrix.in.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">
                        Images upload to your Supabase Storage <span className="font-mono">images</span> bucket.
                      </p>
                      <p className="text-[10px] text-surface-500 font-mono bg-surface-100 dark:bg-surface-900 p-2 rounded">
                        Make sure the bucket is public.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <SectionEyebrow>3. Homepage appearance</SectionEyebrow>
              <div className="rounded-xl border border-surface-200 p-3 dark:border-surface-800">
                <Toggle
                  checked={features.showAnimatedBackground ?? true}
                  onChange={(checked) => setFeatures(prev => ({ ...prev, showAnimatedBackground: checked }))}
                  label="Animated glass background"
                />
                <p className="mt-1 text-xs text-surface-500">
                  Site-wide frosted canvas behind every page: drifting grid, glow orbs and a
                  desktop cursor spotlight. Off keeps the flat white / dark surfaces.
                </p>
              </div>
              <div className="mt-3">
                <label className={adminLabel}>Post hero style</label>
                <select
                  value={postHeroStyle}
                  onChange={e => setPostHeroStyle(e.target.value as any)}
                  className={`${adminInput} sm:w-1/2`}
                >
                  <option value="v1">Default: Natural Display</option>
                  <option value="v7">Current: Full Screen Hero</option>
                  <option value="v2">Immersive Blur Background</option>
                  <option value="v8">Floating Card</option>
                </select>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                <div className="space-y-3">
                  <div>
                    <label className={adminLabel}>Card style</label>
                    <select
                      value={cardStyle}
                      onChange={e => setCardStyle(e.target.value as any)}
                      className={adminInput}
                    >
                      <option value="v2">v2 - Glass Frame (default)</option>
                      <option value="v1">v1 - Flat Hover Overlay</option>
                    </select>
                  </div>
                  <div>
                    <label className={adminLabel}>Badge style</label>
                    <select
                      value={badgeStyle}
                      onChange={e => setBadgeStyle(e.target.value as any)}
                      className={adminInput}
                    >
                      <option value="v1">Default: Subtle & Clean</option>
                      <option value="v2">Glass Blur</option>
                      <option value="v5">Minimalist Tag</option>
                      <option value="v10">Angled Accent</option>
                    </select>
                  </div>
                </div>
                <CardStylePreview style={cardStyle} badgeStyle={badgeStyle} label="Global card preview" />
              </div>
              <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"
                >
                  <Save className="w-4 h-4" /> Save settings
                </button>
              </div>
            </div>
          </Panel>
          </>
          )}

          {settingsSubTab === 'discovery' && (() => {
            const activeRailConfig = [
              {
                key: 'explore' as RailListKey,
                title: 'Explore page rail',
                description: 'Used on /explore.',
                items: exploreFilterItems,
                liveItems: liveExploreItems,
                savedItems: savedExploreItems,
                setItems: setExploreFilterItems,
                enabled: discoveryPages.useCustomRailOnExplore ?? true,
                toggleKey: 'useCustomRailOnExplore' as const,
                toggleLabel: 'Custom filter rail',
                toggleDesc: 'Affects /explore. When off, visitors see the normal sorting & filter UI. When on, only your custom chips show.',
                disabledMsg: 'Rail is disabled — public page uses default sorting & filters.',
              },
              {
                key: 'tool' as RailListKey,
                title: 'AI tool page rail',
                description: 'Used on /tool/[tool] pages.',
                items: toolRailItems,
                liveItems: liveToolRailItems,
                savedItems: savedToolRailItems,
                setItems: setToolRailItems,
                enabled: discoveryPages.useCustomRailOnTools ?? false,
                toggleKey: 'useCustomRailOnTools' as const,
                toggleLabel: 'Custom filter rail',
                toggleDesc: 'Affects /tool/[tool]. When off, visitors see normal sorting & filter UI. When on, only your custom chips show.',
                disabledMsg: 'Rail is disabled — public tool pages use default sorting & filters.',
              },
              {
                key: 'tag' as RailListKey,
                title: 'Tag page rail',
                description: 'Used on /tag/[tag] pages.',
                items: tagRailItems,
                liveItems: liveTagRailItems,
                savedItems: savedTagRailItems,
                setItems: setTagRailItems,
                enabled: discoveryPages.useCustomRailOnTags ?? false,
                toggleKey: 'useCustomRailOnTags' as const,
                toggleLabel: 'Custom filter rail',
                toggleDesc: 'Affects /tag/[tag]. When off, visitors see normal sorting & filter UI. When on, only your custom chips show.',
                disabledMsg: 'Rail is disabled — public tag pages use default sorting & filters.',
              },
            ].find(r => r.key === discoveryTab);

            return (
              <div className="space-y-6">
                {/* Top Info Banner */}
                <div className="flex items-center gap-2.5 p-3.5 text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800/60 rounded-xl border border-surface-200 dark:border-surface-700">
                  <Info className="w-4 h-4 text-surface-400 shrink-0" />
                  <span>Controls for listing & discovery pages. Each panel is labeled with the exact page it affects. Rails default to off — they never show fake &quot;auto&quot; chips.</span>
                </div>

                {/* Sub-tabs Navigation */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'explore', label: 'Explore Page', icon: Compass },
                    { id: 'tool', label: 'AI Tool Pages', icon: Cpu },
                    { id: 'tag', label: 'Tag Pages', icon: Tag },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const active = discoveryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDiscoveryTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-primary-600 text-white shadow-primary-600/20'
                            : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Main Card Container */}
                <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:p-6 space-y-6">
                  {/* Explore Page Tab View */}
                  {discoveryTab === 'explore' && (
                    <>
                      {/* Header */}
                      <div className="flex items-start gap-4 pb-4 border-b border-surface-100 dark:border-surface-800">
                        <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shrink-0">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-base text-surface-900 dark:text-white">Explore Page</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">/explore</span>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">Controls /explore — your main discovery page</p>
                        </div>
                      </div>

                      {/* Hero Controls */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">Hero badge</label>
                            <input
                              value={discoveryPages.exploreBadge || ''}
                              onChange={e => setDiscoveryPages(prev => ({ ...prev, exploreBadge: e.target.value }))}
                              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 text-surface-900 dark:text-white"
                              placeholder="Explore the library"
                            />
                          </div>
                          <div>
                            <div className="mb-1.5 flex items-center justify-between">
                              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Hero heading</label>
                              <WandButton
                                fieldId="discovery-explore-title"
                                value={discoveryPages.exploreTitle || ''}
                                onChange={(v) => setDiscoveryPages(prev => ({ ...prev, exploreTitle: v }))}
                                prompt={discoveryPrompts.exploreHeading}
                              />
                            </div>
                            <textarea rows={2}
                              value={discoveryPages.exploreTitle || ''}
                              onChange={e => setDiscoveryPages(prev => ({ ...prev, exploreTitle: e.target.value }))}
                              className="resize-y w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 text-surface-900 dark:text-white"
                              placeholder="Explore AI Prompts"
                            />
                            <CharCount value={discoveryPages.exploreTitle || ''} recommended={60} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Hero description</label>
                            <WandButton
                              fieldId="discovery-explore-desc"
                              value={discoveryPages.exploreDescription || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, exploreDescription: v }))}
                              prompt={discoveryPrompts.exploreDescription}
                            />
                          </div>
                          <textarea
                            value={discoveryPages.exploreDescription || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, exploreDescription: e.target.value }))}
                            rows={2}
                            className={`${adminInputOnCard} min-h-[80px] resize-y`}
                            placeholder="Browse thousands of tested prompts across every major AI tool. Filter by tool, tag or use-case."
                          />
                          <CharCount value={discoveryPages.exploreDescription || ''} recommended={160} />
                        </div>
                      </div>

                      {/* SEO & Social Card */}
                      <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-primary-500 shrink-0">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-surface-900 dark:text-white">SEO & social</h4>
                            <p className="text-xs text-surface-500">Meta for the Explore page</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="mb-1.5 flex items-center justify-between">
                              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Meta title</label>
                              <WandButton
                                fieldId="discovery-explore-seo-title"
                                value={discoveryPages.exploreSeoTitle || ''}
                                onChange={(v) => setDiscoveryPages(prev => ({ ...prev, exploreSeoTitle: v }))}
                                prompt={discoveryPrompts.exploreMetaTitle}
                              />
                            </div>
                            <textarea rows={2}
                              value={discoveryPages.exploreSeoTitle || ''}
                              onChange={e => setDiscoveryPages(prev => ({ ...prev, exploreSeoTitle: e.target.value }))}
                              className="resize-y w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 text-surface-900 dark:text-white"
                              placeholder="Explore AI Prompts — AI Prompt Matrix"
                            />
                            <CharCount value={discoveryPages.exploreSeoTitle || ''} recommended={60} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">OG image URL</label>
                            <input
                              value={discoveryPages.exploreOgImage || ''}
                              onChange={e => setDiscoveryPages(prev => ({ ...prev, exploreOgImage: e.target.value }))}
                              className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 text-surface-900 dark:text-white"
                              placeholder="Default if empty"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Meta description</label>
                            <WandButton
                              fieldId="discovery-explore-seo-desc"
                              value={discoveryPages.exploreSeoDescription || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, exploreSeoDescription: v }))}
                              prompt={discoveryPrompts.exploreMetaDescription}
                            />
                          </div>
                          <textarea
                            value={discoveryPages.exploreSeoDescription || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, exploreSeoDescription: e.target.value }))}
                            rows={2}
                            className={`${adminInput} min-h-[70px] resize-y`}
                            placeholder="Browse and filter the full library of curated AI prompts."
                          />
                          <CharCount value={discoveryPages.exploreSeoDescription || ''} recommended={160} />
                        </div>
                      </div>

                      {/* Stat boxes row */}
                      <div className="flex items-center justify-between py-2 border-t border-b border-surface-100 dark:border-surface-800">
                        <div>
                          <h4 className="font-bold text-sm text-surface-900 dark:text-white">Show stat boxes</h4>
                          <p className="text-xs text-surface-500">Display total posts / tools / tags in the hero</p>
                        </div>
                        <Toggle
                          checked={discoveryPages.showHeroStats ?? true}
                          onChange={(checked) => setDiscoveryPages(prev => ({ ...prev, showHeroStats: checked }))}
                        />
                      </div>
                    </>
                  )}

                  {/* AI Tool Pages Tab View */}
                  {discoveryTab === 'tool' && (
                    <>
                      {/* Header */}
                      <div className="flex items-start gap-4 pb-4 border-b border-surface-100 dark:border-surface-800">
                        <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shrink-0">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-base text-surface-900 dark:text-white">AI Tool Pages</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">/tool/[tool]</span>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">Controls all AI tool listing pages (e.g., /tool/chatgpt)</p>
                        </div>
                      </div>

                      {/* Hero Controls */}
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Title template</label>
                            <WandButton
                              fieldId="discovery-tool-title"
                              value={discoveryPages.toolTitleTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, toolTitleTemplate: v }))}
                              prompt={discoveryPrompts.toolTitle}
                            />
                          </div>
                          <textarea rows={2}
                            value={discoveryPages.toolTitleTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, toolTitleTemplate: e.target.value }))}
                            className="resize-y w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 text-surface-900 dark:text-white"
                            placeholder="Tool title template: %tool% Prompts"
                          />
                          <CharCount value={discoveryPages.toolTitleTemplate || ''} recommended={60} />
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Description template</label>
                            <WandButton
                              fieldId="discovery-tool-desc"
                              value={discoveryPages.toolDescriptionTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, toolDescriptionTemplate: v }))}
                              prompt={discoveryPrompts.toolDescription}
                            />
                          </div>
                          <textarea
                            value={discoveryPages.toolDescriptionTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, toolDescriptionTemplate: e.target.value }))}
                            rows={2}
                            className={`${adminInputOnCard} min-h-[80px] resize-y`}
                            placeholder="Browse %count% prompt collections organized for %tool%."
                          />
                          <CharCount value={discoveryPages.toolDescriptionTemplate || ''} recommended={160} />
                        </div>
                      </div>

                      {/* SEO & Social Card */}
                      <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-primary-500 shrink-0">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-surface-900 dark:text-white">SEO & social</h4>
                            <p className="text-xs text-surface-500">Meta for AI tool listing pages</p>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Meta title template</label>
                            <WandButton
                              fieldId="discovery-tool-seo-title"
                              value={discoveryPages.toolSeoTitleTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, toolSeoTitleTemplate: v }))}
                              prompt={discoveryPrompts.toolMetaTitle}
                            />
                          </div>
                          <textarea rows={2}
                            value={discoveryPages.toolSeoTitleTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, toolSeoTitleTemplate: e.target.value }))}
                            className="resize-y w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 text-surface-900 dark:text-white"
                            placeholder="%tool% Prompts"
                          />
                          <CharCount value={discoveryPages.toolSeoTitleTemplate || ''} recommended={60} />
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Meta description template</label>
                            <WandButton
                              fieldId="discovery-tool-seo-desc"
                              value={discoveryPages.toolSeoDescriptionTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, toolSeoDescriptionTemplate: v }))}
                              prompt={discoveryPrompts.toolMetaDescription}
                            />
                          </div>
                          <textarea
                            value={discoveryPages.toolSeoDescriptionTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, toolSeoDescriptionTemplate: e.target.value }))}
                            rows={2}
                            className={`${adminInput} min-h-[70px] resize-y`}
                            placeholder="Browse curated prompts for %tool%."
                          />
                          <CharCount value={discoveryPages.toolSeoDescriptionTemplate || ''} recommended={160} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tag Pages Tab View */}
                  {discoveryTab === 'tag' && (
                    <>
                      {/* Header */}
                      <div className="flex items-start gap-4 pb-4 border-b border-surface-100 dark:border-surface-800">
                        <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shrink-0">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-base text-surface-900 dark:text-white">Tag Pages</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">/tag/[tag]</span>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">Controls all tag listing pages (e.g., /tag/cyberpunk)</p>
                        </div>
                      </div>

                      {/* Hero Controls */}
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Title template</label>
                            <WandButton
                              fieldId="discovery-tag-title"
                              value={discoveryPages.tagTitleTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, tagTitleTemplate: v }))}
                              prompt={discoveryPrompts.tagTitle}
                            />
                          </div>
                          <textarea rows={2}
                            value={discoveryPages.tagTitleTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, tagTitleTemplate: e.target.value }))}
                            className="resize-y w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 text-surface-900 dark:text-white"
                            placeholder="Tag title template: %tag% Prompts"
                          />
                          <CharCount value={discoveryPages.tagTitleTemplate || ''} recommended={60} />
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Description template</label>
                            <WandButton
                              fieldId="discovery-tag-desc"
                              value={discoveryPages.tagDescriptionTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, tagDescriptionTemplate: v }))}
                              prompt={discoveryPrompts.tagDescription}
                            />
                          </div>
                          <textarea
                            value={discoveryPages.tagDescriptionTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, tagDescriptionTemplate: e.target.value }))}
                            rows={2}
                            className={`${adminInputOnCard} min-h-[80px] resize-y`}
                            placeholder="Showing %count% collections tagged with &quot;%tag%&quot;."
                          />
                          <CharCount value={discoveryPages.tagDescriptionTemplate || ''} recommended={160} />
                        </div>
                      </div>

                      {/* SEO & Social Card */}
                      <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-primary-500 shrink-0">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-surface-900 dark:text-white">SEO & social</h4>
                            <p className="text-xs text-surface-500">Meta for tag listing pages</p>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Meta title template</label>
                            <WandButton
                              fieldId="discovery-tag-seo-title"
                              value={discoveryPages.tagSeoTitleTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, tagSeoTitleTemplate: v }))}
                              prompt={discoveryPrompts.tagMetaTitle}
                            />
                          </div>
                          <textarea rows={2}
                            value={discoveryPages.tagSeoTitleTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, tagSeoTitleTemplate: e.target.value }))}
                            className="resize-y w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 text-surface-900 dark:text-white"
                            placeholder="%tag% Prompts"
                          />
                          <CharCount value={discoveryPages.tagSeoTitleTemplate || ''} recommended={60} />
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400">Meta description template</label>
                            <WandButton
                              fieldId="discovery-tag-seo-desc"
                              value={discoveryPages.tagSeoDescriptionTemplate || ''}
                              onChange={(v) => setDiscoveryPages(prev => ({ ...prev, tagSeoDescriptionTemplate: v }))}
                              prompt={discoveryPrompts.tagMetaDescription}
                            />
                          </div>
                          <textarea
                            value={discoveryPages.tagSeoDescriptionTemplate || ''}
                            onChange={e => setDiscoveryPages(prev => ({ ...prev, tagSeoDescriptionTemplate: e.target.value }))}
                            rows={2}
                            className={`${adminInput} min-h-[70px] resize-y`}
                            placeholder="Browse prompts tagged with %tag%."
                          />
                          <CharCount value={discoveryPages.tagSeoDescriptionTemplate || ''} recommended={160} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Filter Rail Box for Active Tab */}
                  {activeRailConfig && (
                    <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-primary-500 shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-surface-900 dark:text-white">Filter rail</h4>
                          <p className="text-xs text-surface-500">{activeRailConfig.title}</p>
                        </div>
                      </div>

                      {/* Toggle Row */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                        <div className="pr-4">
                          <h5 className="font-bold text-sm text-surface-900 dark:text-white">{activeRailConfig.toggleLabel}</h5>
                          <p className="text-xs text-surface-500 mt-0.5">{activeRailConfig.toggleDesc}</p>
                        </div>
                        <Toggle
                          checked={activeRailConfig.enabled}
                          onChange={(checked) => setDiscoveryPages(prev => ({ ...prev, [activeRailConfig.toggleKey]: checked }))}
                        />
                      </div>

                      {/* Rail Content or Disabled Banner */}
                      {!activeRailConfig.enabled ? (
                        <div className="p-4 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 text-center">
                          <p className="text-xs font-medium text-surface-500">{activeRailConfig.disabledMsg}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-black text-surface-900 dark:text-white">{activeRailConfig.title}</p>
                              <p className="text-xs text-surface-500">{activeRailConfig.description}</p>
                            </div>
                            <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-bold text-surface-500 ring-1 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700">
                              {activeRailConfig.savedItems.length > 0 ? `${activeRailConfig.savedItems.length} custom chips` : 'Auto fallback preview'}
                            </span>
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-black text-white">All</span>
                            {activeRailConfig.liveItems.slice(0, 12).map(item => (
                              <span key={`${activeRailConfig.key}:${item.type}:${item.value}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-surface-700 ring-1 ring-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:ring-surface-700">
                                {item.label}
                              </span>
                            ))}
                            {activeRailConfig.liveItems.length > 12 && (
                              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-surface-500 ring-1 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700">
                                +{activeRailConfig.liveItems.length - 12} more
                              </span>
                            )}
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => activeRailConfig.setItems(autoExploreItems)} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700">
                              <Check className="h-3.5 w-3.5" /> Fill from current posts
                            </button>
                            <button type="button" onClick={() => activeRailConfig.setItems([])} className="inline-flex items-center gap-2 rounded-lg bg-surface-100 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100">
                              <RotateCcw className="h-3.5 w-3.5" /> Clear custom chips
                            </button>
                          </div>
                          <div className="space-y-3">
                            {activeRailConfig.items.map((item, index) => (
                              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)_140px_minmax(0,1fr)_auto]">
                                <div className="flex sm:flex-col gap-1">
                                  <button type="button" onClick={() => moveRailItem(activeRailConfig.key, index, -1)} disabled={index === 0} className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                                  <button type="button" onClick={() => moveRailItem(activeRailConfig.key, index, 1)} disabled={index === activeRailConfig.items.length - 1} className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                                </div>
                                <input value={item.label} onChange={e => updateRailItem(activeRailConfig.key, index, 'label', e.target.value)} className={adminInputOnCard} placeholder="Visible title, e.g. Anime" />
                                <select value={item.type} onChange={e => updateRailItem(activeRailConfig.key, index, 'type', e.target.value)} className={adminInputOnCard}>
                                  <option value="tag">Tag</option>
                                  <option value="tool">AI Tool</option>
                                  <option value="category">Category</option>
                                </select>
                                <input value={item.value} onChange={e => updateRailItem(activeRailConfig.key, index, 'value', e.target.value)} className={adminInputOnCard} placeholder="Match value, e.g. anime" />
                                <ActionButton variant="danger" onClick={() => removeRailItem(activeRailConfig.key, index)}>Remove</ActionButton>
                              </div>
                            ))}
                            <ActionButton variant="outline" onClick={() => addRailItem(activeRailConfig.key)}>
                              <Plus className="w-4 h-4" /> Add chip
                            </ActionButton>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Bar */}
                  <div className="pt-4 border-t border-surface-200 dark:border-surface-800 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-surface-500">Changes apply to your live configuration.</p>
                    <ActionButton onClick={handleSaveSettings}>
                      <Save className="w-4 h-4" /> Save {discoveryTab === 'explore' ? 'Explore' : discoveryTab === 'tool' ? 'AI Tool' : 'Tag'} page
                    </ActionButton>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Header navigation */}
          {settingsSubTab === 'navigation' && (
            <div className="space-y-6">
              <TabBanner
                icon={<LayoutGrid />}
                title="Header navigation"
                text="Reorder every header item with the arrows — built-in items (Home, Explore, Blog, Submit), header sections, and custom links, all in one list. Rename built-in items by typing a new label (leave blank for the default), hide them with the hide button, and edit section names in the Sections tab."
              />
              <Panel>
                <PanelHeader
                  title="Navigation order"
                  count={headerNavItems.length}
                  subtitle="Built-in items, header sections, and custom links in one list. Custom links are fully editable."
                />
                <div className="space-y-2">
                  {headerNavItems.map((item, index) => (
                    <EditableCard key={item.navKey} isEditing={false} className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center">
                      <div className="flex sm:flex-col gap-1">
                        <button
                          onClick={() => moveHeaderNavItem(item.navKey, -1)}
                          disabled={index === 0}
                          className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveHeaderNavItem(item.navKey, 1)}
                          disabled={index === headerNavItems.length - 1}
                          className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.kind === 'link' ? (
                        <>
                          <input
                            value={item.label}
                            onChange={e => updateHeaderLink(item.linkIndex, 'label', e.target.value)}
                            className={adminInput}
                            placeholder="Label"
                          />
                          <input
                            value={item.href}
                            onChange={e => updateHeaderLink(item.linkIndex, 'href', e.target.value)}
                            className={adminInput}
                            placeholder="/page/custom or https://..."
                          />
                          <button
                            onClick={() => removeHeaderLink(item.linkIndex)}
                            className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      ) : item.kind === 'builtin' ? (
                        (() => {
                          const bk = item.key as HeaderBuiltinKey;
                          const hidden = Boolean(headerBuiltins[bk]?.hidden);
                          return (
                            <>
                              <input
                                value={headerBuiltins[bk]?.label ?? ''}
                                onChange={e => updateHeaderBuiltinLabel(bk, e.target.value)}
                                className={`${adminInput} ${hidden ? 'opacity-50' : ''}`}
                                placeholder={item.label}
                              />
                              <div className="px-1 text-xs text-surface-500 truncate">{item.href}</div>
                              <button
                                onClick={() => toggleHeaderBuiltinHidden(bk)}
                                className={`justify-self-start sm:justify-self-end rounded-xl px-3 py-2 text-xs font-bold transition-colors ${hidden ? 'bg-primary-500 text-white hover:bg-primary-600' : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'}`}
                                title={hidden ? 'Show this item' : 'Hide this item'}
                              >
                                {hidden ? 'Hidden' : 'Hide'}
                              </button>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <div className="flex items-center gap-2 px-1 text-sm font-medium">
                            {item.label}
                          </div>
                          <div className="px-1 text-xs text-surface-500 truncate">{item.href}</div>
                          <span className="justify-self-start sm:justify-self-end px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-[10px] uppercase tracking-wider font-semibold text-surface-500">
                            Section
                          </span>
                        </>
                      )}
                    </EditableCard>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-surface-100 dark:border-surface-800 pt-4">
                  <button
                    onClick={addHeaderLink}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add header link
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save navigation
                  </button>
                </div>
                <p className="text-[11px] text-surface-500">
                  Note: Profile / Sign In and the theme toggle stay pinned to the right of the header and are not part of this order.
                </p>
              </Panel>

              <Panel>
                <PanelHeader
                  title="Header dropdown menus"
                  subtitle="Create one or more dropdown menus for the desktop header — each opens on hover or click with its own label. An item can live in only one menu; ticking it here moves it. The mobile sidebar shows each menu as a collapsible group."
                />
                <div className="space-y-4">
                  {effectiveNavMenus.map(menu => {
                    const isAuto = menu.id === AUTO_MENU_ID;
                    return (
                      <div key={menu.id} className="rounded-2xl border border-surface-200 p-4 space-y-3 dark:border-surface-800">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            value={menu.label}
                            onChange={e => updateNavMenuLabel(menu.id, e.target.value)}
                            className={`${adminInput} w-48`}
                            placeholder="Menu label (e.g. Tools)"
                            disabled={isAuto}
                          />
                          {isAuto ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                              automatic — tick any item below to customize
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeNavMenu(menu.id)}
                              className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Delete menu
                            </button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {headerNavItems.map(item => {
                            const ownerId = navMenuOwner(item.navKey);
                            const inThis = ownerId === menu.id;
                            const otherMenu = !inThis && ownerId ? effectiveNavMenus.find(m => m.id === ownerId) : null;
                            return (
                              <label
                                key={item.navKey}
                                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-surface-200 px-3 py-2 text-sm hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800/60"
                              >
                                <input
                                  type="checkbox"
                                  checked={inThis}
                                  onChange={() => toggleNavMenuItem(menu.id, item.navKey)}
                                  className="h-4 w-4 shrink-0 accent-primary-500"
                                />
                                <span className="font-medium">{item.label}</span>
                                <span className="truncate text-xs text-surface-400">{item.href}</span>
                                {otherMenu && (
                                  <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                                    in &ldquo;{otherMenu.label || 'Menu'}&rdquo;
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={addNavMenu}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-surface-600 hover:bg-surface-200 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add dropdown menu
                      </button>
                      <button
                        type="button"
                        onClick={resetNavMenus}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                      >
                        Reset to automatic
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" /> Save menus
                    </button>
                  </div>
                  <p className="text-[11px] text-surface-500">
                    With zero configuration, one &ldquo;Tools&rdquo; menu contains every header section and updates itself as sections are added. The first change you make here switches to a saved, explicit setup.
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {settingsSubTab === 'homepage' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,780px)_minmax(360px,1fr)] xl:items-start">
              <div className="min-w-0 space-y-6">
              <Panel>
                <PanelHeader
                  title="Homepage Hero Configuration"
                  subtitle="Customize the presentation of your primary homepage section, slider interactions, and library introductions."
                />

                {/* Switch list */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Library Hero Intro', checked: features.showHomepageLibraryHero ?? true, onChange: (val: boolean) => setFeatures(prev => ({ ...prev, showHomepageLibraryHero: val })), desc: 'Intro block above content' },
                    { label: 'Hero Slideshow', checked: heroEnabled, onChange: (val: boolean) => setHeroEnabled(val), desc: 'Interactive featured slides' },
                    { label: 'Show Stat Cards', checked: !heroHideStats, onChange: (val: boolean) => setHeroHideStats(!val), desc: 'Show 4+ prompts etc' },
                    { label: 'Slideshow Auto-Play', checked: heroAutoPlay, onChange: (val: boolean) => setHeroAutoPlay(val), desc: 'Automatically cycle slides' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => item.onChange(!item.checked)}
                      className={`flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition ${
                        item.checked
                          ? 'border-primary-500 bg-primary-50/40 dark:border-primary-500/60 dark:bg-primary-950/10'
                          : 'border-surface-200 bg-surface-50/50 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40 hover:dark:bg-surface-800/40'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">{item.label}</span>
                        <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.checked ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'}`}>
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.checked ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-normal">{item.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Landing-hero copy. Every field is optional — blank falls
                    back to the built-in default, so clearing one restores the
                    shipped wording rather than emptying the hero. */}
                <div>
                  <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-surface-400">Landing Hero Copy</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      { key: 'title', label: 'Hero title', placeholder: 'Better Image Prompts Start Here', hint: 'The accent pattern below gradients the first matching phrase.', span: true },
                      { key: 'subtitle', label: 'Hero subtitle', placeholder: 'Discover tested prompts for ChatGPT, Gemini, Grok, Qwen, and other image tools.', hint: 'One or two lines under the headline.', span: true },
                      { key: 'kickerPrefix', label: 'Kicker prefix', placeholder: 'Curated prompts for', hint: 'The tool names are appended automatically.' },
                      { key: 'accentPattern', label: 'Accent phrase pattern', placeholder: '(ai\\s+prompts?|image\\s+prompts?)', hint: 'Case-insensitive regex; the first match in the title gets the serif gradient.' },
                      { key: 'searchPlaceholder', label: 'Search placeholder', placeholder: 'Search prompts by style, tool or subject...' },
                      { key: 'searchButtonLabel', label: 'Search button', placeholder: 'Search' },
                      { key: 'popularLabel', label: 'Popular-tags label', placeholder: 'Popular:' },
                      { key: 'toolsRowLabel', label: 'Tools row label', placeholder: 'Browse Prompts by AI Tools:' },
                      { key: 'primaryCtaLabel', label: 'Primary CTA label', placeholder: 'Browse All Prompts' },
                      { key: 'primaryCtaHref', label: 'Primary CTA link', placeholder: '/explore' },
                      { key: 'secondaryCtaLabel', label: 'Secondary CTA label', placeholder: 'How It Works' },
                      { key: 'secondaryCtaHref', label: 'Secondary CTA link', placeholder: '#how-it-works' },
                    ] as const).map(field => (
                      <div key={field.key} className={'span' in field && field.span ? 'sm:col-span-2' : undefined}>
                        <label className={adminLabel}>{field.label}</label>
                        <input
                          type="text"
                          value={heroContent[field.key] || ''}
                          onChange={e => setHeroContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={adminInput}
                        />
                        {'hint' in field && field.hint && (
                          <p className="mt-1 text-[11px] text-surface-500">{field.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      { key: 'popularTags', label: 'Popular tags', placeholder: 'Portraits, Cinematic, Anime, Wallpaper, Architecture, Logos', hint: 'Comma separated. Each links to /tag/<lowercased>.' },
                      { key: 'trustBadges', label: 'Trust badges', placeholder: '100% Free to Copy, Tested & Verified Outputs, Exact Model Parameters Included', hint: 'Comma separated. Each gets a green check.' },
                    ] as const).map(field => (
                      <div key={field.key}>
                        <label className={adminLabel}>{field.label}</label>
                        <input
                          type="text"
                          value={(heroContent[field.key] || []).join(', ')}
                          onChange={e => setHeroContent(prev => ({
                            ...prev,
                            [field.key]: e.target.value.split(',').map(v => v.trim()).filter(Boolean),
                          }))}
                          placeholder={field.placeholder}
                          className={adminInput}
                        />
                        <p className="mt-1 text-[11px] text-surface-500">{field.hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className={adminLabel}>Stat tile captions</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {([
                        { key: 'prompts', placeholder: 'Prompts' },
                        { key: 'featured', placeholder: 'Featured' },
                        { key: 'likes', placeholder: 'Likes' },
                        { key: 'saves', placeholder: 'Saves' },
                      ] as const).map(field => (
                        <input
                          key={field.key}
                          type="text"
                          value={heroContent.statLabels?.[field.key] || ''}
                          onChange={e => setHeroContent(prev => ({
                            ...prev,
                            statLabels: { ...prev.statLabels, [field.key]: e.target.value },
                          }))}
                          placeholder={field.placeholder}
                          className={adminInput}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-surface-500">
                      The numbers are live counts — only the captions are editable. Hide the whole
                      row with the &ldquo;Show Stat Cards&rdquo; toggle above.
                    </p>
                  </div>
                </div>
              </Panel>
              <Panel>
                <PanelHeader
                  title="Prompt of the Day Selector"
                  subtitle="Pick the exact featured post to display as today's prominent homepage block."
                  actions={
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${pinnedPromptOfDayId ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'}`}>
                      {pinnedPromptOfDayId ? '★ Manually Pinned' : '⚙ Auto Fallback Mode'}
                    </span>
                  }
                />

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <SectionEyebrow>Current Live Choice</SectionEyebrow>
                      <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50/50 p-4 dark:border-surface-800 dark:bg-surface-900/50">
                        {currentPromptOfDay && currentPromptOfDayImage && (
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-200 dark:bg-surface-800 mb-4">
                            <Image
                              src={currentPromptOfDayImage}
                              alt={currentPromptOfDay.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 300px"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-surface-950 dark:text-white line-clamp-1">
                          {currentPromptOfDay?.title || 'No public post available'}
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-surface-500">
                          {currentPromptOfDay ? (pinnedPromptOfDayId ? 'Selected manually from search list.' : currentPromptOfDay.featured ? 'Using first featured post.' : 'Using latest public post.') : 'Create or publish a post first.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <SectionEyebrow>Section Copy & Settings</SectionEyebrow>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Section Badge">
                          <input value={promptOfDayContent.badge || ''} onChange={e => updateHomepageContent('promptOfDay', 'badge', e.target.value)} className={adminInput} placeholder="e.g. Prompt of the Day" />
                        </Field>
                        <Field label="Button Label">
                          <input value={promptOfDayContent.ctaLabel || ''} onChange={e => updateHomepageContent('promptOfDay', 'ctaLabel', e.target.value)} className={adminInput} placeholder="e.g. View This Prompt" />
                        </Field>
                        <Field label="Main Heading Override" className="sm:col-span-2" action={
                          <WandButton
                            fieldId="homepage-promptOfDay-title"
                            value={promptOfDayContent.title || ''}
                            onChange={(v) => updateHomepageContent('promptOfDay', 'title', v)}
                            prompt={() => homepagePrompts.blockHeading('promptOfDay')}
                          />
                        }>
                          <input value={promptOfDayContent.title || ''} onChange={e => updateHomepageContent('promptOfDay', 'title', e.target.value)} className={adminInput} placeholder="e.g. Today's Featured Prompt" />
                        </Field>
                        <Field label="Short Sub-heading Override" className="sm:col-span-2" action={
                          <WandButton
                            fieldId="homepage-promptOfDay-desc"
                            value={promptOfDayContent.description || ''}
                            onChange={(v) => updateHomepageContent('promptOfDay', 'description', v)}
                            prompt={() => homepagePrompts.blockDescription('promptOfDay')}
                          />
                        }>
                          <textarea value={promptOfDayContent.description || ''} onChange={e => updateHomepageContent('promptOfDay', 'description', e.target.value)} rows={2} className={adminInput} placeholder="e.g. Handpicked from our community artwork" />
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-600 transition"
                      >
                        <Save className="h-4 w-4" /> Save Copy Changes
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <SectionEyebrow>Search & Pin Post</SectionEyebrow>
                      <button
                        type="button"
                        onClick={() => updateHomepageContent('promptOfDay', 'pinnedPostId', '')}
                        className="rounded-lg bg-surface-100 px-3 py-1.5 text-[11px] font-bold text-surface-600 hover:bg-surface-200 transition dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                      >
                        Clear Pin (Auto Mode)
                      </button>
                    </div>
                    
                    <div className="relative mb-4">
                      <input
                        value={promptOfDayPickerSearch}
                        onChange={e => setPromptOfDayPickerSearch(e.target.value)}
                        className={`${adminInput} pl-9`}
                        placeholder="Filter by title, tags, or tools..."
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
                    </div>
                    
                    <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {promptOfDayPickerPosts.map(post => {
                        const imageUrl = post.thumbnailUrl || post.images?.[0]?.url || '';
                        const selected = pinnedPromptOfDayId === post.id || pinnedPromptOfDayId === post.slug;
                        return (
                          <button
                            key={post.id}
                            type="button"
                            onClick={() => updateHomepageContent('promptOfDay', 'pinnedPostId', post.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                              selected
                                ? 'border-primary-500 bg-primary-50/50 dark:border-primary-500/40 dark:bg-primary-900/20'
                                : 'border-surface-200 bg-white hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900'
                            }`}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                              {imageUrl ? (
                                <Image src={imageUrl} alt="" fill className="object-cover" sizes="48px" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] font-bold text-surface-400">No img</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-bold ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-white'}`}>{post.title}</p>
                              <p className="mt-0.5 truncate text-[10px] text-surface-500 font-medium">
                                {post.featured ? '⭐ Featured • ' : ''}{getAllTools(post).join(', ') || post.category || 'Published'}
                              </p>
                            </div>
                            <div className="shrink-0 pl-2">
                              {selected ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              ) : (
                                <span className="rounded-full bg-surface-100 px-3 py-1 text-[10px] font-bold text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                                  Pin
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {promptOfDayPickerPosts.length === 0 && (
                        <div className="rounded-xl border border-dashed border-surface-200 bg-surface-50 py-8 text-center dark:border-surface-800 dark:bg-surface-900/50">
                          <p className="text-sm font-medium text-surface-500">No published posts match your search.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="Homepage Sections Order"
                  subtitle="Reorder the added homepage blocks. This order is used on the live homepage after the hero and quick cards."
                />
                
                <div className="flex items-center justify-between mb-4">
                  <SectionEyebrow>Active Blocks</SectionEyebrow>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('sections');
                      setNewSectionLocation('homepage');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-500/10 px-3 py-2 text-[11px] font-bold text-primary-600 hover:bg-primary-500/20 transition dark:text-primary-400 dark:bg-primary-900/30 dark:hover:bg-primary-900/50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New Section
                  </button>
                </div>
                
                <div className="space-y-3">
                  {orderedHomepageItems.map((token, index) => {
                    const isSection = token.startsWith('section:');
                    const section = isSection ? homepagePostSections.find(item => item.id === token.replace('section:', '')) : undefined;
                    const blockKey = isSection ? '' : token.replace('block:', '');
                    const option = isSection ? undefined : homepageBlockOptions.find(item => item.key === blockKey);
                    if (!section && !option) return null;
                    const enabled = section ? section.visible : Boolean((features as any)[option!.featureKey] ?? true);
                    const title = section?.name || option!.title;
                    const detail = section
                      ? `${section.type} section - ${getSectionPath(section)} - Limit: ${section.limit}`
                      : getHomepageBlockDetail(blockKey);
                    const blockContent = homepageContent[blockKey] || {};
                    const blockHint = !section ? homepageBlockStaticHints[blockKey] : '';
                    const blockIcon = isSection ? (
                      <Layers className="w-4 h-4 text-sky-500" />
                    ) : (
                      blockKey === 'howTo' ? <Wand2 className="w-4 h-4 text-sky-500" /> :
                      blockKey === 'reviewProcess' ? <Check className="w-4 h-4 text-emerald-500" /> :
                      blockKey === 'promptOfDay' ? <Star className="w-4 h-4 text-amber-500" /> :
                      blockKey === 'supportedTools' ? <Zap className="w-4 h-4 text-violet-500" /> :
                      blockKey === 'creativeDirections' ? <Compass className="w-4 h-4 text-rose-500" /> :
                      blockKey === 'creatorFeedback' ? <Users className="w-4 h-4 text-pink-500" /> :
                      blockKey === 'guides' ? <BookOpen className="w-4 h-4 text-indigo-500" /> :
                      blockKey === 'blog' ? <Newspaper className="w-4 h-4 text-cyan-500" /> :
                      <Layers className="w-4 h-4 text-primary-500" />
                    );
                    return (
                      <div key={token} className={`group rounded-xl border border-surface-200 bg-surface-50/50 p-4 transition hover: dark:border-surface-800 dark:bg-surface-900/50 hover:dark:bg-surface-800/80 ${section && !section.visible ? 'opacity-60' : ''}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-black text-surface-400 dark:bg-surface-800 dark:text-surface-500 border border-surface-200/60 dark:border-surface-700/60">{index + 1}</span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="p-1 rounded bg-white dark:bg-surface-800 border border-surface-200/50 dark:border-surface-700/50">{blockIcon}</span>
                                <h4 className="text-sm font-bold text-surface-950 dark:text-white leading-none">{title}</h4>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${isSection ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                                  {isSection ? 'Section' : 'Block'}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold transition ${enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-surface-400 dark:bg-surface-600'}`} />
                                  {enabled ? 'Active' : 'Hidden'}
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-surface-500 dark:text-surface-400 leading-normal">{detail}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => moveHomepageItem(index, 'up')}
                              disabled={index === 0}
                              className="rounded-lg border border-surface-200 bg-white p-2 text-surface-500 hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-surface-800"
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveHomepageItem(index, 'down')}
                              disabled={index === orderedHomepageItems.length - 1}
                              className="rounded-lg border border-surface-200 bg-white p-2 text-surface-500 hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-surface-800"
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            {section && (
                              <button
                                onClick={() => editingSectionId === section.id ? setEditingSectionId(null) : startEditSection(section)}
                                className="rounded-lg border border-surface-200 bg-white p-2 text-primary-500 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-surface-800"
                                title="Edit section"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                            {!section && option && (
                              <button
                                onClick={() => {
                                  setEditingSectionId(null);
                                  setExpandedHomepageBlock(expandedHomepageBlock === blockKey ? null : blockKey);
                                }}
                                className={`rounded-lg border border-surface-200 bg-white p-2 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-900 dark:hover:bg-surface-800 ${expandedHomepageBlock === blockKey ? 'text-primary-500' : 'text-surface-500'}`}
                                title={expandedHomepageBlock === blockKey ? 'Collapse block controls' : 'Edit block content'}
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                            <label className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold cursor-pointer border transition ${
                              enabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                : 'bg-surface-50 text-surface-600 border-surface-200/50 dark:bg-surface-950/20 dark:text-surface-300 dark:border-surface-800'
                            }`}>
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => {
                                  if (section) updateSection({ ...section, visible: e.target.checked });
                                  else setFeatures(prev => ({ ...prev, [option!.featureKey]: e.target.checked }));
                                }}
                                className="h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                              />
                              Visible
                            </label>
                          </div>
                        </div>
                        {section && editingSectionId === section.id && (
                          <div className="mt-4 border-t border-surface-200 dark:border-surface-800 pt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <Field label="Section name">
                                <input value={editSectionName} onChange={e => setEditSectionName(e.target.value)} className={adminInput} placeholder="Section title" />
                              </Field>
                              <Field label="Slug">
                                <input value={editSectionSlug} onChange={e => setEditSectionSlug(slugify(e.target.value))} className={adminInput} placeholder="Slug" />
                              </Field>
                              <Field label="Post limit">
                                <input type="number" min={1} max={50} value={editSectionLimit} onChange={e => setEditSectionLimit(parseInt(e.target.value) || 8)} className={adminInput} placeholder="Post limit" />
                              </Field>
                              <div className="grid grid-cols-1 gap-3 sm:col-span-2 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                                <Field label="Card style override">
                                  <select value={editSectionCardStyle} onChange={e => setEditSectionCardStyle(e.target.value as Section['cardStyle'] | '')} className={adminInput}>
                                    <option value="">Use global card style</option>
                                    <option value="v2">v2 Glass Frame (default)</option>
                                    <option value="v1">v1 Flat Hover Overlay</option>
                                    
                                    
                                    
                                    
                                    
                                    
                                  </select>
                                  <p className="mt-1 text-[11px] text-surface-500">
                                    {editSectionCardStyle ? 'This section will ignore the global card style.' : `Using global card style: ${cardStyleName(cardStyle)}`}
                                  </p>
                                </Field>
                                <CardStylePreview style={editSectionCardStyle || cardStyle} badgeStyle={badgeStyle} label={editSectionCardStyle ? 'Section override preview' : 'Global style preview'} />
                              </div>
                              <Field label="Filter rail tags" className="sm:col-span-2">
                                <input value={editSectionFilterTags} onChange={e => setEditSectionFilterTags(e.target.value)} className={adminInput} placeholder="anime, realistic" />
                              </Field>
                              <Field label="Hero title" className="sm:col-span-2">
                                <input value={editSectionHeroTitle} onChange={e => setEditSectionHeroTitle(e.target.value)} className={adminInput} placeholder="Blank = section name" />
                              </Field>
                              <Field label="Hero badge" className="sm:col-span-2">
                                <input value={editSectionHeroBadge} onChange={e => setEditSectionHeroBadge(e.target.value)} className={adminInput} placeholder="Blank = Section" />
                              </Field>
                              <FieldTextarea
                                className="sm:col-span-2"
                                label="Hero description"
                                value={editSectionHeroDescription}
                                onChange={setEditSectionHeroDescription}
                                rows={2}
                                placeholder="Hero description"
                                recommended={160}
                                action={(
                                  <WandButton
                                    fieldId="section-hero-desc"
                                    value={editSectionHeroDescription}
                                    onChange={setEditSectionHeroDescription}
                                    prompt={() => homepagePrompts.sectionHeroDescription(editSectionHeroTitle || editSectionName, editSectionFilterTags)}
                                    label="Auto-write hero description"
                                  />
                                )}
                              />
                              <FieldTextarea
                                className="sm:col-span-2"
                                label="SEO title"
                                value={editSectionSeoTitle}
                                onChange={setEditSectionSeoTitle}
                                rows={2}
                                placeholder="SEO title (blank = hero title)"
                                recommended={60}
                                action={(
                                  <WandButton
                                    fieldId="section-seo-title"
                                    value={editSectionSeoTitle}
                                    onChange={setEditSectionSeoTitle}
                                    prompt={() => homepagePrompts.sectionSeoTitle(editSectionHeroTitle || editSectionName)}
                                    label="Auto-write SEO title"
                                  />
                                )}
                              />
                              <FieldTextarea
                                className="sm:col-span-2"
                                label="SEO description"
                                value={editSectionSeoDescription}
                                onChange={setEditSectionSeoDescription}
                                rows={2}
                                placeholder="SEO description"
                                recommended={160}
                                action={(
                                  <WandButton
                                    fieldId="section-seo-desc"
                                    value={editSectionSeoDescription}
                                    onChange={setEditSectionSeoDescription}
                                    prompt={() => homepagePrompts.sectionSeoDescription(editSectionHeroTitle || editSectionName, editSectionFilterTags)}
                                    label="Auto-write SEO description"
                                  />
                                )}
                              />
                              <FieldTextarea
                                className="sm:col-span-2"
                                label="Intro content (Markdown supported)"
                                value={editSectionIntroContent}
                                onChange={setEditSectionIntroContent}
                                rows={3}
                                placeholder="Intro content"
                                action={(
                                  <WandButton
                                    fieldId="section-intro-content"
                                    value={editSectionIntroContent}
                                    onChange={setEditSectionIntroContent}
                                    prompt={() => homepagePrompts.sectionIntroContent(editSectionHeroTitle || editSectionName, editSectionFilterTags)}
                                    label="Auto-write intro"
                                  />
                                )}
                              />
                            </div>
                            {section.type === 'custom' && (
                              <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-surface-500">Add posts by title</p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <input
                                    value={sectionPostSearch}
                                    onChange={e => setSectionPostSearch(e.target.value)}
                                    className={`${adminInput} sm:flex-1`}
                                    placeholder="Search published posts..."
                                  />
                                  <select
                                    value=""
                                    onChange={e => addPostToCustomSection(section, e.target.value)}
                                    className={`${adminInput} sm:w-80`}
                                  >
                                    <option value="">Choose a post to add...</option>
                                    {publicPosts
                                      .filter(post => !(section.postIds || []).includes(post.id))
                                      .filter(post => !sectionPostSearch || post.title.toLowerCase().includes(sectionPostSearch.toLowerCase()))
                                      .slice(0, 20)
                                      .map(post => <option key={post.id} value={post.id}>{post.title}</option>)}
                                  </select>
                                </div>
                                <p className="mt-2 text-[11px] text-surface-500">{section.postIds?.length || 0} posts selected. Use the section picker in the Sections tab for detailed ordering.</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <ActionButton variant="primary" onClick={() => saveEditSection(section)}><Check className="h-4 w-4" /> Save section</ActionButton>
                              <ActionButton variant="ghost" onClick={() => setEditingSectionId(null)}><X className="h-4 w-4" /> Cancel</ActionButton>
                            </div>
                          </div>
                        )}
                        {!section && option && expandedHomepageBlock === blockKey && (
                          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-bold text-surface-600 dark:text-surface-200">Edit {option.title}</p>
                              <button
                                type="button"
                                onClick={() => resetHomepageContentBlock(blockKey)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-[11px] font-bold text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
                              </button>
                            </div>
                            {blockHint && (
                              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                {blockHint}
                              </p>
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <input value={blockContent.badge || ''} onChange={e => updateHomepageContent(blockKey, 'badge', e.target.value)} className={adminInput} placeholder="Badge / eyebrow" />
                                {(blockKey === 'reviewProcess' || blockKey === 'promptOfDay' || blockKey === 'guides' || blockKey === 'blog') && <input value={blockContent.ctaLabel || ''} onChange={e => updateHomepageContent(blockKey, 'ctaLabel', e.target.value)} className={adminInput} placeholder="Button label" />}
                                {blockKey === 'reviewProcess' && (
                                  <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-bold text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200">
                                    <span>Show submit button</span>
                                    <Toggle
                                      checked={blockContent.showCta !== false}
                                      onChange={(v) => updateHomepageContent(blockKey, 'showCta', v)}
                                    />
                                  </div>
                                )}
                                {(blockKey === 'supportedTools' || blockKey === 'creativeDirections') && (
                                  <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-bold text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 sm:col-span-2">
                                    <span>Hide prompt counts on cards</span>
                                    <Toggle
                                      checked={blockContent.hidePromptCounts || false}
                                      onChange={(v) => updateHomepageContent(blockKey, 'hidePromptCounts', v)}
                                    />
                                  </div>
                                )}
                                {blockKey === 'promptOfDay' && (
                                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50 sm:col-span-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white dark:bg-surface-900">
                                    {currentPromptOfDay && currentPromptOfDayImage ? (
                                      <Image
                                        src={currentPromptOfDayImage}
                                        alt={currentPromptOfDay.title}
                                        fill
                                        className="object-cover"
                                        sizes="120px"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-[11px] font-bold text-surface-400">No image</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Custom post picker</p>
                                      <button
                                        type="button"
                                        onClick={() => updateHomepageContent(blockKey, 'pinnedPostId', '')}
                                        className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
                                      >
                                        Auto fallback
                                      </button>
                                    </div>
                                    <input
                                      value={promptOfDayPickerSearch}
                                      onChange={e => setPromptOfDayPickerSearch(e.target.value)}
                                      className="mb-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                                      placeholder="Search published posts..."
                                    />
                                    <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                                      {promptOfDayPickerPosts.slice(0, 10).map(post => {
                                        const selected = blockContent.pinnedPostId === post.id || blockContent.pinnedPostId === post.slug;
                                        return (
                                          <button
                                            key={post.id}
                                            type="button"
                                            onClick={() => updateHomepageContent(blockKey, 'pinnedPostId', post.id)}
                                            className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
                                              selected
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-white text-surface-700 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800'
                                            }`}
                                          >
                                            <span className="truncate">{post.featured ? 'Featured - ' : ''}{post.title}</span>
                                            <span className="shrink-0 text-[10px] font-black">{selected ? 'Selected' : 'Pick'}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="mt-2 text-[11px] text-surface-500">{currentPromptOfDay ? `Current: ${currentPromptOfDay.title}` : 'Publish a post first.'}</p>
                                  </div>
                                </div>
                                )}
                                {blockKey === 'guides' && (
                                  <div className="space-y-3 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50 sm:col-span-2">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Homepage guide picker</p>
                                        <p className="mt-1 text-[11px] text-surface-500">Optional override. Leave empty to use Featured guides first, then latest guides.</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => updateHomepageContent('guides', 'selectedGuideSlugs', [])}
                                        className="self-start rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800 sm:self-auto"
                                      >
                                        Auto mode
                                      </button>
                                    </div>
                                    <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                      {guideArticles.map(guide => {
                                        const selectedSlugs = blockContent.selectedGuideSlugs || [];
                                        const selectedIndex = selectedSlugs.indexOf(guide.slug);
                                        const selected = selectedIndex >= 0;
                                        return (
                                          <div
                                            key={guide.slug}
                                            className={`rounded-lg border p-2 transition ${
                                              selected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                                : 'border-surface-200 bg-white hover:border-primary-300 dark:border-surface-700 dark:bg-surface-900'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => toggleHomepageGuide(guide.slug)}
                                              className="flex w-full items-start justify-between gap-3 text-left"
                                            >
                                              <span className="min-w-0">
                                                <span className="line-clamp-2 text-xs font-black text-surface-950 dark:text-white">{guide.title}</span>
                                                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-surface-400">{guide.readMinutes} min read</span>
                                              </span>
                                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${selected ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>
                                                {selected ? `#${selectedIndex + 1}` : 'Pick'}
                                              </span>
                                            </button>
                                            {selected && (
                                              <div className="mt-2 flex gap-1">
                                                <button type="button" onClick={() => moveHomepageGuide(guide.slug, -1)} className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 disabled:opacity-40 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800" disabled={selectedIndex === 0}>
                                                  Up
                                                </button>
                                                <button type="button" onClick={() => moveHomepageGuide(guide.slug, 1)} className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 disabled:opacity-40 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800" disabled={selectedIndex === selectedSlugs.length - 1}>
                                                  Down
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {guideArticles.length === 0 && (
                                      <p className="rounded-lg bg-white px-3 py-2 text-[11px] text-surface-500 dark:bg-surface-900">Create guides in the Articles tab first.</p>
                                    )}
                                  </div>
                                )}
                                {blockKey === 'blog' && (
                                  <div className="space-y-3 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50 sm:col-span-2">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Homepage blog picker</p>
                                        <p className="mt-1 text-[11px] text-surface-500">Optional override. Leave empty to show the latest blog posts.</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => updateHomepageContent('blog', 'selectedBlogSlugs', [])}
                                        className="self-start rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800 sm:self-auto"
                                      >
                                        Auto mode
                                      </button>
                                    </div>
                                    <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                      {blogArticles.map(article => {
                                        const selectedSlugs = blockContent.selectedBlogSlugs || [];
                                        const selectedIndex = selectedSlugs.indexOf(article.slug);
                                        const selected = selectedIndex >= 0;
                                        return (
                                          <div
                                            key={article.slug}
                                            className={`rounded-lg border p-2 transition ${
                                              selected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                                : 'border-surface-200 bg-white hover:border-primary-300 dark:border-surface-700 dark:bg-surface-900'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => toggleHomepageBlogPost(article.slug)}
                                              className="flex w-full items-start justify-between gap-3 text-left"
                                            >
                                              <span className="min-w-0">
                                                <span className="line-clamp-2 text-xs font-black text-surface-950 dark:text-white">{article.title}</span>
                                                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-surface-400">{article.readMinutes} min read</span>
                                              </span>
                                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${selected ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>
                                                {selected ? `#${selectedIndex + 1}` : 'Pick'}
                                              </span>
                                            </button>
                                            {selected && (
                                              <div className="mt-2 flex gap-1">
                                                <button type="button" onClick={() => moveHomepageBlogPost(article.slug, -1)} className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 disabled:opacity-40 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800" disabled={selectedIndex === 0}>
                                                  Up
                                                </button>
                                                <button type="button" onClick={() => moveHomepageBlogPost(article.slug, 1)} className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-surface-600 hover:bg-surface-100 disabled:opacity-40 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800" disabled={selectedIndex === selectedSlugs.length - 1}>
                                                  Down
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {blogArticles.length === 0 && (
                                      <p className="rounded-lg bg-white px-3 py-2 text-[11px] text-surface-500 dark:bg-surface-900">Create blog posts in the Articles tab first.</p>
                                    )}
                                  </div>
                                )}
                                <Field
                                  className="sm:col-span-2"
                                  label="Heading"
                                  action={(
                                    <WandButton
                                      fieldId={`homepage-${blockKey}-title`}
                                      value={blockContent.title || ''}
                                      onChange={(v) => updateHomepageContent(blockKey, 'title', v)}
                                      prompt={() => homepagePrompts.blockHeading(blockKey)}
                                      label="Auto-write heading"
                                    />
                                  )}
                                >
                                  <input value={blockContent.title || ''} onChange={e => updateHomepageContent(blockKey, 'title', e.target.value)} className={adminInput} placeholder="Heading" />
                                  <CharCount value={blockContent.title || ''} recommended={60} />
                                </Field>
                                <FieldTextarea
                                  className="sm:col-span-2"
                                  label="Description"
                                  value={blockContent.description || ''}
                                  onChange={(value) => updateHomepageContent(blockKey, 'description', value)}
                                  rows={2}
                                  placeholder="Description"
                                  recommended={160}
                                  action={(
                                    <WandButton
                                      fieldId={`homepage-${blockKey}-desc`}
                                      value={blockContent.description || ''}
                                      onChange={(v) => updateHomepageContent(blockKey, 'description', v)}
                                      prompt={() => homepagePrompts.blockDescription(blockKey)}
                                      label="Auto-write description"
                                    />
                                  )}
                                />
                                {['howTo', 'reviewProcess', 'supportedTools', 'creatorFeedback'].includes(blockKey) && (
                                  <div className="space-y-3 sm:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Inner cards</p>
                                    <div className="flex items-center gap-2">
                                      {aiUndoStack[`homepage-cards-${blockKey}`] !== undefined && (
                                        <button
                                          type="button"
                                          onClick={() => wandUndo(`homepage-cards-${blockKey}`)}
                                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700"
                                        >
                                          <RotateCcw className="h-3 w-3" /> Undo
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        disabled={activeAiLoaders[`homepage-cards-${blockKey}`]}
                                        onClick={() => {
                                          const count = blockContent.items?.length || (blockKey === 'supportedTools' ? 4 : 3);
                                          const cardShape = blockKey === 'howTo'
                                            ? '{"title": string, "text": string, "checks": string[] (2-3 short checklist lines)}'
                                            : blockKey === 'supportedTools'
                                              ? '{"title": string (AI tool name), "text": string (comma-separated short note lines)}'
                                              : '{"title": string, "text": string}';
                                          runJsonWand(
                                            `homepage-cards-${blockKey}`,
                                            JSON.stringify(blockContent.items || []),
                                            (items) => { if (Array.isArray(items)) updateHomepageContent(blockKey, 'items', items); },
                                            (json) => updateHomepageContent(blockKey, 'items', JSON.parse(json)),
                                            homepagePrompts.blockCards(blockKey, cardShape, count),
                                          );
                                        }}
                                        className="inline-flex items-center gap-1 rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600 hover:bg-primary-100 disabled:opacity-60 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20"
                                      >
                                        {activeAiLoaders[`homepage-cards-${blockKey}`] ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /> : <Wand2 className="h-3 w-3" />}
                                        Auto-fill cards
                                      </button>
                                    </div>
                                  </div>
                                  {(blockContent.items || []).map((item, itemIndex) => (
                                    <div key={`${blockKey}-${itemIndex}`} className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <input
                                          value={item.title || ''}
                                          onChange={e => updateHomepageItem(blockKey, itemIndex, 'title', e.target.value)}
                                          className={adminInput}
                                          placeholder={blockKey === 'supportedTools' ? 'Tool name, e.g. ChatGPT' : 'Card title'}
                                        />
                                        <textarea
                                          value={item.text || ''}
                                          onChange={e => updateHomepageItem(blockKey, itemIndex, 'text', e.target.value)}
                                          rows={2}
                                          className={`${adminInput} resize-y`}
                                          placeholder={blockKey === 'supportedTools' ? 'Comma-separated note lines' : 'Card text'}
                                        />
                                        {blockKey === 'howTo' && (
                                          <textarea
                                            value={(item.checks || []).join('\n')}
                                            onChange={e => updateHomepageItem(blockKey, itemIndex, 'checks', e.target.value)}
                                            rows={3}
                                            className={`${adminInput} resize-y sm:col-span-2`}
                                            placeholder="One checklist item per line"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {(!blockContent.items || blockContent.items.length === 0) && (
                                    <p className="rounded-lg bg-surface-100 px-3 py-2 text-[11px] text-surface-500 dark:bg-surface-800">
                                      Reset defaults will repopulate this block after save/reload.
                                    </p>
                                  )}
                                </div>
                                )}
                                {blockKey === 'creativeDirections' && <input value={blockContent.itemDescription || ''} onChange={e => updateHomepageContent(blockKey, 'itemDescription', e.target.value)} className={`${adminInput} sm:col-span-2`} placeholder="Card description line" />}
                                {(blockKey === 'reviewProcess' || blockKey === 'guides' || blockKey === 'blog') && <input value={blockContent.ctaHref || ''} onChange={e => updateHomepageContent(blockKey, 'ctaHref', e.target.value)} className={`${adminInput} sm:col-span-2`} placeholder="Button URL" />}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {homepagePostSections.length === 0 && (
                    <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                      <p className="text-sm font-bold text-surface-950 dark:text-white">No regular homepage post sections</p>
                      <p className="mt-1 text-[11px] leading-5 text-surface-500">Create one in the Sections tab to place it in this homepage order.</p>
                    </div>
                  )}
                </div>
              </Panel>

              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-primary-500" /> Browse by Style Cards
                </h3>
                <p className="text-xs text-surface-500 mb-4">
                  Control the homepage Creative Directions cards. Leave empty to auto-generate from your most used tags and categories.
                </p>
                <div className="mb-4 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-surface-500">Current homepage cards</p>
                    <span className="text-[11px] font-semibold text-surface-500">
                      {savedCreativeItems.length > 0 ? 'Using saved custom cards' : 'Using auto cards from posts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {liveCreativeItems.slice(0, 8).map(item => {
                      const count = countRailMatches(posts, item);
                      return (
                        <div key={`${item.type}:${item.value}`} className="rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900">
                          <p className="text-sm font-bold text-surface-950 dark:text-white">{item.label}</p>
                          <p className="mt-1 text-[11px] text-surface-500">{item.type} - {item.value}</p>
                          <p className="mt-2 text-xs font-bold text-primary-600 dark:text-primary-300">{count} {count === 1 ? 'prompt' : 'prompts'}</p>
                        </div>
                      );
                    })}
                    {liveCreativeItems.length === 0 && (
                      <div className="rounded-lg border border-dashed border-surface-300 p-3 text-xs text-surface-500 dark:border-surface-700">
                        No post tags or categories found yet.
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setCreativeDirectionItems(autoCreativeItems)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Use current auto cards
                    </button>
                    {savedCreativeItems.length > 0 && (
                      <button
                        onClick={() => setCreativeDirectionItems([])}
                        className="inline-flex items-center gap-2 rounded-lg bg-surface-200 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-100 dark:hover:bg-surface-600"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset to auto
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {creativeDirectionItems.length === 0 && (
                    <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 p-4 text-xs text-surface-500">
                      No saved custom cards. The homepage cards above are auto-generated from current post tags/categories.
                    </div>
                  )}
                  {creativeDirectionItems.map((item, index) => {
                    const isExpanded = expandedCreativeIndex === index;
                    return (
                    <div key={index} className="bg-surface-50/50 dark:bg-surface-950/20 border border-surface-200/60 dark:border-surface-800/80 rounded-xl overflow-hidden">
                      {/* Collapsed row: label + match summary, reorder arrows, edit/remove */}
                      <div className="flex items-center gap-2 p-3">
                        <div className="flex flex-col">
                          <button type="button" onClick={() => moveRailItem('creative', index, -1)} disabled={index === 0} className="p-0.5 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => moveRailItem('creative', index, 1)} disabled={index === creativeDirectionItems.length - 1} className="p-0.5 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-surface-950 dark:text-white">{item.label || <span className="text-surface-400 font-normal">Untitled card</span>}</p>
                          <p className="mt-0.5 text-[11px] text-surface-500">{item.type} - {item.value || '—'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedCreativeIndex(isExpanded ? null : index)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-700 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> {isExpanded ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => { removeRailItem('creative', index); if (isExpanded) setExpandedCreativeIndex(null); }}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Remove Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {isExpanded && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] items-start px-3 pb-3 pt-1 border-t border-surface-200/60 dark:border-surface-800/80">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Card Display Label</span>
                        <input
                          value={item.label}
                          onChange={e => updateRailItem('creative', index, 'label', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                          placeholder="Card title, e.g. Anime"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Match Type</span>
                        <select
                          value={item.type}
                          onChange={e => updateRailItem('creative', index, 'type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                        >
                          <option value="tag">Tag</option>
                          <option value="tool">AI Tool</option>
                          <option value="category">Category</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Slug/Value to Match</span>
                        <input
                          value={item.value}
                          onChange={e => updateRailItem('creative', index, 'value', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                          placeholder="Match value, e.g. anime"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:col-span-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Icon</span>
                          <select
                            value={item.icon || ''}
                            onChange={e => updateRailItem('creative', index, 'icon', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                          >
                            <option value="">Auto</option>
                            <option value="wand">Wand</option>
                            <option value="image">Image</option>
                            <option value="book">Book</option>
                            <option value="camera">Camera</option>
                            <option value="palette">Palette</option>
                            <option value="shield">Shield</option>
                            <option value="lightbulb">Lightbulb</option>
                            <option value="layers">Layers</option>
                            <option value="trending">Trending</option>
                            <option value="users">Users</option>
                            <option value="sparkles">Sparkles</option>
                            <option value="settings">Settings</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Custom Logo URL (optional, overrides icon)</span>
                          <input
                            value={item.imageUrl || ''}
                            onChange={e => updateRailItem('creative', index, 'imageUrl', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                            placeholder="https://... (png/svg with transparency works best)"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setMediaLibraryCallback(() => (url: string) => updateRailItem('creative', index, 'imageUrl', url))}
                              className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                            >
                              <ImageIcon className="h-3.5 w-3.5" /> Library
                            </button>
                            <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary-300 bg-primary-50 px-3 text-xs font-bold text-primary-600 hover:bg-primary-100 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300">
                              <Upload className="h-3.5 w-3.5" /> Upload logo
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleCreativeDirectionLogoUpload(index, file);
                                e.currentTarget.value = '';
                              }}
                            />
                            </label>
                          </div>
                        </div>
                      </div>
                      </div>
                      )}
                    </div>
                    );
                  })}
                  <button
                    onClick={() => addRailItem('creative')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Browse Card
                  </button>
                </div>
              </div>
                <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-primary-500" /> Homepage Quick Cards
                  </h3>
                  <p className="text-xs text-surface-500 mb-4">
                    Optional cards shown below the hero for pages you want to promote. Each card can have its own icon, accent, and layout style.
                  </p>
                  <div className="space-y-4">
                    {homeLinkBlocks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 p-5 text-sm text-surface-500">
                        No homepage quick cards yet. Add one to preview the design.
                      </div>
                    )}
                    {homeLinkBlocks.map((block, index) => (
                      <div key={index} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 p-4">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <p className="text-xs font-bold uppercase text-surface-500">Card {index + 1}</p>
                            <p className="text-sm font-semibold text-surface-950 dark:text-white">{block.title || 'Untitled quick card'}</p>
                          </div>
                          <button
                            onClick={() => setHomeLinkBlocks(prev => prev.filter((_, i) => i !== index))}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="space-y-1">
                                <span className="flex items-center justify-between text-xs font-medium text-surface-500">
                                  Title
                                  <WandButton
                                    fieldId={`quickcard-title-${index}`}
                                    value={block.title}
                                    onChange={(v) => updateHomeLinkBlock(index, 'title', v)}
                                    prompt={() => homepagePrompts.quickCardTitle(block.title)}
                                  />
                                </span>
                                <input
                                  value={block.title}
                                  onChange={e => updateHomeLinkBlock(index, 'title', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                                  placeholder="Anime Poster Prompts"
                                />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-surface-500">Link</span>
                                <input
                                  value={block.href}
                                  onChange={e => updateHomeLinkBlock(index, 'href', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                                  placeholder="/page/custom or /section/name"
                                />
                              </label>
                            </div>
                            <label className="space-y-1 block">
                              <span className="flex items-center justify-between text-xs font-medium text-surface-500">
                                Description
                                <WandButton
                                  fieldId={`quickcard-desc-${index}`}
                                  value={block.description || ''}
                                  onChange={(v) => updateHomeLinkBlock(index, 'description', v)}
                                  prompt={() => homepagePrompts.quickCardDescription(block.title)}
                                />
                              </span>
                              <textarea
                                value={block.description || ''}
                                onChange={e => updateHomeLinkBlock(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                                placeholder="Short reason to open this collection"
                              />
                            </label>
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-surface-500">Icon</span>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {homeCardIcons.map(({ value, label, Icon }) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => updateHomeLinkBlock(index, 'icon', value)}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                                      (block.icon || 'sparkles') === value
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-400'
                                    }`}
                                    title={label}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-surface-500">Accent</span>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {homeCardAccents.map(({ value, label, className }) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => updateHomeLinkBlock(index, 'accent', value)}
                                    className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                                      (block.accent || 'violet') === value
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-400'
                                    }`}
                                  >
                                    <span className={`w-3 h-3 rounded-full ${className}`} />
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {homeCardStyles.map(({ value, label, description }) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => updateHomeLinkBlock(index, 'style', value)}
                                  className={`text-left rounded-lg border p-3 transition-colors ${
                                    (block.style || 'showcase') === value
                                      ? 'border-primary-500 bg-primary-500/10'
                                      : 'border-surface-200 dark:border-surface-700 hover:border-primary-400'
                                  }`}
                                >
                                  <span className="block text-sm font-semibold">{label}</span>
                                  <span className="block text-xs text-surface-500 mt-1">{description}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 p-3 self-start">
                            {(() => {
                              const iconChoice = homeCardIcons.find(item => item.value === (block.icon || 'sparkles')) || homeCardIcons[0];
                              const accentChoice = homeCardAccents.find(item => item.value === (block.accent || 'violet')) || homeCardAccents[0];
                              const PreviewIcon = iconChoice.Icon;
                              return (
                                <div className={`rounded-lg border ${accentChoice.soft} p-4 min-h-[140px] flex flex-col justify-between gap-5`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`w-10 h-10 rounded-lg ${accentChoice.className} text-white flex items-center justify-center shadow-lg`}>
                                      <PreviewIcon className="w-5 h-5" />
                                    </span>
                                    <ArrowRight className="w-4 h-4 opacity-70" />
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-sm leading-snug text-surface-950 dark:text-white">{block.title || 'Card preview'}</p>
                                    <p className="text-xs mt-1 line-clamp-2 text-surface-600 dark:text-surface-400">{block.description || 'Your short description will appear here.'}</p>
                                    <p className="text-[10px] uppercase tracking-wide mt-3 opacity-70">{block.style || 'showcase'} style</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setHomeLinkBlocks(prev => [...prev, { title: '', href: '', description: '', icon: 'sparkles', accent: 'violet', style: 'showcase' }])}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm font-medium"
                    >
                    <Plus className="w-4 h-4" /> Add Homepage Card
                  </button>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors mt-4"
                >
                  <Save className="w-4 h-4" /> Save Homepage
                </button>
              </div>
            </div>
              <aside className="hidden min-w-0 xl:block xl:sticky xl:top-24">
                {activeHomepageBlockOption && activeHomepageBlockContent ? (
                  <HomepageBlockPreview
                    blockKey={activeHomepageBlockOption.key}
                    title={activeHomepageBlockOption.title}
                    content={activeHomepageBlockContent}
                    settings={settings}
                    posts={publicPosts}
                    currentPrompt={currentPromptOfDay}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
                      <p className="text-xs font-black uppercase tracking-wide text-surface-500">Homepage preview area</p>
                      <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">
                        Open any homepage block with the edit button to preview its badge, heading, copy, cards, and CTA here.
                      </p>
                    </div>
                    <CardStylePreview style={cardStyle} badgeStyle={badgeStyle} label="Global card style" />
                  </div>
                )}
              </aside>
            </div>
          )}

          {settingsSubTab === 'footer' && (
            <div className="space-y-6">
            <TabBanner
              icon={<Share2 />}
              title="Footer"
              text="Control the social icons and link columns shown in the site footer on every page."
            />
            <Panel>
              <PanelHeader
                title="Social links"
                subtitle="Shown as icons under the site description in the footer. Leave a field empty to hide that icon."
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  ['twitter', 'X (Twitter)', 'https://x.com/yourhandle'],
                  ['instagram', 'Instagram', 'https://instagram.com/yourhandle'],
                  ['youtube', 'YouTube', 'https://youtube.com/@yourchannel'],
                  ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
                  ['pinterest', 'Pinterest', 'https://pinterest.com/yourprofile'],
                ] as const).map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className={adminLabel}>{label}</label>
                    <input
                      value={socialLinks[key] || ''}
                      onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                      className={adminInput}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-surface-100 dark:border-surface-800 pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save social links
                </button>
              </div>
            </Panel>
            <Panel>
              <PanelHeader
                title="Footer links"
                count={footerLinkGroups.length}
                subtitle="Create footer columns, then add individual links inside each column."
              />
              <div className="space-y-4">
                {footerLinkGroups.map((group, groupIndex) => (
                  <EditableCard key={groupIndex} isEditing={false} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center">
                      <div className="flex sm:flex-col gap-1">
                        <button
                          onClick={() => setFooterLinkGroups(prev => moveArrayItem(prev, groupIndex, groupIndex - 1))}
                          disabled={groupIndex === 0}
                          className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move group up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setFooterLinkGroups(prev => moveArrayItem(prev, groupIndex, groupIndex + 1))}
                          disabled={groupIndex === footerLinkGroups.length - 1}
                          className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move group down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        value={group.title}
                        onChange={e => updateFooterGroupTitle(groupIndex, e.target.value)}
                        className={`${adminInput} font-bold`}
                        placeholder="Footer column title"
                      />
                      <button
                        onClick={() => setFooterLinkGroups(prev => prev.filter((_, i) => i !== groupIndex))}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Remove group
                      </button>
                    </div>
                    <div className="space-y-2">
                      {group.links.length === 0 && (
                        <p className="text-xs text-surface-500">No links in this group.</p>
                      )}
                      {group.links.map((link, linkIndex) => (
                        <div key={linkIndex} className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-surface-300 dark:hover:border-surface-600 p-2.5 transition-all">
                          <div className="flex sm:flex-col gap-1">
                            <button
                              onClick={() => moveFooterLink(groupIndex, linkIndex, linkIndex - 1)}
                              disabled={linkIndex === 0}
                              className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveFooterLink(groupIndex, linkIndex, linkIndex + 1)}
                              disabled={linkIndex === group.links.length - 1}
                              className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            value={link.label}
                            onChange={e => updateFooterLink(groupIndex, linkIndex, 'label', e.target.value)}
                            className={adminInput}
                            placeholder="Label"
                          />
                          <input
                            value={link.href}
                            onChange={e => updateFooterLink(groupIndex, linkIndex, 'href', e.target.value)}
                            className={adminInput}
                            placeholder="/privacy or https://..."
                          />
                          <button
                            onClick={() => setFooterLinkGroups(prev => prev.map((item, i) => (
                              i === groupIndex ? { ...item, links: item.links.filter((_, j) => j !== linkIndex) } : item
                            )))}
                            className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setFooterLinkGroups(prev => prev.map((item, i) => (
                        i === groupIndex ? { ...item, links: [...item.links, { label: '', href: '' }] } : item
                      )))}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:border-primary-400 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add link
                    </button>
                  </EditableCard>
                ))}
                <button
                  onClick={() => setFooterLinkGroups(prev => [...prev, { title: 'New Group', links: [{ label: '', href: '' }] }])}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add footer group
                </button>
              </div>
              <div className="flex justify-end border-t border-surface-100 dark:border-surface-800 pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save footer links
                </button>
              </div>
            </Panel>
            </div>
          )}

          {settingsSubTab === 'ads' && (
          <Panel>
             <PanelHeader title="Ads & scripts" subtitle="Configure AdSense and the reusable ad placements shown across the site." />
             <div className="space-y-4">

                {/* AdSense Account */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="font-bold text-base text-surface-900 dark:text-white">Google AdSense Account</span>
                     <Toggle
                       checked={Boolean(adsConfig.autoAdsEnabled)}
                       onChange={(checked) => setAdsConfig(prev => ({ ...prev, autoAdsEnabled: checked }))}
                       label="Auto Ads"
                     />
                   </div>
                   <input
                     type="text"
                     value={adsConfig.publisherId || ''}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, publisherId: e.target.value.trim() }))}
                     placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                     className={`${adminInput} font-mono`}
                   />
                   <p className="mt-2 text-xs text-surface-500">
                     Adds the site verification meta tag for AdSense. Enable Auto Ads to load the AdSense script on every page (requires a publisher ID).
                   </p>
                </div>

                {/* Header Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="font-bold text-base text-surface-900 dark:text-white">Header Ad (Top of page)</span>
                     <Toggle
                       checked={adsConfig.header.enabled}
                       onChange={(checked) => setAdsConfig(prev => ({ ...prev, header: { ...prev.header, enabled: checked } }))}
                       label="Enabled"
                     />
                   </div>
                   <textarea
                     value={adsConfig.header.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, header: { ...prev.header, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here (e.g., Google AdSense)"
                     className={`${adminInput} resize-y font-mono`}
                   />
                </div>

                {/* In-Feed Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                     <span className="font-bold text-base text-surface-900 dark:text-white">In-Feed Ad (Post Grids)</span>
                     <div className="flex flex-wrap items-center gap-4">
                       <div className="flex items-center gap-2">
                         <span className="text-xs text-surface-500">Show every</span>
                         <input
                           type="number"
                           min="1"
                           max="20"
                           value={adsConfig.inFeed.frequency}
                           onChange={(e) => setAdsConfig(prev => ({ ...prev, inFeed: { ...prev.inFeed, frequency: parseInt(e.target.value) || 8 } }))}
                           className="w-16 px-2 py-1 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none text-xs"
                         />
                         <span className="text-xs text-surface-500">posts</span>
                       </div>
                       <Toggle
                         checked={adsConfig.inFeed.enabled}
                         onChange={(checked) => setAdsConfig(prev => ({ ...prev, inFeed: { ...prev.inFeed, enabled: checked } }))}
                         label="Enabled"
                       />
                     </div>
                   </div>
                   <textarea
                     value={adsConfig.inFeed.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, inFeed: { ...prev.inFeed, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here"
                     className={`${adminInput} resize-y font-mono`}
                   />
                </div>

                {/* Post Top Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="font-bold text-base text-surface-900 dark:text-white">Post Details - Top</span>
                     <Toggle
                       checked={adsConfig.postTop.enabled}
                       onChange={(checked) => setAdsConfig(prev => ({ ...prev, postTop: { ...prev.postTop, enabled: checked } }))}
                       label="Enabled"
                     />
                   </div>
                   <textarea
                     value={adsConfig.postTop.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, postTop: { ...prev.postTop, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here"
                     className={`${adminInput} resize-y font-mono`}
                   />
                </div>

                {/* Post Bottom Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="font-bold text-base text-surface-900 dark:text-white">Post Details - Bottom</span>
                     <Toggle
                       checked={adsConfig.postBottom.enabled}
                       onChange={(checked) => setAdsConfig(prev => ({ ...prev, postBottom: { ...prev.postBottom, enabled: checked } }))}
                       label="Enabled"
                     />
                   </div>
                   <textarea
                     value={adsConfig.postBottom.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, postBottom: { ...prev.postBottom, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here"
                     className={`${adminInput} resize-y font-mono`}
                   />
                </div>

                <ActionButton onClick={handleSaveSettings}>
                  <Save className="w-4 h-4" /> Save ad settings
                </ActionButton>
             </div>
          </Panel>
          )}

          {/* AI Tools Management */}
          {settingsSubTab === 'ai-tools' && (
          <div className="space-y-6">
            <TabBanner
              icon={<Wand2 />}
              title="AI Tools Registry"
              text="The tool registry powers AI Tool Pages, model selectors, and tool filters across the site. Per-tool page SEO is managed in Discovery Pages."
              action={(
                <ActionButton onClick={handleBackfillModels} disabled={isBackfillingModels}>
                  <RotateCcw className={`h-3.5 w-3.5 ${isBackfillingModels ? 'animate-spin' : ''}`} />
                  {isBackfillingModels ? 'Filling...' : 'Fill missing models'}
                </ActionButton>
              )}
            />

            <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-surface-900 dark:text-white flex items-center gap-2">
                    Manage AI Tools <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300 font-bold">{(settings.aiTools || []).length}</span>
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5">Configure branding, models, homepage cards, and placement overrides per tool.</p>
                </div>
                <div className="flex items-center gap-2 max-w-sm w-full">
                  <input
                    value={newAiTool}
                    onChange={e => setNewAiTool(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAiTool()}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs font-semibold"
                    placeholder="New tool name (e.g. ChatGPT)..."
                  />
                  <button
                    onClick={addAiTool}
                    disabled={!newAiTool.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tool
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(settings.aiTools || []).map(tool => {
                  const details = settings.toolDetails?.[tool] || {};
                  const info = getToolInfo(tool, settings.toolDetails);
                  const imgCount = posts.reduce((acc, p) => acc + (p.aiTools?.includes(tool) ? 1 : 0) + p.images.filter(img => img.aiTools ? img.aiTools.includes(tool) : img.aiTool === tool).length, 0);
                  const isEditing = editingAiTool === tool;
                  const isActive = details.active ?? true;
                  const isFeatured = details.featured ?? true;

                  return (
                    <div
                      key={tool}
                      className={`rounded-2xl border transition-all ${
                        isEditing
                          ? 'border-primary-500/50 bg-primary-50/10 dark:bg-primary-950/10 shadow-md p-4 sm:p-6 space-y-6'
                          : 'border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/40 hover:border-surface-300 dark:hover:border-surface-700 p-4'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-6">
                          <div className="flex flex-col gap-3 border-b border-surface-200 pb-4 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center relative ${editAiToolColor || 'bg-surface-500'}`}>
                                {editAiToolLogo && (
                                  <Image src={editAiToolLogo} alt="" fill className="object-contain p-1.5" referrerPolicy="no-referrer" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-base text-surface-900 dark:text-white">{tool}</h4>
                                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Editing Tool Settings</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ActionButton variant="ghost" onClick={() => setEditingAiTool(null)}>
                                Cancel
                              </ActionButton>
                              <ActionButton onClick={() => saveEditAiTool(tool)}>
                                <Save className="w-3.5 h-3.5" /> Save tool
                              </ActionButton>
                            </div>
                          </div>

                          {/* Section 1: Identity & Models */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-surface-500 border-l-2 border-primary-500 pl-2">1. Identity & Models Registry</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">Tool Name</label>
                                <input
                                  value={editAiToolValue}
                                  onChange={e => setEditAiToolValue(e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-bold outline-none focus:border-primary-500"
                                  placeholder="e.g. ChatGPT"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">URL Slug</label>
                                <div className="flex items-center rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
                                  <span className="px-3 py-2 bg-surface-100 dark:bg-surface-800 text-xs text-surface-400 font-mono border-r border-surface-200 dark:border-surface-700">/tool/</span>
                                  <input
                                    value={editAiToolSlug}
                                    onChange={e => setEditAiToolSlug(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-transparent text-xs font-mono outline-none"
                                    placeholder="chatgpt"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">Brand Color Palette</label>
                                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-100 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60">
                                  {TAILWIND_COLORS.map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setEditAiToolColor(c)}
                                      className={`w-6 h-6 rounded-lg ${c} ${editAiToolColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-500 scale-110' : 'hover:scale-105 border border-black/10 dark:border-white/10'} transition-all`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">Logo / Icon URL (or upload)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    value={editAiToolLogo}
                                    onChange={e => setEditAiToolLogo(e.target.value)}
                                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500"
                                    placeholder="https://... or upload icon"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setMediaLibraryCallback(() => setEditAiToolLogo)}
                                    className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer transition-colors shrink-0"
                                    title="Choose from Library"
                                  >
                                    <ImageIcon className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                                  </button>
                                  <label className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer transition-colors shrink-0" title="Upload Logo">
                                    <Upload className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleToolLogoUpload(file);
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300">Description</label>
                                <WandButton
                                  fieldId={`aitool-desc-${tool}`}
                                  value={editAiToolDescription}
                                  onChange={setEditAiToolDescription}
                                  prompt={() => aiToolPrompts.description(tool)}
                                />
                              </div>
                              <textarea
                                value={editAiToolDescription}
                                onChange={e => setEditAiToolDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500 resize-y"
                                placeholder="Brief description of this AI tool..."
                              />
                              <CharCount value={editAiToolDescription} recommended={160} />
                            </div>
                            
                            <div className="pt-2">
                              <h4 className="text-xs font-bold text-surface-900 dark:text-white mb-2">SEO & Hero Overrides (Optional)</h4>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">Hero Title</label>
                                  <textarea rows={2}
                                    value={editAiToolHeroTitle}
                                    onChange={e => setEditAiToolHeroTitle(e.target.value)}
                                    className="resize-y w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500"
                                    placeholder="e.g. Best %tool% Prompts"
                                  />
                                  <CharCount value={editAiToolHeroTitle} recommended={60} />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">Hero Description</label>
                                  <textarea rows={2}
                                    value={editAiToolHeroDescription}
                                    onChange={e => setEditAiToolHeroDescription(e.target.value)}
                                    className="resize-y w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500"
                                    placeholder="e.g. Explore prompts for %tool%."
                                  />
                                  <CharCount value={editAiToolHeroDescription} recommended={160} />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">SEO Title</label>
                                  <textarea rows={2}
                                    value={editAiToolSeoTitle}
                                    onChange={e => setEditAiToolSeoTitle(e.target.value)}
                                    className="resize-y w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500"
                                    placeholder="e.g. %tool% Prompts"
                                  />
                                  <CharCount value={editAiToolSeoTitle} recommended={60} />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300 mb-1">SEO Description</label>
                                  <textarea rows={2}
                                    value={editAiToolSeoDescription}
                                    onChange={e => setEditAiToolSeoDescription(e.target.value)}
                                    className="resize-y w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500"
                                    placeholder="e.g. Discover amazing %tool% prompts."
                                  />
                                  <CharCount value={editAiToolSeoDescription} recommended={160} />
                                </div>
                              </div>
                            </div>

                            {/* Models Registry */}
                            <div className="p-4 rounded-xl bg-surface-100/70 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/60 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-bold text-surface-900 dark:text-white">Models Registry</span>
                                  <p className="text-[10px] text-surface-500">Shown in post prompt model selectors and prompt options.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = `Model ${editAiToolModels.length + 1}`;
                                    setEditAiToolModels([...editAiToolModels, next]);
                                    if (!editAiToolDefaultModel) setEditAiToolDefaultModel(next);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-[11px] font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors shadow-2xs"
                                >
                                  <Plus className="w-3 h-3" /> Add Model
                                </button>
                              </div>
                              {editAiToolModels.length === 0 ? (
                                <p className="text-xs text-surface-400 italic py-2 text-center">No custom models added yet. Default generator models will be used.</p>
                              ) : (
                                <div className="space-y-2">
                                  {editAiToolModels.map((m, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-surface-900 p-2 rounded-xl border border-surface-200 dark:border-surface-700">
                                      <input
                                        value={m}
                                        onChange={e => {
                                          const updated = [...editAiToolModels];
                                          const oldVal = updated[idx];
                                          updated[idx] = e.target.value;
                                          setEditAiToolModels(updated);
                                          if (editAiToolDefaultModel === oldVal) setEditAiToolDefaultModel(e.target.value);
                                        }}
                                        className="flex-1 px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-xs font-semibold outline-none focus:border-primary-500"
                                        placeholder="Model name (e.g. GPT-4o)"
                                      />
                                      <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-[11px] font-bold text-surface-600 dark:text-surface-300 cursor-pointer shrink-0">
                                        <input
                                          type="radio"
                                          name="defaultModel"
                                          checked={editAiToolDefaultModel === m}
                                          onChange={() => setEditAiToolDefaultModel(m)}
                                          className="w-3.5 h-3.5 text-primary-500"
                                        />
                                        Default
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const filtered = editAiToolModels.filter((_, i) => i !== idx);
                                          setEditAiToolModels(filtered);
                                          if (editAiToolDefaultModel === m) setEditAiToolDefaultModel(filtered[0] || '');
                                        }}
                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Section 2: Homepage Card Customization */}
                          <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-800">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-surface-500 border-l-2 border-primary-500 pl-2">2. Homepage Card Customizations (Supported Tools Grid)</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <div className="mb-1 flex items-center justify-between">
                                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300">Top Card Badge</label>
                                  <WandButton
                                    fieldId={`aitool-badge-${tool}`}
                                    value={editAiToolBadge}
                                    onChange={setEditAiToolBadge}
                                    prompt={() => aiToolPrompts.badge(tool)}
                                  />
                                </div>
                                <input
                                  value={editAiToolBadge}
                                  onChange={e => setEditAiToolBadge(e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs outline-none focus:border-primary-500"
                                  placeholder="e.g. Precision Text & Gemini"
                                />
                              </div>
                              <div>
                                <div className="mb-1 flex items-center justify-between">
                                  <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300">Stats Highlights (One label: value per line)</label>
                                  <WandButton
                                    fieldId={`aitool-stats-${tool}`}
                                    value={editAiToolStats}
                                    onChange={setEditAiToolStats}
                                    prompt={() => aiToolPrompts.statsHighlights(tool)}
                                  />
                                </div>
                                <textarea
                                  value={editAiToolStats}
                                  onChange={e => setEditAiToolStats(e.target.value)}
                                  rows={2}
                                  className={`${adminInput} resize-y font-mono`}
                                  placeholder={'Prompt Power: Excellent\nText Fidelity: 98%\nAspect Ratios: Flexible'}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-300">Capability Checkmarks (One feature note per line)</label>
                                <WandButton
                                  fieldId={`aitool-checks-${tool}`}
                                  value={editAiToolChecks}
                                  onChange={setEditAiToolChecks}
                                  prompt={() => aiToolPrompts.capabilities(tool)}
                                />
                              </div>
                              <textarea
                                value={editAiToolChecks}
                                onChange={e => setEditAiToolChecks(e.target.value)}
                                rows={3}
                                className={`${adminInput} resize-y`}
                                placeholder={'Strong text rendering\nReference image workflows\nDetailed prompt structure'}
                              />
                            </div>
                          </div>

                          {/* Section 3: Placement Toggles Bar */}
                          <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-surface-500 border-l-2 border-primary-500 pl-2">3. Site Placement Toggles</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 cursor-pointer">
                                <div>
                                  <span className="text-xs font-bold block text-surface-900 dark:text-white">Active</span>
                                  <span className="text-[10px] text-surface-500">Show in filters & pages</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={editAiToolActive}
                                  onChange={e => setEditAiToolActive(e.target.checked)}
                                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                                />
                              </label>

                              <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 cursor-pointer">
                                <div>
                                  <span className="text-xs font-bold block text-surface-900 dark:text-white">Supported Tools Grid</span>
                                  <span className="text-[10px] text-surface-500">Highlight on homepage</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={editAiToolFeatured}
                                  onChange={e => setEditAiToolFeatured(e.target.checked)}
                                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                                />
                              </label>

                              <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 cursor-pointer">
                                <div>
                                  <span className="text-xs font-bold block text-surface-900 dark:text-white">Footer Links</span>
                                  <span className="text-[10px] text-surface-500">Show in footer column</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={editAiToolShowInFooter}
                                  onChange={e => setEditAiToolShowInFooter(e.target.checked)}
                                  className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-white/20 ${info.color}`}>
                              {info.logo ? (
                                <Image src={info.logo} alt="" fill className="object-contain p-2" referrerPolicy="no-referrer" />
                              ) : (
                                <Wand2 className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-extrabold text-surface-900 dark:text-white truncate">{tool}</h4>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-surface-200 text-surface-500'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-surface-400'}`} />
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                                {isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                                {details.models?.length || 1} models &bull; <span className="font-mono text-[11px] text-primary-600 dark:text-primary-400">/tool/{details.slug || tool.toLowerCase()}</span> &bull; {imgCount} post uses
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-surface-200 dark:border-surface-800">
                            <button
                              onClick={() => startEditAiTool(tool)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-xs font-bold text-surface-800 dark:text-surface-200 transition-colors"
                              title="Customize Tool Cards & Settings"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-primary-500" /> Customize
                            </button>
                            <button
                              onClick={() => removeAiTool(tool)}
                              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Tool"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {settingsSubTab === 'features' && (
          <div className="space-y-6">
            <TabBanner
              icon={<Star />}
              title="Feature flags"
              text="Toggle specific site capabilities on or off."
            />

            <div className="space-y-4">
              {/* User Profiles */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">User Profiles & Bookmarks</span>
                  <Toggle checked={features.userProfiles} onChange={(checked) => setFeatures(prev => ({ ...prev, userProfiles: checked }))} label="Enabled" />
                </div>
              </div>

              {/* User Submissions */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">User Submissions & Approval Queue</span>
                  <Toggle checked={features.userSubmissions} onChange={(checked) => setFeatures(prev => ({ ...prev, userSubmissions: checked }))} label="Enabled" />
                </div>
                {features.userSubmissions && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <Toggle checked={Boolean(features.userSubmissionsAutoApprove)} onChange={(checked) => setFeatures(prev => ({ ...prev, userSubmissionsAutoApprove: checked }))} label="Auto-approve user submissions" />
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Comments & Feedback</span>
                  <Toggle checked={features.comments} onChange={(checked) => setFeatures(prev => ({ ...prev, comments: checked }))} label="Enabled" />
                </div>
                {features.comments && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <Toggle checked={Boolean(features.commentsRequireApproval)} onChange={(checked) => setFeatures(prev => ({ ...prev, commentsRequireApproval: checked }))} label="Require manual approval" />
                  </div>
                )}
              </div>

              {/* Post Page Sections */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-base text-surface-900 dark:text-white">Post Page Sections</span>
                    <p className="mt-1 text-xs text-surface-500">Control the extra blocks shown below each prompt collection.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Toggle checked={features.showCopyCollection ?? true} onChange={(checked) => setFeatures(prev => ({ ...prev, showCopyCollection: checked }))} label="Copy entire collection block" />
                  <Toggle checked={features.showHowTo ?? true} onChange={(checked) => setFeatures(prev => ({ ...prev, showHowTo: checked }))} label="How to use section" />
                  <Toggle checked={features.showRecommendedPosts ?? true} onChange={(checked) => setFeatures(prev => ({ ...prev, showRecommendedPosts: checked }))} label="Recommended prompts" />
                  <Toggle checked={features.showTags ?? true} onChange={(checked) => setFeatures(prev => ({ ...prev, showTags: checked }))} label="Discovery tags" />
                  <Toggle checked={features.showDetailedInsights ?? true} onChange={(checked) => setFeatures(prev => ({ ...prev, showDetailedInsights: checked }))} label="Detailed insights" />
                  {[
                    ['showPostSidebar', 'Post sidebar'],
                    ['showShareButtons', 'Share buttons'],
                    ['showTryButtons', 'Try it on buttons'],
                    ['showLikeCount', 'Show like count'],
                    ['showViewCount', 'Show view count'],
                    ['showYouMightAlsoLike', 'You might also like'],
                    ['showScrollProgress', 'Scroll progress bar'],
                    ['showFaqSchema', 'FAQ + HowTo schema'],
                    ['showPublicProfiles', 'Public profiles'],
                    ['publicProfileLikes', 'Show likes on public profiles'],
                    ['publicProfileBookmarks', 'Show saves on public profiles'],
                  ].map(([key, label]) => (
                    <Toggle
                      key={key}
                      checked={Boolean((features as any)[key] ?? ['showPostSidebar', 'showShareButtons', 'showTryButtons', 'showLikeCount', 'showViewCount', 'showYouMightAlsoLike', 'showScrollProgress', 'showFaqSchema', 'showPublicProfiles'].includes(key))}
                      onChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                      label={label}
                    />
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="mb-3">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Keep Exploring Block</span>
                  <p className="mt-1 text-xs text-surface-500">Controls the card in the post sidebar and its mobile version.</p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="flex items-center justify-between text-xs font-medium text-surface-500">
                        Title
                        <WandButton
                          fieldId="features-keep-exploring-title"
                          value={keepExploring.title || ''}
                          onChange={(v) => setKeepExploring(prev => ({ ...prev, title: v }))}
                          prompt={featurePrompts.keepExploringTitle}
                        />
                      </span>
                      <input
                        value={keepExploring.title || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, title: e.target.value }))}
                        className={adminInput}
                        placeholder="Keep exploring"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-surface-500">Main button label</span>
                      <input
                        value={keepExploring.ctaLabel || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, ctaLabel: e.target.value }))}
                        className={adminInput}
                        placeholder="Open prompt library"
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="flex items-center justify-between text-xs font-medium text-surface-500">
                        Description
                        <WandButton
                          fieldId="features-keep-exploring-desc"
                          value={keepExploring.description || ''}
                          onChange={(v) => setKeepExploring(prev => ({ ...prev, description: v }))}
                          prompt={featurePrompts.keepExploringDescription}
                        />
                      </span>
                      <textarea
                        value={keepExploring.description || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className={`${adminInput} resize-y`}
                        placeholder="Short copy shown under the title"
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-surface-500">Main button link</span>
                      <input
                        value={keepExploring.ctaHref || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, ctaHref: e.target.value }))}
                        className={adminInput}
                        placeholder="/explore"
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    {(keepExploring.links || defaultKeepExploring.links).map((link, index) => (
                      <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px]">
                        <input
                          value={link.label}
                          onChange={e => updateKeepExploringLink(index, 'label', e.target.value)}
                          className={adminInputOnCard}
                          placeholder="Link title"
                        />
                        <input
                          value={link.href}
                          onChange={e => updateKeepExploringLink(index, 'href', e.target.value)}
                          className={adminInputOnCard}
                          placeholder="/tag/poster"
                        />
                        <select
                          value={link.icon || 'image'}
                          onChange={e => updateKeepExploringLink(index, 'icon', e.target.value)}
                          className={adminInputOnCard}
                        >
                          <option value="image">Image</option>
                          <option value="layers">Layers</option>
                          <option value="clipboard">Clipboard</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setKeepExploring(defaultKeepExploring)}
                    className="inline-flex items-center gap-2 rounded-lg bg-surface-200 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-100 dark:hover:bg-surface-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Keep Exploring defaults
                  </button>
                </div>
              </div>

              {/* Advanced Filtering */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Advanced Search & Filtering</span>
                  <Toggle checked={features.advancedFiltering} onChange={(checked) => setFeatures(prev => ({ ...prev, advancedFiltering: checked }))} label="Enabled" />
                </div>
              </div>

              {/* Smart Templates */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Smart &quot;Fill-in-the-blank&quot; Templates</span>
                  <Toggle checked={features.smartTemplates} onChange={(checked) => setFeatures(prev => ({ ...prev, smartTemplates: checked }))} label="Enabled" />
                </div>
              </div>

              {/* Infinite Scrolling */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Infinite Scrolling (Explore)</span>
                  <Toggle checked={features.infiniteScroll} onChange={(checked) => setFeatures(prev => ({ ...prev, infiniteScroll: checked }))} label="Enabled" />
                </div>
                {features.infiniteScroll && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center gap-4">
                    <label className="text-sm">Items Per Load</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={features.infiniteScrollItems || 20}
                      onChange={(e) => setFeatures(prev => ({ ...prev, infiniteScrollItems: parseInt(e.target.value) || 20 }))}
                      className="w-20 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Premium Prompts */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Premium / Pro Prompts</span>
                  <Toggle checked={features.premiumPrompts} onChange={(checked) => setFeatures(prev => ({ ...prev, premiumPrompts: checked }))} label="Enabled" />
                </div>
                {features.premiumPrompts && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="text-sm w-32">Price ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={features.premiumPrice || 5}
                        onChange={(e) => setFeatures(prev => ({ ...prev, premiumPrice: parseFloat(e.target.value) || 0 }))}
                        className="w-24 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm w-32">Payment URL</label>
                      <input
                        type="url"
                        placeholder="https://buy.stripe.com/..."
                        value={features.premiumPaymentUrl || ''}
                        onChange={(e) => setFeatures(prev => ({ ...prev, premiumPaymentUrl: e.target.value }))}
                        className="flex-1 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Skeleton Loaders */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Skeleton Loaders</span>
                  <Toggle checked={features.skeletonLoaders} onChange={(checked) => setFeatures(prev => ({ ...prev, skeletonLoaders: checked }))} label="Enabled" />
                </div>
              </div>

              {/* Trending Algorithm */}
              <div className="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-surface-900 dark:text-white">Trending Algorithms</span>
                  <Toggle checked={features.trendingAlgorithm} onChange={(checked) => setFeatures(prev => ({ ...prev, trendingAlgorithm: checked }))} label="Enabled" />
                </div>
                {features.trendingAlgorithm && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="text-sm w-32">Likes Weighting</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={features.trendingLikesWeight !== undefined ? features.trendingLikesWeight : 2}
                        onChange={(e) => setFeatures(prev => ({ ...prev, trendingLikesWeight: parseFloat(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm w-32">Views Weighting</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={features.trendingViewsWeight !== undefined ? features.trendingViewsWeight : 1}
                        onChange={(e) => setFeatures(prev => ({ ...prev, trendingViewsWeight: parseFloat(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
                      />
                    </div>
                    <p className="text-xs text-surface-500">Formula: (Views x weight) + (Likes x weight) = Trending Score</p>
                  </div>
                )}
              </div>

              {/* Layout Features */}
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div className="flex items-center gap-3">
                  <LayoutTemplate className="w-5 h-5 text-primary-500" />
                  <div>
                    <h3 className="font-medium text-sm">Mobile Grid Layout</h3>
                    <p className="text-xs text-surface-500">Columns to show on mobile devices.</p>
                  </div>
                </div>
                <div className="pl-8 pt-2">
                  <select
                    value={features.mobileColumns || 2}
                    onChange={(e) => setFeatures(prev => ({ ...prev, mobileColumns: parseInt(e.target.value) as 1 | 2 }))}
                    className={`${adminInput} max-w-48`}
                  >
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                  </select>
                </div>
              </div>

              {/* Desktop Columns Setting */}
              <div className="border-b border-surface-200 dark:border-surface-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <LayoutTemplate className="w-5 h-5 text-surface-400" />
                    <div>
                      <p className="font-semibold text-sm">Desktop Grid Columns</p>
                      <p className="text-xs text-surface-500">Columns to show on large desktop monitors (100% zoom).</p>
                    </div>
                  </div>
                </div>
                <div className="pl-8 pt-2">
                  <select
                    value={features.desktopColumns || 4}
                    onChange={(e) => setFeatures(prev => ({ ...prev, desktopColumns: parseInt(e.target.value) as 3 | 4 | 5 | 6 | 7 | 8 }))}
                    className={`${adminInput} max-w-48`}
                  >
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                    <option value={5}>5 Columns</option>
                    <option value={6}>6 Columns</option>
                    <option value={7}>7 Columns</option>
                    <option value={8}>8 Columns</option>
                  </select>
                </div>
              </div>
            </div>

            <ActionButton onClick={handleSaveSettings}>
              <Save className="w-4 h-4" /> Save feature flags
            </ActionButton>
          </div>
          )}

          {settingsSubTab === 'comments' && (
            <div className="space-y-6">
              <TabBanner icon={<MessageCircle />} title="Comments" text="Control the live comment form and moderation defaults." />
              <Panel>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-800 dark:bg-surface-800/50">
                  <span>
                    <b>Enable comments globally</b>
                    <span className="mt-1 block text-xs text-surface-500">Controls the live comment form and comment lists on post pages.</span>
                  </span>
                  <Toggle checked={features.comments} onChange={(checked) => setFeatures(prev => ({ ...prev, comments: checked }))} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-800 dark:bg-surface-800/50">
                  <span>
                    <b>Require approval</b>
                    <span className="mt-1 block text-xs text-surface-500">New comments stay pending until an admin approves them.</span>
                  </span>
                  <Toggle checked={Boolean(features.commentsRequireApproval)} onChange={(checked) => setFeatures(prev => ({ ...prev, commentsRequireApproval: checked }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Comment provider</label>
                  <select className={adminInputOnCard} value="custom" disabled>
                    <option value="custom">Custom built-in comments</option>
                  </select>
                  <p className="mt-1 text-xs text-surface-500">This site currently renders the built-in comment system. Disqus can be added later without changing this route.</p>
                </div>
              </div>
              <ActionButton onClick={handleSaveSettings}>
                <Save className="w-4 h-4" /> Save comments
              </ActionButton>
              </Panel>
            </div>
          )}

          {settingsSubTab === 'share' && (
            <div className="space-y-6">
              <TabBanner icon={<ArrowRight />} title="Share buttons" text="Choose where sharing appears and which targets visitors can use." />
              <Panel>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-800 dark:bg-surface-800/50">
                  <span>
                    <b>Show share buttons on post pages</b>
                    <span className="mt-1 block text-xs text-surface-500">Controls the live share strip rendered on prompt pages.</span>
                  </span>
                  <Toggle checked={features.showShareButtons ?? true} onChange={(checked) => setFeatures(prev => ({ ...prev, showShareButtons: checked }))} />
                </div>
                <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-800 dark:bg-surface-800/50">
                  <p className="text-sm font-bold">Show these share targets</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {shareTargetOptions.map(target => {
                      const activeTargets: ShareTarget[] = settings.shareSettings?.targets?.length ? settings.shareSettings.targets : ['whatsapp', 'x', 'instagram', 'copy'];
                      return (
                        <label key={target.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={activeTargets.includes(target.id)}
                            onChange={e => {
                              const nextTargets = e.target.checked
                                ? Array.from(new Set([...activeTargets, target.id]))
                                : activeTargets.filter(item => item !== target.id);
                              updateSettings({
                                ...settings,
                                shareSettings: {
                                  targets: nextTargets.length > 0 ? nextTargets : (['copy'] as ShareTarget[]),
                                  position: settings.shareSettings?.position || 'floating-sidebar',
                                },
                              });
                            }}
                            className="h-4 w-4 rounded text-primary-500"
                          />
                          {target.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Position</label>
                  <select
                    value={settings.shareSettings?.position || 'floating-sidebar'}
                    onChange={e => updateSettings({
                      ...settings,
                      shareSettings: {
                        targets: settings.shareSettings?.targets?.length ? settings.shareSettings.targets : ['whatsapp', 'x', 'instagram', 'copy'],
                        position: e.target.value as 'below-prompt' | 'bottom' | 'floating-sidebar',
                      },
                    })}
                    className={adminInputOnCard}
                  >
                    <option value="below-prompt">Below prompt</option>
                    <option value="bottom">Bottom of page</option>
                    <option value="floating-sidebar">Floating sidebar</option>
                  </select>
                </div>
              </div>
              <ActionButton onClick={handleSaveSettings}>
                <Save className="w-4 h-4" /> Save share buttons
              </ActionButton>
              </Panel>
            </div>
          )}

          {/* Danger Zone Removed */}
            </div>
          </div>
        </div>
      )}

      {/* ===== SUBMISSIONS TAB ===== */}
      {tab === 'submissions' && (
        <div className="max-w-5xl space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-surface-950 dark:text-white">Submissions</h2>
            <p className="text-xs text-surface-500 mt-1">Review prompt submissions from your community.</p>
          </div>

          {/* Submissions Stats Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localSubmissions.filter(s => s.status === 'pending').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Pending</p>
              </div>
              <span className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Upload className="w-5 h-5 animate-pulse" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localSubmissions.filter(s => s.status === 'published').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Approved</p>
              </div>
              <span className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localSubmissions.filter(s => s.status === 'rejected').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Rejected</p>
              </div>
              <span className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <X className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localSubmissions.length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Total</p>
              </div>
              <span className="p-3 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <FileText className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Submissions Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto p-1.5 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl shadow-sm">
            {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setSubmissionFilter(f)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                  submissionFilter === f
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-surface-600 hover:text-surface-950 dark:text-surface-400 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.06]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {localSubmissions.filter(s => submissionFilter === 'all' || s.status === (submissionFilter === 'approved' ? 'published' : submissionFilter)).length === 0 ? (
              <div className="text-center py-16 border border-dashed border-black/15 dark:border-white/15 rounded-3xl bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl shadow-sm">
                <Upload className="w-8 h-8 text-surface-400 mx-auto mb-3" />
                <p className="text-sm text-surface-500 font-medium">No submissions in this category.</p>
              </div>
            ) : (
              localSubmissions
                .filter(s => submissionFilter === 'all' || s.status === (submissionFilter === 'approved' ? 'published' : submissionFilter))
                .map(sub => (
                  <div key={sub.id} className="p-5 rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl shadow-sm space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-xs font-bold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 border border-primary-500/20 shadow-inner">
                          {sub.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-surface-950 dark:text-white leading-tight">{sub.title}</h4>
                            <span className="rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              {sub.aiTool}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              sub.status === 'pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' :
                              sub.status === 'published' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' :
                              'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                            }`}>
                              {sub.status === 'published' ? 'Approved' : sub.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400 leading-normal">
                            By {sub.authorName} • {sub.authorEmail} • {sub.createdAt}
                          </p>
                        </div>
                      </div>

                      {sub.status === 'pending' && (
                        <div className="flex gap-2 sm:self-start">
                          <button
                            onClick={() => handleApproveSubmission(sub.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectSubmission(sub.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-300 transition-all active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] font-mono text-xs text-surface-700 dark:text-surface-300 leading-relaxed break-words whitespace-pre-wrap">
                      {sub.prompt}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ===== COMMENTS TAB ===== */}
      {tab === 'comments' && (
        <div className="max-w-5xl space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-surface-950 dark:text-white">Comments</h2>
            <p className="text-xs text-surface-500 mt-1">Moderate comments across all posts.</p>
          </div>

          {/* Comments Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localComments.filter(c => c.status === 'pending').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Pending</p>
              </div>
              <span className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <MessageCircle className="w-5 h-5 animate-pulse" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localComments.filter(c => c.status === 'approved').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Approved</p>
              </div>
              <span className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localComments.filter(c => c.status === 'spam').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Spam</p>
              </div>
              <span className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Ban className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Comments Filter and Search panel */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl p-4 rounded-3xl border border-white/80 dark:border-white/10 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'spam'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCommentFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    commentFilter === f
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'border border-black/[0.08] dark:border-white/10 bg-white/50 dark:bg-white/[0.04] text-surface-600 hover:bg-white/80 hover:text-surface-950 dark:text-surface-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-surface-400" />
              <input
                value={commentSearch}
                onChange={e => setCommentSearch(e.target.value)}
                placeholder="Search comments..."
                className={`${adminInputOnCard} pl-9 pr-4`}
              />
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {localComments
              .filter(c => commentFilter === 'all' || c.status === commentFilter)
              .filter(c => !commentSearch || c.userName.toLowerCase().includes(commentSearch.toLowerCase()) || c.text.toLowerCase().includes(commentSearch.toLowerCase()) || c.postTitle.toLowerCase().includes(commentSearch.toLowerCase())).length === 0 ? (
                <div className="text-center py-16 border border-dashed border-black/15 dark:border-white/15 rounded-3xl bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl shadow-sm">
                  <MessageCircle className="w-8 h-8 text-surface-400 mx-auto mb-3" />
                  <p className="text-sm text-surface-500 font-medium">No comments match the selected filters.</p>
                </div>
              ) : (
                localComments
                  .filter(c => commentFilter === 'all' || c.status === commentFilter)
                  .filter(c => !commentSearch || c.userName.toLowerCase().includes(commentSearch.toLowerCase()) || c.text.toLowerCase().includes(commentSearch.toLowerCase()) || c.postTitle.toLowerCase().includes(commentSearch.toLowerCase()))
                  .map(comment => (
                    <div key={comment.id} className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-4 sm:p-5 backdrop-blur-xl shadow-sm space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-xs font-bold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 border border-primary-500/20 shadow-inner">
                            {comment.userAvatar}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-surface-950 dark:text-white leading-none">{comment.userName}</span>
                              <span className="text-xs text-surface-400">on</span>
                              <span className="text-xs font-bold text-primary-500 leading-none">{comment.postTitle}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                comment.status === 'pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' :
                                comment.status === 'approved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                              }`}>
                                {comment.status}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-surface-400">{comment.createdAt}</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5">
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveComment(comment.id)}
                              className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95"
                              title="Approve Comment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {comment.status !== 'spam' && (
                            <button
                              onClick={() => handleFlagCommentAsSpam(comment.id)}
                              className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all active:scale-95"
                              title="Mark as Spam"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRejectComment(comment.id)}
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed bg-black/[0.02] dark:bg-white/[0.03] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                        {comment.text}
                      </p>
                    </div>
                  ))
              )}
          </div>
        </div>
      )}

      {/* ===== USERS TAB ===== */}
      {tab === 'users' && (
        <div className="max-w-5xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-surface-950 dark:text-white">Users</h2>
              <p className="text-xs text-surface-500 mt-1">Manage members and their roles.</p>
            </div>
            <ActionButton onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Invite user
            </ActionButton>
          </div>

          {/* User Stats Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">{localUsers.length}</span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Members</p>
              </div>
              <span className="p-3 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                <Users className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localUsers.filter(u => u.role === 'Admin').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Admins</p>
              </div>
              <span className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Shield className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localUsers.filter(u => u.role === 'Editor').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Editors</p>
              </div>
              <span className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Shield className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] p-5 backdrop-blur-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-surface-950 dark:text-white">
                  {localUsers.filter(u => u.status === 'suspended').length}
                </span>
                <p className="text-xs font-semibold text-surface-400 mt-1">Suspended</p>
              </div>
              <span className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Ban className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Users Filter Panel */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl p-4 rounded-3xl border border-white/80 dark:border-white/10 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'Admin', 'Editor', 'Author', 'Subscriber'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userRoleFilter === r
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'border border-black/[0.08] dark:border-white/10 bg-white/50 dark:bg-white/[0.04] text-surface-600 hover:bg-white/80 hover:text-surface-950 dark:text-surface-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-surface-400" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search name or email..."
                className={`${adminInputOnCard} pl-9 pr-4`}
              />
            </div>
          </div>

          {/* Users Grid Table */}
          <div className="border border-white/80 dark:border-white/10 rounded-3xl bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.08] text-[10px] font-black uppercase tracking-wider text-surface-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">Member</th>
                    <th scope="col" className="px-4 py-3 text-left">Role</th>
                    <th scope="col" className="px-4 py-3 text-center">Posts</th>
                    <th scope="col" className="px-4 py-3 text-center">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {localUsers
                    .filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)
                    .filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                    .map(member => (
                      <tr key={member.id} className="hover:bg-white/50 dark:hover:bg-white/[0.04] transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 overflow-hidden items-center justify-center rounded-2xl bg-primary-500/10 text-xs font-bold text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 border border-primary-500/20 shadow-inner">
                              {member.avatar?.startsWith('http') ? (
                                <Image src={member.avatar} alt={member.name} width={36} height={36} className="h-full w-full object-cover" referrerPolicy="no-referrer" unoptimized />
                              ) : (
                                member.avatar
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-surface-950 dark:text-white leading-tight">{member.name}</p>
                              <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-0.5 leading-none">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <select
                            value={member.role}
                            onChange={e => handleUpdateUserRole(member.id, e.target.value)}
                            className="cursor-pointer rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] px-2.5 py-1 text-xs font-semibold outline-none focus:border-primary-500 dark:text-white backdrop-blur-md"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Author">Author</option>
                            <option value="Subscriber">Subscriber</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold text-surface-600 dark:text-surface-400">
                          {member.posts}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-xs">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            member.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {member.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const newName = prompt('Enter new name for ' + member.name + ':', member.name);
                                if (newName) {
                                  setUserOverrides(prev => ({
                                    ...prev,
                                    [member.id]: {
                                      ...prev[member.id],
                                      name: newName,
                                      avatar: newName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
                                    },
                                  }));
                                }
                              }}
                              className="p-1.5 rounded-xl text-surface-500 hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all"
                              title="Edit Member"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(member.id)}
                              className={`p-1.5 rounded-xl transition-all ${
                                member.status === 'active'
                                  ? 'text-rose-500 hover:bg-rose-500/10'
                                  : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={member.status === 'active' ? 'Suspend Member' : 'Activate Member'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite User Modal Overlay */}
          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#090b1c]/90 animate-in fade-in zoom-in-95 duration-150 sm:p-6">
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                  <h3 className="text-sm font-bold text-surface-950 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-500" /> Invite New Member
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-1.5 rounded-xl text-surface-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleInviteUserSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1.5">Full Name</label>
                    <input
                      required
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className={adminInputOnCard}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1.5">Email Address</label>
                    <input
                      required
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className={adminInputOnCard}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1.5">Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as any)}
                      className={`${adminInputOnCard} font-semibold`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Author">Author</option>
                      <option value="Subscriber">Subscriber</option>
                    </select>
                  </div>

                  <div className="mt-6 flex justify-end gap-2 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
                    <ActionButton variant="ghost" onClick={() => setShowInviteModal(false)}>
                      Cancel
                    </ActionButton>
                    <ActionButton type="submit">
                      Invite member
                    </ActionButton>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Ban User Modal Overlay matching Supabase design */}
          {banModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#090b1c]/90 animate-in fade-in zoom-in-95 duration-150 sm:p-6">
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                  <h3 className="text-base font-extrabold text-surface-900 dark:text-white">Confirm to ban user</h3>
                  <button
                    onClick={() => setBanModalUser(null)}
                    className="p-1.5 rounded-xl text-surface-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                    This will revoke access for <span className="font-bold text-surface-900 dark:text-white">{banModalUser.email || banModalUser.name}</span> and prevent them from logging in for the specified duration.
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-surface-700 dark:text-surface-200 mb-2">Set a ban duration</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        disabled={banDurationUnit === 'Permanent' || banDurationUnit === 'None'}
                        value={banDurationValue}
                        onChange={e => setBanDurationValue(parseInt(e.target.value) || 1)}
                        className={`${adminInputOnCard} max-w-24 font-semibold disabled:opacity-50`}
                      />
                      <select
                        value={banDurationUnit}
                        onChange={e => setBanDurationUnit(e.target.value as any)}
                        className={`${adminInputOnCard} flex-1 font-semibold`}
                      >
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                        <option value="Months">Months</option>
                        <option value="Permanent">Permanent</option>
                        <option value="None">None (Lift Ban)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08]">
                    <p className="text-[11px] text-surface-500 dark:text-surface-400">
                      This user will not be able to log in until:
                    </p>
                    <p className="text-xs font-bold text-surface-900 dark:text-white mt-0.5">
                      {(() => {
                        if (banDurationUnit === 'Permanent') return 'Permanent (100 Years)';
                        if (banDurationUnit === 'None') return 'Immediately (Ban Lifted)';
                        const d = new Date();
                        let hours = banDurationValue || 1;
                        if (banDurationUnit === 'Days') hours *= 24;
                        if (banDurationUnit === 'Weeks') hours *= 24 * 7;
                        if (banDurationUnit === 'Months') hours *= 24 * 30;
                        d.setHours(d.getHours() + hours);
                        return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
                      })()}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
                    <ActionButton variant="ghost" onClick={() => setBanModalUser(null)}>
                      Cancel
                    </ActionButton>
                    <ActionButton variant="danger" onClick={() => handleConfirmUserStatus(banModalUser.id, 'suspended', banDurationValue, banDurationUnit)}>
                      Confirm ban
                    </ActionButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SEO TAB ===== */}
      {tab === 'seo' && (
        <div className="max-w-4xl">
          <SeoPagesTab settings={settings} updateSettings={updateSettings} mode="global" />
        </div>
      )}

      {/* ===== PAGES TAB ===== */}
      {tab === 'pages' && (
        <div className="max-w-4xl space-y-6">
          <div className="flex border-b border-surface-200 dark:border-surface-800">
            <button
              onClick={() => setPagesSubTab('static')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                pagesSubTab === 'static'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              Static Pages
            </button>
            <button
              onClick={() => setPagesSubTab('seo')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                pagesSubTab === 'seo'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              SEO Pages
            </button>
          </div>

          {pagesSubTab === 'static' ? (
            <StaticPagesTab
              key={[
                settings.pageAbout,
                settings.pagePrivacy,
                settings.pageTerms,
                settings.pageDmca,
                settings.pageDisclaimer,
                settings.pageContact,
              ].join('|')}
              settings={settings}
              updateSettings={updateSettings}
            />
          ) : (
            <SeoPagesTab settings={settings} updateSettings={updateSettings} mode="pages" />
          )}
        </div>
      )}
      {tab === 'ai-studio' && (
        <AiStudioTab
          posts={posts}
          onCreateArticleFromAi={(content) => {
            navigator.clipboard.writeText(content);
            pushAdminRoute('articles');
            showToast('AI response copied to clipboard! Switched to Articles tab.', 'success');
          }}
          onCreatePostFromAi={(promptText, imageUrl) => {
            setImages([{ id: generateId(), url: imageUrl || '', prompt: promptText, aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
            setTitle(promptText.slice(0, 60));
            pushAdminRoute('posts');
            showToast('New post pre-filled from AI Studio!', 'success');
          }}
        />
      )}
          </div>
        </main>
      </div>
      <MediaLibraryModal 
        isOpen={!!mediaLibraryCallback} 
        onClose={() => setMediaLibraryCallback(null)}
        onSelect={(url) => mediaLibraryCallback?.(url)}
      />
    </div>
  );
}
