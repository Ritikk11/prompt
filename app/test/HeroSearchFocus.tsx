'use client';
import { useState, type CSSProperties } from 'react';
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

  const [gradientId, setGradientId] = useState<string>('google-blue');

  // Color themes derived from the site's Google-blue primary scale and brand quad.
  // Light-mode stops stay >=500-level so the gradient text never fades into the
  // light hero background; dark-mode stops use the bright brand variants.
  const gradientOptions = [
    { id: 'google-blue', label: 'Google Blue', dot: 'from-primary-700 to-primary-400', className: 'bg-gradient-to-r from-primary-800 via-primary-600 to-primary-500 dark:from-primary-200 dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent' },
    { id: 'deep-navy', label: 'Deep Navy', dot: 'from-primary-950 to-primary-500', className: 'bg-gradient-to-r from-primary-950 via-primary-800 to-primary-600 dark:from-primary-300 dark:via-primary-400 dark:to-primary-500 bg-clip-text text-transparent' },
    { id: 'azure', label: 'Azure', dot: 'from-primary-600 to-primary-300', className: 'bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 dark:from-primary-100 dark:via-primary-200 dark:to-primary-300 bg-clip-text text-transparent' },
    { id: 'evergreen', label: 'Evergreen', dot: 'from-primary-600 to-google-green', className: 'bg-gradient-to-r from-primary-700 to-[#188038] dark:from-primary-300 dark:to-[#81c995] bg-clip-text text-transparent' },
    { id: 'golden-hour', label: 'Golden Hour', dot: 'from-[#fbbc04] to-[#ea8600]', className: 'bg-gradient-to-r from-[#b26a00] via-[#ea8600] to-[#f9ab00] dark:from-[#fdd663] dark:via-[#fbbc04] dark:to-[#f9ab00] bg-clip-text text-transparent' },
    { id: 'sunset-coral', label: 'Sunset Coral', dot: 'from-google-red to-[#c5221f]', className: 'bg-gradient-to-r from-[#a50e0e] via-[#c5221f] to-google-red dark:from-[#f28b82] dark:via-[#ee675c] dark:to-[#ea4335] bg-clip-text text-transparent' },
  ];

  const currentGradient = gradientOptions.find(g => g.id === gradientId) || gradientOptions[0];

  const heroDelay = (ms: number) => ({ '--glm-hero-delay': `${ms}ms` } as CSSProperties);

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-transparent px-5 py-16 text-surface-950 dark:text-white sm:px-8 md:min-h-[calc(100vh-64px)] md:py-20 lg:px-12">
      {/* Staged hero entrance — same recipe as the stylish about-us design's
          hero: fade + slide-up on load, blocks cascading via delays.
          CWV-safe: the H1 (LCP element) starts with zero delay, the cascade
          finishes in ~1.1s, and only transform/opacity animate (compositor
          work — no layout shift, no main-thread blocking). */}
      <style>{`
        @keyframes glm-hero-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        @keyframes glm-hero-in-sm { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes glm-hero-rise { from { transform: translateY(20px); } to { transform: none; } }
        @keyframes glm-hero-fade { from { opacity: 0; } to { opacity: 1; } }
        .glm-hero-in, .glm-hero-in-sm {
          animation: glm-hero-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
          animation-delay: var(--glm-hero-delay, 0ms);
          backface-visibility: hidden;
        }
        .glm-hero-in-sm { animation-name: glm-hero-in-sm; animation-duration: 0.6s; }
        /* Frosted surfaces must never be opacity-animated, and neither may any
           wrapper around one: backdrop-filter is not computed while the element
           is faded, so the frost snaps in when opacity lands — the flash that
           reads as the panel re-animating. Same rule and same fix as the scroll
           reveal (see GlmReveal): move the surface with a TRANSFORM only, and
           fade the plain content inside it. Combined it reads the same as the
           old fade+rise, minus the pop.
           -rise    = transform on the surface + fade its direct children
           -rise-only = transform, no fade at all — for wrappers whose own
                        children are the glass (search form, tool pills) */
        .glm-hero-rise, .glm-hero-rise-only {
          animation: glm-hero-rise 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
          animation-delay: var(--glm-hero-delay, 0ms);
          backface-visibility: hidden;
        }
        .glm-hero-rise > * {
          animation: glm-hero-fade 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
          animation-delay: var(--glm-hero-delay, 0ms);
        }
        @media (prefers-reduced-motion: reduce) {
          .glm-hero-in, .glm-hero-in-sm, .glm-hero-rise, .glm-hero-rise-only, .glm-hero-rise > * { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Interactive Customizer Toolbar (Color Theme rail) */}
        <div className="glm-hero-rise mb-7 flex w-full max-w-4xl flex-col gap-2 rounded-2xl border border-white/80 bg-white/55 p-2.5 sm:p-3 shadow-xl shadow-slate-900/5 backdrop-blur-2xl backdrop-saturate-[160%] dark:border-white/10 dark:bg-white/[0.05]">
          {/* Color / Gradient Row */}
          <div className="flex w-full items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap sm:justify-center">
            <span className="shrink-0 px-2 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Color Theme:
            </span>
            {gradientOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setGradientId(opt.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all duration-150 border active:scale-[0.96] ${
                  gradientId === opt.id
                    ? 'bg-surface-900 text-white shadow-sm border-surface-900 dark:bg-white dark:text-surface-950 dark:border-white'
                    : 'border-transparent hover:border-primary-400 text-surface-600 hover:bg-white/60 dark:text-surface-300 dark:hover:bg-white/10 dark:hover:border-primary-400/50'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kicker Pill */}
        <div style={heroDelay(60)} className="glm-hero-rise mb-7 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-primary-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-primary-200">
          <Flame className="h-4 w-4 text-amber-400" />
          <span>Curated prompts for {toolNames.slice(0, 4).join(', ') || 'ChatGPT, Gemini, Grok & Qwen'}</span>
        </div>

        {/* Main Headline with default font & custom styled AI Prompt */}
        <h1 className="glm-hero-in max-w-5xl text-4xl font-black leading-[1.14] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          {(() => {
            const regex = /(ai\s+prompts?|image\s+prompts?)/i;
            const match = title.match(regex);
            if (!match || match.index === undefined) return title;
            const before = title.slice(0, match.index);
            const matchedText = match[0];
            const after = title.slice(match.index + matchedText.length);

            const renderStyledAccent = () => {
              const gradientCls = currentGradient.className;
              return (
                <span className={`font-serif-italic font-bold px-1.5 inline-block ${gradientCls}`}>
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
        <p style={heroDelay(200)} className="glm-hero-in mt-6 max-w-3xl text-base leading-8 text-surface-600 dark:text-surface-300 sm:text-lg">
          {subtitle}
        </p>

        {/* Integrated Search Bar with matching animated Explore button */}
        <div style={heroDelay(350)} className="glm-hero-rise-only mt-9 w-full max-w-2xl">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="group/search relative flex items-center rounded-full border border-white/80 bg-white/60 p-1.5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl backdrop-saturate-[160%] transition-all duration-300 ease-out hover:border-primary-400 hover:shadow-2xl focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/15 dark:border-white/15 dark:bg-white/10 dark:shadow-black/50 dark:hover:border-white/30"
          >
            <Search className="ml-4 h-5 w-5 text-surface-400 transition-colors duration-300 ease-out group-focus-within/search:text-primary-500 dark:text-surface-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search prompts by style, tool or subject..."
              className="w-full bg-transparent px-3 py-2 text-sm text-surface-900 placeholder-surface-400 outline-none dark:text-white dark:placeholder-surface-400 sm:text-base"
            />
            <button
              type="submit"
              className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full bg-primary-600 px-7 py-3 text-sm font-bold text-white shadow-sm backdrop-blur-md transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:bg-primary-700 hover:shadow-md active:scale-95 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              <span>Explore</span>
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
          <div className="mt-7 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              href="/explore"
              className="group inline-flex h-14 items-center gap-2 rounded-full border border-primary-600 bg-primary-600 px-8 text-base font-bold text-white shadow-sm backdrop-blur-md transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:border-primary-500 hover:bg-primary-700 hover:shadow-md active:scale-95 dark:border-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              <Search className="h-5 w-5" />
              <span>Browse All Prompts</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-white/80 bg-white/60 px-8 text-base font-bold text-surface-700 shadow-sm backdrop-blur-xl transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/80 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/14 dark:hover:text-white"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Trust Badges */}
        <div style={heroDelay(500)} className="glm-hero-in-sm mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
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
        <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3.5 md:grid-cols-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                style={heroDelay(500 + index * 100)}
                className="glm-hero-rise group relative overflow-hidden rounded-2xl border border-white/80 bg-white/55 p-4 text-left shadow-lg shadow-slate-900/5 backdrop-blur-2xl backdrop-saturate-[160%] transform-gpu [backface-visibility:hidden] [transform:translateZ(0)] transition-all duration-300 ease-out hover:scale-[1.03] hover:border-primary-400 hover:shadow-xl dark:border-white/10 dark:bg-white/10 dark:hover:border-primary-400/60"
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
          <div style={heroDelay(650)} className="glm-hero-rise-only mt-9 flex flex-col items-center gap-3">
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
