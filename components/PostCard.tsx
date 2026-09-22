'use client';
import Link from '@/components/PrefetchLink';

import { Eye, Heart } from 'lucide-react';
import type { Post } from '@/lib/types';
import { getToolInfo, getAllTools } from '@/lib/constants';
import { useData } from '@/components/context/DataContext';
import LoadingImage, { LoadingImg } from '@/components/LoadingImage';
import ToolBadge from '@/components/ToolBadge';
import { getThumbnailImageUrl, getThumbnailSrcSet } from '@/lib/image-url';

// Match MasonryGrid's breakpoints and configured columns. Lazy images can use
// their measured width in supporting browsers; this is the eager/fallback hint.
export function masonryImageSizes(mobileColumns: number, desktopColumns: number, inset: number) {
  const slot = (columns: number, gap: number, container: string) =>
    `calc((${container} - 24px - ${(columns - 1) * gap}px) / ${columns} - ${inset}px)`;
  return `(max-width: 639px) ${slot(mobileColumns, 12, '100vw')}, (max-width: 767px) ${slot(2, 16, '100vw')}, (max-width: 1023px) ${slot(Math.min(desktopColumns, 3), 16, '100vw')}, (max-width: 1279px) ${slot(desktopColumns, 16, '100vw')}, ${slot(desktopColumns, 16, '1280px')}`;
}

// Alternate, tool-color-independent badge looks selectable via settings.badgeStyle.
// The glass default (v1 / v2 / unknown) is the shared, site-wide <ToolBadge>.
const VARIANT_STYLES = ['v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10'];

const Badge = ({ style, toolName, toolInfo, className = "" }: { style: string; toolName: string; toolInfo: any; className?: string }) => {
  if (!VARIANT_STYLES.includes(style)) {
    return <ToolBadge toolName={toolName} toolInfo={toolInfo} size="sm" className={className} />;
  }

  const isIconOnly = style === 'v8';

  const getBadgeStyle = () => {
    switch(style) {
      case 'v3': return `bg-surface-900 border-2 border-primary-500 text-primary-500 shadow-[0_0_15px_rgba(var(--primary-500),0.5)]`;
      case 'v4': return `bg-surface-100 dark:bg-surface-800 border-b-4 border-r-4 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white shadow-md active:border-0 active:translate-x-[2px] active:translate-y-[2px]`;
      case 'v5': return `bg-surface-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-[8px] px-2 py-0.5 rounded-none`;
      case 'v6': return `bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 text-white border-0 shadow-lg animate-gradient-x`;
      case 'v7': return `bg-white dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-surface-100 dark:border-surface-700 rounded-2xl shadow-soft hover:scale-105 transition-transform`;
      case 'v8': return `bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10`;
      case 'v9': return `bg-transparent border-2 border-white/50 text-white font-black hover:bg-white hover:text-black transition-colors`;
      case 'v10': return `bg-primary-500 text-white [clip-path:polygon(0_0,100%_0,85%_100%,0%_100%)] pl-3 pr-6 py-1 font-black italic`;
      default: return '';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle()} ${className}`}>
      {toolInfo.logo ? (
        <div 
          className={`relative shrink-0 ${isIconOnly ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} bg-white rounded-full overflow-hidden p-[2px]`}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden" style={toolInfo.logoScale ? { transform: `scale(${toolInfo.logoScale})` } : undefined}>
            <LoadingImage src={toolInfo.logo} alt={`${toolName} logo`} fill className="object-contain" referrerPolicy="no-referrer" skeleton={false} />
          </div>
        </div>
      ) : null}
      {!isIconOnly && toolName}
    </div>
  );
};

export default function PostCard({ post: initialPost, index, aspect, cardStyleOverride, badgeStyleOverride, priority = false, imageSizes }: { post: Post; index?: number; aspect?: string; cardStyleOverride?: 'v1' | 'v2'; badgeStyleOverride?: string; priority?: boolean; imageSizes?: string }) {
  const { settings, posts } = useData();
  const post = posts.find(p => p.id === initialPost.id) || initialPost;
  
  const allTools = getAllTools(post);
  const primaryTool = allTools.length > 0 ? allTools[0] : (post.images[0]?.aiTool || '');
  const toolInfo = getToolInfo(primaryTool, settings?.toolDetails);
  
  // v2 is the site's card design; v1 stays available as the flat alternative.
  // Normalize anything else to v2: sections saved with a since-removed style
  // (v3–v8) carry that string in the DB, and it must resolve to the redesign,
  // not fall through to the v1 tail branch below.
  const rawCardStyle = cardStyleOverride || settings?.cardStyle || 'v2';
  const cardStyle = rawCardStyle === 'v1' ? 'v1' : 'v2';
  const badgeStyle = badgeStyleOverride || settings?.badgeStyle || 'v1';
  const showSkeleton = settings.features?.skeletonLoaders ?? true;
  const showLikeCount = settings.features?.showLikeCount ?? true;
  const showViewCount = settings.features?.showViewCount ?? true;
  const rawThumbnailUrl = post?.thumbnailUrl || post?.images?.[0]?.url || '';
  const imageUrl = getThumbnailImageUrl(rawThumbnailUrl, { width: 380, quality: 74 });
  const thumbnailSrcSet = getThumbnailSrcSet(rawThumbnailUrl);
  const thumbnailSizes = imageSizes || masonryImageSizes(settings.features?.mobileColumns || 1, settings.features?.desktopColumns || 4, cardStyle === 'v2' ? 14 : 0);

  const renderBadges = (className = "") => (
    <div className="flex flex-wrap gap-1">
      {allTools.slice(0, 3).map((tool) => (
        <Badge key={tool} style={badgeStyle} toolName={tool} toolInfo={getToolInfo(tool, settings?.toolDetails)} className={className} />
      ))}
      {allTools.length > 3 && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-black/50 backdrop-blur text-white shadow-md ${className}`}>
          +{allTools.length - 3}
        </div>
      )}
    </div>
  );

  if (cardStyle === 'v2') {
    return (
      <Link
        href={`/${post.slug || post.id}`}
        prefetch="intent"
        /* Glass frame around an opaque thumbnail: the frost lives on the mat,
           never on the image. Only border-color and box-shadow transition —
           animating the frame's opacity would drop its backdrop-filter for the
           duration and flash the raw background through. */
        className={`group relative block break-inside-avoid overflow-hidden rounded-[20px] border border-white/60 bg-white/25 px-1.5 pb-2.5 pt-1.5 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08)] backdrop-blur-[6px] backdrop-saturate-150 transition-[border-color,box-shadow] duration-300 hover:border-primary-500/50 hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)] dark:hover:border-primary-400/50 dark:hover:shadow-[0_8px_24px_-4px_rgba(2,6,23,0.55)] ${aspect ? `${aspect} h-full` : ''}`}
        style={{ animationDelay: `${(index || 0) * 80}ms` }}
      >
        {/* A tint, not an opaque slab: this only shows while the image loads,
            and white-on-glass reads as a hole in the card. */}
        <div className={`relative overflow-hidden rounded-[12px] bg-black/[0.04] dark:bg-white/[0.06] ${aspect ? 'h-full' : ''}`}>
          {aspect ? (
            <LoadingImg
              src={imageUrl}
              srcSet={thumbnailSrcSet}
              alt={post.title}
              wrapperClassName="absolute inset-0 h-full w-full"
              sizes={thumbnailSizes}
              showSkeleton={showSkeleton}
              className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
              priority={priority}
            />
          ) : (
            <LoadingImg
              src={imageUrl}
              srcSet={thumbnailSrcSet}
              sizes={thumbnailSizes}
              alt={post.title}
              showSkeleton={showSkeleton}
              className="block h-auto w-full transition-transform duration-700 ease-in-out group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
              priority={priority}
            />
          )}
          <div className="absolute top-2.5 left-2.5 z-10">
             {renderBadges()}
          </div>
          {aspect && (
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/35 to-transparent">
              <h3 className="font-bold text-white text-[13px] sm:text-[15px] leading-snug line-clamp-2 drop-shadow">
                {post.title}
              </h3>
            </div>
          )}
        </div>
        <div className={`px-1 pb-1 pt-3 ${aspect ? 'hidden' : ''}`}>
          <h3 className="font-bold text-surface-900 dark:text-white text-[13px] sm:text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center justify-between text-surface-500 dark:text-surface-400">
             <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400">{post.images.length} {post.images.length === 1 ? 'Prompt' : 'Prompts'}</span>
             {(showLikeCount || showViewCount) && <div className="flex gap-2.5">
               {showViewCount && <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium"><Eye className="w-3.5 h-3.5" />{post.views}</span>}
               {showLikeCount && <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium"><Heart className="w-3.5 h-3.5" />{post.likes}</span>}
             </div>}
          </div>
        </div>
      </Link>
    );
  }

  // cardStyle === 'v1'
  // Pinterest-style: on touch devices the card is a bare image + the count
  // pill — no overlay, no title (tap is the reveal). Desktop keeps the hover
  // overlay with title/stats.
  const titleBlock = (
    <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end pointer-events-none">
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <h3 className="font-bold text-white text-[13px] sm:text-[14px] leading-tight line-clamp-3 drop-shadow-md">
          {post.title}
        </h3>

        {(showLikeCount || showViewCount) && <div className="flex items-center gap-3 mt-2">
          {showViewCount && <span className="flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-white/90 drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            <Eye className="w-3 h-3 opacity-90" /> {post.views}
          </span>}
          {showLikeCount && <span className="flex items-center gap-1 font-bold text-[10px] sm:text-[11px] text-white/90 drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            <Heart className="w-3 h-3 opacity-90" /> {post.likes}
          </span>}
        </div>}
      </div>
    </div>
  );

  return (
    <Link
      href={`/${post.slug || post.id}`}
      prefetch="intent"
      className={`group block relative rounded-2xl overflow-hidden bg-black/[0.04] dark:bg-white/[0.06] transition-all duration-300 hover:shadow-xl active:scale-[0.98] active:shadow-md break-inside-avoid ${aspect ? aspect : ''}`}
      style={{ animationDelay: `${(index || 0) * 80}ms` }}
    >
      {/* When the caller forces a frame (aspect-[3/4] in the section rows), the
          image uses `fill` so it is sized by the frame instead of its own
          intrinsic width/height — a source with a different natural ratio then
          covers the frame exactly rather than overflowing it and making the row
          look ragged. Without a forced frame (masonry) it keeps intrinsic flow
          sizing so heights stay varied. */}
      {aspect ? (
        <LoadingImg
          src={imageUrl}
          srcSet={thumbnailSrcSet}
          alt={post.title}
          wrapperClassName="absolute inset-0 h-full w-full"
          sizes={thumbnailSizes}
          showSkeleton={showSkeleton}
          className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
          priority={priority}
        />
      ) : (
        <LoadingImg
          src={imageUrl}
          srcSet={thumbnailSrcSet}
          sizes={thumbnailSizes}
          alt={post.title}
          showSkeleton={showSkeleton}
          className="block h-auto w-full transition-transform duration-700 ease-in-out group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
          priority={priority}
        />
      )}

      {/* Overlay gradient + hover title: desktop only. `hidden` on touch keeps
          the card a bare image there (Pinterest-style). */}
      <div className="hidden [@media(hover:hover)]:block">
        <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {titleBlock}
      </div>

      {/* Top Left AI Tool Badge — stays visible on hover; the gradient behind
          it keeps the badges readable, so hiding them was never needed. */}
      <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
        {renderBadges()}
      </div>

      {/* Bottom-left prompt count — the one always-on cue on every device. */}
      <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-0">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold bg-black/40 text-white backdrop-blur-md italic border border-white/10">
          {post.images.length} {post.images.length === 1 ? 'PROMPT' : 'PROMPTS'}
        </span>
      </div>
    </Link>
  );
}
