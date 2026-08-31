'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bookmark, Flame, Heart, Layers, Search, Sparkles,
  ArrowRight, CheckCircle2
} from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';

export interface LandingHeroProps {
  featuredPosts: any[];
  settings?: SiteSettings;
  postCount: number;
}

/**
 * Option A (Enhanced with real user data & Outfit font-heading):
 * Integrates instant search, verified trust points, and clean glass stat cards
 * using your real website settings, titles, subtitles, tools, and stats.
 */
export default function HeroLandingSearchFocus({ featuredPosts = [], settings, postCount = 0 }: LandingHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalSaves = featuredPosts.reduce((sum, post) => sum + (post.bookmarkedBy?.length || 0), 0);
  const toolNames = (settings?.aiTools || ['ChatGPT', 'Gemini', 'Grok', 'Qwen']).filter(Boolean);

  const title = settings?.heroTitle || 'Better Image Prompts Start Here';
  const subtitle = settings?.heroSubtitle || 'Discover tested prompts for ChatGPT, Gemini, Grok, Qwen, and other image tools. Copy, customize, and build stronger artwork from one organized library.';

  const popularTags = ['Portraits', 'Cinematic', 'Anime', 'Wallpaper', 'Architecture', 'Logos'];

  const statItems = settings?.heroHideStats ? [] : [
    { label: 'Prompts', value: `${postCount}+`, icon: Layers, color: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20' },
    { label: 'Featured', value: `${featuredPosts.length}`, icon: Flame, color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20' },
    ...(settings?.features?.showLikeCount !== false ? [{ label: 'Likes', value: `${totalLikes}`, icon: Heart, color: 'text-pink-500 bg-pink-500/10 dark:text-pink-400 dark:bg-pink-500/20' }] : []),
    { label: 'Saves', value: `${totalSaves}`, icon: Bookmark, color: 'text-cyan-500 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20' },
  ];

  // Accent gradient for the matched title phrase — fixed to the Google Blue
  // theme (the color-selector toolbar was removed as no longer needed).
  const accentGradient = 'bg-gradient-to-r from-primary-800 via-primary-600 to-primary-500 dark:from-primary-200 dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent';

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-transparent px-5 pt-8 pb-16 text-surface-950 dark:text-white sm:px-8 sm:py-16 md:min-h-[calc(100vh-64px)] md:py-20 lg:px-12">
      {/* No entrance animations in the hero: any fade/slide (even transform-only)
          delays the paint of the elements it touches — the H1 is the LCP element
          and the cascade read as a visible up-shift on first render. Everything
          renders stable in its final place; scroll reveals below the fold still
          animate via GlmReveal. */}

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Kicker Pill — same glass recipe as the tag/tool pills below */}
        <div className="mb-5 sm:mb-7 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-surface-700 shadow-sm backdrop-blur-xl dark:border-white/12 dark:bg-white/8 dark:text-white/85">
          <Flame className="h-4 w-4 text-amber-400" />
          <span>Curated prompts for {toolNames.slice(0, 4).join(', ') || 'ChatGPT, Gemini, Grok & Qwen'}</span>
        </div>

        {/* Main Headline with default font & custom styled AI Prompt.
            LCP element — NO entrance animation. Any animation (even transform-only
            with a backwards fill) makes Lighthouse wait to count it as painted,
            which inflates LCP. It renders instantly at full opacity; the kicker,
            subtitle, stats and pills still cascade in around it. */}
        <h1 className="max-w-5xl text-4xl font-black leading-[1.14] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          {(() => {
            const regex = /(ai\s+prompts?|image\s+prompts?)/i;
            const match = title.match(regex);
            if (!match || match.index === undefined) return title;
            const before = title.slice(0, match.index);
            const matchedText = match[0];
            const after = title.slice(match.index + matchedText.length);

            const renderStyledAccent = () => {
              return (
                <span className={`font-serif-italic font-bold px-1.5 inline-block ${accentGradient}`}>
                  {matchedText}
                </span>
              );
            };

            return (
              <>
                {before}
                {renderStyledAccent()}
                {after}
              </>
            );
          })()}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-3xl text-base leading-8 text-surface-600 dark:text-surface-300 sm:text-lg">
          {subtitle}
        </p>

        {/* Integrated Search Bar with matching animated Explore button */}
        <div className="mt-7 sm:mt-9 w-full max-w-2xl">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="group/search relative flex items-center rounded-full border border-white/80 bg-white/60 p-1.5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl backdrop-saturate-[120%] transition-all duration-300 ease-out hover:border-primary-400 hover:shadow-2xl focus-within:scale-[1.02] focus-within:border-primary-500 focus-within:shadow-2xl focus-within:shadow-primary-500/20 focus-within:ring-4 focus-within:ring-primary-500/15 dark:border-white/15 dark:bg-white/10 dark:shadow-black/50 dark:hover:border-white/30"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search prompts by style, tool or subject..."
              className="w-full bg-transparent px-2 py-2 text-sm text-surface-900 placeholder-surface-400 outline-none dark:text-white dark:placeholder-surface-400 sm:px-3 sm:text-base"
            />
            <Search className="mx-2.5 h-5 w-5 shrink-0 text-surface-400 transition-colors duration-300 ease-out group-focus-within/search:text-primary-500 dark:text-surface-300" />
            <button
              type="submit"
              className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#4285f4] to-[#1a73e8] px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary-500/25 transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary-500/40 hover:brightness-[1.06] active:scale-95 sm:px-7"
            >
              <span>Search</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />
            </button>
          </form>

          {/* Quick Trending Tags with matching tool effect */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-surface-500 dark:text-surface-400">Popular:</span>
            {popularTags.map(tag => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                className="rounded-full border border-white/80 bg-white/60 px-3.5 py-1.5 text-xs font-bold text-surface-700 shadow-sm backdrop-blur-xl transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/80 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/14 dark:hover:text-white"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Action Buttons with exact matching tool hover effect */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3.5 sm:mt-7 sm:flex-row">
            <Link
              href="/explore"
              className="group/cta inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-[#4285f4] to-[#1a73e8] px-8 text-base font-bold text-white shadow-md shadow-primary-500/25 transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary-500/40 hover:brightness-[1.06] active:scale-95 sm:w-auto"
            >
              <span>Browse All Prompts</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/80 bg-white/60 px-8 text-base font-bold text-surface-700 shadow-sm backdrop-blur-xl transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/80 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/14 dark:hover:text-white"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>100% Free to Copy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Tested & Verified Outputs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Exact Model Parameters Included</span>
          </div>
        </div>

        {/* Live Glass Stats Grid with colorful icons */}
        <div className="mt-7 grid w-full max-w-4xl grid-cols-2 gap-3.5 sm:mt-10 md:grid-cols-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/55 p-3.5 text-left shadow-lg shadow-slate-900/5 backdrop-blur-2xl backdrop-saturate-[120%] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-300 ease-out hover:scale-[1.03] hover:border-primary-400 hover:shadow-xl sm:p-4 dark:border-white/10 dark:bg-white/10 dark:hover:border-primary-400/60"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-110 ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-surface-950 dark:text-white">{item.value}</div>
                    <div className="text-xs font-medium text-surface-500 dark:text-surface-400">{item.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supported AI Tools with real tool logos and rich hover animation */}
        {toolNames.length > 0 && (
          <div className="mt-7 sm:mt-9 flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Browse Prompts by AI Tools:
            </span>
            <div className="flex max-w-4xl flex-wrap justify-center gap-2.5">
              {toolNames.map(tool => {
                const info = getToolInfo(tool, settings?.toolDetails);
                return (
                  <Link
                    key={tool}
                    href={`/tool/${encodeURIComponent(tool)}`}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 text-xs font-bold text-surface-700 shadow-sm backdrop-blur-xl origin-center transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/80 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/14 dark:hover:text-white"
                  >
                    {info?.logo ? (
                      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full">
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
                    ) : (
                      <span className={`h-2 w-2 rounded-full ${info?.color || 'bg-primary-500'}`} />
                    )}
                    <span className="leading-none">{tool}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
