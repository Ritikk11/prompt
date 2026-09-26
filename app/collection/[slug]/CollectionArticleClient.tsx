'use client';

import { useState } from 'react';
import Link from '@/components/PrefetchLink';
import Image from 'next/image';
import {
  Copy,
  Check,
  Share2,
  Sparkles,
  Layers,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  Compass,
  X,
  Maximize2,
} from 'lucide-react';
import type { Post, RoundupItem, SiteSettings } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';
import ToolBadge from '@/components/ToolBadge';
import { LoadingImg } from '@/components/LoadingImage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PostCard from '@/components/PostCard';

interface Props {
  post: Post;
  settings: SiteSettings;
  relatedPosts: Post[];
  siteUrl: string;
}

export default function CollectionArticleClient({
  post,
  settings,
  relatedPosts,
  siteUrl,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  const items = post.roundupItems || [];
  const primaryTool = post.aiTools?.[0] || 'ChatGPT';
  const toolInfo = getToolInfo(primaryTool, settings.toolDetails);

  const handleCopyPrompt = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleCopyAll = async () => {
    if (items.length === 0) return;
    const compiled = items
      .map((item, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const desc = item.description ? `\nNotes: ${item.description}` : '';
        return `#${num}. ${item.title} (${item.aiTool || 'AI Prompt'})\nPrompt: ${item.prompt}${desc}`;
      })
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(compiled);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2400);
    } catch (err) {
      console.error('Failed to copy all prompts:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${siteUrl}/collection/${post.slug || post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description || `Check out ${post.title} on PromptSoul`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if user dismissed share dialog
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen pb-24 text-surface-900 dark:text-white">
      {/* Lightbox Modal */}
      {activeImageZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-opacity"
          onClick={() => setActiveImageZoom(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImageZoom(null)}
            className="absolute top-5 right-5 z-50 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl">
            <img
              src={activeImageZoom}
              alt="Enlarged prompt visual"
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <article className="max-w-4xl mx-auto px-4 pt-6 sm:pt-10">
        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-semibold text-surface-500 overflow-x-auto no-scrollbar"
        >
          <Link href="/" className="hover:text-primary-500 transition-colors shrink-0">
            Home
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-primary-500 transition-colors shrink-0">
            Explore
          </Link>
          <span>/</span>
          <span className="text-surface-700 dark:text-surface-300 truncate max-w-[280px]">
            {post.title}
          </span>
        </nav>

        {/* Hero Header */}
        <header className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-pink-500 to-primary-500 text-white shadow-md shadow-pink-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Curated Collection
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-surface-100 dark:bg-white/[0.08] text-surface-700 dark:text-surface-200 border border-black/5 dark:border-white/10">
              <Layers className="w-3.5 h-3.5 text-primary-500" />
              {items.length} {items.length === 1 ? 'Prompt' : 'Prompts'}
            </span>
            {primaryTool && (
              <ToolBadge toolName={primaryTool} toolInfo={toolInfo} size="sm" />
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] text-surface-950 dark:text-white">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-surface-500 border-b border-black/5 dark:border-white/10 pb-5 pt-1">
            {formattedDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-surface-400" />
                {formattedDate}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-surface-400" />
              {Math.max(3, Math.ceil(items.length * 1.5))} min read
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors shadow-sm"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-primary-500" />
                  <span>Share Collection</span>
                </>
              )}
            </button>
          </div>

          {/* Hero Cover Image */}
          {post.thumbnailUrl && (
            <div className="relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 shadow-xl bg-black/[0.04] dark:bg-white/[0.04] aspect-[16/9] max-h-[460px] w-full">
              <Image
                src={post.thumbnailUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Introduction Text */}
          {post.description && (
            <div className="pt-2 text-base sm:text-lg leading-relaxed text-surface-700 dark:text-surface-200 font-normal">
              {post.description}
            </div>
          )}

          {post.extendedDescription && (
            <div className="prose prose-surface dark:prose-invert max-w-none pt-2 font-normal text-surface-700 dark:text-surface-300">
              <MarkdownRenderer>{post.extendedDescription}</MarkdownRenderer>
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-500/20 bg-primary-500/[0.04] dark:bg-primary-500/[0.06] p-4 mt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-bold text-surface-900 dark:text-white">
                {items.length} Ready-to-copy prompts in this guide
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 transition-all shadow-md shadow-primary-500/20 active:scale-95"
            >
              {allCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>All Prompts Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy All Prompts</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Listicle Items Section */}
        <div className="space-y-12 sm:space-y-16">
          {items.map((item, index) => {
            const itemNumber = String(index + 1).padStart(2, '0');
            const itemTool = item.aiTool || primaryTool;
            const itemToolInfo = getToolInfo(itemTool, settings.toolDetails);
            const isCopied = copiedId === item.id;

            return (
              <section
                key={item.id || index}
                id={`item-${index + 1}`}
                className="scroll-mt-24 rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-5 sm:p-8 backdrop-blur-xl shadow-sm transition-all hover:shadow-md"
              >
                {/* Item Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-pink-500 text-xs sm:text-sm font-black text-white shadow-md shadow-primary-500/20">
                      {itemNumber}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-surface-950 dark:text-white tracking-tight">
                      {item.title}
                    </h2>
                  </div>
                  {itemTool && (
                    <ToolBadge toolName={itemTool} toolInfo={itemToolInfo} size="sm" />
                  )}
                </div>

                {/* Prompt Visual Image */}
                {item.imageUrl && (
                  <div className="group relative mb-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03]">
                    <div className="relative w-full max-h-[560px] overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/30">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="max-h-[560px] w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveImageZoom(item.imageUrl)}
                        className="absolute bottom-3 right-3 rounded-xl bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 backdrop-blur-md transition-opacity hover:bg-black/80"
                        title="View Full Size"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Prompt Code/Box */}
                <div className="mb-6 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-surface-100/90 dark:bg-surface-900/90 shadow-inner">
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-surface-200/60 dark:bg-surface-800/60 px-4 py-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Copy-Ready Prompt
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(item.prompt, item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                        isCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="font-mono text-xs sm:text-[13px] leading-relaxed select-all text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words">
                      {item.prompt}
                    </p>
                  </div>
                </div>

                {/* Short Description / Editorial Commentary */}
                {item.description && (
                  <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-surface-50/70 dark:bg-white/[0.02] p-4 sm:p-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Editorial Notes & Tips
                    </h3>
                    <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300 font-normal">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Link to Standalone Post if linked */}
                {item.postId && (
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex justify-end">
                    <Link
                      href={`/${item.postId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <span>View standalone prompt page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer of the Article */}
        <div className="mt-16 rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-8 text-center backdrop-blur-xl shadow-sm space-y-4">
          <h3 className="text-xl font-extrabold text-surface-950 dark:text-white">
            Liked this collection?
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-300 max-w-md mx-auto">
            Discover thousands of tested AI image prompts for ChatGPT, Gemini, Grok, and more.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Prompts</span>
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] px-6 py-3 text-sm font-bold text-surface-800 dark:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <Share2 className="w-4 h-4 text-primary-500" />
              <span>Share Guide</span>
            </button>
          </div>
        </div>

        {/* Related Prompts / Collections Grid */}
        {relatedPosts.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-surface-950 dark:text-white">
                More From PromptSoul
              </h2>
              <Link
                href="/explore"
                className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
              >
                Browse All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedPosts.slice(0, 6).map((rel) => (
                <PostCard key={rel.id} post={rel} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
