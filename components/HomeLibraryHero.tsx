'use client';
import { useState } from 'react';
import Link from '@/components/PrefetchLink';
import Image from 'next/image';
import { ArrowRight, Bookmark, CheckCircle2, Flame, Heart, Layers, Search } from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import { getToolInfo } from '@/lib/constants';

type HomeLibraryHeroProps = {
  featuredPosts: Post[];
  settings: SiteSettings;
  postCount: number;
};

/** Shared pill recipe: kicker, tag chips, tool chips and the secondary CTA. */
const glassPill =
  'border border-white/60 bg-white/25 shadow-sm backdrop-blur-md backdrop-saturate-150 transition-all duration-200 ease-out hover:scale-105 hover:border-primary-400 hover:bg-white/60 hover:text-primary-600 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/85 dark:hover:border-primary-400/60 dark:hover:bg-white/[0.10] dark:hover:text-white';

/** Brand-blue gradient button, used by the search submit and the primary CTA. */
const gradientButton =
  'bg-gradient-to-r from-google-blue to-[#1a73e8] text-white shadow-md shadow-primary-500/25 transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary-500/40 hover:brightness-[1.06] active:scale-95';

/**
 * Landing hero: kicker, headline, instant search, popular tags, CTAs, trust
 * line, live stat tiles and the tool row.
 *
 * Client component for the search input's state. The section is transparent —
 * the site canvas (components/SiteBackground) is the backdrop every glass
 * surface here frosts.
 *
 * Deliberately has NO entrance animation. The H1 is the LCP element, and any
 * animation on it (even transform-only with a backwards fill) makes Lighthouse
 * wait before counting it as painted. Reveals start below the fold.
 */
export default function HomeLibraryHero({ featuredPosts, settings, postCount }: HomeLibraryHeroProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const content = settings.heroContent || {};
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalSaves = featuredPosts.reduce((sum, post) => sum + (post.bookmarkedBy?.length || 0), 0);
  const toolNames = (settings.aiTools || []).filter(Boolean);
  // heroContent.title/subtitle (admin-editable) win; the legacy top-level
  // heroTitle/heroSubtitle are the next fallback, then the built-in default.
  const title = content.title || settings.heroTitle || 'Better Image Prompts Start Here';
  const subtitle = content.subtitle || settings.heroSubtitle || 'Discover tested prompts for ChatGPT, Gemini, Grok, Qwen, and other image tools. Copy, customize, and build stronger artwork from one organized library.';
  const statLabels = content.statLabels || {};
  const popularTags = content.popularTags?.filter(Boolean) || ['Portraits', 'Cinematic', 'Anime', 'Wallpaper', 'Architecture', 'Logos'];
  const trustBadges = content.trustBadges?.filter(Boolean) || ['100% Free to Copy', 'Tested & Verified Outputs', 'Exact Model Parameters Included'];

  const statItems = settings.heroHideStats ? [] : [
    { label: statLabels.prompts || 'Prompts', value: `${postCount}+`, icon: Layers, color: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20' },
    { label: statLabels.featured || 'Featured', value: `${featuredPosts.length}`, icon: Flame, color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20' },
    ...(settings.features?.showLikeCount !== false ? [{ label: statLabels.likes || 'Likes', value: `${totalLikes}`, icon: Heart, color: 'text-pink-500 bg-pink-500/10 dark:text-pink-400 dark:bg-pink-500/20' }] : []),
    { label: statLabels.saves || 'Saves', value: `${totalSaves}`, icon: Bookmark, color: 'text-cyan-500 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/20' },
  ];

  // Accent phrase inside the headline. The pattern is admin-editable, so a bad
  // one must not take the homepage down — an invalid regex just means no accent.
  let titleNode: React.ReactNode = title;
  try {
    const match = title.match(new RegExp(content.accentPattern || '(ai\\s+prompts?|image\\s+prompts?)', 'i'));
    if (match && match.index !== undefined && match[0]) {
      titleNode = (
        <>
          {title.slice(0, match.index)}
          <span className="font-serif-italic font-bold px-1.5 inline-block accent-gradient">{match[0]}</span>
          {title.slice(match.index + match[0].length)}
        </>
      );
    }
  } catch {
    titleNode = title;
  }

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden px-5 pt-8 pb-16 text-surface-950 dark:text-white sm:px-8 sm:py-16 md:min-h-[calc(100vh-64px)] md:py-20 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <div className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-surface-700 sm:mb-7 ${glassPill}`}>
          <Flame className="h-4 w-4 text-amber-400" />
          <span>
            {content.kickerPrefix || 'Curated prompts for'}{' '}
            {toolNames.slice(0, 4).join(', ') || 'ChatGPT, Gemini, Grok & Qwen'}
          </span>
        </div>

        <h1 className="max-w-5xl text-4xl font-black leading-[1.14] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          {titleNode}
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-surface-600 dark:text-surface-300 sm:text-lg">
          {subtitle}
        </p>

        <div className="mt-7 w-full max-w-2xl sm:mt-9">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="group/search relative flex items-center rounded-full border border-white/60 bg-white/45 p-1.5 shadow-xl shadow-slate-900/5 backdrop-blur-md backdrop-saturate-150 transition-all duration-300 ease-out hover:border-primary-400 hover:shadow-2xl focus-within:scale-[1.02] focus-within:border-primary-500 focus-within:shadow-2xl focus-within:shadow-primary-500/20 focus-within:ring-4 focus-within:ring-primary-500/15 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/50 dark:hover:border-white/30"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={content.searchPlaceholder || 'Search prompts by style, tool or subject...'}
              aria-label="Search prompts"
              className="w-full bg-transparent px-2 py-2 text-sm text-surface-900 placeholder-surface-400 outline-none dark:text-white dark:placeholder-surface-400 sm:px-3 sm:text-base"
            />
            <Search className="mx-2.5 h-5 w-5 shrink-0 text-surface-400 transition-colors duration-300 ease-out group-focus-within/search:text-primary-500 dark:text-surface-300" />
            <button
              type="submit"
              className={`group/btn inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold sm:px-7 ${gradientButton}`}
            >
              <span>{content.searchButtonLabel || 'Search'}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />
            </button>
          </form>

          {popularTags.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="font-semibold text-surface-500 dark:text-surface-400">{content.popularLabel || 'Popular:'}</span>
              {popularTags.map(tag => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                  prefetch={true}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold text-surface-700 ${glassPill}`}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col items-center justify-center gap-3.5 sm:mt-7 sm:flex-row">
            <Link
              href={content.primaryCtaHref || '/explore'}
              prefetch={true}
              className={`group/cta inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-transparent px-8 text-base font-bold sm:w-auto ${gradientButton}`}
            >
              <span>{content.primaryCtaLabel || 'Browse All Prompts'}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
            </Link>
            <a
              href={content.secondaryCtaHref || '#how-it-works'}
              className={`inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-bold text-surface-700 ${glassPill}`}
            >
              {content.secondaryCtaLabel || 'How It Works'}
            </a>
          </div>
        </div>

        {trustBadges.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-surface-600 dark:text-surface-300 sm:mt-8">
            {trustBadges.map(badge => (
              <div key={badge} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 grid w-full max-w-4xl grid-cols-2 gap-3.5 sm:mt-10 md:grid-cols-4">
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group glass-card relative overflow-hidden p-3.5 text-left transition-all duration-300 ease-out hover:scale-[1.03] hover:border-primary-400 hover:shadow-xl dark:hover:border-primary-400/60 sm:p-4"
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

        {toolNames.length > 0 && (
          <div className="mt-7 flex flex-col items-center gap-3 sm:mt-9">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              {content.toolsRowLabel || 'Browse Prompts by AI Tools:'}
            </span>
            <div className="flex max-w-4xl flex-wrap justify-center gap-2.5">
              {toolNames.map(tool => {
                const info = getToolInfo(tool, settings.toolDetails);
                return (
                  <Link
                    key={tool}
                    href={`/tool/${encodeURIComponent(tool)}`}
                    prefetch={true}
                    className={`inline-flex h-9 origin-center items-center justify-center gap-2 rounded-full px-4 text-xs font-bold text-surface-700 ${glassPill}`}
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
