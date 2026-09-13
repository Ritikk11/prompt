import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  ArrowRight,
  Compass,
  Lightbulb,
  ExternalLink,
  Check,
  Copy,
  DownloadCloud,
  Image as ImageIcon,
  Eye,
  Layers,
  ClipboardCheck,
} from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getDefaultImageModel, getToolInfo, getAllTools } from '@/lib/constants';
import { isUserOwnedPost, EDITORIAL_TEAM_NAME } from '@/lib/authors';
import { getPromptImageUrl, getThumbnailImageUrl } from '@/lib/image-url';
import LoadingImage, { LoadingImg } from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import AdSlot from '@/components/AdSlot';
import ScrollReveal from '@/components/ScrollReveal';
import MasonryGrid from '@/components/MasonryGrid';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// Client Islands
import PostPageProvider from '@/components/post/PostPageProvider';
import PostHeroStats from '@/components/post/PostHeroStats';
import PromptItemCard from '@/components/post/PromptItemCard';
import PostShareCard from '@/components/post/PostShareCard';
import CommentsSection from '@/components/post/CommentsSection';
import CopyCollectionBanner from '@/components/post/CopyCollectionBanner';

interface PostContentProps {
  post: Post;
  settings: SiteSettings;
  relatedPosts?: Post[];
  recommendedPosts?: Post[];
}

const defaultKeepExploring = {
  title: 'Keep Exploring',
  description: 'Find more creative inspiration from our expanding prompt directory.',
  ctaLabel: 'Explore All Prompts',
  ctaHref: '/explore',
  links: [
    { label: 'Browse Latest Prompts', href: '/section/latest-prompts', icon: 'image' },
    { label: 'Trending Prompt Collections', href: '/section/popular-prompts', icon: 'layers' },
    { label: 'Browse by AI Tool', href: '/tool/chatgpt', icon: 'clipboard' },
  ],
};

const HERO_SIZES = '(max-width: 640px) 200px, (max-width: 1024px) 240px, 320px';

export default function PostContent({
  post,
  settings,
  relatedPosts = [],
  recommendedPosts = [],
}: PostContentProps) {
  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">Post not found</h2>
        <p className="text-surface-500 mb-8">This prompt might have been moved or deleted.</p>
        <Link
          href="/"
          prefetch={false}
          className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  const showSkeleton = settings.features?.skeletonLoaders ?? false;
  const showLikeCount = settings.features?.showLikeCount ?? true;
  const showViewCount = settings.features?.showViewCount ?? true;
  const showCopyCollection = settings.features?.showCopyCollection ?? true;
  const showHowTo = settings.features?.showHowTo ?? true;
  const showRecommendedPosts = settings.features?.showRecommendedPosts ?? true;
  const showPostSidebar = settings.features?.showPostSidebar ?? true;
  const showShareButtons = settings.features?.showShareButtons ?? true;
  const showYouMightAlsoLike = settings.features?.showYouMightAlsoLike ?? true;
  const showTags = settings.features?.showTags ?? true;
  const showDetailedInsights = settings.features?.showDetailedInsights ?? true;

  const heroTools = getAllTools(post);
  const primaryHeroToolInfo =
    heroTools.length > 0
      ? getToolInfo(heroTools[0], settings?.toolDetails)
      : { color: '', logo: '', logoScale: undefined };
  const heroToolInfo = primaryHeroToolInfo;
  const heroToolName = heroTools.join(' + ');

  const fallbackPromptImageUrl = '';
  const originalMainImageUrl = post.thumbnailUrl || post.images?.[0]?.url || fallbackPromptImageUrl;
  const mainPromptImageUrl = getPromptImageUrl(originalMainImageUrl, { width: 768, quality: 78 });
  const backgroundPromptImageUrl = mainPromptImageUrl;

  const heroImageSrcSet = [360, 480, 768, 1280]
    .map((w) => `${getPromptImageUrl(originalMainImageUrl || fallbackPromptImageUrl, { width: w, quality: 78 })} ${w}w`)
    .join(', ');

  const toolLabel =
    heroTools.length === 0
      ? 'your AI tool'
      : heroTools.length === 1
      ? heroTools[0]
      : heroTools.join(' or ');

  const howToSteps = [
    {
      title: `Open ${toolLabel}`,
      text: 'Use the tool or model listed with this prompt. If multiple tools are shown, choose the one you prefer.',
      icon: ExternalLink,
    },
    {
      title: 'Copy the prompt',
      text: 'Use the copy button on any prompt card, or copy the entire collection above.',
      icon: Copy,
    },
    {
      title: 'Upload reference image',
      text: 'Attach your reference image first when the prompt is image-guided.',
      icon: ImageIcon,
    },
    {
      title: 'Customize details',
      text: 'Replace placeholders, names, colors, aspect ratio, or style notes as needed.',
      icon: Check,
    },
    {
      title: 'Paste and generate',
      text: 'Paste the prompt with the image, generate the artwork, then refine in small steps.',
      icon: DownloadCloud,
    },
  ];

  const postHeroStyle = settings.postHeroStyle || 'v1';
  const sharePosition = settings.shareSettings?.position || 'floating-sidebar';
  const showInlineShareButtons = showShareButtons;
  const showSidebarShareButtons = showShareButtons && sharePosition === 'floating-sidebar';

  const renderAuthorByline = () => {
    const isUserOwned = isUserOwnedPost(post.authorId);
    if (!isUserOwned) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white/90">
          <div className="w-5 h-5 rounded-full bg-primary-500/30 flex items-center justify-center text-[10px] font-bold text-white">
            P
          </div>
          <span>Published by</span>
          <span className="font-semibold text-white">{EDITORIAL_TEAM_NAME}</span>
        </div>
      );
    }

    if (!settings.features?.showPublicProfiles) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white/90">
          <div className="w-5 h-5 rounded-full bg-primary-500/30 flex items-center justify-center text-[10px] font-bold text-white">
            {(post.authorUsername || 'C').slice(0, 1).toUpperCase()}
          </div>
          <span>Published by</span>
          <span className="font-semibold text-white">@{post.authorUsername || 'creator'}</span>
        </div>
      );
    }

    const username = post.authorUsername || 'creator';
    const authorUrl = `/user/${post.authorId}`;
    const avatarUrl = post.authorAvatar;

    return (
      <Link
        href={authorUrl}
        prefetch={false}
        className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-xs text-white/90"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={username}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-white/40"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-primary-500/40 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-white/40">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="text-white/70">Published by</span>
        <span className="font-semibold text-white leading-tight transition-colors group-hover:text-primary-300">
          @{username}
        </span>
      </Link>
    );
  };

  const renderMetaInfo = (align: 'center' | 'start' = 'center') => (
    <div className={`flex flex-col items-center gap-5 sm:gap-4 ${align === 'start' ? 'lg:items-start' : ''}`}>
      <PostHeroStats post={post} showViewCount={showViewCount} showLikeCount={showLikeCount} />
      {renderAuthorByline()}
    </div>
  );

  const renderHero = () => {
    switch (postHeroStyle) {
      case 'v2': // Immersive Blur Background
        return (
          <div className="relative mb-12 w-full rounded-[32px] overflow-hidden bg-white/[0.08] shadow-2xl group min-h-[500px] flex items-end">
            {/* Decorative background blur sharing heroImageSrcSet and HERO_SIZES to reuse browser cache */}
            <img
              src={mainPromptImageUrl}
              srcSet={heroImageSrcSet}
              sizes={HERO_SIZES}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 blur-xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="relative z-20 w-full max-w-6xl mx-auto flex flex-col items-center gap-8 p-8 pb-12 text-center lg:flex-row lg:items-center lg:gap-12 lg:p-12 lg:text-left">
              <LoadingImg
                src={mainPromptImageUrl}
                alt={post.title}
                showSkeleton={showSkeleton}
                priority
                wrapperClassName="inline-flex max-w-full shrink-0 justify-center rounded-2xl shadow-2xl aspect-square w-[260px] sm:w-[320px] lg:w-[400px]"
                className="h-auto max-h-[260px] sm:max-h-[320px] lg:max-h-[400px] w-auto max-w-full rounded-2xl object-contain"
                referrerPolicy="no-referrer"
                width={1280}
                height={1280}
                srcSet={heroImageSrcSet}
                sizes={HERO_SIZES}
                decoding="sync"
              />
              <div className="flex min-w-0 flex-col items-center lg:items-start">
                <div className="flex flex-wrap justify-center gap-2 mb-6 lg:justify-start">
                  {heroTools.map((tool) => {
                    const info = getToolInfo(tool, settings?.toolDetails);
                    return <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />;
                  })}
                </div>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                  {post.title}
                </h1>
                <p className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed mb-8 drop-shadow">
                  {post.description}
                </p>
                {renderMetaInfo('start')}
              </div>
            </div>
          </div>
        );

      case 'v3': // Diagonal Split
        return (
          <div className="relative mb-12 w-full rounded-[32px] overflow-hidden bg-white/25 dark:bg-white/[0.08] border border-white/80 dark:border-white/10 shadow-xl backdrop-blur-md backdrop-saturate-150">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
              <div className="flex flex-col justify-center p-8 md:p-12 order-2 md:order-1">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {heroTools.map((tool) => {
                      const info = getToolInfo(tool, settings?.toolDetails);
                      return <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />;
                    })}
                  </div>
                  {post.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/[0.07] dark:bg-white/[0.09] text-surface-700 dark:text-surface-300">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 leading-tight">
                  {post.title}
                </h1>
                <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg mb-8 line-clamp-4">
                  {post.description}
                </p>
                <div className="flex justify-start">{renderMetaInfo()}</div>
              </div>
              <div className="relative order-1 md:order-2 h-64 md:h-auto min-h-[300px] bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center p-6 lg:p-10">
                <img
                  src={mainPromptImageUrl}
                  srcSet={heroImageSrcSet}
                  sizes={HERO_SIZES}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover blur-3xl opacity-20 scale-125 z-0"
                />
                <div className="max-h-[400px] w-full max-w-[800px] h-full sm:w-[600px] rounded-[24px] shadow-2xl relative z-10 overflow-hidden">
                  <LoadingImage
                    src={mainPromptImageUrl}
                    alt={post.title}
                    fill
                    showSkeleton={showSkeleton}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'v4': // Minimalist Text
        return (
          <div className="mb-12 flex flex-col items-center text-center mt-6 md:mt-10">
            <ToolBadge toolName={heroToolName} toolInfo={heroToolInfo} size="lg" className="mb-6" />
            <h1 className="text-4xl md:text-6xl font-black text-surface-900 dark:text-white mb-6 tracking-tight leading-tight max-w-4xl">
              {post.title}
            </h1>
            <p className="text-surface-600 dark:text-surface-400 text-lg md:text-2xl max-w-3xl leading-relaxed mb-8 font-medium">
              {post.description}
            </p>
            <div className="relative w-full max-w-2xl aspect-video mb-10 rounded-3xl overflow-hidden shadow-xl bg-black/[0.04] dark:bg-white/[0.06] p-4">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                <LoadingImage
                  src={mainPromptImageUrl}
                  alt={post.title}
                  fill
                  showSkeleton={showSkeleton}
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 672px"
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
                {heroTools.map((tool) => {
                  const info = getToolInfo(tool, settings?.toolDetails);
                  return <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />;
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
                src={mainPromptImageUrl}
                alt={post.title}
                fill
                showSkeleton={showSkeleton}
                className="object-contain lg:object-cover"
                referrerPolicy="no-referrer"
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        );

      case 'v1':
      default: // Natural layout
        return (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-surface-900 dark:text-white mb-4 tracking-tight leading-tight max-w-4xl">
                {post.title}
              </h1>
              <p className="text-surface-600 dark:text-surface-300 text-base md:text-lg max-w-3xl leading-relaxed mb-6">
                {post.description}
              </p>
              {renderMetaInfo()}
            </div>
            <div className="relative mb-12 w-full max-w-5xl mx-auto flex justify-center">
              <div className="relative w-full flex justify-center rounded-[32px] overflow-hidden bg-black/[0.04] dark:bg-white/[0.06] p-2 sm:p-4">
                <div className="relative aspect-[4/5] min-h-0 w-full overflow-hidden rounded-[24px] shadow-md sm:aspect-auto sm:h-[70vh] sm:min-h-[520px] sm:max-h-[760px]">
                  <LoadingImage
                    src={mainPromptImageUrl}
                    alt={post.title}
                    fill
                    showSkeleton={showSkeleton}
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 768px) 100vw, 960px"
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  const SidebarCard = ({ item }: { item: Post }) => {
    const tools = getAllTools(item);
    const firstTool = tools[0];
    const firstToolInfo = firstTool ? getToolInfo(firstTool, settings?.toolDetails) : null;
    const itemImageUrl = getThumbnailImageUrl(item.thumbnailUrl || item.images?.[0]?.url || '', {
      width: 220,
      quality: 72,
    });
    return (
      <Link
        href={`/${item.slug || item.id}`}
        prefetch={false}
        className="group flex gap-3 rounded-2xl border border-white/80 bg-white/60 p-2.5 shadow-sm backdrop-blur-xl backdrop-saturate-150 transition-[border-color,box-shadow] duration-300 hover:border-primary-400/60 hover:shadow-md dark:border-white/10 dark:bg-white/[0.08] dark:hover:border-primary-400/50"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
          <LoadingImage
            src={itemImageUrl}
            alt={item.title}
            fill
            sizes="64px"
            showSkeleton={showSkeleton}
            className="object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0 flex-1 py-1">
          <h4 className="line-clamp-2 text-xs font-bold leading-snug text-surface-900 dark:text-white">
            {item.title}
          </h4>
          <div className="mt-1 flex items-center justify-between gap-2">
            {showViewCount && (
              <p className="flex min-w-0 items-center gap-2 text-[11px] text-surface-400">
                <Eye className="h-3 w-3" /> {(item.views || 0).toLocaleString()}
              </p>
            )}
            {firstTool && firstToolInfo && (
              <ToolBadge toolName={firstTool} toolInfo={firstToolInfo} size="sm" className="shrink-0" />
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
      links: settings.keepExploring?.links?.length
        ? settings.keepExploring.links
        : defaultKeepExploring.links,
    };
    const iconMap = {
      image: ImageIcon,
      layers: Layers,
      clipboard: ClipboardCheck,
    };

    return (
      <div
        className={`rounded-2xl border border-white/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 ${
          mobile ? 'mb-16 lg:hidden' : ''
        }`}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-surface-900 dark:text-white">
              {keepExploring.title}
            </h3>
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
                prefetch={false}
                className="group flex items-center justify-between rounded-xl border border-white/80 bg-white/25 px-3 py-2.5 text-xs font-bold text-surface-700 hover:border-primary-400/60 hover:bg-white/70 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-surface-300 dark:hover:border-primary-400/50 dark:hover:bg-white/10 dark:hover:text-white"
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
          prefetch={false}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-black text-white hover:bg-primary-700"
        >
          {keepExploring.ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  };

  const renderLargeExploreShowcase = () => {
    const chatGptInfo = getToolInfo('ChatGPT', settings?.toolDetails);
    const geminiInfo = getToolInfo('Gemini', settings?.toolDetails);

    const glassPill =
      'border border-white/60 bg-white/25 shadow-sm backdrop-blur-md backdrop-saturate-150 transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/60 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/[0.10] dark:hover:text-white';

    const gradientButton =
      'bg-gradient-to-r from-google-blue to-[#1a73e8] text-white shadow-md shadow-primary-500/25 transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary-500/40 hover:brightness-[1.06] active:scale-95';

    return (
      <section className="my-12 rounded-3xl border border-white/80 bg-white/60 p-8 text-center backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.08] sm:p-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
            Explore More Prompts
          </h2>
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">
            Browse our curated library of tested AI image prompts or filter by your favorite tool.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Big All Prompts Button */}
            <Link
              href="/explore"
              prefetch={false}
              className={`group/cta inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border border-transparent px-8 text-base font-bold ${gradientButton}`}
            >
              <Compass className="h-5 w-5" />
              <span>All Prompts</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/cta:translate-x-1" />
            </Link>

            {/* ChatGPT Prompts Button */}
            <Link
              href="/tool/chatgpt"
              prefetch={false}
              className={`inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full px-8 text-base font-bold text-surface-700 ${glassPill}`}
            >
              {chatGptInfo?.logo ? (
                <span className="relative h-5 w-5 overflow-hidden rounded-full shrink-0">
                  <Image
                    src={chatGptInfo.logo}
                    alt="ChatGPT"
                    width={20}
                    height={20}
                    className="h-full w-full object-contain dark:invert dark:brightness-200"
                    referrerPolicy="no-referrer"
                  />
                </span>
              ) : null}
              <span>ChatGPT</span>
            </Link>

            {/* Gemini Prompts Button */}
            <Link
              href="/tool/gemini"
              prefetch={false}
              className={`inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full px-8 text-base font-bold text-surface-700 ${glassPill}`}
            >
              {geminiInfo?.logo ? (
                <span className="relative h-5 w-5 overflow-hidden rounded-full shrink-0">
                  <Image
                    src={geminiInfo.logo}
                    alt="Gemini"
                    width={20}
                    height={20}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </span>
              ) : null}
              <span>Gemini</span>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  return (
    <PostPageProvider
      userProfilesEnabled={settings.features?.userProfiles}
      postTitle={post.title}
      postId={post.id}
      settings={settings}
    >
      <div className="max-w-6xl mx-auto px-1 py-4 sm:py-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/explore"
            prefetch={false}
            className="group inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-surface-600 shadow-sm backdrop-blur-xl transition-all hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-surface-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>Back to prompts</span>
          </Link>
        </div>

        {/* Hero Banner Section (Server Rendered) */}
        {renderHero()}

        {/* Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            {/* Reference Images (if guided) */}
            {post.referenceImages && post.referenceImages.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                  <h3 className="font-bold text-base tracking-tight">Reference Images</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {post.referenceImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-white/80 bg-white/40 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]"
                    >
                      <LoadingImage
                        src={getThumbnailImageUrl(url, { width: 400, quality: 75 })}
                        alt={`Reference ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Cards List (Client Island per item for paywall & carousel) */}
            <div className="space-y-12 mb-12">
              {(post.images || []).map((img, index) => (
                <PromptItemCard
                  key={img.id || index}
                  img={img}
                  index={index}
                  post={post}
                  settings={settings}
                  showSkeleton={showSkeleton}
                />
              ))}
            </div>

            {/* Inline Share Card (on mobile / inline layouts) */}
            {showInlineShareButtons && (
              <PostShareCard
                postTitle={post.title}
                postSlugOrId={post.slug || post.id}
                thumbnailUrl={post.thumbnailUrl}
                className={`mb-12 md:mb-16 ${sharePosition === 'floating-sidebar' ? 'lg:hidden' : ''}`}
              />
            )}

            {/* Copy All Prompts Banner */}
            {showCopyCollection && (post.images?.length || 0) > 1 && (
              <CopyCollectionBanner post={post} settings={settings} />
            )}

            {/* How to Use Section (Server Rendered HTML with content-visibility optimization) */}
            {showHowTo && (
              <div
                className="mb-16 rounded-3xl border border-white/80 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.08] sm:p-8 backdrop-blur-xl backdrop-saturate-150"
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}
              >
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400">
                      Quick workflow
                    </p>
                    <h3 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white md:text-3xl">
                      How to use these prompts
                    </h3>
                  </div>
                  <p className="max-w-xl text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                    Copy, customize, and generate. Keep the original prompt structure intact, then
                    adjust only the details you want to change.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {howToSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="rounded-2xl border border-white/80 bg-white/25 p-4 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-black text-surface-600 dark:text-surface-400">
                            0{index + 1}
                          </span>
                        </div>
                        <h4 className="mb-2 text-sm font-bold text-surface-900 dark:text-white">
                          {step.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                          {step.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <AdSlot placement="postBottom" />
          </div>

          {/* Sticky Desktop Sidebar */}
          {showPostSidebar && (
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-4">
                {showSidebarShareButtons && (
                  <PostShareCard
                    postTitle={post.title}
                    postSlugOrId={post.slug || post.id}
                    thumbnailUrl={post.thumbnailUrl}
                  />
                )}

                {renderExploreAllPromptsBlock()}

                {showYouMightAlsoLike && recommendedPosts.length > 0 && (
                  <div className="rounded-2xl border border-white/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150">
                    <h3 className="mb-3 text-sm font-black text-surface-900 dark:text-white">
                      You might also like
                    </h3>
                    <div className="space-y-2">
                      {recommendedPosts.slice(0, 3).map((item) => (
                        <SidebarCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Discovery Tags (Server Rendered HTML) */}
        {showTags && (post.tags || []).length > 0 && (
          <div className="mb-16">
            <h3 className="text-sm font-bold text-surface-600 dark:text-surface-400 uppercase tracking-[0.2em] mb-6">
              Discovery Tags
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {(post.tags || []).map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                  prefetch={false}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-black/[0.04] dark:bg-white/[0.06] text-surface-600 dark:text-surface-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white transition-all transform uppercase tracking-wider"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section (Client Island with content-visibility optimization) */}
        {settings.features?.comments && (
          <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
            <CommentsSection
              postId={post.id}
              initialComments={post.comments || []}
              settings={settings}
            />
          </div>
        )}

        {/* Related Posts Section (MasonryGrid unchanged client island, 0 CLS risk) */}
        {showRecommendedPosts && relatedPosts.length > 0 && (
          <div className="border-t border-white/80 dark:border-white/10 pt-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary-500 rounded-full underline-offset-8" />
                <h2 className="text-2xl font-black tracking-tight">Related Prompts</h2>
              </div>
              <Link
                href="/explore"
                prefetch={false}
                className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-2 group"
              >
                Explore More{' '}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <ScrollReveal>
              <div className="mb-16">
                <MasonryGrid posts={relatedPosts} settings={settings} renderAdSlot={false} disablePriority />
              </div>
            </ScrollReveal>
          </div>
        )}

        {renderLargeExploreShowcase()}

        {/* Extended Description / Markdown Insights (Server Rendered with content-visibility) */}
        {showDetailedInsights && post.extendedDescription && (
          <div
            className="mt-16 border-t border-white/80 pt-10 dark:border-white/10 sm:mt-20 sm:pt-16"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-1.5 rounded-full bg-primary-500" />
                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400">
                      Guide
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
                      Detailed Insights
                    </h2>
                  </div>
                </div>
                <div className="h-px flex-1 bg-black/[0.07] dark:bg-white/[0.09] sm:max-w-48" />
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.08] sm:rounded-3xl sm:p-8 md:p-12 backdrop-blur-xl backdrop-saturate-150">
                <div className="prose prose-sm max-w-none dark:prose-invert sm:prose-base lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-img:rounded-xl prose-img:shadow-md prose-p:text-surface-600 dark:prose-p:text-surface-300 prose-li:text-surface-600 dark:prose-li:text-surface-300">
                  <MarkdownRenderer>{post.extendedDescription}</MarkdownRenderer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Native FAQs Accordion (Pure Server HTML) */}
        {post.faqs?.length ? (
          <div className="mt-16 border-t border-white/80 pt-10 dark:border-white/10 sm:mt-20 sm:pt-16">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-9 w-1.5 rounded-full bg-primary-500" />
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400">
                    FAQ
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
                    Frequently Asked Questions
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {post.faqs.map((faq, index) => (
                  <details
                    key={`${faq.question}-${index}`}
                    className="group rounded-2xl border border-white/80 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150"
                  >
                    <summary className="cursor-pointer list-none text-base font-bold text-surface-900 dark:text-white">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Recommended Posts Section */}
        {showRecommendedPosts && recommendedPosts.length > 0 && (
          <div className="mt-16 border-t border-white/80 pt-10 dark:border-white/10 sm:mt-20 sm:pt-16">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400">
                    Next ideas
                  </p>
                  <h2 className="text-2xl font-black tracking-tight">Recommended Posts</h2>
                </div>
              </div>
              <Link
                href="/explore"
                prefetch={false}
                className="hidden text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 sm:flex items-center gap-2 group"
              >
                Explore More{' '}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <ScrollReveal>
              <div className="mb-16">
                <MasonryGrid posts={recommendedPosts} settings={settings} renderAdSlot={false} disablePriority />
              </div>
            </ScrollReveal>
          </div>
        )}
      </div>
    </PostPageProvider>
  );
}
