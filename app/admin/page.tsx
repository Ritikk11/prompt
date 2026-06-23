'use client';
export const runtime = 'edge';
import { useState, useEffect, useRef } from 'react';
import { useData } from '@/components/context/DataContext';
import { aiTools } from '@/lib/data/seedData';
import type { Post, Section, ImagePrompt, PostFaq, AdSettings, SiteSettings, SiteFeatures, FooterLinkGroup, HomeLinkBlock, HomepageBlockContent, KeepExploringSettings, NavLink, AdminUserSummary, FilterRailItem, ShareTarget, Author } from '@/lib/types';
import { createClient as createSupabaseClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import {
  Plus, Trash2, Edit3, Eye, EyeOff, ChevronUp, ChevronDown,
  Save, X, FileText, LayoutGrid, Star, StarOff, Upload,
  Settings, Check, Search, RotateCcw, GripVertical, Image as ImageIcon,
  Zap, Layers, Info, LayoutTemplate, BarChart2, Sparkles, Wand2, Tag, ArrowRight, Users, MessageCircle, Grid3X3
} from 'lucide-react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { imageModelOptions, getAllTools, getDefaultImageModel, getImageModelForTools, getToolInfo } from '@/lib/constants';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoPagesTab from '@/components/admin/SeoPagesTab';
import StaticPagesTab from '@/components/admin/StaticPagesTab';
import { getSectionPath } from '@/lib/sections';
import { getFilterTagsFromPosts } from '@/lib/filter-tags';
import { optimizeImageFile, optimizeImageToDataUrl, type ImageOptimizePreset } from '@/lib/client-image-optimizer';
import PostCard from '@/components/PostCard';
import HomeHowItWorks from '@/components/HomeHowItWorks';
import HomeReviewProcess from '@/components/HomeReviewProcess';
import HomePromptOfDay from '@/components/HomePromptOfDay';
import HomeSupportedTools from '@/components/HomeSupportedTools';
import HomeCreativeDirections from '@/components/HomeCreativeDirections';
import HomeCreatorFeedback from '@/components/HomeCreatorFeedback';
import HomeNewsletter from '@/components/HomeNewsletter';
import { getAuthors, normalizeAuthor, slugifyAuthor } from '@/lib/authors';



type AdminTab = 'dashboard' | 'posts' | 'sections' | 'settings' | 'submissions' | 'comments' | 'users' | 'seo' | 'pages';
type SettingsSubTab = 'general' | 'homepage' | 'navigation' | 'footer' | 'features' | 'ads' | 'ai-tools' | 'comments' | 'share';
type SectionLocationFilter = 'homepage' | 'header' | 'footer' | 'all';

const adminTabKeys: AdminTab[] = ['dashboard', 'posts', 'sections', 'settings', 'submissions', 'comments', 'users', 'seo', 'pages'];
const settingsSubTabKeys: SettingsSubTab[] = ['general', 'homepage', 'navigation', 'footer', 'features', 'ads', 'ai-tools', 'comments', 'share'];
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
  { key: 'creatorFeedback', featureKey: 'showHomepageCreatorFeedback', title: 'Creator feedback' },
  { key: 'newsletter', featureKey: 'showHomepageNewsletter', title: 'Newsletter' },
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

:::tip
Add reference images for more accurate outputs.
:::

:::creative
Use cinematic lighting, a clear subject, and one strong visual style.
:::

:::prompt
Ultra detailed poster art, dramatic lighting, sharp composition
:::

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

function cleanNavLinks(links: NavLink[] = []) {
  return links.map(link => ({
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

function cleanRailItems(items: FilterRailItem[] = []) {
  return items
    .map(item => ({
      label: item.label.trim(),
      type: item.type || 'tag',
      value: item.value.trim(),
    }))
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

function getAutoCreativeItems(posts: Post[]): FilterRailItem[] {
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
    v1: 'Hover Overlay',
    v2: 'Floating Image with Border',
    v3: 'Compact Editorial',
    v4: 'Social Card',
    v5: 'Brutalist',
    v6: 'Gradient Overlay',
    v7: 'Polaroid',
    v8: 'Glass Panel',
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

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">{label}</p>
        <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[10px] font-black text-primary-600 dark:text-primary-300">{cardStyleName(activeStyle)}</span>
      </div>
      <div className="mx-auto max-w-[280px] overflow-hidden rounded-xl bg-white p-2 dark:bg-surface-900">
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
    if (blockKey === 'newsletter') return <HomeNewsletter settings={previewSettings} />;
    return null;
  })();

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Actual block preview</p>
        <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[10px] font-black text-primary-600 dark:text-primary-300">{title}</span>
      </div>
      <div className="h-[560px] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-950">
        <div className="pointer-events-none origin-top-left scale-[0.32] [width:1200px]">
          {actualPreview}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-surface-500">
        This is the real homepage component scaled down for admin preview.
      </p>
    </div>
  );
}

export default function Admin() {
  const {
    posts, sections, settings, addPost, updatePost, deletePost,
    addSection, updateSection, deleteSection, updateSettings, resetData, deleteMockData, loading, loadAdminData
  } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminChecking, setAdminChecking] = useState(false);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const isAdmin = Boolean(user && !adminAccessDenied);

  const initialDataLoaded = useRef(false);
  const lastAuthUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user && !initialDataLoaded.current) {
      setAdminChecking(true);
      const loadUsers = async () => {
        try {
          await loadAdminData();
          const supabase = createSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('/api/admin', {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || 'Admin request failed');
          if (res.ok && Array.isArray(json.users)) setAdminUsers(json.users);
          setAdminAccessDenied(false);
        } catch (error) {
          console.error('Failed to load admin data', error);
          setAdminAccessDenied(true);
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
      lastAuthUserId.current = nextUserId;
      setUser(nextUser);
      if (userChanged) {
        initialDataLoaded.current = false;
        setAdminAccessDenied(false);
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
              if (error) alert('Error updating password: ' + error.message);
              else {
                alert('Password updated successfully!');
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
      applyAuthSession(session?.user ?? null);
      
      if (event === 'PASSWORD_RECOVERY') {
        const newPassword = prompt('Enter your new password:');
        if (newPassword) {
          supabase.auth.updateUser({ password: newPassword }).then(({ error }) => {
            if (error) alert('Error updating password: ' + error.message);
            else alert('Password updated successfully!');
          });
        }
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
      alert('Please allow popups for this site to sign in with Google.');
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
      let error = null;
      if (authMode === 'login') {
        const res = await supabase.auth.signInWithPassword({ email, password });
        error = res.error;
      } else {
        const res = await supabase.auth.signUp({ email, password });
        error = res.error;
        if (!error && res.data.user && !res.data.session) {
          alert("Signup successful! Please check your email to confirm your account.");
        }
      }
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
      alert('Password reset email sent! Check your inbox.');
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

  // Post form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [extendedDescription, setExtendedDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [faqs, setFaqs] = useState<PostFaq[]>([]);
  const [tagsStr, setTagsStr] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesStr, setCategoriesStr] = useState('');
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>([]);
  const [authorId, setAuthorId] = useState(settings.defaultAuthorId || getAuthors(settings)[0]?.id || 'editorial-team');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'pending' | 'draft'>('published');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [images, setImages] = useState<ImagePrompt[]>([{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
  const [assignedSections, setAssignedSections] = useState<string[]>([]);


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
  const [editSectionSeoTitle, setEditSectionSeoTitle] = useState('');
  const [editSectionSeoDescription, setEditSectionSeoDescription] = useState('');
  const [editSectionIntroContent, setEditSectionIntroContent] = useState('');
  const [pickingPostsForSection, setPickingPostsForSection] = useState<string | null>(null);
  const [postPickerSearch, setPostPickerSearch] = useState('');
  const [sectionPostSearch, setSectionPostSearch] = useState('');
  const [promptOfDayPickerSearch, setPromptOfDayPickerSearch] = useState('');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPromptInstruction, setAiPromptInstruction] = useState('');

  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteLogo, setSiteLogo] = useState(settings.siteLogo || '');
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [heroEnabled, setHeroEnabled] = useState(settings.heroEnabled);
  const [heroAutoPlay, setHeroAutoPlay] = useState(settings.heroAutoPlay);
  const [heroStyle, setHeroStyle] = useState(settings.heroStyle || 'v1');
  const [postHeroStyle, setPostHeroStyle] = useState(settings.postHeroStyle || 'v1');
  const [cardStyle, setCardStyle] = useState(settings.cardStyle || 'v1');
  const [badgeStyle, setBadgeStyle] = useState(settings.badgeStyle || 'v1');
  const [adminEmailsStr, setAdminEmailsStr] = useState((settings.adminEmails || []).join(', '));
  const [authors, setAuthors] = useState<Author[]>(getAuthors(settings));
  const [defaultAuthorId, setDefaultAuthorId] = useState(settings.defaultAuthorId || getAuthors(settings)[0]?.id || 'editorial-team');
  const [headerLinks, setHeaderLinks] = useState<NavLink[]>(settings.headerLinks || []);
  const [homeLinkBlocks, setHomeLinkBlocks] = useState<HomeLinkBlock[]>(settings.homeLinkBlocks || []);
  const [homepageContent, setHomepageContent] = useState<Record<string, HomepageBlockContent>>(settings.homepageContent || {});
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
    settings.exploreFilterItems || tagsToRailItems(settings.exploreFilterTags || [])
  );
  const [creativeDirectionItems, setCreativeDirectionItems] = useState<FilterRailItem[]>(
    settings.creativeDirectionItems || []
  );
  const [footerLinkGroups, setFooterLinkGroups] = useState<FooterLinkGroup[]>(settings.footerLinkGroups || defaultFooterLinkGroups);
  const [imgbbApiKey, setImgbbApiKey] = useState(settings.imgbbApiKey || '');
  const [imageProvider, setImageProvider] = useState<'imgbb' | 'cloudinary' | 'supabase'>(settings.imageProvider || 'imgbb');
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(settings.cloudinaryCloudName || '');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState(settings.cloudinaryUploadPreset || '');
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
      mobileColumns: 2,
      desktopColumns: 4,
    }
  );

  const [settingsSubTab, setSettingsSubTabState] = useState<SettingsSubTab>(() => parseSettingsSubTab(searchParams.get('sub')));
  const [markdownMode, setMarkdownMode] = useState<'edit' | 'preview'>('edit');
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [isBackfillingModels, setIsBackfillingModels] = useState(false);

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
    if (settings.siteDescription !== undefined) setSiteDescription(settings.siteDescription);
    if (settings.heroEnabled !== undefined) setHeroEnabled(settings.heroEnabled);
    if (settings.heroAutoPlay !== undefined) setHeroAutoPlay(settings.heroAutoPlay);
    if (settings.heroStyle !== undefined) setHeroStyle(settings.heroStyle);
    if (settings.postHeroStyle !== undefined) setPostHeroStyle(settings.postHeroStyle);
    if (settings.cardStyle !== undefined) setCardStyle(settings.cardStyle);
    if (settings.badgeStyle !== undefined) setBadgeStyle(settings.badgeStyle);
    if (settings.adminEmails !== undefined) setAdminEmailsStr((settings.adminEmails || []).join(', '));
    if (settings.authors !== undefined || settings.defaultAuthorId !== undefined) {
      const nextAuthors = getAuthors(settings);
      setAuthors(nextAuthors);
      setDefaultAuthorId(settings.defaultAuthorId || nextAuthors[0]?.id || 'editorial-team');
      setAuthorId(current => current || settings.defaultAuthorId || nextAuthors[0]?.id || 'editorial-team');
    }
    if (settings.headerLinks !== undefined) setHeaderLinks(settings.headerLinks || []);
    if (settings.homeLinkBlocks !== undefined) setHomeLinkBlocks(settings.homeLinkBlocks || []);
    if (settings.homepageContent !== undefined) setHomepageContent(settings.homepageContent || {});
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
    if (settings.exploreFilterItems !== undefined || settings.exploreFilterTags !== undefined) {
      setExploreFilterItems(settings.exploreFilterItems || tagsToRailItems(settings.exploreFilterTags || []));
    }
    if (settings.creativeDirectionItems !== undefined) setCreativeDirectionItems(settings.creativeDirectionItems || []);
    if (settings.footerLinkGroups !== undefined) setFooterLinkGroups(settings.footerLinkGroups || defaultFooterLinkGroups);
    if (settings.imgbbApiKey !== undefined) setImgbbApiKey(settings.imgbbApiKey);
    if (settings.imageProvider !== undefined) setImageProvider(settings.imageProvider);
    if (settings.cloudinaryCloudName !== undefined) setCloudinaryCloudName(settings.cloudinaryCloudName);
    if (settings.cloudinaryUploadPreset !== undefined) setCloudinaryUploadPreset(settings.cloudinaryUploadPreset);
    if (settings.ads) setAdsConfig(settings.ads);
    if (settings.features) setFeatures(settings.features);
  }, [settings]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'sections' | 'settings'>('dashboard');

  // Get custom sections for assignment
  const customSections = sections.filter(s => s.type === 'custom');
  const publicPosts = getPublicPosts(posts);
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
  const autoCreativeItems = getAutoCreativeItems(posts);
  const savedCreativeItems = cleanRailItems(creativeDirectionItems);
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
    if (key === 'newsletter') return 'Static newsletter capture section';
    return 'Homepage block';
  };

  const resetForm = () => {
    setTitle(''); setSlug(''); setDescription(''); setExtendedDescription(''); setThumbnailUrl(''); setReferenceImages([]); setSeoTitle(''); setSeoDescription(''); setFaqs([]); setTagsStr(''); setCategory(''); setCategoriesStr(''); setSelectedAiTools([]);
    setAuthorId(defaultAuthorId || authors[0]?.id || 'editorial-team');
    setFeatured(false); setImages([{ id: generateId(), url: '', prompt: '', aiTool: 'ChatGPT', model: getDefaultImageModel('ChatGPT') }]);
    setStatus('published'); setVisibility('public');
    setEditingPost(null); setShowPostForm(false); setAssignedSections([]);
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
    setFaqs(post.faqs || []);
    setTagsStr(post.tags.join(', '));
    setCategory(post.category || '');
    setCategoriesStr(post.categories?.join(', ') || '');
    setSelectedAiTools(post.aiTools || []);
    setAuthorId(post.authorId || defaultAuthorId || authors[0]?.id || 'editorial-team');
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
      const post = posts.find(item => item.id === id || item.slug === id);
      if (post && editingPost?.id !== post.id) {
        startEdit(post);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, posts]);

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
      alert('All image model labels are already filled.');
      return;
    }

    setIsBackfillingModels(true);
    try {
      for (const post of postsToUpdate) {
        await updatePost(post);
      }
      await loadAdminData();
      alert(`Filled model labels for ${postsToUpdate.length} posts.`);
    } catch (error: any) {
      console.error('Failed to backfill models:', error);
      alert(`Failed to fill model labels: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsBackfillingModels(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImageFile = async (file: File, preset: ImageOptimizePreset = 'prompt'): Promise<string> => {
    const optimizedFile = await optimizeImageFile(file, preset);

    if (imageProvider === 'cloudinary' && cloudinaryCloudName && cloudinaryUploadPreset) {
      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('upload_preset', cloudinaryUploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) return data.secure_url;
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    } else if (imageProvider === 'supabase') {
      const supabase = createSupabaseClient();
      const ext = optimizedFile.name.split('.').pop() || 'webp';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, optimizedFile, {
        contentType: optimizedFile.type || 'image/webp',
        cacheControl: '31536000',
      });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      return publicUrl;
    } else if ((imageProvider === 'imgbb' || !imageProvider) && imgbbApiKey) {
      const formData = new FormData();
      formData.append('image', optimizedFile);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) return data.data.url;
      throw new Error(data.error?.message || 'ImgBB upload failed');
    }
    
    return await optimizeImageToDataUrl(file, preset);
  };

  const handleImageUpload = async (idx: number, file: File) => {
    try {
      updateImage(idx, 'url', 'Uploading...');
      const url = await uploadImageFile(file, 'prompt');
      updateImage(idx, 'url', url);
    } catch (err) {
      console.error(err);
      alert('Failed to process image');
      updateImage(idx, 'url', '');
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
      alert("Please add at least one image with a prompt first before generating details.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      // Get last 5 posts for style context
      const existingPostsContext = posts.slice(0, 5).map(p => ({ title: p.title, description: p.description }));
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
          promptInstruction: aiPromptInstruction
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
      
      alert("Generated details successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate details. " + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSavePost = async () => {
    if (!thumbnailUrl) {
      alert('Thumbnail URL is required');
      return;
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || generateId();

    // Check for duplicate slugs
    const slugInUse = posts.some(p => p.slug === finalSlug && p.id !== (editingPost?.id || ''));
    if (slugInUse) {
      alert('This slug is already in use. Please choose a different one.');
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
      authorId: authorId || defaultAuthorId || authors[0]?.id || 'editorial-team',
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
      resetForm();
      alert(!isFinished && status === 'published'
        ? 'Post saved as draft because some required fields (title, description, or images) are missing.'
        : 'Post saved successfully.');
    } catch (error: any) {
      console.error('Failed to save post:', error);
      alert(`Failed to save post: ${error?.message || 'Unknown error'}`);
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
    if (action === 'delete' && !confirm(`Delete ${selected.length} selected posts?`)) return;

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
    setEditSectionSeoTitle(section.seoTitle || '');
    setEditSectionSeoDescription(section.seoDescription || '');
    setEditSectionIntroContent(section.introContent || '');
    setEditSectionFilterTags((section.filterTags || []).join(', '));
  };

  const saveEditSection = (section: Section) => {
    const latestSection = sections.find(item => item.id === section.id) || section;
    updateSection({
      ...latestSection,
      name: editSectionName,
      slug: editSectionSlug || slugify(editSectionName),
      limit: editSectionLimit,
      cardStyle: editSectionCardStyle || undefined,
      seoTitle: editSectionSeoTitle || undefined,
      seoDescription: editSectionSeoDescription || undefined,
      introContent: editSectionIntroContent || undefined,
      filterTags: cleanCommaList(editSectionFilterTags),
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

  const updateHomepageContent = (key: string, field: keyof HomepageBlockContent, value: string) => {
    setHomepageContent(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
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

  const updateRailItem = (list: 'explore' | 'creative', index: number, field: keyof FilterRailItem, value: string) => {
    const setter = list === 'explore' ? setExploreFilterItems : setCreativeDirectionItems;
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addRailItem = (list: 'explore' | 'creative') => {
    const setter = list === 'explore' ? setExploreFilterItems : setCreativeDirectionItems;
    setter(prev => [...prev, { label: '', type: 'tag', value: '' }]);
  };

  const removeRailItem = (list: 'explore' | 'creative', index: number) => {
    const setter = list === 'explore' ? setExploreFilterItems : setCreativeDirectionItems;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const moveHomepageItem = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= orderedHomepageItems.length) return;
    const next = [...orderedHomepageItems];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setHomepageBlockOrder(next);
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
    const cleanAuthors = authors
      .map(author => normalizeAuthor({
        ...author,
        slug: author.slug || slugifyAuthor(author.name),
        updatedAt: new Date().toISOString(),
      }))
      .filter(author => author.name.trim());
    const resolvedAuthors = cleanAuthors.length ? cleanAuthors : getAuthors({ ...settings, siteTitle, siteLogo });
    const resolvedDefaultAuthorId = resolvedAuthors.some(author => author.id === defaultAuthorId)
      ? defaultAuthorId
      : resolvedAuthors[0]?.id;

    updateSettings({
      ...settings,
      siteTitle,
      siteLogo,
      siteDescription,
      heroEnabled,
      heroAutoPlay,
      heroStyle,
      postHeroStyle,
      cardStyle,
      badgeStyle,
      adminEmails: adminEmailsStr.split(',').map(e => e.trim()).filter(Boolean),
      authors: resolvedAuthors,
      defaultAuthorId: resolvedDefaultAuthorId,
      headerLinks: cleanNavLinks(headerLinks),
      homeLinkBlocks: cleanHomeBlocks(homeLinkBlocks),
      homepageContent,
      keepExploring: cleanKeepExploring(keepExploring),
      homepageBlockOrder: orderedHomepageItems,
      exploreFilterTags: cleanCommaList(exploreFilterTags),
      exploreFilterItems: cleanRailItems(exploreFilterItems),
      creativeDirectionItems: cleanRailItems(creativeDirectionItems),
      footerLinkGroups: cleanFooterGroups(footerLinkGroups),
      aiTools: settings.aiTools || ['ChatGPT', 'Gemini', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'Claude'],
      ads: adsConfig,
      imgbbApiKey,
      imageProvider,
      cloudinaryCloudName,
      cloudinaryUploadPreset,
      features,
    });
    alert('Settings saved!');
  };

  // AI Tools Management
  const [newAiTool, setNewAiTool] = useState('');
  const [editingAiTool, setEditingAiTool] = useState<string | null>(null);
  const [editAiToolValue, setEditAiToolValue] = useState('');
  const [editAiToolLogo, setEditAiToolLogo] = useState('');
  const [editAiToolColor, setEditAiToolColor] = useState('');
  const [editAiToolLogoScale, setEditAiToolLogoScale] = useState<number>(1);

  const addAiTool = () => {
    const toolList = settings.aiTools || [];
    if (!newAiTool.trim()) return;
    if (toolList.includes(newAiTool.trim())) {
      alert('AI Tool already exists');
      return;
    }
    updateSettings({ ...settings, aiTools: [...toolList, newAiTool.trim()] });
    setNewAiTool('');
  };

  const removeAiTool = (tool: string) => {
    const inUse = posts.some(p => p.aiTools?.includes(tool) || p.images.some(img => img.aiTools ? img.aiTools.includes(tool) : img.aiTool === tool));
    if (inUse) {
      alert(`Cannot delete "${tool}" - it's used by existing posts. Remove or reassign those images first.`);
      return;
    }
    updateSettings({ ...settings, aiTools: (settings.aiTools || []).filter(t => t !== tool) });
  };

  const startEditAiTool = (tool: string) => {
    setEditingAiTool(tool);
    setEditAiToolValue(tool);
    const existing = settings.toolDetails?.[tool] || getToolInfo(tool);
    setEditAiToolLogo(existing.logo || '');
    setEditAiToolColor(existing.color || 'bg-surface-500');
    setEditAiToolLogoScale(existing.logoScale || 1);
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
    newToolDetails[newToolName] = { logo: editAiToolLogo, color: editAiToolColor, logoScale: editAiToolLogoScale };

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
      const url = await uploadImageFile(file, 'logo');
      setEditAiToolLogo(url);
    } catch (err) {
      console.error(err);
      alert('Failed to process image');
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

  const handleResetData = () => {
    if (confirm('This will reset ALL data to defaults (posts, sections, settings). Are you sure?')) {
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
  const adsSettings = settings.ads as (AdSettings & { publisherId?: string; autoAdsEnabled?: boolean }) | undefined;
  const settingsExtras = settings as SiteSettings & { ogImage?: string; defaultOgImage?: string; footerDescription?: string };
  const siteHealthChecks = [
    { label: 'AdSense meta tag present', ok: Boolean(adsSettings?.publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID) },
    { label: 'Auto Ads script active', ok: Boolean(adsSettings?.autoAdsEnabled) },
    { label: 'Sitemap accessible', ok: true },
    { label: 'Robots.txt present', ok: true },
    { label: 'OG image set', ok: Boolean(settingsExtras.ogImage || settingsExtras.defaultOgImage || settings.siteLogo) },
    { label: 'Footer description set', ok: Boolean((settingsExtras.footerDescription || settings.siteDescription || '').trim()) },
  ];
  const sectionLocationsToRender: Array<'homepage' | 'header' | 'footer'> =
    sectionLocationFilter === 'all' ? ['homepage', 'header', 'footer'] : [sectionLocationFilter as 'homepage' | 'header' | 'footer'];

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'posts', label: 'Posts', icon: <FileText className="w-4 h-4" />, count: posts.length },
    { key: 'sections', label: 'Sections', icon: <Layers className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { key: 'submissions', label: 'Submissions', icon: <Upload className="w-4 h-4" />, count: pendingSubmissionCount },
    { key: 'comments', label: 'Comments', icon: <MessageCircle className="w-4 h-4" />, count: pendingCommentCount },
    { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: adminUsers.length },
    { key: 'pages', label: 'Pages', icon: <FileText className="w-4 h-4" /> },
    { key: 'seo', label: 'SEO', icon: <LayoutTemplate className="w-4 h-4" /> },
  ];
  if (authLoading || adminChecking) {
    return <div className="flex h-[50vh] items-center justify-center text-surface-400">Loading admin...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] max-w-sm mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-6">
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
              className="w-full px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
              className="w-full px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            {authMode === 'login' ? 'Sign in with Email' : 'Sign up with Email'}
          </button>
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

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200 dark:border-surface-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-surface-900 text-surface-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex justify-center py-3 px-4 border border-surface-200 dark:border-surface-700 rounded-xl shadow-sm text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors mb-6"
        >
          Google
        </button>

        <div className="text-center">
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh] max-w-sm mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h1>
        <p className="text-surface-600 dark:text-surface-300 mb-8">
          Your email address ({user.email}) is not authorized to access the admin panel.
        </p>
        <button
          onClick={async () => {
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
            setUser(null);
          }}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">Full control over your site content & settings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const supabase = createSupabaseClient();
              await supabase.auth.signOut();
              setUser(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {tabs.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === item.key 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
                : 'bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            }`}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === item.key ? 'bg-white/20 text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== DASHBOARD TAB ===== */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              onClick={openNewPost}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" /> New Post
            </button>
            <button
              onClick={() => {
                setTab('sections');
                setSectionLocationFilter('homepage');
                startNewSection('homepage');
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-bold text-surface-700 hover:border-primary-400 hover:text-primary-600 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
            >
              <Layers className="h-4 w-4" /> New Section
            </button>
            <button
              onClick={() => window.open('/', '_blank')}
              className="flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-bold text-surface-700 hover:border-primary-400 hover:text-primary-600 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
            >
              <Eye className="h-4 w-4" /> View Site
            </button>
            <button
              onClick={() => loadAdminData()}
              className="flex items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-bold text-surface-700 hover:border-primary-400 hover:text-primary-600 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
            >
              <RotateCcw className="h-4 w-4" /> Clear Cache
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              ['Total Posts', posts.length, 'text-primary-600 bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800'],
              ['Total Views', totalViews.toLocaleString(), 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800'],
              ['Total Likes', totalLikes.toLocaleString(), 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'],
              ['Total Saves', totalSaves.toLocaleString(), 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'],
              ['Submissions Pending', pendingSubmissionCount, 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'],
            ].map(([label, value, tone]) => (
              <div key={label as string} className={`rounded-xl border p-4 ${tone}`}>
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs text-surface-500">{label}</p>
              </div>
            ))}
          </div>

          {pendingSubmissionCount > 0 && (
            <button
              onClick={() => setTab('submissions')}
              className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300"
            >
              <span>{pendingSubmissionCount} submissions waiting for review</span>
              <span className="inline-flex items-center gap-1">Go to Submissions <ArrowRight className="h-4 w-4" /></span>
            </button>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
              <h2 className="mb-4 text-sm font-bold">Site Health Checklist</h2>
              <div className="space-y-3">
                {siteHealthChecks.map(item => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${item.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-surface-700 dark:text-surface-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold">Recent Posts</h2>
                <button onClick={() => setTab('posts')} className="text-xs font-bold text-primary-600 dark:text-primary-300">View all</button>
              </div>
              <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-800">
                {recentPosts.length === 0 ? (
                  <p className="p-4 text-sm text-surface-500">No posts yet.</p>
                ) : (
                  <div className="divide-y divide-surface-200 dark:divide-surface-800">
                    {recentPosts.map(post => (
                      <div key={post.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-xs">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{post.title}</p>
                          <p className="truncate text-surface-500">{getAllTools(post).join(', ') || 'No tool'}</p>
                        </div>
                        <span className="text-surface-500">{(post.views || 0).toLocaleString()} views</span>
                        <span className={`rounded-full px-2 py-1 font-bold ${post.featured ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>
                          {post.featured ? 'Featured' : 'Normal'}
                        </span>
                        <button
                          onClick={() => openEditPost(post)}
                          className="rounded-lg px-2 py-1 font-bold text-primary-600 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
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
                <button
                  onClick={openNewPost}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
                >
                  <Plus className="w-4 h-4" /> Create New Post
                </button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    placeholder="Search posts..."
                  />
                </div>
              </div>
              <div className="mb-4 grid gap-2 md:grid-cols-5">
                <select value={postToolFilter} onChange={e => setPostToolFilter(e.target.value)} className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800">
                  <option value="">All tools</option>
                  {postToolOptions.map(tool => <option key={tool} value={tool}>{tool}</option>)}
                </select>
                <select value={postTagFilter} onChange={e => setPostTagFilter(e.target.value)} className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800">
                  <option value="">All tags</option>
                  {postTagOptions.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
                <select value={postStatusFilter} onChange={e => setPostStatusFilter(e.target.value)} className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800">
                  <option value="">All status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                </select>
                <select value={postFeaturedFilter} onChange={e => setPostFeaturedFilter(e.target.value)} className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800">
                  <option value="">All visibility</option>
                  <option value="featured">Featured</option>
                  <option value="not-featured">Not featured</option>
                  <option value="private">Private</option>
                </select>
                <select value={postSort} onChange={e => setPostSort(e.target.value as typeof postSort)} className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="views">Most views</option>
                  <option value="likes">Most likes</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-surface-200 bg-white p-3 text-xs dark:border-surface-800 dark:bg-surface-900">
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
                <button disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('feature')} className="rounded-lg bg-surface-100 px-3 py-1.5 font-bold text-surface-600 disabled:opacity-40 dark:bg-surface-800 dark:text-surface-200">Feature</button>
                <button disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('unfeature')} className="rounded-lg bg-surface-100 px-3 py-1.5 font-bold text-surface-600 disabled:opacity-40 dark:bg-surface-800 dark:text-surface-200">Unfeature</button>
                <button disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('publish')} className="rounded-lg bg-green-50 px-3 py-1.5 font-bold text-green-700 disabled:opacity-40 dark:bg-green-500/10 dark:text-green-300">Publish</button>
                <button disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('unpublish')} className="rounded-lg bg-surface-100 px-3 py-1.5 font-bold text-surface-600 disabled:opacity-40 dark:bg-surface-800 dark:text-surface-200">Unpublish</button>
                <button disabled={selectedPostIds.length === 0} onClick={() => applyBulkPostAction('delete')} className="rounded-lg bg-red-50 px-3 py-1.5 font-bold text-red-600 disabled:opacity-40 dark:bg-red-500/10 dark:text-red-300">Delete</button>
              </div>

              {/* Posts list */}
              <div className="grid gap-3">
                {filteredPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:shadow-md transition-shadow">
                    <input
                      type="checkbox"
                      checked={selectedPostIds.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="h-4 w-4 shrink-0 rounded text-primary-500"
                    />
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-800">
                      {post.images[0]?.url && (
                        <Image src={post.images[0].url} alt="" fill className="object-cover" sizes="80px" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{post.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/${post.slug || post.id}`;
                          navigator.clipboard.writeText(url);
                          alert('Link copied to clipboard!');
                        }}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title="Copy Post Link"
                      >
                        <svg className="w-4 h-4 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </button>
                      <button
                        onClick={() => updatePost({ ...post, visibility: post.visibility === 'private' ? 'public' : 'private' })}
                        className={`p-2 rounded-lg transition-colors ${post.visibility === 'private' ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                        title={post.visibility === 'private' ? 'Make Public' : 'Make Private'}
                      >
                        {post.visibility === 'private' ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-surface-400" />}
                      </button>
                      <button
                        onClick={() => updatePost({ ...post, featured: !post.featured })}
                        className={`p-2 rounded-lg transition-colors ${post.featured ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                        title={post.featured ? 'Remove from hero' : 'Add to hero'}
                      >
                        {post.featured ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="w-4 h-4 text-surface-400" />}
                      </button>
                      <button
                        onClick={() => duplicatePost(post)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title="Duplicate as private draft"
                      >
                        <FileText className="w-4 h-4 text-surface-400" />
                      </button>
                      <button
                        onClick={() => openEditPost(post)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-primary-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this post?')) deletePost(post.id); }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8 p-5 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800/30 rounded-xl space-y-4">
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
                  className="w-full min-h-20 px-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                />
                <button 
                  onClick={handleGenerateAiDetails}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {isGeneratingAi ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isGeneratingAi ? 'Generating Details...' : 'Generate Details'}
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Author / Reviewer</label>
                    <select
                      value={authorId}
                      onChange={e => setAuthorId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    >
                      {authors.filter(author => author.active !== false).map(author => (
                        <option key={author.id} value={author.id}>{author.name}{author.role ? ` - ${author.role}` : ''}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-surface-500">Shown as the public reviewer/byline and used in structured data.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-bold">FAQs</h4>
                      <p className="mt-1 text-xs text-surface-500">Questions shown on the post page and used for FAQ structured data.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-600"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add FAQ
                    </button>
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
                          <div key={index} className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
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
                              className="mb-2 w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                              placeholder="Question"
                            />
                            {duplicate && <p className="mb-2 text-xs font-bold text-amber-600">Duplicate question warning.</p>}
                            <textarea
                              value={faq.answer}
                              onChange={e => setFaqs(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, answer: e.target.value } : item))}
                              rows={3}
                              className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
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
                    <label className="block text-sm font-medium mb-1.5">Title *</label>
                    <input
                      value={title}
                      onChange={e => {
                        setTitle(e.target.value);
                        if (!editingPost) setSlug(slugify(e.target.value));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="Enter post title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">URL Slug *</label>
                    <input
                      value={slug}
                      onChange={e => setSlug(slugify(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="beautiful-modern-landscape"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Description *</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full min-h-[96px] px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                    placeholder="Describe this prompt collection..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Thumbnail URL *</label>
                  <div className="flex gap-2">
                    <input
                      value={thumbnailUrl}
                      onChange={e => setThumbnailUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="https://..."
                    />
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 cursor-pointer hover:border-primary-500 transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-surface-400" />
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
                               const url = await uploadImageFile(file, 'thumbnail');
                               setThumbnailUrl(url);
                             } catch (err) {
                               console.error(err);
                               alert('Failed to process thumbnail');
                               setThumbnailUrl('');
                             }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {thumbnailUrl && !thumbnailUrl.startsWith('Uploading') && (
                    <div className="mt-2 w-32 h-32 relative rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                      <Image src={thumbnailUrl} alt="Thumbnail preview" fill className="object-cover" unoptimized />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Reference Images (Optional)</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 cursor-pointer hover:border-primary-500 transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-surface-400" />
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
                                 files.map(file => uploadImageFile(file, 'reference'))
                               );
                               setReferenceImages(prev => [
                                 ...prev.filter(url => url !== 'Uploading...'),
                                 ...urls
                               ]);
                             } catch (err) {
                               console.error(err);
                               alert('Failed to process some reference images');
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
                        <div key={idx} className="w-32 h-32 relative rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 group">
                          {url === 'Uploading...' ? (
                            <div className="w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800 text-xs">Uploading...</div>
                          ) : (
                            <>
                              <Image src={url} alt={`Reference ${idx + 1}`} fill className="object-cover" unoptimized />
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setReferenceImages(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

                <div className="rounded-2xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900 sm:p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="text-sm font-medium">Extended Description / Content (Optional, useful for AdSense)</label>
                    <div className="flex flex-wrap gap-2">
                      <div className="grid grid-cols-2 rounded-xl bg-surface-100 p-1 text-xs font-semibold dark:bg-surface-800">
                        <button
                          type="button"
                          onClick={() => setMarkdownMode('edit')}
                          className={`rounded-lg px-3 py-1.5 transition-colors ${markdownMode === 'edit' ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-950 dark:text-white' : 'text-surface-500'}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarkdownMode('preview')}
                          className={`rounded-lg px-3 py-1.5 transition-colors ${markdownMode === 'preview' ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-950 dark:text-white' : 'text-surface-500'}`}
                        >
                          Preview
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMarkdownHelp(prev => !prev)}
                        className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-3 py-2 text-xs font-bold text-surface-600 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-surface-700 dark:text-surface-300"
                      >
                        <Info className="h-3.5 w-3.5" />
                        Formatting
                      </button>
                    </div>
                  </div>

                  {showMarkdownHelp && (
                    <div className="mb-3 grid gap-3 rounded-xl border border-primary-200 bg-primary-50/60 p-3 text-xs dark:border-primary-800/40 dark:bg-primary-950/20 md:grid-cols-2">
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-950 p-3 font-mono text-[11px] leading-relaxed text-surface-50">{MARKDOWN_HELP_EXAMPLE}</pre>
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
                      className="w-full min-h-[240px] resize-y rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 font-mono text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                      placeholder="Write a longer article or detailed description here to display at the bottom of the post page..."
                    />
                  ) : (
                    <div className="min-h-[240px] rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-950 sm:p-6">
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
                    <label className="block text-sm font-medium mb-1.5">Custom Search Title (SEO)</label>
                    <textarea
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      rows={2}
                      className="w-full min-h-[72px] px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                      placeholder="Title for Google search..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Custom Search Description (SEO)</label>
                    <textarea
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      rows={3}
                      className="w-full min-h-[96px] px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                      placeholder="Short snippet for search results..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
                    <textarea
                      value={tagsStr}
                      onChange={e => setTagsStr(e.target.value)}
                      rows={2}
                      className="w-full min-h-[72px] px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                      placeholder="fantasy, landscape, magical"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Categories (comma separated)</label>
                    <textarea
                      value={categoriesStr}
                      onChange={e => setCategoriesStr(e.target.value)}
                      rows={2}
                      className="w-full min-h-[72px] px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                      placeholder="e.g. UI, Characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">AI Tools</label>
                  <div className="flex flex-wrap gap-3">
                    {(settings.aiTools || []).map(tool => (
                      <label key={tool} className="flex items-center gap-2 cursor-pointer bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 px-3 py-2 rounded-xl text-sm">
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
                <div className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
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
                  <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary-500" />
                      Add to Custom Sections
                    </h4>
                    <p className="text-xs text-surface-400 mb-3">Select which custom sections this post should appear in</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customSections.map(section => (
                        <label
                          key={section.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
                            assignedSections.includes(section.id)
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                              : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-primary-300'
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Image
                    </button>
                  </div>

                  <div className="space-y-4">
                    {images.map((img, idx) => (
                      <div key={img.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" /> Image #{idx + 1}
                          </span>
                          {images.length > 1 && (
                            <button onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-surface-400 mb-1">Image URL or Upload</label>
                            <div className="flex gap-2">
                              <input
                                value={img.url}
                                onChange={e => updateImage(idx, 'url', e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                                placeholder="https://..."
                              />
                              <label className="p-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-500 transition-colors">
                                <Upload className="w-3.5 h-3.5 text-surface-400" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(idx, file);
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
                                    <label key={tool} className="flex items-center gap-1.5 cursor-pointer bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 px-2 py-1.5 rounded text-xs">
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
                                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-surface-600 dark:bg-surface-900"
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
                                    className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-surface-600 dark:bg-surface-900"
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
                            className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs resize-y"
                            placeholder="Enter the AI prompt..."
                          />
                        </div>

                        {img.url && (
                          <div className="relative mt-3 h-32 rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-700 flex items-center justify-center p-2">
                            <Image src={img.url} alt="" fill className="object-contain p-2" sizes="(max-width: 768px) 100vw, 33vw" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSavePost}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
                  >
                    <Save className="w-4 h-4" /> {editingPost ? 'Update Post' : 'Create Post'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SECTIONS TAB ===== */}
      {tab === 'sections' && (
        <div className="max-w-3xl">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 border-b border-surface-200 dark:border-surface-800">
            {[
              { id: 'homepage', label: 'Homepage Sections' },
              { id: 'header', label: 'Header Menu' },
              { id: 'footer', label: 'Footer Sections' },
              { id: 'all', label: 'All Sections' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSectionLocationFilter(item.id as SectionLocationFilter)}
                className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  sectionLocationFilter === item.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Add new section */}
          <div id="add-section-form" className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary-500" /> Add New Section
                </h3>
                <p className="mt-1 text-xs text-surface-500">Collapsed by default so the section list stays easy to scan.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => startNewSection('homepage')} className="rounded-lg bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-600">+ Homepage</button>
                <button onClick={() => startNewSection('header')} className="rounded-lg bg-surface-100 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700">+ Header</button>
                <button onClick={() => startNewSection('footer')} className="rounded-lg bg-surface-100 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700">+ Footer</button>
                <button onClick={() => setShowNewSectionForm(prev => !prev)} className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-bold text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800">
                  {showNewSectionForm ? 'Collapse' : 'Open form'}
                </button>
              </div>
            </div>
            {showNewSectionForm && (
              <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <input
                value={newSectionName}
                onChange={e => {
                  setNewSectionName(e.target.value);
                  if (!newSectionSlug) setNewSectionSlug(slugify(e.target.value));
                }}
                className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                placeholder="Section name (e.g., Hot Prompts)..."
              />
              <input
                value={newSectionSlug}
                onChange={e => setNewSectionSlug(slugify(e.target.value))}
                className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                placeholder="URL Slug (optional)"
              />
              <select
                value={newSectionLocation}
                onChange={e => setNewSectionLocation(e.target.value as 'homepage' | 'header' | 'footer')}
                className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
              >
                <option value="homepage">Homepage</option>
                <option value="header">Header Menu Link</option>
                <option value="footer">Footer Section</option>
              </select>
              <select
                value={newSectionType}
                onChange={e => setNewSectionType(e.target.value as Section['type'])}
                className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
              >
                <option value="latest">Latest Prompts</option>
                <option value="popular">Popular Posts</option>
                <option value="trending">Trending</option>
                <option value="ai-tool">AI Tool (auto-filter by tool)</option>
                <option value="tag">Tag (auto-filter by tag)</option>
                <option value="category">Category (auto-filter by category)</option>
                <option value="custom">Custom (pick posts manually)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {newSectionType === 'ai-tool' && (
                <select
                  value={newSectionTool}
                  onChange={e => setNewSectionTool(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                >
                  <option value="">Select AI tool...</option>
                  {(settings.aiTools || []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
              {newSectionType === 'tag' && (
                <input
                  value={newSectionTag}
                  onChange={e => setNewSectionTag(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                  placeholder="Enter tag (e.g., character, funny)..."
                />
              )}
              {newSectionType === 'category' && (
                <input
                  value={newSectionCategory}
                  onChange={e => setNewSectionCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                  placeholder="Enter category (e.g., UI, Game)..."
                />
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs text-surface-400 whitespace-nowrap">Post limit:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newSectionLimit}
                  onChange={e => setNewSectionLimit(parseInt(e.target.value) || 8)}
                  className="w-20 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                />
              </div>
              <div className="sm:col-span-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Card style override</label>
                  <select
                    value={newSectionCardStyle}
                    onChange={e => setNewSectionCardStyle(e.target.value as Section['cardStyle'] | '')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    title="Card style for this section"
                  >
                    <option value="">Use global card style</option>
                    <option value="v1">v1 - Hover Overlay</option>
                    <option value="v2">v2 - Floating Image with Border</option>
                    <option value="v3">v3 - Compact Editorial</option>
                    <option value="v4">v4 - Social Card</option>
                    <option value="v5">v5 - Brutalist</option>
                    <option value="v6">v6 - Gradient Overlay</option>
                    <option value="v7">v7 - Polaroid</option>
                    <option value="v8">v8 - Glass Panel</option>
                  </select>
                  <p className="mt-1 text-[11px] text-surface-500">
                    {newSectionCardStyle ? 'This section will ignore the global card style.' : `Using global card style: ${cardStyleName(cardStyle)}`}
                  </p>
                </div>
                <CardStylePreview style={newSectionCardStyle || cardStyle} badgeStyle={badgeStyle} label={newSectionCardStyle ? 'Section override preview' : 'Global style preview'} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-surface-400 mb-1">Optional filter tags</label>
                <input
                  value={newSectionFilterTags}
                  onChange={e => setNewSectionFilterTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                  placeholder="character, anime, realistic"
                />
                <p className="mt-1 text-[11px] text-surface-500">Adds a horizontal tag rail above this section grid. Tags must match post tags.</p>
              </div>
            </div>
            <button
              onClick={handleAddSection}
              disabled={!newSectionName || (newSectionType === 'ai-tool' && !newSectionTool) || (newSectionType === 'tag' && !newSectionTag) || (newSectionType === 'category' && !newSectionCategory)}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Section
            </button>
              </div>
            )}
          </div>

          {/* Sections Lists by Location */}
          <div className="space-y-8">
            {sectionLocationsToRender.map(loc => (
              <div key={loc} className="mb-4">
                <div className="mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm">{loc === 'homepage' ? 'Homepage Sections' : loc === 'header' ? 'Header Menu Sections' : 'Footer Sections'}</h3>
                    <button
                      type="button"
                      onClick={() => startNewSection(loc)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1.5 text-[11px] font-bold text-primary-600 hover:bg-primary-500/15 dark:text-primary-300"
                    >
                      <Plus className="h-3 w-3" /> Add {loc === 'homepage' ? 'homepage' : loc === 'header' ? 'header' : 'footer'} section
                    </button>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    {loc === 'homepage'
                      ? 'Edit homepage post sections here. Reorder them with the full homepage layout in Settings -> Homepage.'
                      : loc === 'header'
                        ? 'These appear in the header menu and open their full section pages.'
                        : 'Footer sections are ready for future footer placement and organization.'}
                  </p>
                  {loc === 'homepage' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('settings');
                        setSettingsSubTab('homepage');
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-500/10 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-500/15 dark:text-primary-300"
                    >
                      <Layers className="h-3.5 w-3.5" /> Open homepage order
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {[...sections].filter(s => (s.location || 'homepage') === loc).sort((a, b) => a.order - b.order).map((section, idx, arr) => {
                const isAutoSection = section.type === 'latest' || section.type === 'popular';
                const sectionPath = getSectionPath(section);
                return (
                  <div
                    key={section.id}
                    className={`rounded-xl border bg-white dark:bg-surface-900 overflow-hidden transition-all ${
                      !section.visible ? 'border-surface-200 dark:border-surface-800 opacity-60' : 'border-surface-200 dark:border-surface-800'
                    }`}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-3 p-4">
                      {/* Reorder buttons */}
                      {loc === 'homepage' ? (
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
                      )}

                      {/* Section info */}
                      <div className="flex-1 min-w-0">
                      {editingSectionId === section.id ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              value={editSectionName}
                              onChange={e => setEditSectionName(e.target.value)}
                              className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                              placeholder="Name"
                            />
                            <input
                              value={editSectionSlug}
                              onChange={e => setEditSectionSlug(slugify(e.target.value))}
                              className="w-40 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                              placeholder="Slug"
                            />
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={editSectionLimit}
                              onChange={e => setEditSectionLimit(parseInt(e.target.value) || 8)}
                              className="w-16 px-2 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm text-center"
                              title="Post limit"
                            />
                            <select
                              value={editSectionCardStyle}
                              onChange={e => setEditSectionCardStyle(e.target.value as Section['cardStyle'] | '')}
                              className="w-44 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                              title="Card style for this section"
                            >
                              <option value="">Global card style</option>
                              <option value="v1">v1 Hover Overlay</option>
                              <option value="v2">v2 Floating Image with Border</option>
                              <option value="v3">v3 Compact Editorial</option>
                              <option value="v4">v4 Social Card</option>
                              <option value="v5">v5 Brutalist</option>
                              <option value="v6">v6 Gradient Overlay</option>
                              <option value="v7">v7 Polaroid</option>
                              <option value="v8">v8 Glass Panel</option>
                            </select>
                            <input
                              value={editSectionFilterTags}
                              onChange={e => setEditSectionFilterTags(e.target.value)}
                              className="min-w-[220px] flex-1 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                              placeholder="Filter rail tags: anime, realistic"
                              title="Comma-separated filter tags shown as a horizontal rail"
                            />
                            <button onClick={() => saveEditSection(section)} className="p-1.5 rounded-lg bg-primary-500 text-white">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingSectionId(null)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            value={editSectionSeoTitle}
                            onChange={e => setEditSectionSeoTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
                            placeholder="SEO title shown on Google (optional)"
                          />
                          <textarea
                            value={editSectionSeoDescription}
                            onChange={e => setEditSectionSeoDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs resize-y"
                            placeholder="SEO meta description shown on Google (optional)"
                          />
                          <textarea
                            value={editSectionIntroContent}
                            onChange={e => setEditSectionIntroContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs resize-y"
                            placeholder="Intro content shown on the section page. Markdown supported."
                          />
                          {section.type === 'custom' && (
                            <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-surface-500">Add posts by title</p>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  value={sectionPostSearch}
                                  onChange={e => setSectionPostSearch(e.target.value)}
                                  className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                                  placeholder="Search published posts..."
                                />
                                <select
                                  value=""
                                  onChange={e => addPostToCustomSection(section, e.target.value)}
                                  className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 sm:w-80"
                                >
                                  <option value="">Choose a post to add...</option>
                                  {publicPosts
                                    .filter(post => !(section.postIds || []).includes(post.id))
                                    .filter(post => !sectionPostSearch || post.title.toLowerCase().includes(sectionPostSearch.toLowerCase()))
                                    .slice(0, 20)
                                    .map(post => <option key={post.id} value={post.id}>{post.title}</option>)}
                                </select>
                              </div>
                              <p className="mt-2 text-[11px] text-surface-500">{section.postIds?.length || 0} posts selected. The picker below can still be used for detailed ordering.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium text-sm truncate flex items-center gap-2">
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
                            {section.filterTags?.length ? <span>- Filters: {section.filterTags.join(', ')}</span> : null}
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
                          onClick={() => { if (confirm('Delete this section?')) deleteSection(section.id); }}
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
                    <div className="px-4 pb-3">
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
                    <div className="border-t border-surface-200 dark:border-surface-800 p-4 bg-surface-50 dark:bg-surface-800/50">
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
                          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs"
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
                </div>
              );
            })}

            {sections.filter(s => (s.location || 'homepage') === loc).length === 0 && (
              <div className="text-center py-10 text-surface-400">
                <LayoutGrid className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No sections yet for {loc === 'homepage' ? 'Homepage' : 'Header'}.</p>
              </div>
            )}
            </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {tab === 'settings' && (
        <div className={settingsSubTab === 'homepage' ? 'max-w-7xl' : 'max-w-3xl'}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 border-b border-surface-200 dark:border-surface-800">
            {[
              { id: 'general', label: 'General' },
              { id: 'homepage', label: 'Homepage' },
              { id: 'navigation', label: 'Navigation' },
              { id: 'footer', label: 'Footer Links' },
              { id: 'features', label: 'Features' },
              { id: 'ads', label: 'Ads' },
              { id: 'ai-tools', label: 'AI Tools' },
              { id: 'comments', label: 'Comments' },
              { id: 'share', label: 'Share Buttons' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSettingsSubTab(t.id as any)}
                className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  settingsSubTab === t.id 
                    ? 'border-primary-500 text-primary-500' 
                    : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {settingsSubTab === 'general' && (
              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary-500" /> Site Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1">Admin Emails (comma separated). Blank means only server-configured owner emails can access admin.</label>
                    <input
                      value={adminEmailsStr}
                      onChange={e => setAdminEmailsStr(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="admin@example.com, owner@example.com"
                    />
                  </div>
                  <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/40">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white">Authors / Reviewers</h4>
                        <p className="mt-1 text-xs text-surface-500">Public bylines, author pages, and post structured data for trust signals.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const id = `author-${generateId()}`;
                          setAuthors(prev => [...prev, {
                            id,
                            slug: id,
                            name: 'New Author',
                            role: 'Reviewer',
                            bio: '',
                            avatarUrl: '',
                            website: '',
                            active: true,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          }]);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-600"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Author
                      </button>
                    </div>
                    <div className="space-y-3">
                      {authors.map((author, index) => (
                        <div key={author.id} className="rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-surface-600 dark:text-surface-300">
                              <input
                                type="radio"
                                checked={defaultAuthorId === author.id}
                                onChange={() => setDefaultAuthorId(author.id)}
                                className="h-4 w-4 text-primary-500"
                              />
                              Default author
                            </label>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-surface-500">
                                <input
                                  type="checkbox"
                                  checked={author.active !== false}
                                  onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, active: e.target.checked } : item))}
                                  className="h-4 w-4 rounded text-primary-500"
                                />
                                Active
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (authors.length <= 1) return alert('Keep at least one author.');
                                  setAuthors(prev => prev.filter((_, itemIndex) => itemIndex !== index));
                                  if (defaultAuthorId === author.id) setDefaultAuthorId(authors.find((_, itemIndex) => itemIndex !== index)?.id || '');
                                }}
                                className="text-xs font-bold text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                              value={author.name}
                              onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value, slug: slugifyAuthor(e.target.value) } : item))}
                              className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                              placeholder="Author name"
                            />
                            <input
                              value={author.role || ''}
                              onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, role: e.target.value } : item))}
                              className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                              placeholder="Role, e.g. Editorial Reviewer"
                            />
                            <input
                              value={author.slug}
                              onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, slug: slugifyAuthor(e.target.value) } : item))}
                              className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                              placeholder="author-url-slug"
                            />
                            <input
                              value={author.avatarUrl || ''}
                              onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, avatarUrl: e.target.value } : item))}
                              className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                              placeholder="Avatar URL"
                            />
                            <input
                              value={author.website || ''}
                              onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, website: e.target.value } : item))}
                              className="sm:col-span-2 rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                              placeholder="Website URL"
                            />
                            <textarea
                              value={author.bio || ''}
                              onChange={e => setAuthors(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, bio: e.target.value } : item))}
                              rows={3}
                              className="sm:col-span-2 min-h-[96px] rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                              placeholder="Short author bio shown on post pages and /author profile."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Site Title</label>
                <div className="flex gap-2">
                  <input
                    value={siteTitle}
                    onChange={e => setSiteTitle(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    placeholder="AI PromptMatrix"
                  />
                  <button 
                    onClick={async () => {
                      try {
                        const { GoogleGenAI } = await import('@google/genai');
                        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
                        const response = await ai.models.generateContent({
                          model: 'gemini-2.5-flash',
                          contents: `Suggest 5 memorable, short domain names for a website titled "${siteTitle}" with description "${siteDescription}". Just return the options separated by commas.`
                        });
                        if (response.text) {
                          alert(`Suggested domains:\n${response.text}`);
                        }
                      } catch(e) {
                         alert('Could not generate domain names. Make sure NEXT_PUBLIC_GEMINI_API_KEY is configured.');
                      }
                    }}
                    className="px-4 py-2.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-sm font-medium rounded-xl border border-surface-200 dark:border-surface-700 whitespace-nowrap"
                  >
                    Suggest Domains
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Site Logo URL (Used in header & favicon)</label>
                <input
                  value={siteLogo}
                  onChange={e => setSiteLogo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Site Description</label>
                <textarea
                  value={siteDescription}
                  onChange={e => setSiteDescription(e.target.value)}
                  rows={2}
                  className="w-full min-h-[80px] px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm resize-y"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-2">Image Hosting Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { id: 'imgbb', label: 'ImgBB', desc: 'Free, simple' },
                    { id: 'cloudinary', label: 'Cloudinary', desc: 'Fast, secure' },
                    { id: 'supabase', label: 'Supabase Storage', desc: 'Native' },
                  ].map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => setImageProvider(provider.id as any)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                        imageProvider === provider.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                          : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300'
                      }`}
                    >
                      <span className="font-medium text-sm text-surface-900 dark:text-white">{provider.label}</span>
                      <span className="text-[10px] text-surface-500">{provider.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {imageProvider === 'imgbb' && (
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                  <label className="block text-xs font-medium text-surface-400 mb-1">ImgBB API Key</label>
                  <input
                    value={imgbbApiKey}
                    onChange={e => setImgbbApiKey(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    placeholder="Paste ImgBB API key..."
                  />
                  <p className="mt-2 text-[10px] text-surface-500">Firebase has a 1MB limit per document. Set this to offload images larger than 800KB.</p>
                </div>
              )}

              {imageProvider === 'cloudinary' && (
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1">Cloudinary Cloud Name</label>
                    <input
                      value={cloudinaryCloudName}
                      onChange={e => setCloudinaryCloudName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="e.g. dxyz123ab"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-400 mb-1">Upload Preset (Unsigned)</label>
                    <input
                      value={cloudinaryUploadPreset}
                      onChange={e => setCloudinaryUploadPreset(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      placeholder="e.g. my_unsigned_preset"
                    />
                    <p className="mt-2 text-[10px] text-surface-500">You must create an <strong>unsigned</strong> upload preset in your Cloudinary settings to allow direct uploads from the browser.</p>
                  </div>
                </div>
              )}

              {imageProvider === 'supabase' && (
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                  <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">
                    Images will be uploaded to your Supabase Storage images bucket.
                  </p>
                  <p className="text-[10px] text-surface-500 font-mono bg-surface-100 dark:bg-surface-900 p-2 rounded">
                    Make sure your Supabase Storage bucket is public.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroEnabled}
                    onChange={e => setHeroEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">Show hero slideshow</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroAutoPlay}
                    onChange={e => setHeroAutoPlay(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">Hero auto-play</span>
                </label>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1.5">Hero Style</label>
                <select
                  value={heroStyle}
                  onChange={e => setHeroStyle(e.target.value as any)}
                  className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                >
                  <option value="v1">Default: Classic Slider</option>
                  <option value="v9">Library Landing</option>
                  <option value="v3">Current: Diagonal Cards</option>
                  <option value="v4">Bento Feature Grid</option>
                  <option value="v8">Cinematic Edge</option>
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1.5">Post Hero Style</label>
                <select
                  value={postHeroStyle}
                  onChange={e => setPostHeroStyle(e.target.value as any)}
                  className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                >
                  <option value="v1">Default: Natural Display</option>
                  <option value="v7">Current: Full Screen Hero</option>
                  <option value="v2">Immersive Blur Background</option>
                  <option value="v8">Floating Card</option>
                </select>
              </div>
              <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Card Style</label>
                    <select
                      value={cardStyle}
                      onChange={e => setCardStyle(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    >
                      <option value="v1">v1 - Hover Overlay</option>
                      <option value="v2">v2 - Floating Image with Border</option>
                      <option value="v3">v3 - Compact Editorial</option>
                      <option value="v4">v4 - Social Card</option>
                      <option value="v5">v5 - Brutalist</option>
                      <option value="v6">v6 - Gradient Overlay</option>
                      <option value="v7">v7 - Polaroid</option>
                      <option value="v8">v8 - Glass Panel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Badge Style</label>
                    <select
                      value={badgeStyle}
                      onChange={e => setBadgeStyle(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
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
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors mt-8"
              >
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
          )}

          {/* Ad Spaces Management */}
          {settingsSubTab === 'navigation' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-primary-500" /> Current Header Navigation
                </h3>
                <p className="text-xs text-surface-500 mb-4">
                  This is what the header can show. Built-in links are controlled by the app; header sections are managed in Sections.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-surface-500 font-semibold mb-2">Built-in links</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Home', href: '/' },
                        { label: 'Explore', href: '/explore' },
                        ...(settings.features?.userSubmissions ? [{ label: 'Submit Prompt', href: '/submit' }] : []),
                        ...(settings.features?.userProfiles ? [{ label: 'Profile', href: '/profile' }] : []),
                      ].map(link => (
                        <span key={link.href} className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs">
                          {link.label} <span className="text-surface-500">{link.href}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-surface-500 font-semibold mb-2">Header sections</p>
                    <div className="flex flex-wrap gap-2">
                      {sections.filter(s => s.location === 'header' && s.visible).sort((a,b) => a.order - b.order).length > 0 ? (
                        sections.filter(s => s.location === 'header' && s.visible).sort((a,b) => a.order - b.order).map(section => (
                          <span key={section.id} className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs">
                            {section.name} <span className="text-surface-500">{getSectionPath(section)}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-surface-500">No header sections enabled.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-primary-500" /> Extra Header Links
                </h3>
                <p className="text-xs text-surface-500 mb-4">
                  Home, Explore, Submit, Profile, and header sections are handled automatically. Add only extra custom links here, one per line as Label | URL.
                </p>
                <div className="space-y-3">
                  {headerLinks.length === 0 && (
                    <p className="text-xs text-surface-500">No extra header links.</p>
                  )}
                  {headerLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        value={link.label}
                        onChange={e => updateHeaderLink(index, 'label', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                        placeholder="Label"
                      />
                      <input
                        value={link.href}
                        onChange={e => updateHeaderLink(index, 'href', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                        placeholder="/page/custom or https://..."
                      />
                      <button
                        onClick={() => setHeaderLinks(prev => prev.filter((_, i) => i !== index))}
                        className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setHeaderLinks(prev => [...prev, { label: '', href: '' }])}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Header Link
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors"
                  >
                    <Save className="w-4 h-4" /> Save Navigation
                  </button>
                </div>
              </div>
            </div>
          )}

          {settingsSubTab === 'homepage' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,780px)_minmax(360px,1fr)] xl:items-start">
              <div className="min-w-0 space-y-6">
              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-primary-500" /> Homepage Hero
                </h3>
                <p className="text-xs text-surface-500 mb-4">
                  Control the main homepage hero behavior and the library intro block above the slider.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-700 dark:bg-surface-800/50">
                    <input
                      type="checkbox"
                      checked={features.showHomepageLibraryHero ?? true}
                      onChange={(e) => setFeatures(prev => ({ ...prev, showHomepageLibraryHero: e.target.checked }))}
                      className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    Show library hero intro
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-700 dark:bg-surface-800/50">
                    <input
                      type="checkbox"
                      checked={heroEnabled}
                      onChange={e => setHeroEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    Show hero slideshow
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-700 dark:bg-surface-800/50">
                    <input
                      type="checkbox"
                      checked={heroAutoPlay}
                      onChange={e => setHeroAutoPlay(e.target.checked)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                    />
                    Hero auto-play
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-surface-500 mb-1.5">Hero Style</span>
                    <select
                      value={heroStyle}
                      onChange={e => setHeroStyle(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    >
                      <option value="v1">Default: Classic Slider</option>
                      <option value="v9">Library Landing</option>
                      <option value="v3">Current: Diagonal Cards</option>
                      <option value="v4">Bento Feature Grid</option>
                      <option value="v8">Cinematic Edge</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary-500" /> Prompt of the Day
                    </h3>
                    <p className="text-xs text-surface-500">
                      Pick the exact post used by the featured Prompt of the Day homepage block.
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-500/10 px-3 py-1.5 text-[11px] font-bold text-primary-600 dark:text-primary-300">
                    {pinnedPromptOfDayId ? 'Pinned post' : 'Auto fallback'}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                  <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-surface-400">Current live choice</p>
                    {currentPromptOfDay && currentPromptOfDayImage && (
                      <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg bg-surface-200 dark:bg-surface-800">
                        <Image
                          src={currentPromptOfDayImage}
                          alt={currentPromptOfDay.title}
                          fill
                          className="object-cover"
                          sizes="260px"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <p className="mt-2 text-sm font-bold text-surface-950 dark:text-white">{currentPromptOfDay?.title || 'No public post available'}</p>
                    <p className="mt-1 text-xs text-surface-500">
                      {currentPromptOfDay ? (pinnedPromptOfDayId ? 'Selected manually from admin.' : currentPromptOfDay.featured ? 'Using first featured post.' : 'Using latest public post.') : 'Create or publish a post first.'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Custom post picker</p>
                        <button
                          type="button"
                          onClick={() => updateHomepageContent('promptOfDay', 'pinnedPostId', '')}
                          className="self-start rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-surface-600 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800 sm:self-auto"
                        >
                          Use auto fallback
                        </button>
                      </div>
                      <input
                        value={promptOfDayPickerSearch}
                        onChange={e => setPromptOfDayPickerSearch(e.target.value)}
                        className="mb-3 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                        placeholder="Search any published post by title, tag, category, or AI tool..."
                      />
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {promptOfDayPickerPosts.map(post => {
                          const imageUrl = post.thumbnailUrl || post.images?.[0]?.url || '';
                          const selected = pinnedPromptOfDayId === post.id || pinnedPromptOfDayId === post.slug;
                          return (
                            <button
                              key={post.id}
                              type="button"
                              onClick={() => updateHomepageContent('promptOfDay', 'pinnedPostId', post.id)}
                              className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                                selected
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                  : 'border-surface-200 bg-white hover:border-primary-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-500'
                              }`}
                            >
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-200 dark:bg-surface-800">
                                {imageUrl ? (
                                  <Image src={imageUrl} alt="" fill className="object-cover" sizes="56px" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-[10px] font-bold text-surface-400">No img</div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-surface-950 dark:text-white">{post.title}</p>
                                <p className="mt-1 truncate text-[11px] text-surface-500">
                                  {post.featured ? 'Featured - ' : ''}{getAllTools(post).join(', ') || post.category || 'Published post'}
                                </p>
                              </div>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${selected ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-300'}`}>
                                {selected ? 'Selected' : 'Pick'}
                              </span>
                            </button>
                          );
                        })}
                        {promptOfDayPickerPosts.length === 0 && (
                          <p className="rounded-lg bg-white px-3 py-4 text-center text-xs text-surface-500 dark:bg-surface-900">No published posts match that search.</p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input value={promptOfDayContent.badge || ''} onChange={e => updateHomepageContent('promptOfDay', 'badge', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Badge / eyebrow" />
                      <input value={promptOfDayContent.ctaLabel || ''} onChange={e => updateHomepageContent('promptOfDay', 'ctaLabel', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Button label" />
                      <input value={promptOfDayContent.title || ''} onChange={e => updateHomepageContent('promptOfDay', 'title', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Heading" />
                      <textarea value={promptOfDayContent.description || ''} onChange={e => updateHomepageContent('promptOfDay', 'description', e.target.value)} rows={2} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Description" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600"
                    >
                      <Save className="h-4 w-4" /> Save Prompt of the Day
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-500" /> Homepage Sections Order
                </h3>
                <p className="text-xs text-surface-500 mb-4">
                  Reorder the added homepage blocks. This order is used on the live homepage after the hero and quick cards.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab('sections');
                    setNewSectionLocation('homepage');
                  }}
                  className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary-500/10 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-500/15 dark:text-primary-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Section
                </button>
                <div className="space-y-2">
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
                    return (
                      <div key={token} className={`rounded-lg border border-surface-200 bg-surface-50 p-3 transition dark:border-surface-700 dark:bg-surface-800/50 ${section && !section.visible ? 'opacity-55' : ''}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-black text-surface-500 dark:bg-surface-900 dark:text-surface-300">{index + 1}</span>
                              <p className="text-sm font-bold text-surface-950 dark:text-white">{title}</p>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${isSection ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'bg-primary-500/10 text-primary-600 dark:text-primary-300'}`}>
                                {isSection ? 'POST SECTION' : 'BLOCK'}
                              </span>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${enabled ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-300'}`}>
                                {enabled ? 'ON' : 'OFF'}
                              </span>
                            </div>
                            <p className="mt-1 pl-8 text-[11px] leading-5 text-surface-500">{detail}</p>
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
                            <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-surface-600 dark:bg-surface-900 dark:text-surface-200">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => {
                                  if (section) updateSection({ ...section, visible: e.target.checked });
                                  else setFeatures(prev => ({ ...prev, [option!.featureKey]: e.target.checked }));
                                }}
                                className="h-4 w-4 rounded text-primary-500"
                              />
                              Show
                            </label>
                          </div>
                        </div>
                        {section && editingSectionId === section.id && (
                          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <input value={editSectionName} onChange={e => setEditSectionName(e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Section title" />
                              <input value={editSectionSlug} onChange={e => setEditSectionSlug(slugify(e.target.value))} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Slug" />
                              <input type="number" min={1} max={50} value={editSectionLimit} onChange={e => setEditSectionLimit(parseInt(e.target.value) || 8)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Post limit" />
                              <div className="grid gap-3 sm:col-span-2 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                                <div>
                                  <label className="block text-xs text-surface-400 mb-1">Card style override</label>
                                  <select value={editSectionCardStyle} onChange={e => setEditSectionCardStyle(e.target.value as Section['cardStyle'] | '')} className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800">
                                    <option value="">Use global card style</option>
                                    <option value="v1">v1 Hover Overlay</option>
                                    <option value="v2">v2 Floating Image with Border</option>
                                    <option value="v3">v3 Compact Editorial</option>
                                    <option value="v4">v4 Social Card</option>
                                    <option value="v5">v5 Brutalist</option>
                                    <option value="v6">v6 Gradient Overlay</option>
                                    <option value="v7">v7 Polaroid</option>
                                    <option value="v8">v8 Glass Panel</option>
                                  </select>
                                  <p className="mt-1 text-[11px] text-surface-500">
                                    {editSectionCardStyle ? 'This section will ignore the global card style.' : `Using global card style: ${cardStyleName(cardStyle)}`}
                                  </p>
                                </div>
                                <CardStylePreview style={editSectionCardStyle || cardStyle} badgeStyle={badgeStyle} label={editSectionCardStyle ? 'Section override preview' : 'Global style preview'} />
                              </div>
                              <input value={editSectionFilterTags} onChange={e => setEditSectionFilterTags(e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Filter rail tags: anime, realistic" />
                              <input value={editSectionSeoTitle} onChange={e => setEditSectionSeoTitle(e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="SEO title" />
                              <textarea value={editSectionSeoDescription} onChange={e => setEditSectionSeoDescription(e.target.value)} rows={2} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="SEO description" />
                              <textarea value={editSectionIntroContent} onChange={e => setEditSectionIntroContent(e.target.value)} rows={3} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Intro content" />
                            </div>
                            {section.type === 'custom' && (
                              <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-surface-500">Add posts by title</p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <input
                                    value={sectionPostSearch}
                                    onChange={e => setSectionPostSearch(e.target.value)}
                                    className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                                    placeholder="Search published posts..."
                                  />
                                  <select
                                    value=""
                                    onChange={e => addPostToCustomSection(section, e.target.value)}
                                    className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 sm:w-80"
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
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => saveEditSection(section)} className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-600"><Check className="h-4 w-4" /> Save section</button>
                              <button onClick={() => setEditingSectionId(null)} className="inline-flex items-center gap-2 rounded-lg bg-surface-100 px-4 py-2 text-sm font-bold text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"><X className="h-4 w-4" /> Cancel</button>
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
                                <input value={blockContent.badge || ''} onChange={e => updateHomepageContent(blockKey, 'badge', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Badge / eyebrow" />
                                {(blockKey === 'reviewProcess' || blockKey === 'promptOfDay' || blockKey === 'newsletter') && <input value={blockContent.ctaLabel || ''} onChange={e => updateHomepageContent(blockKey, 'ctaLabel', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Button label" />}
                                {blockKey === 'promptOfDay' && (
                                  <div className="grid gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50 sm:col-span-2 sm:grid-cols-[120px_1fr]">
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
                                  <div>
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
                                <input value={blockContent.title || ''} onChange={e => updateHomepageContent(blockKey, 'title', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Heading" />
                                <textarea value={blockContent.description || ''} onChange={e => updateHomepageContent(blockKey, 'description', e.target.value)} rows={2} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Description" />
                                {['howTo', 'reviewProcess', 'supportedTools', 'creatorFeedback'].includes(blockKey) && (
                                  <div className="space-y-3 sm:col-span-2">
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-surface-500">Inner cards</p>
                                  {(blockContent.items || []).map((item, itemIndex) => (
                                    <div key={`${blockKey}-${itemIndex}`} className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <input
                                          value={item.title || ''}
                                          onChange={e => updateHomepageItem(blockKey, itemIndex, 'title', e.target.value)}
                                          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                                          placeholder={blockKey === 'supportedTools' ? 'Tool name, e.g. ChatGPT' : 'Card title'}
                                        />
                                        <textarea
                                          value={item.text || ''}
                                          onChange={e => updateHomepageItem(blockKey, itemIndex, 'text', e.target.value)}
                                          rows={2}
                                          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900"
                                          placeholder={blockKey === 'supportedTools' ? 'Comma-separated note lines' : 'Card text'}
                                        />
                                        {blockKey === 'howTo' && (
                                          <textarea
                                            value={(item.checks || []).join('\n')}
                                            onChange={e => updateHomepageItem(blockKey, itemIndex, 'checks', e.target.value)}
                                            rows={3}
                                            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-900 sm:col-span-2"
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
                                {blockKey === 'creativeDirections' && <input value={blockContent.itemDescription || ''} onChange={e => updateHomepageContent(blockKey, 'itemDescription', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Card description line" />}
                                {blockKey === 'reviewProcess' && <input value={blockContent.ctaHref || ''} onChange={e => updateHomepageContent(blockKey, 'ctaHref', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Button URL" />}
                                {blockKey === 'newsletter' && (
                                  <>
                                    <input value={blockContent.inputPlaceholder || ''} onChange={e => updateHomepageContent(blockKey, 'inputPlaceholder', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Input placeholder" />
                                    <input value={blockContent.helperText || ''} onChange={e => updateHomepageContent(blockKey, 'helperText', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800" placeholder="Helper text" />
                                    <input value={blockContent.successText || ''} onChange={e => updateHomepageContent(blockKey, 'successText', e.target.value)} className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800 sm:col-span-2" placeholder="Success text" />
                                  </>
                                )}
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
              </div>

              <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-500" /> Explore Filter Rail
                </h3>
                <p className="text-xs text-surface-500 mb-4">
                  Add custom chips for the Explore page. The title is what users see; the match value is the real post tag, category, or AI tool to filter by.
                </p>
                <div className="mb-4 rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-surface-500">Current live rail</p>
                    <span className="text-[11px] font-semibold text-surface-500">
                      {savedExploreItems.length > 0 ? 'Using saved custom chips' : 'Using auto chips from posts'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-black text-white">All</span>
                    {liveExploreItems.slice(0, 14).map(item => (
                      <span key={`${item.type}:${item.value}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-surface-700 ring-1 ring-surface-200 dark:bg-surface-900 dark:text-surface-100 dark:ring-surface-700">
                        {item.label}
                      </span>
                    ))}
                    {liveExploreItems.length > 14 && (
                      <span className="rounded-full bg-surface-200 px-3 py-1.5 text-xs font-bold text-surface-600 dark:bg-surface-700 dark:text-surface-200">
                        +{liveExploreItems.length - 14} more
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setExploreFilterItems(autoExploreItems)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Use current auto chips
                    </button>
                    {savedExploreItems.length > 0 && (
                      <button
                        onClick={() => setExploreFilterItems([])}
                        className="inline-flex items-center gap-2 rounded-lg bg-surface-200 px-3 py-2 text-xs font-bold text-surface-700 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-100 dark:hover:bg-surface-600"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset to auto
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {exploreFilterItems.length === 0 && (
                    <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 p-4 text-xs text-surface-500">
                      No saved custom chips. The live rail above is auto-generated from current AI tools and common post tags.
                    </div>
                  )}
                  {exploreFilterItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
                      <input
                        value={item.label}
                        onChange={e => updateRailItem('explore', index, 'label', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                        placeholder="Visible title, e.g. Anime"
                      />
                      <select
                        value={item.type}
                        onChange={e => updateRailItem('explore', index, 'type', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      >
                        <option value="tag">Tag</option>
                        <option value="tool">AI Tool</option>
                        <option value="category">Category</option>
                      </select>
                      <input
                        value={item.value}
                        onChange={e => updateRailItem('explore', index, 'value', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                        placeholder="Match value, e.g. anime"
                      />
                      <button
                        onClick={() => removeRailItem('explore', index)}
                        className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addRailItem('explore')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Explore Chip
                  </button>
                </div>
                <details className="mt-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-surface-600 dark:text-surface-300">Legacy comma tags</summary>
                  <p className="mt-2 text-[11px] text-surface-500">Fallback only. New custom chips above are preferred.</p>
                  <input
                    value={exploreFilterTags}
                    onChange={e => setExploreFilterTags(e.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                    placeholder="video, character, anime, realistic, illustration"
                  />
                </details>
              </div>

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
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                  {creativeDirectionItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
                      <input
                        value={item.label}
                        onChange={e => updateRailItem('creative', index, 'label', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                        placeholder="Card title, e.g. Anime"
                      />
                      <select
                        value={item.type}
                        onChange={e => updateRailItem('creative', index, 'type', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                      >
                        <option value="tag">Tag</option>
                        <option value="tool">AI Tool</option>
                        <option value="category">Category</option>
                      </select>
                      <input
                        value={item.value}
                        onChange={e => updateRailItem('creative', index, 'value', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                        placeholder="Match value, e.g. anime"
                      />
                      <button
                        onClick={() => removeRailItem('creative', index)}
                        className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="space-y-1">
                                <span className="text-xs font-medium text-surface-500">Title</span>
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
                              <span className="text-xs font-medium text-surface-500">Description</span>
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
            <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary-500" /> Footer Links
              </h3>
              <p className="text-xs text-surface-500 mb-4">
                Create footer columns, then add individual links inside each column.
              </p>
              <div className="space-y-4">
                {footerLinkGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                      <input
                        value={group.title}
                        onChange={e => updateFooterGroupTitle(groupIndex, e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm font-semibold"
                        placeholder="Footer column title"
                      />
                      <button
                        onClick={() => setFooterLinkGroups(prev => prev.filter((_, i) => i !== groupIndex))}
                        className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                      >
                        Remove Group
                      </button>
                    </div>
                    <div className="space-y-2">
                      {group.links.length === 0 && (
                        <p className="text-xs text-surface-500">No links in this group.</p>
                      )}
                      {group.links.map((link, linkIndex) => (
                        <div key={linkIndex} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                          <input
                            value={link.label}
                            onChange={e => updateFooterLink(groupIndex, linkIndex, 'label', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                            placeholder="Label"
                          />
                          <input
                            value={link.href}
                            onChange={e => updateFooterLink(groupIndex, linkIndex, 'href', e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                            placeholder="/privacy or https://..."
                          />
                          <button
                            onClick={() => setFooterLinkGroups(prev => prev.map((item, i) => (
                              i === groupIndex ? { ...item, links: item.links.filter((_, j) => j !== linkIndex) } : item
                            )))}
                            className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:border-primary-400 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add Link
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFooterLinkGroups(prev => [...prev, { title: 'New Group', links: [{ label: '', href: '' }] }])}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Footer Group
                </button>
              </div>
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors mt-4"
              >
                <Save className="w-4 h-4" /> Save Footer Links
              </button>
            </div>
          )}

          {settingsSubTab === 'ads' && (
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
             <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
               <Settings className="w-4 h-4 text-primary-500" /> Ad Spaces
             </h3>
             <div className="space-y-6">
                
                {/* Header Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium">Header Ad (Top of page)</span>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsConfig.header.enabled}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, header: { ...prev.header, enabled: e.target.checked } }))}
                          className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-xs">Enabled</span>
                     </label>
                   </div>
                   <textarea
                     value={adsConfig.header.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, header: { ...prev.header, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here (e.g., Google AdSense)"
                     className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs font-mono resize-y"
                   />
                </div>

                {/* In-Feed Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium">In-Feed Ad (Post Grids)</span>
                     <div className="flex items-center gap-4">
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
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={adsConfig.inFeed.enabled}
                            onChange={(e) => setAdsConfig(prev => ({ ...prev, inFeed: { ...prev.inFeed, enabled: e.target.checked } }))}
                            className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-xs">Enabled</span>
                       </label>
                     </div>
                   </div>
                   <textarea
                     value={adsConfig.inFeed.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, inFeed: { ...prev.inFeed, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here"
                     className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs font-mono resize-y"
                   />
                </div>

                {/* Post Top Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium">Post Details - Top</span>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsConfig.postTop.enabled}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, postTop: { ...prev.postTop, enabled: e.target.checked } }))}
                          className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-xs">Enabled</span>
                     </label>
                   </div>
                   <textarea
                     value={adsConfig.postTop.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, postTop: { ...prev.postTop, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here"
                     className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs font-mono resize-y"
                   />
                </div>

                {/* Post Bottom Ad */}
                <div className="p-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium">Post Details - Bottom</span>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsConfig.postBottom.enabled}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, postBottom: { ...prev.postBottom, enabled: e.target.checked } }))}
                          className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-xs">Enabled</span>
                     </label>
                   </div>
                   <textarea
                     value={adsConfig.postBottom.code}
                     onChange={(e) => setAdsConfig(prev => ({ ...prev, postBottom: { ...prev.postBottom, code: e.target.value } }))}
                     rows={3}
                     placeholder="Paste Ad HTML/JS code here"
                     className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-xs font-mono resize-y"
                   />
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors mt-8"
                >
                  <Save className="w-4 h-4" /> Save Ad Settings
                </button>
             </div>
          </div>
          )}

          {/* AI Tools Management */}
          {settingsSubTab === 'ai-tools' && (
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-500" /> AI Tools ({(settings.aiTools || []).length})
            </h3>
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-800/40 dark:bg-primary-950/20 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">Image model labels</p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Fill empty/defaultable model fields with GPT Image 2, Nano Banana 2, Grok Imagine Image Quality, and Qwen-Image.</p>
              </div>
              <button
                type="button"
                onClick={handleBackfillModels}
                disabled={isBackfillingModels}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <RotateCcw className={`h-4 w-4 ${isBackfillingModels ? 'animate-spin' : ''}`} />
                {isBackfillingModels ? 'Filling...' : 'Fill missing models'}
              </button>
            </div>

            {/* Add AI Tool */}
            <div className="flex gap-2 mb-4">
              <input
                value={newAiTool}
                onChange={e => setNewAiTool(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAiTool()}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none focus:border-primary-500 text-sm"
                placeholder="New tool name (e.g. Midjourney v6)..."
              />
              <button
                onClick={addAiTool}
                disabled={!newAiTool.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* AI Tools list */}
            <div className="grid grid-cols-1 gap-3">
              {(settings.aiTools || []).map(tool => {
                const imgCount = posts.reduce((acc, p) => acc + (p.aiTools?.includes(tool) ? 1 : 0) + p.images.filter(img => img.aiTools ? img.aiTools.includes(tool) : img.aiTool === tool).length, 0);
                const info = getToolInfo(tool, settings.toolDetails);
                return (
                  <div key={tool} className="flex flex-col gap-2 p-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                    {editingAiTool === tool ? (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                           <input
                             value={editAiToolValue}
                             onChange={e => setEditAiToolValue(e.target.value)}
                             className="flex-1 px-2 py-1.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs font-semibold"
                             autoFocus
                             placeholder="Tool Name"
                           />
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-1.5 rounded bg-surface-100 dark:bg-surface-800/50">
                          {TAILWIND_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setEditAiToolColor(c)}
                              className={`w-5 h-5 rounded-full ${c} ${editAiToolColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-primary-500' : 'hover:scale-110 border border-black/10 dark:border-white/10'} transition-transform`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={editAiToolLogoScale}
                            onChange={e => setEditAiToolLogoScale(parseFloat(e.target.value) || 1)}
                            className="w-16 px-2 py-1.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                            title="Logo Scale (1 = normal)"
                          />
                          <input
                            value={editAiToolLogo}
                            onChange={e => setEditAiToolLogo(e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 outline-none focus:border-primary-500 text-xs"
                            placeholder="Logo Image URL"
                          />
                          <label className="p-1.5 rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 cursor-pointer transition-colors" title="Upload Logo">
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
                          <button onClick={() => saveEditAiTool(tool)} className="p-1.5 rounded bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingAiTool(null)} className="p-1.5 rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors text-surface-600 dark:text-surface-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className={`relative w-8 h-8 shrink-0 flex items-center justify-center rounded-md border border-white/20 shadow-sm ${info.color}`}>
                          {info.logo && (
                            <Image src={info.logo} alt="" fill className="object-contain p-1.5" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tool}</p>
                          <p className="text-[10px] text-surface-400">{imgCount} post uses</p>
                        </div>
                        <button
                          onClick={() => startEditAiTool(tool)}
                          className="p-1.5 rounded hover:bg-surface-200 dark:hover:bg-surface-700 shrink-0"
                          title="Edit Tool Details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary-500" />
                        </button>
                        <button
                          onClick={() => removeAiTool(tool)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                          title="Delete Tool"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {settingsSubTab === 'features' && (
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-500" /> Feature Flags
            </h3>
            <p className="text-xs text-surface-500 mb-6">Toggle specific site capabilities on or off.</p>
            
            <div className="space-y-4">
              {/* User Profiles */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Profiles & Bookmarks</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.userProfiles} onChange={(e) => setFeatures(prev => ({ ...prev, userProfiles: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
                </div>
              </div>

              {/* User Submissions */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Submissions & Approval Queue</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.userSubmissions} onChange={(e) => setFeatures(prev => ({ ...prev, userSubmissions: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
                </div>
                {features.userSubmissions && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={features.userSubmissionsAutoApprove} onChange={(e) => setFeatures(prev => ({ ...prev, userSubmissionsAutoApprove: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                      Auto-Approve User Submissions
                    </label>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Comments & Feedback</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.comments} onChange={(e) => setFeatures(prev => ({ ...prev, comments: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
                </div>
                {features.comments && (
                  <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={features.commentsRequireApproval} onChange={(e) => setFeatures(prev => ({ ...prev, commentsRequireApproval: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                      Require manual approval for user comments
                    </label>
                  </div>
                )}
              </div>

              {/* Post Page Sections */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-medium">Post Page Sections</span>
                    <p className="mt-1 text-xs text-surface-500">Control the extra blocks shown below each prompt collection.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={features.showCopyCollection ?? true} onChange={(e) => setFeatures(prev => ({ ...prev, showCopyCollection: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    Copy entire collection block
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={features.showHowTo ?? true} onChange={(e) => setFeatures(prev => ({ ...prev, showHowTo: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    How to use section
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={features.showRecommendedPosts ?? true} onChange={(e) => setFeatures(prev => ({ ...prev, showRecommendedPosts: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    Recommended prompts
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={features.showTags ?? true} onChange={(e) => setFeatures(prev => ({ ...prev, showTags: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    Discovery tags
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={features.showDetailedInsights ?? true} onChange={(e) => setFeatures(prev => ({ ...prev, showDetailedInsights: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    Detailed insights
                  </label>
                  {[
                    ['showPostSidebar', 'Post sidebar'],
                    ['showShareButtons', 'Share buttons'],
                    ['showTryButtons', 'Try it on buttons'],
                    ['showYouMightAlsoLike', 'You might also like'],
                    ['showScrollProgress', 'Scroll progress bar'],
                    ['showFaqSchema', 'FAQ + HowTo schema'],
                    ['showPublicProfiles', 'Public profiles'],
                    ['publicProfileLikes', 'Show likes on public profiles'],
                    ['publicProfileBookmarks', 'Show saves on public profiles'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean((features as any)[key] ?? ['showPostSidebar', 'showShareButtons', 'showTryButtons', 'showYouMightAlsoLike', 'showScrollProgress', 'showFaqSchema', 'showPublicProfiles'].includes(key))}
                        onChange={(e) => setFeatures(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-primary-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="mb-3">
                  <span className="text-sm font-medium">Keep Exploring Block</span>
                  <p className="mt-1 text-xs text-surface-500">Controls the card in the post sidebar and its mobile version.</p>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-surface-500">Title</span>
                      <input
                        value={keepExploring.title || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:border-primary-500"
                        placeholder="Keep exploring"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-surface-500">Main button label</span>
                      <input
                        value={keepExploring.ctaLabel || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, ctaLabel: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:border-primary-500"
                        placeholder="Open prompt library"
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-surface-500">Description</span>
                      <textarea
                        value={keepExploring.description || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:border-primary-500 resize-y"
                        placeholder="Short copy shown under the title"
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-surface-500">Main button link</span>
                      <input
                        value={keepExploring.ctaHref || ''}
                        onChange={e => setKeepExploring(prev => ({ ...prev, ctaHref: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:border-primary-500"
                        placeholder="/explore"
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    {(keepExploring.links || defaultKeepExploring.links).map((link, index) => (
                      <div key={index} className="grid gap-2 rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900 sm:grid-cols-[1fr_1fr_130px]">
                        <input
                          value={link.label}
                          onChange={e => updateKeepExploringLink(index, 'label', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm outline-none focus:border-primary-500"
                          placeholder="Link title"
                        />
                        <input
                          value={link.href}
                          onChange={e => updateKeepExploringLink(index, 'href', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm outline-none focus:border-primary-500"
                          placeholder="/tag/poster"
                        />
                        <select
                          value={link.icon || 'image'}
                          onChange={e => updateKeepExploringLink(index, 'icon', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm outline-none focus:border-primary-500"
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
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Advanced Search & Filtering</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.advancedFiltering} onChange={(e) => setFeatures(prev => ({ ...prev, advancedFiltering: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
                </div>
              </div>

              {/* Smart Templates */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Smart &quot;Fill-in-the-blank&quot; Templates</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.smartTemplates} onChange={(e) => setFeatures(prev => ({ ...prev, smartTemplates: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
                </div>
              </div>

              {/* Infinite Scrolling */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Infinite Scrolling (Explore)</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.infiniteScroll} onChange={(e) => setFeatures(prev => ({ ...prev, infiniteScroll: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
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
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Premium / Pro Prompts</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.premiumPrompts} onChange={(e) => setFeatures(prev => ({ ...prev, premiumPrompts: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
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
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Skeleton Loaders</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.skeletonLoaders} onChange={(e) => setFeatures(prev => ({ ...prev, skeletonLoaders: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
                </div>
              </div>

              {/* Trending Algorithm */}
              <div className="p-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trending Algorithms</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={features.trendingAlgorithm} onChange={(e) => setFeatures(prev => ({ ...prev, trendingAlgorithm: e.target.checked }))} className="w-4 h-4 rounded text-primary-500" />
                    <span className="text-xs">Enabled</span>
                  </label>
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
                    className="w-48 px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                    className="w-48 px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors mt-8"
            >
              <Save className="w-4 h-4" /> Save Feature Flags
            </button>
          </div>
          )}

          {settingsSubTab === 'comments' && (
            <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary-500" /> Comments
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-800 dark:bg-surface-800/50">
                  <span>
                    <b>Enable comments globally</b>
                    <span className="mt-1 block text-xs text-surface-500">Controls the live comment form and comment lists on post pages.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={features.comments}
                    onChange={e => setFeatures(prev => ({ ...prev, comments: e.target.checked }))}
                    className="h-4 w-4 rounded text-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-800 dark:bg-surface-800/50">
                  <span>
                    <b>Require approval</b>
                    <span className="mt-1 block text-xs text-surface-500">New comments stay pending until an admin approves them.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={features.commentsRequireApproval}
                    onChange={e => setFeatures(prev => ({ ...prev, commentsRequireApproval: e.target.checked }))}
                    className="h-4 w-4 rounded text-primary-500"
                  />
                </label>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Comment provider</label>
                  <select className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none dark:border-surface-700 dark:bg-surface-800" value="custom" disabled>
                    <option value="custom">Custom built-in comments</option>
                  </select>
                  <p className="mt-1 text-xs text-surface-500">This site currently renders the built-in comment system. Disqus can be added later without changing this route.</p>
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="mt-6 flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                <Save className="w-4 h-4" /> Save Comments
              </button>
            </div>
          )}

          {settingsSubTab === 'share' && (
            <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary-500" /> Share Buttons
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm dark:border-surface-800 dark:bg-surface-800/50">
                  <span>
                    <b>Show share buttons on post pages</b>
                    <span className="mt-1 block text-xs text-surface-500">Controls the live share strip rendered on prompt pages.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={features.showShareButtons ?? true}
                    onChange={e => setFeatures(prev => ({ ...prev, showShareButtons: e.target.checked }))}
                    className="h-4 w-4 rounded text-primary-500"
                  />
                </label>
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
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                  >
                    <option value="below-prompt">Below prompt</option>
                    <option value="bottom">Bottom of page</option>
                    <option value="floating-sidebar">Floating sidebar</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="mt-6 flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                <Save className="w-4 h-4" /> Save Share Buttons
              </button>
            </div>
          )}

          {/* Danger Zone Removed */}
        </div>
      </div>
      )}

      {/* ===== SUBMISSIONS TAB ===== */}
      {tab === 'submissions' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary-500" /> Pending Submissions
            </h3>
            {!features.userSubmissions ? (
              <p className="text-sm text-surface-500">User submissions are currently disabled. Enable them in the Features tab.</p>
            ) : (
              <div>
                {posts.filter(p => p.status === 'pending').length === 0 ? (
                  <p className="text-sm text-surface-500 text-center py-8">No pending submissions.</p>
                ) : (
                  <div className="space-y-4">
                    {posts.filter(p => p.status === 'pending').map(post => (
                      <div key={post.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{post.title}</p>
                          <p className="text-xs text-surface-500">{post.images.length} images</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                               updatePost({ ...post, status: 'published' });
                               alert('Post approved and published!');
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openEditPost(post)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 transition-colors"
                          >
                            Review & Edit
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Pending Comments
            </h3>
            {!features.comments ? (
              <p className="text-sm text-surface-500">Comments are currently disabled. Enable them in the Features tab.</p>
            ) : pendingCommentCount === 0 ? (
              <p className="text-sm text-surface-500 text-center py-8">No pending comments.</p>
            ) : (
              <div className="space-y-4">
                {posts.flatMap(post => (post.comments || [])
                  .filter(comment => comment.status === 'pending')
                  .map(comment => ({ post, comment }))
                ).map(({ post, comment }) => (
                  <div key={comment.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-surface-400">On {post.title}</p>
                        <p className="mt-1 text-sm font-semibold">{comment.userName}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => {
                            updatePost({
                              ...post,
                              comments: (post.comments || []).map(item => item.id === comment.id ? { ...item, status: 'approved' } : item),
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            updatePost({
                              ...post,
                              comments: (post.comments || []).filter(item => item.id !== comment.id),
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-surface-600 dark:text-surface-300">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== COMMENTS TAB ===== */}
      {tab === 'comments' && (
        <div className="max-w-4xl space-y-6">
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-500" /> Comment Review
            </h3>
            {!features.comments ? (
              <p className="text-sm text-surface-500">Comments are currently disabled. Enable them in Settings &gt; Features.</p>
            ) : pendingCommentCount === 0 ? (
              <p className="text-sm text-surface-500 text-center py-8">No pending comments.</p>
            ) : (
              <div className="space-y-4">
                {posts.flatMap(post => (post.comments || [])
                  .filter(comment => comment.status === 'pending')
                  .map(comment => ({ post, comment }))
                ).map(({ post, comment }) => (
                  <div key={comment.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-surface-400">On {post.title}</p>
                        <p className="mt-1 text-sm font-semibold">{comment.userName}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => updatePost({ ...post, comments: (post.comments || []).map(item => item.id === comment.id ? { ...item, status: 'approved' } : item) })}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updatePost({ ...post, comments: (post.comments || []).filter(item => item.id !== comment.id) })}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-surface-600 dark:text-surface-300">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== USERS TAB ===== */}
      {tab === 'users' && (
        <div className="max-w-5xl space-y-4">
          <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" /> User Management
            </h3>
            {adminUsers.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-8">No users found yet.</p>
            ) : (
              <div className="space-y-3">
                {adminUsers.map(account => {
                  const submitted = posts.filter(post => post.authorId === account.id).length;
                  const saved = posts.filter(post => post.bookmarkedBy?.includes(account.id)).length;
                  const liked = posts.filter(post => post.likedBy?.includes(account.id)).length;
                  return (
                    <div key={account.id} className="flex flex-col gap-3 rounded-xl border border-surface-200 p-4 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{account.name}</p>
                        <p className="truncate text-xs text-surface-500">{account.email || account.id}</p>
                        <p className="mt-1 text-[11px] text-surface-400">Last sign in: {account.lastSignInAt ? new Date(account.lastSignInAt).toLocaleString() : 'Never'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <span className="rounded-lg bg-surface-100 px-3 py-2 dark:bg-surface-800"><b>{submitted}</b><br />posts</span>
                        <span className="rounded-lg bg-surface-100 px-3 py-2 dark:bg-surface-800"><b>{saved}</b><br />saves</span>
                        <span className="rounded-lg bg-surface-100 px-3 py-2 dark:bg-surface-800"><b>{liked}</b><br />likes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SEO TAB ===== */}
      {tab === 'seo' && (
        <div className="max-w-4xl">
          <SeoPagesTab settings={settings} updateSettings={updateSettings} />
        </div>
      )}

      {/* ===== PAGES TAB ===== */}
      {tab === 'pages' && (
        <div className="max-w-4xl">
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
        </div>
      )}
    </div>
  );
}


