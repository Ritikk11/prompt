'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flame, Heart, Layers, Search, Sparkles,
  ArrowRight, Copy, Check, Zap, Eye, Compass
} from 'lucide-react';
import type { LandingHeroProps } from './HeroLandingSearchFocus';
import { getPromptImageUrl } from '@/lib/image-url';
import { getAllTools, getToolInfo } from '@/lib/constants';

/**
 * Option C: "Interactive 1-Click Prompt Spotlight"
 * Keeps the centered layout, but embeds an interactive prompt card bar right in the hero,
 * allowing visitors to copy a featured prompt immediately with 1 click.
 */
export default function HeroLandingInteractiveCopy({ featuredPosts, settings, postCount }: LandingHeroProps) {
  const [copied, setCopied] = useState(false);
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const toolNames = (settings.aiTools || ['ChatGPT', 'Midjourney', 'Flux', 'Gemini', 'Grok']).filter(Boolean);

  const featuredPost = featuredPosts[0] || null;
  const promptText = featuredPost?.images?.[0]?.prompt || featuredPost?.description || 'Ultra detailed cinematic portrait, volumetric atmospheric lighting, 8k resolution';
  const postThumb = getPromptImageUrl(featuredPost?.thumbnailUrl || featuredPost?.images?.[0]?.url, { width: 120, quality: 70 });
  const primaryTool = featuredPost ? (getAllTools(featuredPost)[0] || 'ChatGPT') : 'ChatGPT';

  const title = settings.heroTitle || 'The Curated Matrix of AI Image Prompts';
  const subtitle = settings.heroSubtitle || 'Discover, copy, and create stunning visual artwork with tested prompts for every major image generator.';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statItems = settings.heroHideStats ? [] : [
    { label: 'Curated Prompts', value: `${postCount}+`, icon: Layers },
    { label: 'Featured Collections', value: `${featuredPosts.length}`, icon: Flame },
    ...(settings.features?.showLikeCount !== false ? [{ label: 'Community Likes', value: `${totalLikes}`, icon: Heart }] : []),
    { label: 'Image Generators', value: `${toolNames.length}+`, icon: Zap },
  ];

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8 md:min-h-[calc(100vh-64px)] md:py-24 lg:px-12">
      {/* Background Lighting */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.2),transparent_38%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.2),transparent_32%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.15),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,250,252,0.98)_100%)] dark:bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.3),transparent_38%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.1),transparent_32%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.2),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(#7c3aed_0.7px,transparent_0.7px)] [background-size:20px_20px] dark:opacity-[0.12]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Top Kicker */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-100/90 px-4 py-2 text-xs font-bold text-violet-900 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-violet-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span>Production-Ready Prompts for Creators & Designers</span>
        </div>

        {/* Headline with font-heading */}
        <h1 className="font-heading max-w-4xl text-4xl font-extrabold leading-[1.06] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          The Curated Matrix of{' '}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300">
            Tested AI Prompts
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-300 sm:text-lg sm:leading-8">
          Instant 1-click copy formulas paired with verified image outputs. Designed for ChatGPT, Midjourney, Flux, Grok, and Gemini.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/explore"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-primary-600 px-8 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-xl active:scale-95 dark:bg-primary-500 dark:hover:bg-primary-600 sm:w-auto"
          >
            <Compass className="h-5 w-5" />
            <span>Explore All Prompts</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-surface-300 bg-white/80 px-8 text-base font-bold text-surface-800 backdrop-blur transition-all hover:bg-surface-100 dark:border-white/15 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:bg-surface-800 sm:w-auto"
          >
            How It Works
          </a>
        </div>

        {/* Interactive 1-Click Prompt Bar */}
        {featuredPost && (
          <div className="mt-10 w-full max-w-3xl rounded-2xl border border-surface-200 bg-white/90 p-3.5 shadow-xl shadow-surface-900/5 backdrop-blur-xl transition-all hover:border-primary-400 dark:border-white/15 dark:bg-surface-900/90 dark:shadow-black/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Thumbnail + Prompt details */}
              <div className="flex items-center gap-3 text-left">
                {postThumb && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-900">
                    <Image src={postThumb} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary-600 dark:text-primary-300">
                      {primaryTool}
                    </span>
                    <span className="truncate text-xs font-bold text-surface-900 dark:text-white">
                      {featuredPost.title}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-mono text-surface-500 dark:text-surface-400">
                    {promptText}
                  </p>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20 active:scale-95'
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Glass Stats Grid */}
        <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-surface-200/80 bg-white/70 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-primary-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary-500 dark:text-primary-300" />
                  <div>
                    <div className="text-xl font-black text-surface-950 dark:text-white">{item.value}</div>
                    <div className="text-xs text-surface-500 dark:text-white/60">{item.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supported AI Tools Row */}
        {toolNames.length > 0 && (
          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {toolNames.map(tool => (
              <Link
                key={tool}
                href={`/tool/${encodeURIComponent(tool)}`}
                className="rounded-full border border-surface-200 bg-white/70 px-4 py-2 text-xs font-bold text-surface-700 backdrop-blur-md transition hover:border-primary-300 hover:text-primary-600 dark:border-white/12 dark:bg-white/8 dark:text-white/82 dark:hover:border-white/30 dark:hover:bg-white/14"
              >
                {tool}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
