'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Layers, ArrowLeft, Eye, ShieldCheck, Check,
  Sliders, Smartphone, Monitor, Tablet, RefreshCw
} from 'lucide-react';
import type { Post, SiteSettings } from '@/lib/types';
import HomeLibraryHero from '@/components/HomeLibraryHero';
import HeroLandingSearchFocus from '@/components/hero-preview/HeroLandingSearchFocus';
import HeroLandingCleanTrust from '@/components/hero-preview/HeroLandingCleanTrust';
import HeroLandingInteractiveCopy from '@/components/hero-preview/HeroLandingInteractiveCopy';
import HeroLandingArtVisual from '@/components/hero-preview/HeroLandingArtVisual';

interface Props {
  featuredPosts: Post[];
  settings: SiteSettings;
  postCount: number;
}

export default function HeroPreviewClient({ featuredPosts, settings, postCount }: Props) {
  const [activeTab, setActiveTab] = useState<'optionA' | 'optionB' | 'optionC' | 'optionD' | 'original'>('optionA');
  const [deviceFrame, setDeviceFrame] = useState<'full' | 'tablet' | 'mobile'>('full');

  const variants = [
    {
      id: 'optionA' as const,
      name: 'Option A: Search & Value Focused',
      badge: 'Recommended',
      description: 'Features Outfit font-heading typography, an integrated instant search bar, trending #tags, value checkmarks, and elevated glass stats.',
    },
    {
      id: 'optionB' as const,
      name: 'Option B: Clean Authority & Trust',
      badge: 'Clean & Bold',
      description: 'Refined editorial typography with Outfit font-heading, dual high-contrast action buttons, and verified metric pillars.',
    },
    {
      id: 'optionC' as const,
      name: 'Option C: Interactive 1-Click Copy Bar',
      badge: 'Interactive',
      description: 'Embeds a live featured prompt spotlight bar right in the hero with instant 1-click clipboard copy.',
    },
    {
      id: 'optionD' as const,
      name: 'Option D: Category-Driven Creative Hub',
      badge: 'Creative',
      description: 'Vibrant category pill cards (Anime, Cinematic, Portraits, Concept Art) to jump straight into specialized prompt collections.',
    },
    {
      id: 'original' as const,
      name: 'Current Live Homepage Hero',
      badge: 'Original',
      description: 'The current active hero on your live website for direct before/after comparison.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-100 text-surface-950 dark:bg-surface-950 dark:text-white">
      {/* Sticky Top Control Toolbar */}
      <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-surface-800 dark:bg-surface-900/90 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-bold text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back Home</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <h1 className="text-sm font-black uppercase tracking-wider text-surface-900 dark:text-white">
                  Homepage Hero Variations Preview
                </h1>
              </div>
              <p className="text-[11px] text-surface-500">
                Compare refined landing-page heroes without touching the original homepage
              </p>
            </div>
          </div>

          {/* Device Frame Viewport Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800">
            <button
              onClick={() => setDeviceFrame('full')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                deviceFrame === 'full'
                  ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-white'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
              title="Full Desktop Screen"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                deviceFrame === 'tablet'
                  ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-white'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDeviceFrame('mobile')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                deviceFrame === 'mobile'
                  ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-white'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
              title="Mobile View (390px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        </div>

        {/* Hero Selector Tabs */}
        <div className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1">
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveTab(v.id)}
              className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === v.id
                  ? 'border-primary-500 bg-primary-500/10 text-primary-600 shadow-sm dark:bg-primary-500/20 dark:text-primary-300'
                  : 'border-surface-200 bg-surface-50 text-surface-600 hover:border-surface-300 hover:bg-white dark:border-surface-800 dark:bg-surface-900/60 dark:text-surface-400 dark:hover:border-surface-700 dark:hover:bg-surface-900'
              }`}
            >
              <span>{v.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === v.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                }`}
              >
                {v.badge}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Hero Description Note */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="rounded-xl border border-surface-200 bg-white/70 p-3 text-xs text-surface-600 dark:border-surface-800 dark:bg-surface-900/60 dark:text-surface-300">
          <strong className="text-surface-950 dark:text-white">Active Preview: </strong>
          {variants.find(v => v.id === activeTab)?.description}
        </div>
      </div>

      {/* Main Preview Frame Container */}
      <main className="mx-auto max-w-7xl px-2 py-6 sm:px-6">
        <div className="flex justify-center">
          <div
            className={`w-full transition-all duration-300 ${
              deviceFrame === 'mobile'
                ? 'max-w-[390px] rounded-[36px] border-[8px] border-surface-900 shadow-2xl overflow-hidden'
                : deviceFrame === 'tablet'
                ? 'max-w-[768px] rounded-[28px] border-[6px] border-surface-800 shadow-2xl overflow-hidden'
                : 'rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden'
            }`}
          >
            {activeTab === 'optionA' && (
              <HeroLandingSearchFocus
                featuredPosts={featuredPosts}
                settings={settings}
                postCount={postCount}
              />
            )}
            {activeTab === 'optionB' && (
              <HeroLandingCleanTrust
                featuredPosts={featuredPosts}
                settings={settings}
                postCount={postCount}
              />
            )}
            {activeTab === 'optionC' && (
              <HeroLandingInteractiveCopy
                featuredPosts={featuredPosts}
                settings={settings}
                postCount={postCount}
              />
            )}
            {activeTab === 'optionD' && (
              <HeroLandingArtVisual
                featuredPosts={featuredPosts}
                settings={settings}
                postCount={postCount}
              />
            )}
            {activeTab === 'original' && (
              <HomeLibraryHero
                featuredPosts={featuredPosts}
                settings={settings}
                postCount={postCount}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
