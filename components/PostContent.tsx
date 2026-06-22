'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';

import Image from 'next/image';
import { Copy, Check, Eye, Heart, Calendar, Tag, ChevronLeft, Clock, ArrowRight, Lock, Download, ZoomIn, X, DownloadCloud, Image as ImageIcon, Wand2, Bookmark, Share2, ExternalLink, Link as LinkIcon, MessageCircle, Layers, ClipboardCheck } from 'lucide-react';
import { useData } from '@/components/context/DataContext';
import { getGridClasses } from '@/lib/utils';
import { getDefaultImageModel, getToolInfo, getAllTools, getToolForImageModel } from '@/lib/constants';
import TemplatePrompt from '@/components/TemplatePrompt';
import { createClient } from '@/lib/supabase-client';
import { getAuthRedirectTo } from '@/lib/auth-redirect';
import type { User } from '@supabase/supabase-js';
import type { Post, ShareTarget } from '@/lib/types';

import CopyButton from '@/components/CopyButton';
import LoadingImage, { LoadingImg } from '@/components/LoadingImage';
import MarkdownRenderer from '@/components/MarkdownRenderer';

import PostCard from '@/components/PostCard';
import AdSlot from '@/components/AdSlot';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const WhatsAppLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12.04 2a9.89 9.89 0 0 0-8.44 15.03L2.5 22l5.08-1.06A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.88 12.37 8.1 8.1 0 0 1-10.98 2.94l-.34-.2-2.8.59.6-2.72-.22-.35A8.09 8.09 0 0 1 12.04 3.8Zm-3.1 4.16c-.17 0-.43.06-.66.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.16 1.75 2.8 4.34 3.81 2.15.85 2.6.68 3.06.64.47-.04 1.52-.62 1.74-1.22.21-.59.21-1.1.15-1.21-.07-.11-.24-.17-.5-.31-.27-.13-1.53-.76-1.77-.84-.24-.09-.42-.13-.6.13-.17.26-.68.84-.84 1.01-.15.17-.31.19-.58.06-.26-.13-1.11-.41-2.12-1.31-.78-.7-1.31-1.56-1.46-1.82-.15-.26-.02-.4.12-.53.12-.12.27-.31.4-.47.13-.15.17-.26.26-.43.09-.18.04-.33-.02-.46-.07-.13-.58-1.43-.82-1.96-.2-.45-.42-.46-.62-.47h-.53Z" />
  </svg>
);

const XLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M13.74 10.62 21.05 2h-1.73l-6.35 7.48L7.9 2H2.05l7.67 11.31L2.05 22h1.73l6.71-7.9L15.86 22h5.85l-7.97-11.38Zm-2.38 2.8-.78-1.13L4.4 3.32h2.67l4.99 7.24.78 1.13 6.48 9.42h-2.67l-5.29-7.69Z" />
  </svg>
);

const InstagramLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
  </svg>
);

const FacebookLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M14 8.3V6.9c0-.7.46-.86.78-.86h1.98V3.02L14.03 3C11 3 10.3 5.26 10.3 6.7v1.6H8v3.1h2.3V21H14v-9.6h2.5l.34-3.1H14Z" />
  </svg>
);

const PinterestLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12.04 2C6.58 2 3 5.75 3 10.45c0 2.18 1.22 4.9 3.17 5.76.3.14.46.08.53-.2.05-.22.32-1.29.44-1.79.04-.16.02-.3-.11-.45-.64-.76-1.15-2.14-1.15-3.43 0-3.28 2.48-6.45 6.7-6.45 3.65 0 6.2 2.48 6.2 6.03 0 4.01-2.03 6.79-4.67 6.79-1.46 0-2.55-1.2-2.2-2.67.42-1.76 1.23-3.65 1.23-4.92 0-1.13-.61-2.08-1.87-2.08-1.48 0-2.67 1.53-2.67 3.58 0 1.31.44 2.19.44 2.19l-1.79 7.56c-.3 1.27-.18 3.05-.05 4.2.06.51.72.63.95.18.6-1.09 1.57-2.88 1.91-4.13.13-.49.68-2.58.68-2.58.53 1.01 2.06 1.86 3.69 1.86 4.85 0 8.35-4.46 8.35-9.99C22.78 5.35 18.73 2 12.04 2Z" />
  </svg>
);

const defaultKeepExploring = {
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

export default function PostContent({ post: initialPost, relatedPosts }: { post: Post; relatedPosts: Post[] }) {
  const { incrementViews, toggleLike, toggleBookmark, settings, posts } = useData();
  const contextPost = posts.find(p => p.id === initialPost?.id);
  const contextHasPrompts = contextPost?.images?.some((image) => image.prompt?.trim());
  const post = useMemo(() => (
    contextHasPrompts ? contextPost! : {
      ...initialPost,
      views: contextPost?.views ?? initialPost.views,
      likes: contextPost?.likes ?? initialPost.likes,
      likedByUser: contextPost?.likedByUser ?? initialPost.likedByUser,
      bookmarkedByUser: contextPost?.bookmarkedByUser ?? initialPost.bookmarkedByUser,
    }
  ), [contextHasPrompts, contextPost, initialPost]);
  
  const viewIncrementedRef = useRef(false);
  const showSkeleton = settings.features?.skeletonLoaders ?? false;

  const [lightboxImage, setLightboxImage] = useState<{ url: string; index: number; tools: string[] } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [shareFeedback, setShareFeedback] = useState('');
  const [tryFeedback, setTryFeedback] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentState, setCommentState] = useState(() => ({
    postId: post.id,
    items: post.comments || [],
  }));
  const comments = commentState.postId === post.id ? commentState.items : (post.comments || []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const hasTemplateVariables = (prompt: string) => /(?:\[[^\]]+\]|\{[^}]+\})/.test(prompt);

  const trackEvent = (eventName: string, params: Record<string, string | number | boolean> = {}) => {
    if (typeof window === 'undefined') return;
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', eventName, { post_id: post.id, post_slug: post.slug, ...params });
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    try {
      const saved = await toggleBookmark(post.id, post);
      if (saved !== null) trackEvent(saved ? 'prompt_saved' : 'prompt_unsaved');
    } catch (error: any) {
      alert(error?.message || 'Could not update bookmark.');
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    const text = commentText.trim();
    if (text.length < 2) return;
    setCommentSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action: 'comment', id: post.id, text }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not post comment');
      trackEvent('comment_submitted', { status: json.comment?.status || 'unknown' });
      setCommentState(prev => {
        const currentItems = prev.postId === post.id ? prev.items : (post.comments || []);
        return { postId: post.id, items: [...currentItems, json.comment] };
      });
      setCommentText('');
    } catch (error: any) {
      alert(error?.message || 'Could not post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleLogin = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectTo(),
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const heroTools = post ? getAllTools(post) : [];
  const primaryHeroToolInfo = heroTools.length > 0 ? getToolInfo(heroTools[0], settings?.toolDetails) : { color: '', logo: '', logoScale: undefined };
  const heroToolInfo = primaryHeroToolInfo;
  const heroToolName = heroTools.join(' + ');

  useEffect(() => {
    if (post && !viewIncrementedRef.current) {
      incrementViews(post.id, initialPost);
      viewIncrementedRef.current = true;
    }
  }, [post, initialPost, incrementViews]);

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">Post not found</h2>
        <p className="text-surface-500 mb-8">This prompt might have been moved or deleted.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20">
          Return to Gallery
        </Link>
      </div>
    );
  }

  const allPromptsText = settings.features?.premiumPrompts && post.isPremium && !user 
    ? "Premium Collection - Please sign in to view full prompts." 
    : (post.images || []).map((img, i) => `Image ${i + 1} (${img.aiTool}):\n${img.prompt}`).join('\n\n');
  const showCopyCollection = settings.features?.showCopyCollection ?? true;
  const showHowTo = settings.features?.showHowTo ?? true;
  const showRecommendedPosts = settings.features?.showRecommendedPosts ?? true;
  const showPostSidebar = settings.features?.showPostSidebar ?? true;
  const showShareButtons = settings.features?.showShareButtons ?? true;
  const showTryButtons = settings.features?.showTryButtons ?? true;
  const showYouMightAlsoLike = settings.features?.showYouMightAlsoLike ?? true;
  const showTags = settings.features?.showTags ?? true;
  const showDetailedInsights = settings.features?.showDetailedInsights ?? true;
  const relatedPostIds = new Set(relatedPosts.map(p => p.id));
  const recommendedPosts = posts
    .filter(p =>
      p.id !== post.id &&
      !relatedPostIds.has(p.id) &&
      (p.status === 'published' || !p.status) &&
      p.visibility !== 'private'
    )
    .slice(0, 4);
  const primaryToolName = heroTools[0] || 'ChatGPT / Gemini';
  const toolLabel = heroTools.length === 0 ? 'your AI tool' : heroTools.length === 1 ? heroTools[0] : heroTools.join(' or ');
  const howToSteps = [
    { title: `Open ${toolLabel}`, text: 'Use the tool or model listed with this prompt. If multiple tools are shown, choose the one you prefer.', icon: Wand2 },
    { title: 'Copy the prompt', text: 'Use the copy button on any prompt card, or copy the entire collection above.', icon: Copy },
    { title: 'Upload reference image', text: 'Attach your reference image first when the prompt is image-guided.', icon: ImageIcon },
    { title: 'Customize details', text: 'Replace placeholders, names, colors, aspect ratio, or style notes as needed.', icon: Check },
    { title: 'Paste and generate', text: 'Paste the prompt with the image, generate the artwork, then refine in small steps.', icon: DownloadCloud }
  ];

  const postHeroStyle = settings.postHeroStyle || 'v1';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://aipromptmatrix.in/${post.slug || post.id}`;
  const firstPrompt = post.images?.find(image => image.prompt?.trim())?.prompt || allPromptsText;

  const getTryToolUrl = (tool: string, prompt: string) => {
    const encoded = encodeURIComponent(prompt);
    const normalized = tool.toLowerCase();
    if (normalized.includes('chatgpt') || normalized.includes('openai')) return `https://chatgpt.com/?q=${encoded}`;
    if (normalized.includes('gemini') || normalized.includes('banana')) return 'https://gemini.google.com/app';
    if (normalized.includes('grok')) return `https://grok.com/?q=${encoded}`;
    if (normalized.includes('qwen')) return `https://chat.qwen.ai/?q=${encoded}`;
    if (normalized.includes('claude')) return `https://claude.ai/new?q=${encoded}`;
    if (normalized.includes('perplexity')) return `https://www.perplexity.ai/search?q=${encoded}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`${tool} AI image generator`)}`;
  };

  const handleTryTool = async (tool: string, prompt: string) => {
    const targetUrl = getTryToolUrl(tool, prompt);
    const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    try {
      await navigator.clipboard.writeText(prompt);
      setTryFeedback(`Prompt copied. Opening ${tool}...`);
      window.setTimeout(() => setTryFeedback(''), 2500);
    } catch {}
    trackEvent('try_tool_clicked', { tool });
    if (!opened) {
      setTryFeedback(`Prompt copied. Please allow popups to open ${tool}.`);
      window.setTimeout(() => setTryFeedback(''), 3500);
    }
  };

  const configuredShareTargets = settings.shareSettings?.targets?.length
    ? settings.shareSettings.targets
    : ['whatsapp', 'x', 'instagram', 'copy'] as ShareTarget[];
  const shareTargets = configuredShareTargets.filter((target, index, list) => list.indexOf(target) === index);
  const sharePosition = settings.shareSettings?.position || 'floating-sidebar';
  const showInlineShareButtons = showShareButtons;
  const showSidebarShareButtons = showShareButtons && sharePosition === 'floating-sidebar';
  const shareButtonMeta: Record<ShareTarget, { label: string; title: string; className: string; icon: ReactNode }> = {
    whatsapp: { label: 'WhatsApp', title: 'Share on WhatsApp', className: 'text-green-500 hover:bg-green-500 hover:text-white', icon: <WhatsAppLogo className="h-4 w-4" /> },
    x: { label: 'X', title: 'Share on X', className: 'hover:bg-black hover:text-white', icon: <XLogo className="h-4 w-4" /> },
    instagram: { label: 'Instagram', title: 'Copy caption for Instagram', className: 'text-pink-500 hover:bg-pink-500 hover:text-white', icon: <InstagramLogo className="h-4 w-4" /> },
    copy: { label: 'Copy link', title: 'Copy link', className: 'hover:bg-primary-500 hover:text-white', icon: <LinkIcon className="h-4 w-4" /> },
    facebook: { label: 'Facebook', title: 'Share on Facebook', className: 'text-blue-600 hover:bg-blue-600 hover:text-white', icon: <FacebookLogo className="h-4 w-4" /> },
    pinterest: { label: 'Pinterest', title: 'Share on Pinterest', className: 'text-red-600 hover:bg-red-600 hover:text-white', icon: <PinterestLogo className="h-4 w-4" /> },
  };

  const renderShareCard = (className = '') => (
    <div className={`rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900 ${className}`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-surface-900 dark:text-white">
        <Share2 className="h-4 w-4 text-primary-500" /> Share
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {shareTargets.map(target => (
          <button
            key={target}
            onClick={() => handleShare(target)}
            className={`flex items-center justify-center rounded-xl bg-surface-100 p-2 dark:bg-surface-800 ${shareButtonMeta[target].className}`}
            title={shareButtonMeta[target].title}
            aria-label={shareButtonMeta[target].title}
          >
            {shareButtonMeta[target].icon}
          </button>
        ))}
      </div>
      {(shareFeedback || tryFeedback) && (
        <p className="mt-3 text-[11px] font-bold text-primary-500">{shareFeedback || tryFeedback}</p>
      )}
    </div>
  );

  const handleShare = async (target: ShareTarget) => {
    const text = `${post.title} - ${pageUrl}`;
    trackEvent('share_clicked', { target });
    if (target === 'copy') {
      await navigator.clipboard.writeText(pageUrl);
      setShareFeedback('Link copied');
      window.setTimeout(() => setShareFeedback(''), 2500);
      return;
    }
    if (target === 'instagram') {
      await navigator.clipboard.writeText(text);
      setShareFeedback('Caption copied for Instagram');
      window.setTimeout(() => setShareFeedback(''), 2500);
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    const imageUrl = post.thumbnailUrl || post.images?.[0]?.url || '';
    const url = target === 'whatsapp'
      ? `https://wa.me/?text=${encodeURIComponent(text)}`
      : target === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`
        : target === 'pinterest'
          ? `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&description=${encodeURIComponent(post.title)}&media=${encodeURIComponent(imageUrl)}`
          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const SidebarCard = ({ item }: { item: Post }) => {
    const tools = getAllTools(item);
    const firstTool = tools[0];
    const firstToolInfo = firstTool ? getToolInfo(firstTool, settings?.toolDetails) : null;
    return (
    <Link href={`/${item.slug || item.id}`} className="group flex gap-3 rounded-2xl border border-surface-200 bg-white p-2.5 transition-colors hover:border-primary-400 dark:border-surface-800 dark:bg-surface-900">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-100 dark:bg-surface-800">
        <LoadingImage src={item.thumbnailUrl || item.images?.[0]?.url || ''} alt="" fill showSkeleton={showSkeleton} className="object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <h4 className="line-clamp-2 text-xs font-bold leading-snug text-surface-900 dark:text-white">{item.title}</h4>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-2 text-[11px] text-surface-400">
            <Eye className="h-3 w-3" /> {(item.views || 0).toLocaleString()}
          </p>
          {firstTool && firstToolInfo && (
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full ${firstToolInfo.color}/80 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white shadow-xl backdrop-blur-md border border-white/10`}>
              {firstToolInfo.logo && (
                <span className="relative h-3 w-3 shrink-0 overflow-hidden rounded-full bg-white p-[1px]">
                  <Image src={firstToolInfo.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                </span>
              )}
              {firstTool}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
  };

  const renderExploreAllPromptsBlock = (mobile = false) => {
    const keepExploring = {
      ...defaultKeepExploring,
      ...(settings.keepExploring || {}),
      links: settings.keepExploring?.links?.length ? settings.keepExploring.links : defaultKeepExploring.links,
    };
    const iconMap = {
      image: ImageIcon,
      layers: Layers,
      clipboard: ClipboardCheck,
    };

    return (
      <div className={`rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900 ${mobile ? 'mb-16 lg:hidden' : ''}`}>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-surface-900 dark:text-white">{keepExploring.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
              {keepExploring.description}
            </p>
          </div>
        </div>
        <div className="mb-4 grid gap-2">
          {keepExploring.links.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || ImageIcon;
            return (
              <Link
                key={`${item.label}:${item.href}`}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 text-xs font-bold text-surface-700 transition-colors hover:border-primary-300 hover:bg-white hover:text-primary-600 dark:border-surface-800 dark:bg-surface-950/60 dark:text-surface-300 dark:hover:border-primary-500/50 dark:hover:bg-surface-900 dark:hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary-500" />
                  {item.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-surface-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
        <Link
          href={keepExploring.ctaHref || '/explore'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-primary-600"
        >
          {keepExploring.ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  };

  const getTryToolsForImage = (image: Post['images'][number]) => {
    const selectedTools = (image.aiTools || []).filter(Boolean);
    if (selectedTools.length > 0) return selectedTools;

    const fallbackTools = [image.aiTool].filter(Boolean);
    const modelTool = getToolForImageModel(image.model);
    return modelTool && fallbackTools.some(tool => tool.toLowerCase() === modelTool.toLowerCase()) ? [modelTool] : fallbackTools;
  };
  const renderTryButtonsForPrompt = (tools: string[], prompt: string, className = '') => {
    const uniqueTools = Array.from(new Set(tools.filter(Boolean)));
    if (!showTryButtons || uniqueTools.length === 0 || !prompt.trim()) return null;
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {uniqueTools.map(tool => (
          (() => {
            const info = getToolInfo(tool, settings?.toolDetails);
            return (
          <button
            key={tool}
            onClick={() => handleTryTool(tool, prompt)}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-surface-700 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:text-white"
          >
            {info.logo && (
              <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-white p-[1px] shadow-sm">
                <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
              </span>
            )}
            Try in {tool}
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
            );
          })()
        ))}
      </div>
    );
  };

  const renderMetaInfo = () => {
    const isV2 = postHeroStyle === 'v2';
    const containerClasses = isV2
      ? 'bg-black/40 border-white/10 text-white/90 backdrop-blur-md'
      : 'bg-slate-800/40 text-slate-400 border-slate-300/10 shadow-lg shadow-black/10 ring-1 ring-white/5 backdrop-blur-xl';
    
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-medium py-3 px-6 rounded-full border transition-colors ${containerClasses}`}>
        <span className="flex items-center gap-1.5">
          <Eye className={`w-4.5 h-4.5 ${isV2 ? 'text-white' : 'text-primary-500'}`} /> {(post.views || 0).toLocaleString()} <span className="hidden sm:inline">views</span>
        </span>
        <span className={`w-1 h-1 rounded-full ${isV2 ? 'bg-white/30' : 'bg-slate-400/30'}`} />
        <button
          onClick={() => toggleLike(post.id, initialPost)}
          className={`flex items-center gap-1.5 transition-colors ${
            post.likedByUser ? 'text-red-500' : isV2 ? 'hover:text-red-400' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-4.5 h-4.5 ${post.likedByUser ? 'fill-current animate-heart-pop text-red-500' : ''}`} /> {(post.likes || 0).toLocaleString()} <span className="hidden sm:inline">likes</span>
        </button>
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 transition-colors ${
            post.bookmarkedByUser ? 'text-primary-500' : isV2 ? 'hover:text-primary-300' : 'hover:text-primary-500'
          }`}
        >
          <Bookmark className={`w-4.5 h-4.5 ${post.bookmarkedByUser ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">{post.bookmarkedByUser ? 'saved' : 'save'}</span>
        </button>
        <span className={`w-1 h-1 rounded-full ${isV2 ? 'bg-white/30' : 'bg-slate-400/30'}`} />
        <span className="flex items-center gap-1.5">
          <Clock className="w-4.5 h-4.5" /> {formatDate(post.createdAt)}
        </span>
      </div>
    );
  };

  const renderHero = () => {
    switch (postHeroStyle) {
      case 'v2': // Immersive Blur Background
        return (
          <div className="relative mb-12 w-full rounded-[32px] overflow-hidden bg-surface-900 shadow-2xl group min-h-[500px] flex items-end">
            <Image src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} alt="bg" fill className="object-cover opacity-40 blur-xl scale-110"  referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="relative z-20 p-8 md:p-12 w-full max-w-4xl mx-auto flex flex-col items-center text-center pb-12">
              <div className="relative w-full max-w-lg aspect-[4/3] mb-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <LoadingImage 
                  src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={post.title} 
                  fill 
                  showSkeleton={showSkeleton}
                  className="object-contain bg-black/20" 
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {heroTools.map(tool => {
                  const info = getToolInfo(tool, settings?.toolDetails);
                  return (
                    <span key={tool} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md backdrop-blur-md saturate-150 ${info.color}/90 border border-white/20 uppercase tracking-widest`}>
                      {info.logo && (
                        <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                          <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                            <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}
                      {tool}
                    </span>
                  );
                })}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">{post.title}</h1>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed mb-8 drop-shadow">{post.description}</p>
              {renderMetaInfo()}
            </div>
          </div>
        );
      case 'v3': // Diagonal Split
        return (
          <div className="relative mb-12 w-full rounded-[32px] overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl">
             <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                <div className="flex flex-col justify-center p-8 md:p-12 order-2 md:order-1">
                   <div className="flex flex-wrap items-center gap-2 mb-4">
                   <div className="flex flex-wrap gap-2">
                     {heroTools.map(tool => {
                       const info = getToolInfo(tool, settings?.toolDetails);
                       return (
                         <span key={tool} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${info.color}/90 uppercase tracking-wider`}>
                           {info.logo && (
                             <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                               <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                                 <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                               </div>
                             </div>
                           )}
                           {tool}
                         </span>
                       );
                     })}
                   </div>
                     {post.featured && <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300">⭐ Featured</span>}
                   </div>
                   <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 leading-tight">{post.title}</h1>
                   <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg mb-8 line-clamp-4">{post.description}</p>
                   <div className="flex justify-start">{renderMetaInfo()}</div>
                </div>
                <div className="relative order-1 md:order-2 h-64 md:h-auto min-h-[300px] bg-surface-100 dark:bg-surface-800/30 flex items-center justify-center p-6 lg:p-10">
                   <Image src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} alt="" fill className="object-cover blur-3xl opacity-20 scale-125 z-0"  referrerPolicy="no-referrer" />
                   <div className="max-h-[400px] w-full max-w-[800px] h-full sm:w-[600px] rounded-[24px] shadow-2xl relative z-10 overflow-hidden">
                     <LoadingImage src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} alt={post.title} fill showSkeleton={showSkeleton} className="object-contain" referrerPolicy="no-referrer" />
                   </div>
                </div>
             </div>
          </div>
        );
      case 'v4': // Minimalist Text
        return (
          <div className="mb-12 flex flex-col items-center text-center mt-6 md:mt-10">
            <span className={`mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-lg ${heroToolInfo.color}/90 saturate-150`}>
                {heroToolInfo.logo && (
                  <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                    <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={heroToolInfo.logoScale ? { transform: `scale(${heroToolInfo.logoScale})` } : undefined}>
                      <Image src={heroToolInfo.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
                {heroToolName}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-surface-900 dark:text-white mb-6 tracking-tight leading-tight max-w-4xl">{post.title}</h1>
            <p className="text-surface-600 dark:text-surface-400 text-lg md:text-2xl max-w-3xl leading-relaxed mb-8 font-medium">{post.description}</p>
            <div className="relative w-full max-w-2xl aspect-video mb-10 rounded-3xl overflow-hidden shadow-xl bg-surface-100 dark:bg-surface-800/50 p-4">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                <LoadingImage 
                  src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={post.title} 
                  fill 
                  showSkeleton={showSkeleton}
                  className="object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {renderMetaInfo()}
          </div>
        );
      case 'v5': // Asymmetric Offset
        return (
          <div className="relative mb-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
            <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="flex flex-wrap gap-2 mb-4">
              {heroTools.map(tool => {
                const info = getToolInfo(tool, settings?.toolDetails);
                return (
                  <span key={tool} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black text-white ${info.color}/90 uppercase tracking-[0.2em] shadow-md`}>
                    {info.logo && (
                      <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                        <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                          <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                    {tool}
                  </span>
                );
              })}
            </div>
              <h1 className="text-4xl md:text-6xl font-black text-surface-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                {post.title}
              </h1>
              <p className="text-surface-600 dark:text-surface-400 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl border-l-4 border-primary-500 pl-6">
                {post.description}
              </p>
              <div className="flex justify-start">{renderMetaInfo()}</div>
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 relative aspect-[3/4] lg:aspect-auto lg:h-[600px] rounded-[40px] overflow-hidden shadow-2xl skew-y-2 lg:skew-y-0 lg:-rotate-2 hover:rotate-0 transition-transform duration-700">
               <LoadingImage 
                src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                alt={post.title} 
                fill 
                showSkeleton={showSkeleton}
                className="object-cover" 
                referrerPolicy="no-referrer"
                priority
              />
            </div>
          </div>
        );
      case 'v6': // Cyberpunk Bordered
        return (
          <div className="relative mb-16 w-full p-1 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-[32px] shadow-[0_20px_50px_rgba(var(--primary-500),0.3)]">
            <div className="bg-white dark:bg-surface-950 rounded-[30px] p-8 md:p-12 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex gap-2 mb-6">
                       <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest">AI GENERATED</span>
                       <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-white text-[10px] font-black uppercase tracking-widest ${heroToolInfo.color}/90 shadow-md`}>
                        {heroToolInfo.logo && (
                          <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                            <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={heroToolInfo.logoScale ? { transform: `scale(${heroToolInfo.logoScale})` } : undefined}>
                              <Image src={heroToolInfo.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}
                        {heroToolName}
                       </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-surface-900 dark:text-white mb-6 uppercase tracking-tighter italic">
                      {post.title}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-base md:text-lg mb-8 font-medium">
                      {post.description}
                    </p>
                    <div className="flex justify-start">{renderMetaInfo()}</div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-surface-900 shadow-2xl rotate-1">
                    <LoadingImage 
                      src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                      alt={post.title} 
                      fill 
                      showSkeleton={showSkeleton}
                      className="object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
               </div>
            </div>
          </div>
        );
      case 'v7': // Full Screen Hero
        return (
          <div className="relative w-full h-[80vh] min-h-[600px] mb-12 rounded-[48px] overflow-hidden group">
             <LoadingImage 
              src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
              alt={post.title} 
              fill 
              showSkeleton={showSkeleton}
              className="object-cover transition-transform duration-1000 group-hover:scale-105" 
              referrerPolicy="no-referrer"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 md:p-16 text-center">
               <div className="flex flex-wrap gap-2 mb-6 justify-center">
                 {heroTools.map(tool => {
                   const info = getToolInfo(tool, settings?.toolDetails);
                   return (
                     <span key={tool} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black text-white ${info.color}/80 backdrop-blur-md uppercase tracking-widest border border-white/20 shadow-xl`}>
                       {info.logo && (
                          <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                            <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                              <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        )}
                       {tool}
                     </span>
                   );
                 })}
               </div>
               <h1 className="text-4xl md:text-7xl font-black text-white mb-6 max-w-5xl leading-tight">
                 {post.title}
               </h1>
               <div className="mb-10 scale-110">{renderMetaInfo()}</div>
            </div>
          </div>
        );
      case 'v8': // Floating Card
        return (
          <div className="relative mb-20 md:mb-32">
             <div className="relative w-full h-64 md:h-96 rounded-[32px] overflow-hidden">
                <Image 
                  src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={post.title} 
                  fill 
                  className="object-cover blur-2xl opacity-50 scale-110" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-surface-950" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0 md:-translate-y-1/2 w-[95%] max-w-5xl bg-white dark:bg-surface-900 rounded-[32px] shadow-2xl border border-surface-100 dark:border-surface-800 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
                <div className="w-full md:w-1/2 aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shrink-0">
                  <LoadingImage 
                    src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'} 
                    alt={post.title} 
                    fill 
                    showSkeleton={showSkeleton}
                    className="object-cover" 
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {heroTools.map(tool => {
                      const info = getToolInfo(tool, settings?.toolDetails);
                      return (
                        <span key={tool} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black text-white ${info.color} uppercase tracking-widest shadow-md`}>
                          {info.logo && (
                            <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                              <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                                <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                              </div>
                            </div>
                          )}
                          {tool}
                        </span>
                      );
                    })}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-surface-900 dark:text-white mb-4 tracking-tight leading-tight">
                    {post.title}
                  </h1>
                  <p className="text-surface-500 dark:text-surface-400 mb-8 line-clamp-3 italic font-medium">
                    &quot;{post.description}&quot;
                  </p>
                  <div className="scale-90 origin-left">{renderMetaInfo()}</div>
                </div>
             </div>
          </div>
        );
      case 'v1':
      default: // Natural layout
        return (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 tracking-tight leading-tight max-w-4xl">{post.title}</h1>
              <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg max-w-3xl leading-relaxed mb-6">{post.description}</p>
              {renderMetaInfo()}
            </div>
            <div className="relative mb-12 w-full max-w-5xl mx-auto flex justify-center">
              <div className="relative w-full flex justify-center rounded-[32px] overflow-hidden bg-surface-100 dark:bg-surface-800/30 p-2 sm:p-4">
                <div className="w-full h-full max-h-[75vh] min-h-[40vh] sm:min-h-[50vh] rounded-[24px] shadow-md relative overflow-hidden">
                  <LoadingImage
                    src={post.thumbnailUrl || post.images[0]?.url || 'https://picsum.photos/seed/placeholder/800/600'}
                    alt={post.title}
                    fill
                    showSkeleton={showSkeleton}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
                <div className="absolute top-6 left-6 z-20">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-md backdrop-blur-md saturate-150 ${heroToolInfo.color}/90 border border-white/20 uppercase tracking-widest`}>
                    {heroToolInfo.logo && (
                      <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                        <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm" style={heroToolInfo.logoScale ? { transform: `scale(${heroToolInfo.logoScale})` } : undefined}>
                          <Image src={heroToolInfo.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                    {heroToolName}
                  </span>
                </div>
                {post.featured && (
                  <div className="absolute top-6 right-6 z-20">
                    <span className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-400 text-yellow-900 border border-yellow-300 shadow-md uppercase tracking-widest">
                      ⭐ Featured
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-1 py-4 sm:py-6 fade-in">
      {(shareFeedback || tryFeedback) && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-800 shadow-xl dark:border-surface-700 dark:bg-surface-900 dark:text-white">
          {shareFeedback || tryFeedback}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-400 mb-6 font-medium">
        <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronLeft className="w-3.5 h-3.5 rotate-180 opacity-50" />
        <span className="truncate text-surface-900 dark:text-white max-w-[200px]">{post.title}</span>
      </nav>

      {/* Post Header & Hero styles */}
      {renderHero()}

      <AdSlot placement="postTop" />

      <div className={showPostSidebar ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]' : ''}>
        <div className="min-w-0">

      {/* Reference Images */}
      {post.referenceImages && post.referenceImages.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Reference Images <span className="text-surface-400 font-medium ml-1">({post.referenceImages.length})</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-4">
             {post.referenceImages.map((url, idx) => (
               <div key={idx} className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex flex-col w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)]">
                 <div className="relative w-full h-auto flex items-center justify-center p-3 sm:p-4 bg-surface-50 dark:bg-surface-800">
                    <div className="w-full relative rounded-xl overflow-hidden cursor-zoom-in" onClick={() => setLightboxImage({ url, index: idx, tools: [] })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Reference ${idx + 1}`} className="w-full h-auto block rounded-xl group-hover:scale-[1.01] transition-transform duration-500" referrerPolicy="no-referrer" />
                    </div>
                 </div>
                 <div className="p-3 sm:p-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center bg-white dark:bg-surface-900 mt-auto">
                    <span className="text-sm font-semibold tracking-wide text-surface-600 dark:text-surface-400">Ref {idx + 1}</span>
                    <button
                      onClick={() => handleDownload(url, `reference_${post.id}_${idx + 1}.png`)}
                      className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-600 dark:text-surface-400"
                      title="Download image"
                    >
                      <DownloadCloud className="w-5 h-5" />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Images with Prompts — NO cropping, natural display */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Prompt Gallery <span className="text-surface-400 font-medium ml-1">({post.images.length})</span>
          </h2>
        </div>

        <div className="space-y-10">
          {(post.images || []).map((img, index) => (
            <div
              key={img.id}
              className="group rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image + Prompt layout */}
              <div className="grid grid-cols-1 items-start gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                {/* Image — no cropping, natural display */}
                <div className="relative self-start p-3 sm:p-5">
                  <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-surface-200/70 bg-surface-50 p-2 shadow-sm transition-transform duration-500 group-hover:scale-[1.005] dark:border-surface-700/70 dark:bg-surface-800/60 group/img">
                    <div className="relative flex w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-surface-100 dark:bg-surface-900" onClick={() => setLightboxImage({ url: img.url || '', index, tools: img.aiTools || [img.aiTool].filter(Boolean) })}>
                      <LoadingImg
                        src={img.url || 'https://picsum.photos/seed/placeholder/800/600'}
                        alt={`Prompt ${index + 1}`}
                        showSkeleton={showSkeleton}
                        className="block h-auto w-full rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                      {(img.aiTools || [img.aiTool].filter(Boolean)).map((tool) => {
                        const info = getToolInfo(tool, settings?.toolDetails);
                        return (
                          <div key={tool} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold text-white shadow-xl backdrop-blur-md ${info.color}/80 border border-white/10 uppercase tracking-wider`}>
                            {info.logo && (
                              <div className="relative flex shrink-0 items-center justify-center w-3.5 h-3.5 bg-white/20 rounded-full p-[1px]">
                                <div 
                                  className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm flex items-center justify-center p-[1px]"
                                >
                                  <div className="relative w-full h-full" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                                    <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                </div>
                              </div>
                            )}
                            {tool}
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-2.5 py-1.5 rounded-full text-[9px] font-bold bg-black/40 text-white backdrop-blur-md border border-white/10 uppercase tracking-widest shadow-xl">
                        PROMPT #{index + 1}
                      </span>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none rounded-2xl" />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity translate-y-2 group-hover/img:translate-y-0 duration-300 z-30">
                      <button
                        title="Download Image"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (img.url) handleDownload(img.url, `prompt_${post.id}_${index + 1}.png`);
                        }}
                        className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:scale-110 transition-all shadow-xl"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        title="View Fullscreen"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage({ url: img.url || '', index, tools: img.aiTools || [img.aiTool].filter(Boolean) });
                        }}
                        className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:scale-110 transition-all shadow-xl"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    {settings.features?.premiumPrompts && post.isPremium && !user ? (
                       <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-6 mb-6 text-center border border-surface-200/50 dark:border-surface-700/50 relative overflow-hidden group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
                         <div className="absolute inset-0 bg-surface-50/80 dark:bg-surface-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6">
                           <Lock className="w-8 h-8 text-yellow-500 mb-3" />
                           <h4 className="font-bold text-lg mb-1">Premium Prompt</h4>
                           <p className="text-sm text-surface-500 mb-4 max-w-sm">
                             Sign in to view and copy this engineered prompt.
                           </p>
                           {settings.features?.premiumPaymentUrl ? (
                             <a href={settings.features?.premiumPaymentUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg">
                               Unlock All for ${settings.features?.premiumPrice || 5}
                             </a>
                           ) : (
                             <button onClick={handleLogin} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 shadow-lg">
                               Sign in to Unlock
                             </button>
                           )}
                         </div>
                         <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono filter blur-[4px] truncate">
                           {img.prompt.slice(0, 100)}...
                         </p>
                       </div>
                    ) : settings.features?.smartTemplates && hasTemplateVariables(img.prompt) ? (
                       <TemplatePrompt originalPrompt={img.prompt} />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                            <h3 className="font-bold text-base tracking-tight">Prompt</h3>
                          </div>
                          <CopyButton text={img.prompt} />
                        </div>
                        <div className={`mb-3 overflow-hidden rounded-2xl border border-surface-200/50 bg-surface-50 p-5 transition-colors group-hover:bg-primary-50/20 dark:border-surface-700/50 dark:bg-surface-800/50 dark:group-hover:bg-primary-900/10 sm:p-6 md:max-h-[460px] md:overflow-y-auto ${expandedPrompts[img.id] ? 'max-h-none md:max-h-[460px]' : 'max-h-[260px]'}`}>
                          <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-surface-700 dark:text-surface-300 md:text-base">
                            {img.prompt}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedPrompts(prev => ({ ...prev, [img.id]: !prev[img.id] }))}
                          className="mb-6 inline-flex w-full items-center justify-center rounded-xl border border-surface-200 px-4 py-2 text-xs font-bold text-surface-600 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-surface-700 dark:text-surface-300 md:hidden"
                        >
                          {expandedPrompts[img.id] ? 'Show less prompt' : 'Show full prompt'}
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-surface-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-primary-500/50" />
                    Model: <span className="text-surface-600 dark:text-surface-200">{img.model || getDefaultImageModel(img.aiTool) || img.aiTool}</span>
                  </div>
                  {renderTryButtonsForPrompt(getTryToolsForImage(img), img.prompt, 'mt-4')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInlineShareButtons && (
        renderShareCard(`mb-10 ${sharePosition === 'floating-sidebar' ? 'lg:hidden' : ''}`)
      )}

      {/* Copy All Prompts CTA */}
      {showCopyCollection && (
        <div className="mb-16 p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 text-white text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl translate-y-32 -translate-x-32 group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">Copy Entire Collection</h3>
            <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
              {post.images.length === 1
                ? 'Copy this prompt instantly to use in your favorite AI generator.'
                : `Grab all ${post.images.length} creative prompts instantly to use in your favorite AI generator.`}
            </p>
            <div className="flex justify-center">
               <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20">
                 <CopyButton text={allPromptsText} eventName="collection_copied" />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* How to use */}
      {showHowTo && (
      <div className="mb-16 rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Quick workflow</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white md:text-3xl">How to use these prompts</h3>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-surface-500 dark:text-surface-400">
            Copy, customize, and generate. Keep the original prompt structure intact, then adjust only the details you want to change.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {howToSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-950/60">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-surface-300 dark:text-surface-700">0{index + 1}</span>
                </div>
                <h4 className="mb-2 text-sm font-bold text-surface-900 dark:text-white">{step.title}</h4>
                <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">{step.text}</p>
              </div>
            );
          })}
        </div>
      </div>
      )}

      <AdSlot placement="postBottom" />

        </div>

        {showPostSidebar && (
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {showSidebarShareButtons && (
                renderShareCard()
              )}

              <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900">
                <h3 className="mb-3 text-sm font-black text-surface-900 dark:text-white">Prompt details</h3>
                <div className="space-y-2 text-xs text-surface-500 dark:text-surface-400">
                  <p><span className="font-bold text-surface-800 dark:text-surface-200">{post.images.length}</span> prompt{post.images.length === 1 ? '' : 's'}</p>
                  <p><span className="font-bold text-surface-800 dark:text-surface-200">{heroTools.join(', ') || 'AI tool'}</span></p>
                  <p>{(post.tags || []).slice(0, 4).map(tag => `#${tag}`).join(' ')}</p>
                </div>
              </div>

              {renderExploreAllPromptsBlock()}

              {showYouMightAlsoLike && recommendedPosts.length > 0 && (
                <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900">
                  <h3 className="mb-3 text-sm font-black text-surface-900 dark:text-white">You might also like</h3>
                  <div className="space-y-2">
                    {recommendedPosts.slice(0, 3).map(item => <SidebarCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Tags */}
      {showTags && (
      <div className="mb-16">
        <h3 className="text-sm font-bold text-surface-400 uppercase tracking-[0.2em] mb-6">Discovery Tags</h3>
        <div className="flex flex-wrap gap-2.5">
          {(post.tags || []).map(tag => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white transition-all transform hover:-translate-y-1 shadow-sm uppercase tracking-wider"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>
      )}

      {settings.features?.comments && (
        <div className="mb-16 border-t border-surface-200 dark:border-surface-800 pt-16">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-8">Comments & Feedback</h3>
          <div className="bg-surface-50 dark:bg-surface-800/30 rounded-2xl p-8 text-center border border-surface-200 dark:border-surface-800">
            {user ? (
               <div className="max-w-2xl mx-auto flex flex-col gap-4">
                 <textarea
                   rows={3}
                   value={commentText}
                   onChange={(event) => setCommentText(event.target.value)}
                   placeholder="Share your experience using these prompts, or post your own variations..."
                   className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 focus:border-primary-500 outline-none transition-colors text-sm resize-none"
                 />
                 <div className="flex justify-end">
                   <button
                     type="button"
                     onClick={handleSubmitComment}
                     disabled={commentSubmitting || commentText.trim().length < 2}
                     className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {commentSubmitting ? 'Posting...' : 'Post Comment'}
                   </button>
                 </div>
               </div>
            ) : (
               <div>
                 <p className="text-surface-500 mb-4">Join the discussion and share your results.</p>
                 <button onClick={handleLogin} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                   Sign in to Comment
                 </button>
               </div>
            )}
            
            <div className="mt-12 text-left">
              <p className="text-sm font-medium text-surface-400 mb-6">
                {comments.filter(comment => comment.status === 'approved' || comment.userId === user?.id).length} comments
              </p>
              <div className="space-y-4">
                {comments
                  .filter(comment => comment.status === 'approved' || comment.userId === user?.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(comment => (
                    <div key={comment.id} className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-950">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {comment.userAvatar ? (
                            <Image src={comment.userAvatar} alt="" width={32} height={32} className="rounded-full" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/40">
                              {comment.userName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            {settings.features?.showPublicProfiles ? (
                              <Link href={`/user/${comment.userId}`} className="block truncate text-sm font-bold text-surface-900 hover:text-primary-500 dark:text-white">
                                {comment.userName}
                              </Link>
                            ) : (
                              <p className="truncate text-sm font-bold text-surface-900 dark:text-white">{comment.userName}</p>
                            )}
                            <p className="text-xs text-surface-400">{formatDate(comment.createdAt)}</p>
                          </div>
                        </div>
                        {comment.status === 'pending' && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-surface-600 dark:text-surface-300">{comment.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Posts */}
      {showRecommendedPosts && relatedPosts.length > 0 && (
        <div className="border-t border-surface-200 dark:border-surface-800 pt-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary-500 rounded-full underline-offset-8" />
              <h2 className="text-2xl font-black tracking-tight">Related Prompts</h2>
            </div>
            <Link href="/explore" className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-2 group">
              Explore More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns) + " mb-16"}>
            {relatedPosts.map((p, i) => (
              <div key={p.id} className="mb-1 inline-block w-full break-inside-avoid">
                <PostCard post={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      )}

      {renderExploreAllPromptsBlock(true)}

      {/* Extended HTML / Article Description */}
      {showDetailedInsights && post.extendedDescription && (
        <div className="mt-16 border-t border-surface-200 pt-10 dark:border-surface-800 sm:mt-20 sm:pt-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-1.5 rounded-full bg-primary-500" />
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Guide</p>
                  <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">Detailed Insights</h2>
                </div>
              </div>
              <div className="h-px flex-1 bg-surface-200 dark:bg-surface-800 sm:max-w-48" />
            </div>
            
            <div className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:rounded-3xl sm:p-8 md:p-12">
              <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-xl prose-img:shadow-md prose-p:text-surface-600 dark:prose-p:text-surface-300 prose-li:text-surface-600 dark:prose-li:text-surface-300">
                <MarkdownRenderer>{post.extendedDescription}</MarkdownRenderer>
              </div>
            </div>
          </div>
        </div>
      )}

      {post.faqs?.length ? (
        <div className="mt-16 border-t border-surface-200 pt-10 dark:border-surface-800 sm:mt-20 sm:pt-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-primary-500" />
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">FAQ</p>
                <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">Frequently Asked Questions</h2>
              </div>
            </div>
            <div className="space-y-3">
              {post.faqs.map((faq, index) => (
                <details key={`${faq.question}-${index}`} className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
                  <summary className="cursor-pointer list-none text-base font-bold text-surface-900 dark:text-white">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Recommended Posts */}
      {showRecommendedPosts && recommendedPosts.length > 0 && (
        <div className="mt-16 border-t border-surface-200 pt-10 dark:border-surface-800 sm:mt-20 sm:pt-16">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-500">Next ideas</p>
                <h2 className="text-2xl font-black tracking-tight">Recommended Posts</h2>
              </div>
            </div>
            <Link href="/explore" className="hidden text-sm font-bold text-primary-500 hover:text-primary-600 sm:flex items-center gap-2 group">
              Explore More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className={getGridClasses(settings.features?.mobileColumns, settings.features?.desktopColumns) + " mb-16"}>
            {recommendedPosts.map((p, i) => (
              <div key={p.id} className="mb-1 inline-block w-full break-inside-avoid">
                <PostCard post={p} index={i} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 transition-opacity"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Toolbar */}
            <div className="absolute top-0 right-0 flex items-center gap-4 z-50 p-4">
              <button 
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(lightboxImage.url, `prompt_${post.id}_${lightboxImage.index + 1}.png`);
                }}
                title="Download Image"
              >
                <Download className="w-6 h-6" />
              </button>
              <button 
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImage(null);
                }}
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Image */}
            <div 
              className="relative w-full h-full max-h-[90vh] flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-wrap gap-2">
                {lightboxImage.tools.map(tool => {
                  const info = getToolInfo(tool, settings?.toolDetails);
                  return (
                    <div key={tool} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white shadow-xl backdrop-blur-md ${info.color}/80 border border-white/10 uppercase tracking-wider`}>
                      {info.logo && (
                        <div className="relative flex shrink-0 items-center justify-center w-4 h-4 bg-white/20 rounded-full p-[1px]">
                          <div className="relative w-full h-full rounded-full bg-white overflow-hidden shadow-sm flex items-center justify-center p-[1px]">
                            <div className="relative w-full h-full" style={info.logoScale ? { transform: `scale(${info.logoScale})` } : undefined}>
                              <Image src={info.logo} alt="" fill className="object-contain" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        </div>
                      )}
                      {tool}
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-4 right-4 z-20 hidden md:block pointer-events-none">
                 <span className="px-3 py-2 rounded-full text-xs font-bold bg-black/40 text-white backdrop-blur-md border border-white/10 uppercase tracking-widest shadow-xl">
                   PROMPT #{lightboxImage.index + 1}
                 </span>
              </div>
              <div className="w-full h-full max-h-[90vh] overflow-hidden rounded-2xl relative">
                <LoadingImage
                  src={lightboxImage.url}
                  alt={`Prompt ${lightboxImage.index + 1}`}
                  fill
                  showSkeleton={showSkeleton}
                  className="object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
