'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Layers, Flame, Heart, Search, ArrowRight,
  Zap, CheckCircle2, Compass, BookOpen, Star
} from 'lucide-react';
import type { LandingHeroProps } from './HeroLandingSearchFocus';
import { getToolInfo } from '@/lib/constants';

/**
 * Option D: "Category-Driven Creative Hub"
 * Centered hero with interactive category filter cards (Anime, Cinematic, Product, Portraits, Wallpaper, 3D Art)
 * allowing users to jump straight into specialized prompt collections.
 */
export default function HeroLandingArtVisual({ featuredPosts, settings, postCount }: LandingHeroProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const toolNames = (settings.aiTools || ['ChatGPT', 'Midjourney', 'Flux', 'Gemini', 'Grok']).filter(Boolean);

  const categories = [
    { label: 'All Prompts', icon: '✨', path: '/explore' },
    { label: 'Cinematic', icon: '🎬', path: '/tag/cinematic' },
    { label: 'Photoreal Portraits', icon: '📸', path: '/tag/portrait' },
    { label: 'Anime & Manga', icon: '🎨', path: '/tag/anime' },
    { label: '3D & Concept Art', icon: '🔮', path: '/tag/concept' },
    { label: 'Minimalist & Logos', icon: '📐', path: '/tag/logo' },
  ];

  const statItems = settings.heroHideStats ? [] : [
    { label: 'Tested Prompts', value: `${postCount}+`, icon: Layers },
    { label: 'Featured Drops', value: `${featuredPosts.length}`, icon: Flame },
    ...(settings.features?.showLikeCount !== false ? [{ label: 'Community Rating', value: '4.9 ★', icon: Star }] : []),
    { label: 'AI Generators', value: `${toolNames.length}+`, icon: Zap },
  ];

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-surface-50 px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8 md:min-h-[calc(100vh-64px)] md:py-24 lg:px-12">
      {/* Aurora Backdrop */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.22),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.2),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,250,252,0.98)_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.3),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.22),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.25),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.25] [background-image:radial-gradient(#7c3aed_0.7px,transparent_0.7px)] [background-size:20px_20px] dark:opacity-[0.14]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Kicker Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-300/60 bg-pink-50/90 px-4 py-2 text-xs font-bold text-pink-900 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-pink-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span>The Definitive Prompt Matrix for Visual Creators</span>
        </div>

        {/* Headline with font-heading */}
        <h1 className="font-heading max-w-4xl text-4xl font-extrabold leading-[1.06] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          Craft Extraordinary Art with{' '}
          <span className="bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-pink-300 dark:to-amber-300">
            Precision Prompts
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-300 sm:text-lg sm:leading-8">
          Skip generic generations. Copy battle-tested prompts formatted with exact lighting, camera specs, composition rules, and model tokens.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/explore"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-8 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:w-auto"
          >
            <Compass className="h-5 w-5" />
            <span>Explore All Collections</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/guides"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-surface-300 bg-white/80 px-8 text-base font-bold text-surface-800 backdrop-blur transition-all hover:bg-surface-100 dark:border-white/15 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:bg-surface-800 sm:w-auto"
          >
            <BookOpen className="h-5 w-5 text-violet-500" />
            <span>Mastery Guides</span>
          </Link>
        </div>

        {/* Category Jump Cards */}
        <div className="mt-10 flex w-full max-w-4xl flex-wrap justify-center gap-2.5">
          {categories.map(cat => (
            <Link
              key={cat.label}
              href={cat.path}
              className="inline-flex items-center gap-2 rounded-2xl border border-surface-200 bg-white/80 px-4 py-2.5 text-xs font-bold text-surface-800 shadow-sm backdrop-blur-md transition-all hover:border-violet-400 hover:bg-white hover:text-violet-600 hover:shadow-md hover:scale-105 dark:border-white/10 dark:bg-surface-900/80 dark:text-surface-200 dark:hover:border-violet-400 dark:hover:text-white"
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>

        {/* Stat Items */}
        <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3.5 md:grid-cols-4">
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-surface-200/80 bg-white/70 p-4 text-left backdrop-blur-md dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                    <Icon className="h-4 w-4" />
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

        {/* Supported Tools */}
        {toolNames.length > 0 && (
          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
            {toolNames.map(tool => (
              <Link
                key={tool}
                href={`/tool/${encodeURIComponent(tool)}`}
                className="rounded-full border border-surface-200 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-surface-700 backdrop-blur-md transition hover:border-violet-300 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-surface-300 dark:hover:border-white/20 dark:hover:text-white"
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
