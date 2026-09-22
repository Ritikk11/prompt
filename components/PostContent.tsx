import Link from '@/components/PrefetchLink';
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
import { sanitizeHeroPalette, DEFAULT_HERO_PALETTE } from '@/lib/hero-palette';
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
import BackButton from '@/components/post/BackButton';

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

function alphaHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
          prefetch={true}
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
  const showSaveButton = settings.features?.showSaveButton ?? true;
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
  const primaryTool = heroTools[0] || '';
  const toolSlug = primaryTool.toLowerCase().replace(/[\s-]+/g, '-');
  const hasMultipleTools = heroTools.length > 1;

  const fallbackPromptImageUrl = '';
  const originalMainImageUrl = post.thumbnailUrl || post.images?.[0]?.url || fallbackPromptImageUrl;
  const mainPromptImageUrl = getPromptImageUrl(originalMainImageUrl, { width: 768, quality: 78 });

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

  const sharePosition = settings.shareSettings?.position || 'floating-sidebar';
  const showInlineShareButtons = showShareButtons;
  const showSidebarShareButtons = showShareButtons && sharePosition === 'floating-sidebar';

  const renderAuthorByline = () => {
    const isUserOwned = isUserOwnedPost(post.authorId);
    if (!isUserOwned) {
      const siteLogo = settings.siteLogo || '/icon-190x190.webp';
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs text-white/90 backdrop-blur-xl shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:border-white/30 hover:bg-white/15 hover:text-white antialiased transform-gpu will-change-transform [backface-visibility:hidden] origin-center">
          <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/30 bg-black/40">
            <Image
              src={siteLogo}
              alt={EDITORIAL_TEAM_NAME}
              width={20}
              height={20}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <span className="text-white/60">Published by</span>
          <span className="font-semibold text-white">{EDITORIAL_TEAM_NAME}</span>
        </div>
      );
    }

    if (!settings.features?.showPublicProfiles) {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs text-white/90 backdrop-blur-xl shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:border-white/30 hover:bg-white/15 hover:text-white antialiased transform-gpu will-change-transform [backface-visibility:hidden] origin-center">
          <div className="w-5 h-5 shrink-0 rounded-full bg-primary-500/30 flex items-center justify-center text-[10px] font-bold text-white">
            {(post.authorUsername || 'C').slice(0, 1).toUpperCase()}
          </div>
          <span className="text-white/60">Published by</span>
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
        prefetch={true}
        className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs text-white/90 backdrop-blur-xl shadow-sm transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-white/30 hover:bg-white/15 hover:text-white antialiased transform-gpu will-change-transform [backface-visibility:hidden] origin-center cursor-pointer"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={username}
            width={20}
            height={20}
            className="w-5 h-5 shrink-0 rounded-full object-cover ring-1 ring-white/40 group-hover:ring-primary-400"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <div className="w-5 h-5 shrink-0 rounded-full bg-primary-500/40 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-white/40 group-hover:ring-primary-400">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="text-white/60">Published by</span>
        <span className="font-semibold text-white leading-tight transition-colors group-hover:text-primary-300">
          @{username}
        </span>
      </Link>
    );
  };

  const renderHero = () => {
    const palette = sanitizeHeroPalette(post.heroPalette) || DEFAULT_HERO_PALETTE;
    const mainImage = post.thumbnailUrl || post.images?.[0]?.url || '';
    const cardBg = alphaHex('#070a14', 0.9);

    return (
      <div
        className="relative mb-12 w-full overflow-hidden rounded-[32px] border border-white/10 text-white shadow-2xl backdrop-blur-2xl p-5 sm:p-8 lg:p-12"
        style={{ backgroundColor: cardBg }}
      >
        {/* Aurora Nebula: Compact centered on mobile, expansive corner-reaching only on desktop */}
        <div
          className="pointer-events-none absolute -top-28 left-1/4 w-[600px] h-[600px] blur-[130px] opacity-65 lg:-top-52 lg:-left-32 lg:w-[1050px] lg:h-[850px] lg:blur-[160px] lg:opacity-75 rounded-full"
          style={{ backgroundColor: palette.primary }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 right-1/4 w-[600px] h-[600px] blur-[130px] opacity-55 lg:-bottom-52 lg:-right-32 lg:w-[1050px] lg:h-[850px] lg:blur-[160px] lg:opacity-70 rounded-full"
          style={{ backgroundColor: palette.secondary }}
        />
        <div
          className="pointer-events-none absolute -top-28 -right-24 w-[700px] h-[650px] rounded-full blur-[150px] opacity-35 hidden lg:block"
          style={{ backgroundColor: palette.secondary }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-24 w-[700px] h-[650px] rounded-full blur-[150px] opacity-35 hidden lg:block"
          style={{ backgroundColor: palette.primary }}
        />

        {/* Content expanded to full (no outer extra layer) */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center text-center lg:text-left gap-7 lg:gap-14">
          {/* Thumbnail Artwork Box: Natural fluid aspect ratio (Portrait 4:5, Landscape 16:9, Square 1:1) */}
          <div
            className="relative shrink-0 w-fit max-w-full mx-auto lg:mx-0 rounded-[28px] overflow-hidden border border-white/20 shadow-2xl"
            style={{
              boxShadow: `0 20px 60px -15px ${alphaHex(palette.primary, 0.45 * 0.8)}`,
            }}
          >
            {mainImage ? (
              <img
                src={mainImage}
                alt={post.title}
                className="block w-auto h-auto max-w-[280px] sm:max-w-[340px] lg:max-w-[440px] max-h-[380px] sm:max-h-[460px] lg:max-h-[500px] rounded-[28px] object-contain"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-white/40">No Image</div>
            )}

            {/* In Phone: Standard tool badges kept at bottom of thumbnail with subtle scrim */}
            {heroTools.length > 0 && (
              <div className="lg:hidden absolute inset-x-0 bottom-0 z-20 p-3 pt-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-wrap items-center justify-center gap-2">
                {heroTools.map((tool) => {
                  const info = getToolInfo(tool, settings?.toolDetails);
                  return <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />;
                })}
              </div>
            )}
          </div>

          {/* Info Side */}
          <div className="flex flex-1 flex-col min-w-0 items-center lg:items-start">
            {/* Tool Badges on Desktop */}
            <div className="hidden lg:flex flex-wrap items-center gap-2 mb-4 justify-start">
              {heroTools.map((tool) => {
                const info = getToolInfo(tool, settings?.toolDetails);
                return <ToolBadge key={tool} toolName={tool} toolInfo={info} size="md" />;
              })}
            </div>

            {/* Post Title */}
            <h1 className="font-black tracking-tight text-white mb-4 text-2xl sm:text-3xl lg:text-5xl leading-snug lg:leading-[1.15]">
              {post.title}
            </h1>

            {/* Post Description */}
            <p className="text-white/80 line-clamp-3 mb-8 font-normal leading-relaxed text-xs sm:text-sm lg:text-base max-w-2xl">
              {post.description}
            </p>

            {/* Stats & Actions (Row 1) and Author Byline (Row 2: centered on mobile, left-aligned on desktop) */}
            <div className="flex flex-col items-center lg:items-start gap-2.5 sm:gap-3">
              <PostHeroStats
                post={post}
                showViewCount={showViewCount}
                showLikeCount={showLikeCount}
                showSaveButton={showSaveButton}
              />
              {renderAuthorByline()}
            </div>
          </div>
        </div>
      </div>
    );
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
        prefetch={true}
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
                prefetch={true}
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
          prefetch={true}
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
              prefetch={true}
              className={`group/cta inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border border-transparent px-8 text-base font-bold ${gradientButton}`}
            >
              <Compass className="h-5 w-5" />
              <span>All Prompts</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/cta:translate-x-1" />
            </Link>

            {/* ChatGPT Prompts Button */}
            <Link
              href="/tool/chatgpt"
              prefetch={true}
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
              prefetch={true}
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
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-surface-500 min-w-0 overflow-x-auto no-scrollbar"
          >
            <Link
              href="/"
              prefetch={true}
              className="hover:text-primary-500 transition-colors shrink-0"
            >
              Home
            </Link>
            <span className="shrink-0">/</span>
            <Link
              href="/explore"
              prefetch={true}
              className="hover:text-primary-500 transition-colors shrink-0"
            >
              Prompts
            </Link>
            {primaryTool && (
              <>
                <span className="hidden shrink-0 sm:inline">/</span>
                {hasMultipleTools ? (
                  <span className="hidden shrink-0 text-surface-700 dark:text-surface-300 sm:inline">
                    {heroToolName}
                  </span>
                ) : (
                  <Link
                    href={`/tool/${toolSlug}`}
                    prefetch={true}
                    className="hidden hover:text-primary-500 transition-colors shrink-0 sm:inline"
                  >
                    {primaryTool}
                  </Link>
                )}
              </>
            )}
            <span className="shrink-0">/</span>
            <span
              className="block max-w-[120px] truncate font-medium text-surface-900 dark:text-surface-100 sm:max-w-[220px] md:max-w-md"
              title={post.title}
            >
              {post.title}
            </span>
          </nav>

          <BackButton fallbackHref="/explore" />
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
            <div className="mb-12">
              <div className="mb-5 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
                  Prompt Gallery{' '}
                  <span className="ml-1 font-medium text-surface-600 dark:text-surface-400">
                    ({post.images?.length || 0})
                  </span>
                </h2>
              </div>
              <div className="space-y-12">
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
                  prefetch={true}
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
                prefetch={true}
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
                prefetch={true}
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
