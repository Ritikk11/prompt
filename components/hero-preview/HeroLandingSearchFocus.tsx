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
  featuredPosts: Post[];
  settings: SiteSettings;
  postCount: number;
}

/**
 * Option A (Enhanced with real user data & Outfit font-heading):
 * Integrates instant search, verified trust points, and clean glass stat cards
 * using your real website settings, titles, subtitles, tools, and stats.
 */
export default function HeroLandingSearchFocus({ featuredPosts, settings, postCount }: LandingHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalSaves = featuredPosts.reduce((sum, post) => sum + (post.bookmarkedBy?.length || 0), 0);
  const toolNames = (settings.aiTools || ['ChatGPT', 'Gemini', 'Grok', 'Qwen']).filter(Boolean);

  const title = settings.heroTitle || 'Better Image Prompts Start Here';
  const subtitle = settings.heroSubtitle || 'Discover tested prompts for ChatGPT, Gemini, Grok, Qwen, and other image tools. Copy, customize, and build stronger artwork from one organized library.';

  const popularTags = ['Portraits', 'Cinematic', 'Anime', 'Wallpaper', 'Architecture', 'Logos'];

  const statItems = settings.heroHideStats ? [] : [
    { label: 'Prompts', value: `${postCount}+`, icon: Layers, color: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20' },
    { label: 'Featured', value: `${featuredPosts.length}`, icon: Flame, color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20' },
    ...(settings.features?.showLikeCount !== false ? [{ label: 'Likes', value: `${totalLikes}`, icon: Heart, color: 'text-pink-500 bg-pink-500/10 dark:text-pink-400 dark:bg-pink-500/20' }] : []),
    { label: 'Saves', value: `${totalSaves}`, icon: Bookmark, color: 'text-cyan-500 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20' },
  ];

  const [fontStyle, setFontStyle] = useState<
    | 'instrument'
    | 'editorial'
    | 'bodoni'
    | 'futuristic'
    | 'space'
    | 'bebas'
    | 'script'
    | 'dancing'
    | 'glow-pill'
    | 'cinzel'
    | 'clean-gradient'
  >('instrument');
  const [gradientId, setGradientId] = useState<string>('violet-pink');

  const fontOptions = [
    { id: 'instrument', label: '✨ Instrument Serif' },
    { id: 'editorial', label: '🖋️ Playfair Serif' },
    { id: 'bodoni', label: '👒 Bodoni Vogue' },
    { id: 'futuristic', label: '⚡ Syne Geometric' },
    { id: 'space', label: '🚀 Space Grotesk' },
    { id: 'bebas', label: '💥 Impact Condensed' },
    { id: 'script', label: '✍️ Caveat Script' },
    { id: 'dancing', label: '🌊 Dancing Script' },
    { id: 'glow-pill', label: '💎 Glass Glow Pill' },
    { id: 'cinzel', label: '🏛️ Cinzel Roman' },
    { id: 'clean-gradient', label: '🌈 Default Sans' },
  ] as const;

  const gradientOptions = [
    { id: 'violet-pink', label: 'Neon Sunset', dot: 'from-violet-500 to-pink-500', className: 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 dark:from-violet-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent' },
    { id: 'cyan-blue', label: 'Cyber Cyan', dot: 'from-blue-500 to-cyan-400', className: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 dark:from-blue-300 dark:via-cyan-300 dark:to-emerald-200 bg-clip-text text-transparent' },
    { id: 'aurora', label: 'Aurora', dot: 'from-emerald-400 via-teal-400 to-indigo-500', className: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 dark:from-emerald-300 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent' },
    { id: 'tokyo-synth', label: 'Tokyo Synth', dot: 'from-fuchsia-500 to-cyan-400', className: 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-cyan-500 dark:from-fuchsia-300 dark:via-pink-300 dark:to-cyan-300 bg-clip-text text-transparent' },
    { id: 'fire-amber', label: 'Fire Ember', dot: 'from-amber-500 to-rose-500', className: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 dark:from-amber-300 dark:via-orange-300 dark:to-rose-300 bg-clip-text text-transparent' },
    { id: 'royal-gold', label: 'Royal Gold', dot: 'from-yellow-400 to-amber-600', className: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-200 dark:via-yellow-100 dark:to-amber-400 bg-clip-text text-transparent' },
    { id: 'emerald-mint', label: 'Emerald Mint', dot: 'from-emerald-400 to-teal-600', className: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-200 bg-clip-text text-transparent' },
    { id: 'google-blue', label: 'Electric Blue', dot: 'from-blue-600 to-indigo-500', className: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-300 dark:via-indigo-300 dark:to-violet-200 bg-clip-text text-transparent' },
    { id: 'candy-pastel', label: 'Cotton Candy', dot: 'from-pink-400 to-sky-300', className: 'bg-gradient-to-r from-pink-500 via-purple-400 to-sky-400 dark:from-pink-300 dark:via-purple-200 dark:to-sky-200 bg-clip-text text-transparent' },
    { id: 'pure-white', label: 'Solid White', dot: 'from-surface-100 to-white', className: 'text-primary-600 dark:text-white dark:drop-shadow-[0_0_16px_rgba(255,255,255,0.45)]' },
  ];

  const currentGradient = gradientOptions.find(g => g.id === gradientId) || gradientOptions[0];

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8 md:min-h-[calc(100vh-64px)] md:py-20 lg:px-12">
      {/* Ambient Radial Background Lighting */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.22),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.13),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] dark:bg-[radial-gradient(circle_at_18%_15%,rgba(139,92,246,0.25),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.1),transparent_30%),radial-gradient(circle_at_50%_78%,rgba(236,72,153,0.2),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(#7c3aed_0.7px,transparent_0.7px)] [background-size:18px_18px] dark:opacity-[0.12]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Interactive Customizer Toolbars */}
        <div className="mb-7 flex w-full max-w-4xl flex-col gap-2.5 rounded-2xl border border-surface-200 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-white/12 dark:bg-white/8">
          {/* Font Style Row */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="px-2 text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Font Style:
            </span>
            {fontOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setFontStyle(opt.id)}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all duration-200 ${
                  fontStyle === opt.id
                    ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                    : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Color / Gradient Row */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-surface-200/60 pt-2.5 dark:border-white/10">
            <span className="px-2 text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Color Theme:
            </span>
            {gradientOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setGradientId(opt.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all duration-200 ${
                  gradientId === opt.id
                    ? 'bg-surface-900 text-white shadow-sm dark:bg-white dark:text-surface-950'
                    : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-white/10'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kicker Pill */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-100/80 px-4 py-2 text-xs font-bold text-primary-700 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-primary-200">
          <Flame className="h-4 w-4 text-amber-400" />
          <span>Curated prompts for {toolNames.slice(0, 4).join(', ') || 'ChatGPT, Gemini, Grok & Qwen'}</span>
        </div>

        {/* Main Headline with default font & custom styled AI Prompt */}
        <h1 className="max-w-5xl text-4xl font-black leading-[1.14] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          {(() => {
            const regex = /(ai\s+prompts?|image\s+prompts?)/i;
            const match = title.match(regex);
            if (!match || match.index === undefined) return title;
            const before = title.slice(0, match.index);
            const matchedText = match[0];
            const after = title.slice(match.index + matchedText.length);

            const renderStyledAccent = () => {
              const gradientCls = currentGradient.className;
              switch (fontStyle) {
                case 'instrument':
                  return (
                    <span className={`font-instrument font-normal text-[1.18em] px-2 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'editorial':
                  return (
                    <span className={`font-serif-italic font-black px-1.5 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'bodoni':
                  return (
                    <span className={`font-bodoni font-black px-2 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'futuristic':
                  return (
                    <span className={`font-syne uppercase tracking-tight font-black px-1.5 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'space':
                  return (
                    <span className={`font-space tracking-tight font-bold px-1.5 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'bebas':
                  return (
                    <span className={`font-bebas tracking-wide text-[1.12em] px-2 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'script':
                  return (
                    <span className={`font-script text-5xl sm:text-7xl lg:text-8xl font-bold px-2 inline-block -rotate-2 align-middle ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'dancing':
                  return (
                    <span className={`font-dancing text-5xl sm:text-7xl lg:text-8xl font-bold px-2 inline-block align-middle ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'glow-pill':
                  return (
                    <span className="inline-flex items-center align-middle mx-1.5 px-4 py-1 rounded-2xl border border-primary-500/40 bg-primary-500/10 backdrop-blur-md shadow-lg shadow-primary-500/20 font-black text-3xl sm:text-5xl lg:text-6xl">
                      <span className={gradientCls}>{matchedText}</span>
                    </span>
                  );
                case 'cinzel':
                  return (
                    <span className={`font-cinzel tracking-wider font-black px-2 inline-block ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
                case 'clean-gradient':
                default:
                  return (
                    <span className={`px-1 inline-block font-black ${gradientCls}`}>
                      {matchedText}
                    </span>
                  );
              }
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
        <div className="mt-9 w-full max-w-2xl">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="group/search relative flex items-center rounded-full border border-surface-200 bg-white/95 p-1.5 shadow-xl shadow-surface-900/5 backdrop-blur-xl transition-all duration-300 ease-out hover:border-primary-400 hover:shadow-2xl focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/15 dark:border-white/15 dark:bg-white/10 dark:shadow-black/50 dark:hover:border-white/30"
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
              className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full bg-primary-600 px-7 py-3 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:bg-primary-700 hover:shadow-md active:scale-95 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              <span>Explore</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
            </button>
          </form>

          {/* Quick Trending Tags with matching tool effect */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-surface-500 dark:text-surface-400">Popular:</span>
            {popularTags.map(tag => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                className="rounded-full border border-surface-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-surface-700 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-white/30 dark:hover:bg-white/14 dark:hover:text-white"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Action Buttons with exact matching tool hover effect */}
          <div className="mt-7 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              href="/explore"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-primary-600 bg-primary-600 px-8 text-base font-bold text-white shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-primary-500 hover:bg-primary-700 hover:shadow-md active:scale-95 dark:border-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              <Search className="h-5 w-5" />
              Browse All Prompts
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-surface-200 bg-white/80 px-8 text-base font-bold text-surface-700 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-white/30 dark:hover:bg-white/14 dark:hover:text-white"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
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
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white/70 p-4 text-left shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:border-primary-300 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20"
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
          <div className="mt-9 flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Browse Prompts by AI Tools:
            </span>
            <div className="flex max-w-4xl flex-wrap justify-center gap-2.5">
              {toolNames.map(tool => {
                const info = getToolInfo(tool, settings.toolDetails);
                return (
                  <Link
                    key={tool}
                    href={`/tool/${encodeURIComponent(tool)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white/80 px-4 py-2 text-xs font-bold text-surface-700 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/12 dark:bg-white/8 dark:text-white/85 dark:hover:border-white/30 dark:hover:bg-white/14 dark:hover:text-white"
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
                    {tool}
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
