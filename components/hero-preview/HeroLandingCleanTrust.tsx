'use client';
import Link from 'next/link';
import {
  Flame, Heart, Layers, Search, Sparkles,
  ArrowRight, ShieldCheck, Zap, BookOpen, Compass
} from 'lucide-react';
import type { LandingHeroProps } from './HeroLandingSearchFocus';
import { getToolInfo } from '@/lib/constants';

/**
 * Option B: "Authoritative & Clean Landing Page"
 * Enhances the existing hero with clean typography, dual high-contrast action buttons,
 * verified metric cards, and a direct AI tools explorer rail.
 */
export default function HeroLandingCleanTrust({ featuredPosts, settings, postCount }: LandingHeroProps) {
  const totalLikes = featuredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const toolNames = (settings.aiTools || ['ChatGPT', 'Midjourney', 'Flux', 'Gemini', 'Grok']).filter(Boolean);

  const title = settings.heroTitle || 'Master AI Image Generation with Production-Ready Prompts';
  const subtitle = settings.heroSubtitle || 'A curated library of verified AI prompts, creative directions, and exact model parameters. Copy copy-ready formulas tested against the latest generator versions.';

  const statItems = settings.heroHideStats ? [] : [
    { label: 'Prompt Collections', value: `${postCount}+`, icon: Layers, note: 'Ready to copy' },
    { label: 'Handpicked Today', value: `${featuredPosts.length}`, icon: Flame, note: 'Staff picks' },
    ...(settings.features?.showLikeCount !== false ? [{ label: 'Creator Likes', value: `${totalLikes}`, icon: Heart, note: 'Community rated' }] : []),
    { label: 'Supported Models', value: `${toolNames.length}+`, icon: Zap, note: 'Major AI tools' },
  ];

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-white px-5 py-16 text-surface-950 dark:bg-surface-950 dark:text-white sm:px-8 md:min-h-[calc(100vh-64px)] md:py-24 lg:px-12">
      {/* Subtle Mesh Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.2),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.3),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        {/* Top Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-100/80 px-4 py-2 text-xs font-bold text-surface-800 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-surface-200">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tested & Verified Against Latest Model Updates</span>
        </div>

        {/* Headline with font-heading */}
        <h1 className="font-heading max-w-4xl text-4xl font-extrabold leading-[1.06] tracking-tight text-surface-950 dark:text-white sm:text-6xl lg:text-7xl">
          The Curated Library of{' '}
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-cyan-300">
            Tested AI Prompts
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-300 sm:text-lg sm:leading-8">
          Stop struggling with generic AI outputs. Discover tested prompts, model-specific parameters, and copy-ready formulas that deliver professional-grade visuals.
        </p>

        {/* Dual Primary Action Buttons */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/explore"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-primary-600 px-8 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 sm:w-auto"
          >
            <Compass className="h-5 w-5" />
            <span>Browse {postCount}+ Prompts</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/guides"
            className="btn-glow inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-surface-300 bg-white px-8 text-base font-bold text-surface-800 transition-all hover:bg-surface-50 dark:border-white/15 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800 sm:w-auto"
          >
            <BookOpen className="h-5 w-5 text-primary-500" />
            <span>Prompt Guides</span>
          </Link>
        </div>

        {/* Value Checklist */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-semibold text-surface-500 dark:text-surface-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Exact Negative Prompts</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Resolution & Aspect Ratios</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Zero Sign-Up Required to Copy</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-3.5 md:grid-cols-4">
          {statItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-surface-200/80 bg-surface-50/80 p-4 text-left backdrop-blur-sm transition-all hover:border-surface-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">
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

        {/* Supported AI Tools Row */}
        {toolNames.length > 0 && (
          <div className="mt-10 flex flex-col items-center gap-3 border-t border-surface-200/60 pt-8 dark:border-surface-800">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Browse Prompts by AI Generator:
            </span>
            <div className="flex max-w-4xl flex-wrap justify-center gap-2.5">
              {toolNames.map(tool => {
                const info = getToolInfo(tool, settings.toolDetails);
                return (
                  <Link
                    key={tool}
                    href={`/tool/${encodeURIComponent(tool)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-4 py-2 text-xs font-bold text-surface-700 transition-all hover:border-primary-400 hover:text-primary-600 hover:scale-105 dark:border-white/10 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-white/25 dark:hover:text-white"
                  >
                    <span className={`h-2 w-2 rounded-full ${info?.color || 'bg-primary-500'}`} />
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
