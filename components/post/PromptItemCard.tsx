'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Lock,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';
import type { ImagePrompt, Post, SiteSettings } from '@/lib/types';
import { getDefaultImageModel, getToolInfo, getToolForImageModel } from '@/lib/constants';
import ToolBadge from '@/components/ToolBadge';
import CopyButton from '@/components/CopyButton';
import TemplatePrompt from '@/components/TemplatePrompt';
import { LoadingImg } from '@/components/LoadingImage';
import { getPromptImageUrl, getThumbnailImageUrl } from '@/lib/image-url';
import { usePostPage } from './PostPageProvider';

const GALLERY_SIZES = '(max-width: 768px) calc(100vw - 48px), 680px';
const buildGallerySrcSet = (url?: string) => {
  if (!url) return undefined;
  return [480, 640, 768, 1024]
    .map((w) => `${getPromptImageUrl(url, { width: w, quality: 74 })} ${w}w`)
    .join(', ');
};

const hasTemplateVariables = (text?: string) =>
  Boolean(text && /\[([a-zA-Z0-9_\s-]+)\]/.test(text));

interface PromptItemCardProps {
  img: ImagePrompt;
  index: number;
  post: Post;
  settings?: SiteSettings;
  showSkeleton?: boolean;
}

export default function PromptItemCard({
  img,
  index,
  post,
  settings,
  showSkeleton = false,
}: PromptItemCardProps) {
  const { user, handleLogin, showFeedback, openLightbox } = usePostPage();

  const [activeIdx, setActiveIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const images = useMemo(() => {
    if (img.urls && img.urls.length > 0) return img.urls.filter(Boolean);
    return [img.url].filter(Boolean);
  }, [img.urls, img.url]);

  const safeActiveIdx = activeIdx < images.length ? activeIdx : 0;
  const activeUrl = images[safeActiveIdx] || img.url || '';
  const tools = img.aiTool ? img.aiTool.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || images.length <= 1) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        setActiveIdx((prev) => (prev + 1) % images.length);
      } else {
        setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
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
    } catch {}
  };

  const getTryToolUrl = (tool: string, prompt: string) => {
    const encoded = encodeURIComponent(prompt);
    const normalized = tool.toLowerCase();
    if (normalized.includes('chatgpt') || normalized.includes('dall-e')) {
      return `https://chatgpt.com/?q=${encoded}`;
    }
    if (normalized.includes('midjourney')) {
      return 'https://www.midjourney.com/explore';
    }
    if (normalized.includes('gemini') || normalized.includes('imagen')) {
      return `https://gemini.google.com/app?prompt=${encoded}`;
    }
    if (normalized.includes('grok')) {
      return `https://x.com/i/grok?text=${encoded}`;
    }
    if (normalized.includes('bing') || normalized.includes('copilot')) {
      return `https://www.bing.com/images/create?q=${encoded}`;
    }
    return '';
  };

  const handleTryTool = async (tool: string, prompt: string) => {
    const url = getTryToolUrl(tool, prompt);
    if (!url) return;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    try {
      await navigator.clipboard.writeText(prompt);
      showFeedback(`Prompt copied. Opening ${tool}...`);
    } catch {}
    if (!opened) {
      showFeedback(`Prompt copied. Please allow popups to open ${tool}.`, 3500);
    }
  };

  const getTryToolsForImage = () => {
    const selectedTools = (img.aiTools || []).filter(Boolean);
    if (selectedTools.length > 0) return selectedTools;

    const fallbackTools = [img.aiTool].filter(Boolean);
    const modelTool = getToolForImageModel(img.model);
    return modelTool && fallbackTools.some((tool) => tool.toLowerCase() === modelTool.toLowerCase())
      ? [modelTool]
      : fallbackTools;
  };

  const tryTools = getTryToolsForImage();

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/60 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.08]">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left: Interactive Image Gallery */}
        <div className="relative self-start p-3 sm:p-4">
          <div
            className="relative mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/60 bg-white/25 p-2 dark:border-white/10 dark:bg-white/[0.06] group/img select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative flex w-full min-h-[300px] sm:min-h-[420px] cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
              onClick={() => openLightbox(images, safeActiveIdx, index, tools)}
            >
              <LoadingImg
                src={getPromptImageUrl(activeUrl || '', { width: 768, quality: 74 })}
                srcSet={buildGallerySrcSet(activeUrl)}
                sizes={GALLERY_SIZES}
                alt={`${post.title}${img.aiTool ? ` — ${img.aiTool}` : ''} prompt ${index + 1}`}
                showSkeleton={showSkeleton}
                priority={index === 0}
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding={index === 0 ? 'sync' : 'async'}
                wrapperClassName="w-full"
                className="block h-auto w-full rounded-xl transition-transform duration-300 ease-out group-hover/img:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Top-Left Tool Badges */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-none">
              {tools.map((tool) => {
                const info = getToolInfo(tool, settings?.toolDetails);
                return <ToolBadge key={tool} toolName={tool} toolInfo={info} size="sm" />;
              })}
            </div>

            {/* Top-Right: Prompt Number & Image Counter */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 pointer-events-none">
              {images.length > 1 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-600/90 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider shadow-lg">
                  {safeActiveIdx + 1} / {images.length}
                </span>
              )}
              <span className="px-2.5 py-1.5 rounded-full text-[9px] font-bold bg-black/50 text-white backdrop-blur-md border border-white/10 uppercase tracking-widest shadow-xl">
                PROMPT #{index + 1}
              </span>
            </div>

            {/* Carousel Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Previous variation"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-xl hidden sm:flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next variation"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-xl hidden sm:flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Floating Action Bar (Bottom Right of Image) */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(images, safeActiveIdx, index, tools);
                }}
                className="p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/35 active:bg-white/40 text-white backdrop-blur-xl border border-white/35 hover:border-white/60 hover:scale-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                title="Zoom in (Fullscreen)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeUrl) {
                    handleDownload(
                      activeUrl,
                      `prompt_${post.title}_${index + 1}_v${safeActiveIdx + 1}.png`
                    );
                  }
                }}
                className="p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/35 active:bg-white/40 text-white backdrop-blur-xl border border-white/35 hover:border-white/60 hover:scale-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                title="Download full quality"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Variations Thumbnail Strip */}
          {images.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto p-1.5 no-scrollbar">
              {images.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`relative flex-none w-12 h-12 rounded-xl overflow-hidden transition-all ${
                    i === safeActiveIdx
                      ? 'ring-2 ring-primary-500 scale-105 shadow-md'
                      : 'opacity-50 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  <img
                    src={getThumbnailImageUrl(u, { width: 100, quality: 65 })}
                    alt={`Variation ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Prompt Text, Paywall Gate, Model Info, Try Buttons */}
        <div className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            {settings?.features?.premiumPrompts && post.isPremium && !user ? (
              <div className="bg-white/25 dark:bg-white/5 rounded-2xl p-6 mb-6 text-center border border-white/60 dark:border-white/10 relative overflow-hidden group-hover:bg-primary-50/20 dark:group-hover:bg-primary-900/10 transition-colors">
                <div className="absolute inset-0 bg-white/25 dark:bg-white/5 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6">
                  <Lock className="w-8 h-8 text-yellow-500 mb-3" />
                  <h4 className="font-bold text-lg mb-1">Premium Prompt</h4>
                  <p className="text-sm text-surface-500 mb-4 max-w-sm">
                    Sign in to view and copy this engineered prompt.
                  </p>
                  {settings?.features?.premiumPaymentUrl ? (
                    <a
                      href={settings.features.premiumPaymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg"
                    >
                      Unlock All for ${settings?.features?.premiumPrice || 5}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 shadow-lg"
                    >
                      Sign in to Unlock
                    </button>
                  )}
                </div>
                <p className="text-sm md:text-base leading-relaxed text-surface-700 dark:text-surface-300 font-mono filter blur-[4px] truncate">
                  {img.prompt.slice(0, 100)}...
                </p>
              </div>
            ) : settings?.features?.smartTemplates && hasTemplateVariables(img.prompt) ? (
              <TemplatePrompt originalPrompt={img.prompt} />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                    <h3 className="font-bold text-base tracking-tight">Prompt</h3>
                  </div>
                  <CopyButton text={img.prompt} />
                </div>
                <div className="relative mb-4">
                  <div
                    className={`no-scrollbar overflow-hidden rounded-2xl border border-primary-500/20 bg-primary-50/25 p-5 transition-colors group-hover:bg-primary-50/40 dark:border-primary-400/20 dark:bg-primary-950/25 dark:group-hover:bg-primary-900/30 sm:p-6 md:max-h-[460px] md:overflow-y-auto ${
                      expanded ? 'max-h-none md:max-h-[460px]' : 'max-h-[260px]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-surface-800 dark:text-surface-200 md:text-base selection:bg-primary-500/20">
                      {img.prompt}
                    </p>
                  </div>
                  {!expanded && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-2xl bg-gradient-to-t from-surface-50 to-transparent dark:from-surface-800 md:hidden"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="btn-glow mb-6 inline-flex w-full items-center justify-center rounded-full border border-white/80 px-4 py-2 text-xs font-semibold text-surface-700 transition-colors dark:border-white/15 dark:text-surface-200 md:hidden"
                >
                  {expanded ? 'Show less prompt' : 'Show full prompt'}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest">
            <Clock className="w-4 h-4 text-primary-500/50" />
            Model:{' '}
            <span className="text-surface-600 dark:text-surface-200">
              {img.model || getDefaultImageModel(img.aiTool) || img.aiTool}
            </span>
          </div>

          {settings?.features?.showTryButtons !== false && tryTools.length > 0 && img.prompt.trim() && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(new Set(tryTools.filter(Boolean))).map((tool) => {
                const info = getToolInfo(tool, settings?.toolDetails);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => handleTryTool(tool, img.prompt)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-xs font-bold text-surface-700 hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-surface-200 dark:hover:text-white backdrop-blur-xl backdrop-saturate-150 transition-all duration-200"
                  >
                    {info.logo && (
                      <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full p-[1px]">
                        <Image
                          src={info.logo}
                          alt={`${tool} logo`}
                          width={16}
                          height={16}
                          className={`h-full w-full object-contain ${
                            tool.toLowerCase().includes('chatgpt') || info.logo.includes('chatgpt')
                              ? 'dark:invert dark:brightness-200'
                              : ''
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      </span>
                    )}
                    Try in {tool}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
